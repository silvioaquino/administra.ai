// src/app/api/admin/planos/route.ts
// Cria um novo plano. Apenas ADMIN. Usa adminPrisma.

import { NextResponse } from "next/server"
import { adminPrisma } from "@/lib/prisma-admin"
import { getServerAdminOrNull } from "@/lib/admin"

export async function POST(req: Request) {
  const session = await getServerAdminOrNull()
  if (!session) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { name, price, features, isActive, stripePriceId } = body

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Nome do plano é obrigatório" }, { status: 400 })
    }
    if (price === undefined || price === null || isNaN(Number(price))) {
      return NextResponse.json({ error: "Preço inválido" }, { status: 400 })
    }

    const plano = await adminPrisma.plan.create({
      data: {
        name: name.trim(),
        price: Number(price),
        features: Array.isArray(features) ? features : [],
        isActive: isActive === undefined ? true : Boolean(isActive),
        stripePriceId: stripePriceId ? String(stripePriceId) : null,
      },
    })

    return NextResponse.json({ plano }, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar plano:", error)
    return NextResponse.json({ error: "Erro ao criar plano" }, { status: 500 })
  }
}
