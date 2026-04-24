# 🎮 Já Caiu? — Guia Completo de Setup

## O que é esse projeto?
App + Site para monitorar se jogadores da sua lista foram banidos nas plataformas:
- Steam (CS2 / VAC Ban)
- FACEIT
- Gamer Club Brasil

Quando alguém da lista for banido, você recebe **e-mail + notificação no celular** automaticamente.

---

## 📁 Estrutura do Projeto

```
jacaiu/
├── site/          → Site em Next.js (hospedado na Vercel)
├── app/           → App React Native com Expo (iOS + Android)
├── backend/       → APIs, banco de dados e cron jobs (Supabase)
└── docs/          → Esta documentação
```

---

## 🛠️ Contas que você precisa criar (todas gratuitas)

### 1. Supabase (banco de dados + autenticação)
- Acesse: https://supabase.com
- Crie uma conta e um novo projeto chamado "jacaiu"
- Anote: `SUPABASE_URL` e `SUPABASE_ANON_KEY` (em Settings > API)

### 2. Vercel (hospedagem do site)
- Acesse: https://vercel.com
- Crie uma conta gratuita (pode entrar com GitHub)

### 3. Resend (envio de e-mails)
- Acesse: https://resend.com
- Crie uma conta gratuita
- Anote: `RESEND_API_KEY`

### 4. Expo (app mobile)
- Acesse: https://expo.dev
- Crie uma conta gratuita
- Instale no seu computador: `npm install -g expo-cli`

### 5. OneSignal (notificações push)
- Acesse: https://onesignal.com
- Crie um novo app chamado "Já Caiu?"
- Anote: `ONESIGNAL_APP_ID` e `ONESIGNAL_API_KEY`

---

## 🗄️ Banco de Dados — Execute no Supabase

Vá em Supabase > SQL Editor e rode o arquivo:
**`backend/schema.sql`**

---

## 🌐 Subindo o Site (Next.js + Vercel)

```bash
# 1. Entrar na pasta do site
cd site

# 2. Instalar dependências
npm install

# 3. Criar arquivo de variáveis de ambiente
cp .env.example .env.local
# Edite o .env.local com suas chaves

# 4. Testar localmente
npm run dev
# Abra: http://localhost:3000

# 5. Publicar na Vercel
npx vercel --prod
```

---

## 📱 Rodando o App (Expo)

```bash
# 1. Entrar na pasta do app
cd app

# 2. Instalar dependências
npm install

# 3. Criar arquivo de variáveis de ambiente
cp .env.example .env
# Edite o .env com suas chaves

# 4. Iniciar o app
npx expo start

# 5. Escanear o QR code com o app "Expo Go" no seu celular
```

---

## ⚙️ Cron Job (verificação automática de bans)

O sistema verifica bans automaticamente a cada hora.
Configure no Supabase > Edge Functions ou use o Vercel Cron (já configurado no site).

---

## 🔑 Variáveis de Ambiente

### Site (`site/.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=sua_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_service_key_aqui
RESEND_API_KEY=sua_chave_resend
ONESIGNAL_APP_ID=seu_app_id
ONESIGNAL_API_KEY=sua_api_key
```

### App (`app/.env`)
```
EXPO_PUBLIC_SUPABASE_URL=sua_url_aqui
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui
EXPO_PUBLIC_ONESIGNAL_APP_ID=seu_app_id
```

---

## 🚀 Publicando nas lojas

### Google Play Store
```bash
cd app
npx expo build:android
# Siga as instruções do Expo para gerar o .aab
```

### Apple App Store
```bash
cd app
npx expo build:ios
# Requer conta Apple Developer ($99/ano)
```

---

## ❓ Precisa de ajuda?
Cada arquivo tem comentários explicando o que cada parte faz.
