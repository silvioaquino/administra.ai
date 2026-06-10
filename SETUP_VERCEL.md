# Deploy na Vercel - Administra.ai

## Visão Geral

Este documento guia a configuração do ambiente de desenvolvimento na Vercel para a equipe de desenvolvimento.

## Pré-requisitos

1. Conta na [Vercel](https://vercel.com)
2. Projeto no GitHub/GitLab/Bitbucket
3. Banco de dados NeonDB configurado

## Passo a Passo para Deploy

### 1. Conectar Repositório à Vercel

```bash
# No site da Vercel:
# 1. Clique em "New Project"
# 2. Importe seu repositório do GitHub
# 3. Selecione a branch correta (main ou develop)
```

### 2. Configurar Variáveis de Ambiente

Na Vercel, vá em **Settings > Environment Variables** e configure:

| Nome | Valor | Tipo | Descrição |
|------|-------|------|-----------|
| `DATABASE_URL` | `postgresql://...` | Secret | String de conexão do NeonDB |
| `NEXTAUTH_SECRET` | `gRgLyTlpQbEG...` | Secret | Chave secreta do NextAuth |
| `NEXTAUTH_URL` | `https://seu-projeto.vercel.app` | Secret | URL do projeto na Vercel |
| `STRIPE_SECRET_KEY` | `sk_test_...` | Secret | Chave do Stripe (test) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Secret | Webhook do Stripe |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` | Secret | Chave pública do Stripe |
| `RESEND_API_KEY` | `re_...` | Secret | API do Resend (emails) |
| `EMAIL_FROM` | `KaiUp Software <...>` | Secret | Email remetente |

### 3. Configurar Webhook do Stripe

Após o deploy, configure o webhook na Vercel:
1. No Dashboard do Stripe: Developers > Webhooks
2. Adicione endpoint: `https://seu-projeto.vercel.app/api/webhooks/stripe`
3. Eventos: `checkout.session.completed`, `customer.subscription.*`

### 4. Banco de Dados - NeonDB

O projeto já está configurado com NeonDB. Certifique-se de:
- Liberar acesso ao IP da Vercel (0.0.0.0/0 para dev)
- Executar migrações após deploy

```bash
# Após deploy, Rode migrações:
npx prisma migrate deploy
```

## Ambientes Separados (Staging/Production)

### 🔧 Configuração PÓS-primeiro deploy

**Após criar o projeto na Vercel:**

1. **Settings > Git > Production Branch** → `main`
2. **Settings > Git > Preview Branches** → `develop, staging, feature/**`
3. **Settings > Environment Variables** → Configure para cada ambiente:

| Variável | Production | Preview (Develop/Staging) |
|----------|------------|---------------------------|
| `DATABASE_URL` | NeonDB - Produção | NeonDB - Staging (separado) |
| `NEXTAUTH_URL` | https://seu-projeto.vercel.app | https://seu-projeto-git-develop.vercel.app |
| `STRIPE_SECRET_KEY` | sk_live_... | sk_test_... |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | pk_live_... | pk_test_... |

### 🔄 Branches Recomendadas

```
main          → producao.vercel.app
  ↖
develop       → develop--seu-projeto.vercel.app
  ↖
feature/x     → feature-x-seu-projeto.vercel.app
  ↖
security/x    → security-x-seu-projeto.vercel.app
  ↖
test/x        → test-x-seu-projeto.vercel.app
```

### 📊 Configuração de Banco de Dados Separado

**Produção:**
- Database: `administra-prod`
- Usuário limitado

**Staging:**
- Database: `administra-staging`  
- Dados fictícios para testes
- Acesso liberado para equipe

### 🛡️ Branch Protection (GitHub)

No GitHub, configure:
- `main`: Require PR reviews + status checks
- `develop`: Require PR reviews
- Delete branches after merge

### 🎯 Webhook Stripe para Ambientes

**Produção:**
- Endpoint: `https://seu-projeto.vercel.app/api/webhooks/stripe`

**Staging:**
- Endpoint: `https://seu-projeto-git-develop.vercel.app/api/webhooks/stripe`
- Usar Stripe Test Mode

## Comandos Úteis

```bash
# Build local (testar antes do deploy)
npm run build

# Linting
npm run lint

# Executar Prisma Studio
npx prisma studio

# Resetar banco (APENAS LOCAL!)
npx prisma migrate reset
```

## Monitoramento e Logs

Na Vercel:
- **Functions**: Ver erros de API routes
- **Analytics**: Performance do app
- **Logs**: Debug em tempo real

## 📊 Status Atual do Repositório

| Branch | Status | Deploy URL |
|--------|--------|------------|
| `feature/SilvioAquino` | ✅ Commitado, aguardando PR | Preview |
| `develop` | ✅ Criada, PR pendente | Staging |
| `main` | ⬜ Pendente | Production |

## 🔄 Workflow de Deploy

```
feature/SilvioAquino → PR → develop (staging) → PR → main (produção)
```

### Para abrir o PR manualmente:
1. Acesse: https://github.com/silvioaquino/administra.ai/pull/new/feature/SilvioAquino
2. Base: `develop`
3. Crie o PR e aguarde review

## Equipe de Desenvolvimento

| Membro | Responsabilidade | Branch Principal |
|--------|----------------|----------------|
| Silvio | Desenvolvimento | `feature/*` |
| Guilherme TOmaz | Auth, permissões | `security/*` |
| Meiry Paiva | QA, usabilidade | `test/*` |

## Checklist Pós-Deploy

- [ ] Variáveis de ambiente configuradas
- [ ] Webhook Stripe funcionando
- [ ] Migrações executadas
- [ ] Testes de login registrados
- [ ] Backup do banco configurado

---

**Última atualização:** 2025-03-09