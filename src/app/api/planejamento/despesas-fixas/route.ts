// src/app/api/planejamento/despesas-fixas/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const ano = parseInt(searchParams.get("ano") || new Date().getFullYear().toString())

  try {
    const config = await prisma.planejamentoConfig.findFirst({
      where: {
        userId: session.user.id,
        tipo: "despesas_fixas",
        anoReferencia: ano
      }
    })

    return NextResponse.json({
      success: true,
      dados: config?.dados || []
    })
  } catch (error) {
    console.error("Erro ao buscar despesas fixas:", error)
    return NextResponse.json(
      { error: "Erro ao buscar despesas fixas" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const { dados, ano } = await request.json()

    const config = await prisma.planejamentoConfig.upsert({
      where: {
        empresaId_userId_tipo_anoReferencia: {
          empresaId: session.user.empresaId || "",
          userId: session.user.id,
          tipo: "despesas_fixas",
          anoReferencia: ano
        }
      },
      update: { dados },
      create: {
        empresaId: session.user.empresaId || "",
        userId: session.user.id,
        tipo: "despesas_fixas",
        dados,
        anoReferencia: ano
      }
    })

    return NextResponse.json({ success: true, data: config })
  } catch (error) {
    console.error("Erro ao salvar despesas fixas:", error)
    return NextResponse.json(
      { error: "Erro ao salvar despesas fixas" },
      { status: 500 }
    )
  }
}