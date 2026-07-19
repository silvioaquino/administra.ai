// src/middleware.ts
// Protege as rotas de administração do SaaS no edge.
// Bloqueia qualquer usuário que não tenha role === "ADMIN".

import { getToken } from "next-auth/jwt"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const isApi = req.nextUrl.pathname.startsWith("/api/admin")

  if (token?.role !== "ADMIN") {
    return isApi
      ? NextResponse.json({ error: "Acesso negado" }, { status: 403 })
      : NextResponse.redirect(new URL("/", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
}
