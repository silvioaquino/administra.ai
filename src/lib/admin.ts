// src/lib/admin.ts
// Helper server-side para proteger rotas/APIs de administração do SaaS.
// Reutiliza getServerSession(authOptions), padrão do restante do código.

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { NextResponse } from "next/server"

type AdminSession = NonNullable<Awaited<ReturnType<typeof getServerSession<typeof authOptions>>["user"]> & { role: "ADMIN" }>

/**
 * Retorna a sessão se o usuário for ADMIN, ou null caso contrário.
 * Use para proteger páginas (server components) e API routes.
 */
export async function getServerAdminOrNull() {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== "ADMIN") return null
  return session
}

/**
 * Protege uma página (server component): redireciona para "/" se não for ADMIN.
 */
export async function requireAdminPage() {
  const session = await getServerAdminOrNull()
  if (!session) redirect("/")
  return session as AdminSession
}

/**
 * Protege uma API route: retorna NextResponse 403 se não for ADMIN.
 * Uso: const guard = await requireAdminApi(); if (guard) return guard
 */
export async function requireAdminApi() {
  const session = await getServerAdminOrNull()
  if (!session) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }
  return null
}
