# 🔐 Como Habilitar Google OAuth no Supabase

Siga estes passos para ativar a autenticação com Google no seu projeto Supabase:

## 1. Acesse o Google Cloud Console

1. Vá para [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente

## 2. Configure as Credenciais OAuth

1. No menu à esquerda, clique em **APIs & Services** → **Credentials**
2. Clique em **Create Credentials** → **OAuth 2.0 Client ID**
3. Selecione **Web application** como tipo
4. Adicione os URIs autorizados:
   - `http://localhost:3000` (desenvolvimento)
   - `http://localhost:5173` (desenvolvimento Vite)
   - `https://seu-dominio.com` (produção)
   - `https://seu-projeto.supabase.co/auth/v1/callback` (Supabase)

5. Copie o **Client ID** e **Client Secret**

## 3. Configure no Supabase

1. Vá para [Supabase Dashboard](https://app.supabase.com/)
2. Selecione seu projeto
3. No menu à esquerda, clique em **Authentication** → **Providers**
4. Procure por **Google** e clique para expandir
5. Cole o **Client ID** e **Client Secret** obtidos do Google Cloud
6. Marque a opção **Enable Sign in with Google**
7. Clique em **Save**

## 4. Teste a Autenticação

1. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

2. Acesse `http://localhost:5173`
3. Você verá a tela de login
4. Clique em **Entrar com Google**
5. Complete o login com sua conta Google

## ✅ Pronto!

Seu aplicativo agora permite login via Google. Cada usuário terá acesso apenas às suas próprias escalas.

## 🔗 Links Úteis

- [Documentação Supabase - Google Auth](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Supabase Dashboard](https://app.supabase.com/)

## 📝 Notas

- As chaves são sensíveis - nunca as compartilhe
- O Client Secret deve ser mantido seguro (apenas no servidor)
- A variável `VITE_SUPABASE_ANON_KEY` já está configurada para o lado do cliente
