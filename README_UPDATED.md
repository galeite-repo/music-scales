# 🎺 Escalas Musicais - Guia de Estudo para Trompete

Um aplicativo web moderno para estudar escalas musicais usando inteligência artificial (Groq API), com autenticação segura via Google OAuth e isolamento de dados por usuário.

## ✨ Características

- 🎺 **Geração de Escalas com IA** - Cria escalas musicais automáticas com Groq
- 🔐 **Autenticação Google** - Login simples e seguro
- 👤 **Isolamento de Dados** - Cada usuário vê apenas suas escalas
- 🎨 **UI/UX Profissional** - Design moderno com Tailwind CSS
- 💾 **Persistência de Dados** - Supabase PostgreSQL com RLS
- ⚡ **Tempo Real** - Atualizações instantâneas
- 🌙 **Dark Theme** - Design elegante e confortável

## 🚀 Quick Start

### 1. Clonar e Instalar

```bash
git clone <repositorio>
cd music-scales
npm install
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env.local`:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
```

### 3. Habilitar Google OAuth

Veja [GOOGLE_OAUTH_SETUP.md](GOOGLE_OAUTH_SETUP.md) para instruções completas.

### 4. Executar Migration

1. Vá para Supabase Dashboard → SQL Editor
2. Copie conteúdo de `supabase/migrations/20260106_add_user_id_to_scales.sql`
3. Execute

### 5. Iniciar Servidor

```bash
npm run dev
# Acesse http://localhost:5173
```

## 📋 Requisitos

- Node.js 16+
- npm ou yarn
- Conta Supabase
- Conta Google Cloud (para OAuth)

## 🏗️ Arquitetura

```
┌─────────────────┐
│   React App     │
│  (Frontend)     │
└────────┬────────┘
         │
    ┌────▼─────┐
    │ Supabase │
    │   Auth   │
    │ (Google) │
    └─────┬────┘
         │
    ┌────▼──────────┐
    │ PostgreSQL    │
    │ (RLS Policy)  │
    └────┬──────────┘
         │
    ┌────▼──────────┐
    │ Edge Function │
    │  (Deno)       │
    └────┬──────────┘
         │
    ┌────▼──────────┐
    │  Groq API     │
    │  (IA)         │
    └───────────────┘
```

## 📁 Estrutura de Projeto

```
music-scales/
├── src/
│   ├── App.tsx                 # Componente principal
│   ├── main.tsx                # Ponto de entrada
│   ├── index.css               # Estilos globais
│   ├── components/
│   │   ├── Login.tsx           # Tela de login
│   │   └── AddScaleModal.tsx   # Modal de criar escala
│   └── lib/
│       └── supabase.ts         # Cliente Supabase
├── supabase/
│   ├── functions/
│   │   └── generate-scale/     # Edge function
│   └── migrations/             # Migrations SQL
├── package.json
├── vite.config.ts
├── tsconfig.json
└── tailwind.config.js
```

## 🔐 Segurança

### Row Level Security (RLS)

Cada usuário só pode ver suas próprias escalas:

```sql
-- Política de SELECT
SELECT auth.uid() = user_id

-- Política de INSERT
INSERT auth.uid() = user_id

-- Política de UPDATE
UPDATE auth.uid() = user_id

-- Política de DELETE
DELETE auth.uid() = user_id
```

### Google OAuth

- Login seguro via Google
- Tokens JWT gerenciados por Supabase
- Sem armazenamento de senhas

## 📚 Documentação

- [CHECKLIST.md](CHECKLIST.md) - Próximos passos
- [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - Resumo técnico
- [AUTHENTICATION_CHANGES.md](AUTHENTICATION_CHANGES.md) - Mudanças implementadas
- [GOOGLE_OAUTH_SETUP.md](GOOGLE_OAUTH_SETUP.md) - Setup Google OAuth
- [USAGE_EXAMPLES.md](USAGE_EXAMPLES.md) - Exemplos de código
- [FILE_STRUCTURE.md](FILE_STRUCTURE.md) - Estrutura de arquivos

## 🛠️ Desenvolvimento

### Scripts

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview

# Lint
npm run lint
```

### Dependências

- `react` - Framework UI
- `@supabase/supabase-js` - Cliente Supabase
- `lucide-react` - Ícones
- `tailwind` - CSS framework
- `typescript` - Linguagem tipada
- `vite` - Build tool

## 🌐 Deploy

### Vercel (Recomendado)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel
```

**Variáveis de Ambiente:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Netlify

```bash
npm run build
# Fazer upload da pasta dist/
```

## 🎯 Funcionalidades

### Login
- [x] Google OAuth
- [x] Verificação de sessão
- [x] Persistência automática
- [ ] Recuperar senha (futuro)

### Escalas
- [x] Listar escalas do usuário
- [x] Criar escala com IA
- [x] Visualizar detalhes
- [x] Deletar escala
- [x] Auto-seleção de nova escala

### Segurança
- [x] RLS policies
- [x] User isolation
- [x] Token JWT
- [x] Google OAuth

## 🐛 Troubleshooting

### Erro: "Invalid OAuth provider"

Verifique se habilitou Google OAuth em Supabase:
1. Authentication → Providers → Google
2. Insira Client ID e Client Secret
3. Ative o provider

### Erro: "user_id column not found"

Execute a migration:
1. Supabase Dashboard → SQL Editor
2. Copie conteúdo de `20260106_add_user_id_to_scales.sql`
3. Execute

### Erro: "Unauthorized" ao criar escala

Verifique:
1. Está autenticado? (veja <Login />)
2. Possui token de acesso? (verifique AddScaleModal.tsx)
3. Edge function tem GROQ_API_KEY?

## 📊 Performance

- ⚡ Índices em user_id
- 🚀 Edge functions na borda
- 📦 Code splitting automático
- 🎨 Carregamento lazy de componentes

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 License

MIT

## 👨‍💻 Autor

Desenvolvido com ❤️ para músicos e trompetistas

## 🙏 Agradecimentos

- [Supabase](https://supabase.com) - Backend
- [Groq](https://groq.com) - IA para geração
- [Tailwind CSS](https://tailwindcss.com) - Estilos
- [React](https://react.dev) - Framework

## 📞 Suporte

Para dúvidas ou issues:
1. Verifique a documentação em `CHECKLIST.md`
2. Consulte `USAGE_EXAMPLES.md` para exemplos
3. Abra uma issue no GitHub

---

**Happy Practicing! 🎺** 🎶
