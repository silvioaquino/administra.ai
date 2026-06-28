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
    // Buscar da tabela DespesaFixa (principal)
    const despesas = await prisma.despesaFixa.findMany({
      where: {
        userId: session.user.id,
        empresaId: session.user.empresaId || "sem-empresa"
      },
      orderBy: { nome: "asc" }
    })

    // Se não encontrar, buscar na tabela planejamentoConfig
    if (despesas.length === 0) {
      const config = await prisma.planejamentoConfig.findFirst({
        where: {
          userId: session.user.id,
          tipo: "despesas_fixas",
          anoReferencia: ano
        }
      })
      if (config?.dados) {
        return NextResponse.json({
          success: true,
          dados: config.dados
        })
      }
    }

    return NextResponse.json({
      success: true,
      dados: despesas
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

    const empresaId = session.user.empresaId || "sem-empresa"

    // SALVAR na tabela DespesaFixa (principal)
    await prisma.despesaFixa.deleteMany({
      where: {
        userId: session.user.id,
        empresaId
      }
    })

    await prisma.despesaFixa.createMany({
      data: dados.map((despesa: any) => ({
        nome: despesa.nome,
        valor: despesa.valor,
        vencimento: despesa.vencimento ? new Date(despesa.vencimento) : new Date(),
        userId: session.user.id,
        empresaId
      }))
    })

    // SALVAR também na tabela planejamentoConfig
    await prisma.planejamentoConfig.upsert({
      where: {
        empresaId_userId_tipo_anoReferencia: {
          empresaId,
          userId: session.user.id,
          tipo: "despesas_fixas",
          anoReferencia: ano
        }
      },
      update: { dados },
      create: {
        empresaId,
        userId: session.user.id,
        tipo: "despesas_fixas",
        dados,
        anoReferencia: ano
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao salvar despesas fixas:", error)
    return NextResponse.json(
      { error: "Erro ao salvar despesas fixas" },
      { status: 500 }
    )
  }
}