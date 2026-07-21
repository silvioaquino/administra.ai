// src/app/api/admin/planos/[id]/route.ts
// Atualiza um plano (nome, preço, features, ativo, stripePriceId).
// Apenas ADMIN. Usa adminPrisma.

import { NextRequest, NextResponse } from "next/server"
import { adminPrisma } from "@/lib/prisma-admin"
import { getServerAdminOrNull } from "@/lib/admin"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerAdminOrNull()
  if (!session) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { name, price, features, isActive, stripePriceId } = body

    const planoExistente = await adminPrisma.plan.findUnique({ where: { id } })
    if (!planoExistente) {
      return NextResponse.json({ error: "Plano não encontrado" }, { status: 404 })
    }

    const data: Record<string, unknown> = {}
    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return NextResponse.json({ error: "Nome inválido" }, { status: 400 })
      }
      data.name = name.trim()
    }
    if (price !== undefined) {
      if (isNaN(Number(price))) {
        return NextResponse.json({ error: "Preço inválido" }, { status: 400 })
      }
      data.price = Number(price)
    }
    if (features !== undefined) data.features = Array.isArray(features) ? features : []
    if (isActive !== undefined) data.isActive = Boolean(isActive)
    if (stripePriceId !== undefined) data.stripePriceId = stripePriceId ? String(stripePriceId) : null

    const plano = await adminPrisma.plan.update({ where: { id }, data })

    return NextResponse.json({ plano })
  } catch (error) {
    console.error("Erro ao atualizar plano:", error)
    return NextResponse.json({ error: "Erro ao atualizar plano" }, { status: 500 })
  }
}
