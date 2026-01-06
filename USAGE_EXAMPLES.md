# 💡 Exemplos de Uso - Sistema de Autenticação

## 1️⃣ Como o Login Funciona

### Na primeira vez que o usuário acessa:

```typescript
// Usuário não autenticado
┌─────────────────────────────┐
│      Login.tsx              │
│  ┌──────────────────────┐   │
│  │ 🎺 Escalas Musicais  │   │
│  │                      │   │
│  │ [Entrar com Google]  │   │
│  └──────────────────────┘   │
└─────────────────────────────┘
```

### Após clicar em "Entrar com Google":

```
1. Redireciona para Google
2. Usuário autentica
3. Google redireciona de volta
4. Supabase troca código por JWT
5. Sessão criada
6. App detecta mudança
7. Mostra as escalas do usuário
```

---

## 2️⃣ Fluxo de Criar Escala

```typescript
// Usuário autenticado, clica "Gerar Nova Escala"
┌─────────────────────────────────────────┐
│         AddScaleModal.tsx               │
│  ┌─────────────────────────────────┐    │
│  │ Gerar Nova Escala               │    │
│  │ Nome: [DO Blues________________]│    │
│  │                                 │    │
│  │ [Cancelar]  [Gerar com IA]      │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ POST /functions/v1/generate-scale       │
│                                         │
│ {                                       │
│   "scaleName": "DO Blues",              │
│   "userId": "12345-uuid"  ← INCLUÍDO    │
│ }                                       │
│                                         │
│ Authorization: Bearer token_do_usuario  │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Groq API gera a escala                  │
│ Edge function insere no banco            │
│ user_id salvo junto                     │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Escala aparece na lista                 │
│ e é selecionada automaticamente         │
└─────────────────────────────────────────┘
```

---

## 3️⃣ Isolamento de Dados por Usuário

### Cenário: 2 usuários diferentes

```typescript
// 👤 Usuário A (João)
// Login com Google
// Cria: DO Blues, FA# Dórico

const { data } = await supabase
  .from('scales')
  .select('*')
  .eq('user_id', 'uuid-joão')  // Filter automático
  
// Resultado:
// ├── DO Blues
// └── FA# Dórico

// 👤 Usuário B (Maria)
// Login com Google
// Cria: SOL Mixolídio

const { data } = await supabase
  .from('scales')
  .select('*')
  .eq('user_id', 'uuid-maria')  // Filter automático
  
// Resultado:
// └── SOL Mixolídio

// João NUNCA vê as escalas de Maria (até no banco!)
// Maria NUNCA vê as escalas de João (até no banco!)
```

### Por quê funciona?

1. **Banco de dados:**
   - RLS policy verifica: `auth.uid() = user_id`
   - Query é bloqueada se UIDs não correspondem

2. **Aplicação:**
   - `.eq('user_id', user.id)` filtra
   - Só busca escalas do usuário autenticado

---

## 4️⃣ Código Exemplo - Criando uma Escala

```typescript
// Em AddScaleModal.tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    // Obtém usuário autenticado
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Você não está autenticado');
    }
    
    // Obtém token de acesso
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    // Envia requisição com userId
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        scaleName: 'DO Blues',
        userId: user.id,  // ← Passamos o ID do usuário
      }),
    });
    
    const result = await response.json();
    console.log('Escala criada:', result);
    
  } catch (err) {
    console.error('Erro:', err);
  }
};
```

---

## 5️⃣ Código Exemplo - Carregando Escalas

```typescript
// Em App.tsx
const loadScales = async () => {
  if (!user) return;  // Só carrega se autenticado
  
  setIsLoading(true);
  
  // Busca escalas do usuário autenticado
  const { data, error } = await supabase
    .from('scales')
    .select('*')
    .eq('user_id', user.id)  // ← IMPORTANTE: Filtra por user_id
    .order('order_index', { ascending: true });
  
  if (error) {
    console.error('Erro:', error);
  } else if (data) {
    setScales(data);
    if (data.length > 0 && !selectedScale) {
      setSelectedScale(data[0]);
    }
  }
  
  setIsLoading(false);
};

// Quando usuário autenticado muda
useEffect(() => {
  if (user) {
    loadScales();
  }
}, [user]);
```

---

## 6️⃣ Código Exemplo - Logout

```typescript
// Em App.tsx
const handleLogout = async () => {
  // Remove sessão do Supabase
  await supabase.auth.signOut();
  
  // Limpa estado local
  setUser(null);
  setScales([]);
  setSelectedScale(null);
  
  // Componente automaticamente renderiza <Login />
};

// No header:
<button onClick={handleLogout}>
  <LogOut className="w-5 h-5" />
</button>
```

---

## 7️⃣ Fluxo Seguro do RLS

```sql
-- Quando João tenta ver escalas:
SELECT * FROM scales WHERE user_id = 'uuid-joão'

-- RLS policy intercepta:
-- ✅ PERMITIDO: auth.uid() = 'uuid-joão'
-- Resultado: suas escalas

-- Quando João tenta forçar UUID de Maria:
SELECT * FROM scales WHERE user_id = 'uuid-maria'

-- RLS policy intercepta:
-- ❌ BLOQUEADO: auth.uid() = 'uuid-maria' é FALSE
-- Erro: "rows hidden due to RLS policy"

-- Impossível contornar via queries diretas!
```

---

## 8️⃣ Monitoramento em Tempo Real

```typescript
// Verificar quando usuário muda
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      console.log('Evento:', event);
      console.log('Sessão:', session);
      
      switch (event) {
        case 'SIGNED_IN':
          console.log('✅ Usuário entrou:', session?.user?.email);
          setUser(session?.user || null);
          break;
          
        case 'SIGNED_OUT':
          console.log('👋 Usuário saiu');
          setUser(null);
          break;
          
        case 'TOKEN_REFRESHED':
          console.log('🔄 Token atualizado');
          break;
      }
    }
  );
  
  return () => subscription?.unsubscribe();
}, []);
```

---

## 9️⃣ Tratamento de Erros

```typescript
// Erro de autenticação
if (!user) {
  return <Login onLoginSuccess={() => {}} />;
}

// Erro de RLS
try {
  const { data, error } = await supabase
    .from('scales')
    .select('*')
    .eq('user_id', 'outro-user-id');
    
  if (error?.code === 'PGRST116') {
    // RLS policy bloqueou
    console.error('Acesso negado: você só pode ver suas escalas');
  }
} catch (err) {
  console.error('Erro:', err);
}

// Erro de autorização (sem token)
const response = await fetch(apiUrl, {
  headers: {
    'Authorization': `Bearer ${token}`,  // Sem isso = erro 401
  },
});
```

---

## 🔟 Performance e Índices

```sql
-- Index automático criado para user_id
CREATE INDEX scales_user_id_idx ON scales(user_id);

-- Isso torna queries muito rápidas:
-- ✅ SEM índice: O(n) - verifica todas as linhas
-- ✅ COM índice: O(log n) - busca rápida

-- Resultado: mesmocom milhares de escalas, é rápido
```

---

## 📊 Comparação: Antes vs Depois

### ❌ ANTES (Sem autenticação)

```typescript
// Qualquer pessoa via o mesmo dado
const { data } = await supabase.from('scales').select('*');

// Resultado: TODAS as escalas do banco
[
  { id: 1, name: 'DO Blues', user_id: null },
  { id: 2, name: 'FA# Dórico', user_id: null },
  { id: 3, name: 'SOL Mixolídio', user_id: null },
]

// Problema: Sem segurança, sem isolamento
```

### ✅ DEPOIS (Com autenticação)

```typescript
// Apenas o usuário autenticado vê seus dados
const { data: { user } } = await supabase.auth.getUser();

const { data } = await supabase
  .from('scales')
  .select('*')
  .eq('user_id', user.id);

// Resultado: APENAS escalas deste usuário
[
  { id: 1, name: 'DO Blues', user_id: 'uuid-joão' },
  { id: 2, name: 'FA# Dórico', user_id: 'uuid-joão' },
]

// Benefício: Seguro, isolado, escalável
```

---

## 🎯 Checklist de Segurança

- [x] Usar Google OAuth (mais seguro que email/senha)
- [x] RLS policies no banco (defesa em profundidade)
- [x] Token JWT para edge function (autenticação forte)
- [x] Validar user_id no backend (não confiar no cliente)
- [x] Filtrar queries por user_id (segurança dupla)
- [x] Sem armazenar senhas (delegado ao Google)
- [x] Logout limpa sessão (logout real)
- [x] HTTPS em produção (criptografia em trânsito)

---

## 💡 Dicas Avançadas

1. **Atualizar sessão:**
   ```typescript
   const { data } = await supabase.auth.refreshSession();
   ```

2. **Obter usuário sem fazer query:**
   ```typescript
   const { data: { user } } = await supabase.auth.getUser();
   ```

3. **Adicionar mais providers OAuth:**
   ```typescript
   // GitHub, Discord, Apple, etc
   await supabase.auth.signInWithOAuth({
     provider: 'github',
   });
   ```

4. **Limpar usuário após logout:**
   ```typescript
   const { error } = await supabase.auth.signOut();
   if (!error) {
     setUser(null);
   }
   ```

---

**Fim dos Exemplos!** 🚀
