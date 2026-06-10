# Guia de Segurança - Administra.ai

## Pontos de Atenção para Revisão

### 1. Autenticação NextAuth

**Status atual:** Implementado com Credentials Provider
- ✅ Hash de senha com bcryptjs
- ✅ JWT Session Strategy
- ✅ Session maxAge: 30 dias

**Recomendações:**
- [ ] Adicionar rate limiting no login (previne brute force)
- [ ] Implementar refresh token rotation
- [ ] Adicionar 2FA (TOTP/Email) - opcional
- [ ] Configurar cookies com `secure: true` em produção

### 2. API Routes - Autorização

**Arquivos críticos para revisão:**
- `src/app/api/caixa/*` - Operações de caixa
- `src/app/api/vendas/*` - Transações financeiras
- `src/app/api/retiradas/*` - Retiradas de caixa
- `src/app/api/fichas-tecnicas/*` - Dados produtivos

**Padrão atual (usando getServerSession):**
```typescript
// Adicionar em cada API Route:
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)  // linha existente
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  // ... resto da lógica
}
```

**TODO: Criar middleware para proteger rotas automaticamente (arquivo removido durante setup):**
```typescript
// src/middleware.ts
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export default async function middleware(req: NextRequest) {
  // Verificar se rota precisa de auth
  const isProtected = !req.nextUrl.pathname.startsWith('/api/auth') && 
                      !req.nextUrl.pathname.startsWith('/login') &&
                      req.nextUrl.pathname !== '/'
  
  if (isProtected) {
    // Implementar verificação de session/token
    // Usar auth() do NextAuth ou verificar cookie JWT
  }
  return NextResponse.next()
}

export const config = {
  matcher: '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
}
```

**Padrão de proteção:**
```typescript
// Adicionar em cada API Route:
import { auth } from "@/lib/auth"

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  // ... resto da lógica
}
```

### 3. Middleware de Proteção

Criar `src/middleware.ts` (não existe):
```typescript
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isAuthPage = req.nextUrl.pathname.startsWith('/login') || 
                     req.nextUrl.pathname.startsWith('/register')
  
  if (!isLoggedIn && !isAuthPage) {
    const loginUrl = new URL('/login', req.url)
    return NextResponse.redirect(loginUrl)
  }
  
  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

### 4. Headers de Segurança

Já configurados no `vercel.json`:
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block

**Adicionar ao `next.config.ts`:**
```typescript
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
        ]
      }
    ]
  }
}
```

### 5. Validação de Dados (Zod)

Verificar se todas as APIs usam validação:
- [ ] Criar schemas em `src/lib/validations/`
- [ ] Validar input em todas as mutations

### 6. Rate Limiting

Recomendado para:
- /api/auth/register - 5 requisições/hora/IP
- /api/auth/login - 10 requisições/15min/IP
- /api/auth/forgot-password - 3 requisições/hora/IP

Usar `lru-cache` ou Vercel Edge Config

### 7. Logs de Segurança

Adicionar logs para:
- Tentativas de login falhas
- Alterações de dados sensíveis
- Exportação/relatórios

### 8. CORS (se for usar API externa)

Configurar CORS nas APIs que precisam:
```typescript
headers: {
  'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL,
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}
```

### 9. Variáveis Sensíveis

**Já no .env (verificar na Vercel):**
- STRIPE_SECRET_KEY - deve ser production key
- NEXTAUTH_SECRET - deve ser único e forte
- DATABASE_URL - verificar SSL

### 10. Auditoria de Código

Antes do merge:
- [ ] Executar `npm audit`
- [ ] Revisar dependências (dependabot)
- [ ] Checar vulnerabilidades conhecidas

---

## Checklist de Implementação

| Item | Status | Responsável |
|------|--------|-------------|
| API Routes caixa protegidas | ✅ | feito - vendas/retiradas/fechar |
| Middleware de auth | ⬜ | Equipe Segurança |
| Rate limiting login | ⬜ | Equipe Segurança |
| Headers segurança | ✅ | feito no vercel.json |
| Validações Zod | ⬜ | Equipe Segurança |
| Logs de auditoria | ⬜ | Equipe Segurança |
| Revisão de permissões | ⬜ | Equipe Segurança |

---

**Guia criado para:** Equipe de Segurança
**Data:** 2025-03-09