// src/app/api/planejamento/metas/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Não autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const ano = parseInt(searchParams.get("ano") || "2026")
  const mes = searchParams.get("mes") ? parseInt(searchParams.get("mes")!) : null

  try {
    if (mes) {
      // Buscar meta específica do mês
      const meta = await prisma.planejamentoFaturamento.findUnique({
        where: {
          userId_ano_mes: {
            userId: session.user.id,
            ano,
            mes,
          },
        },
      })

      if (!meta) {
        // Retornar valores padrão se não existir
        return NextResponse.json({
          success: true,
          data: {
            mes,
            metaDiariaAlmoco: 0,
            metaDiariaJanta: 0,
            diasTrabalhados: 26,
            lucroDesejado: 15,
          },
        })
      }

      return NextResponse.json({
        success: true,
        data: {
          mes: meta.mes,
          metaDiariaAlmoco: meta.metaDiariaAlmoco,
          metaDiariaJanta: meta.metaDiariaJanta,
          diasTrabalhados: meta.diasTrabalhados,
          lucroDesejado: meta.lucroDesejado,
        },
      })
    }

    // Buscar todas as metas do ano
    const metasDb = await prisma.planejamentoFaturamento.findMany({
      where: {
        userId: session.user.id,
        ano,
      },
      orderBy: { mes: "asc" },
    })

    // Preencher meses faltantes com valores padrão
    const metas: Array<{
      mes: number
      metaDiariaAlmoco: number
      metaDiariaJanta: number
      diasTrabalhados: number
      lucroDesejado: number
    }> = []

    for (let i = 1; i <= 12; i++) {
      const metaExistente = metasDb.find(m => m.mes === i)
      if (metaExistente) {
        metas.push({
          mes: metaExistente.mes,
          metaDiariaAlmoco: metaExistente.metaDiariaAlmoco,
          metaDiariaJanta: metaExistente.metaDiariaJanta,
          diasTrabalhados: metaExistente.diasTrabalhados,
          lucroDesejado: metaExistente.lucroDesejado,
        })
      } else {
        metas.push({
          mes: i,
          metaDiariaAlmoco: 0,
          metaDiariaJanta: 0,
          diasTrabalhados: 26,
          lucroDesejado: 15,
        })
      }
    }

    return NextResponse.json({ success: true, metas })
  } catch (error) {
    console.error("Erro ao buscar metas:", error)
    return NextResponse.json({ success: false, message: "Erro ao buscar metas" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Não autorizado" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { ano, metas } = body

    if (!ano || !metas || !Array.isArray(metas)) {
      return NextResponse.json({ success: false, message: "Dados inválidos" }, { status: 400 })
    }

    // Salvar/atualizar cada meta do mês
    for (const meta of metas) {
      await prisma.planejamentoFaturamento.upsert({
        where: {
          userId_ano_mes: {
            userId: session.user.id,
            ano,
            mes: meta.mes,
          },
        },
        update: {
          metaDiariaAlmoco: meta.metaDiariaAlmoco,
          metaDiariaJanta: meta.metaDiariaJanta,
          diasTrabalhados: meta.diasTrabalhados,
          lucroDesejado: meta.lucroDesejado,
        },
        create: {
          userId: session.user.id,
          ano,
          mes: meta.mes,
          metaDiariaAlmoco: meta.metaDiariaAlmoco,
          metaDiariaJanta: meta.metaDiariaJanta,
          diasTrabalhados: meta.diasTrabalhados,
          lucroDesejado: meta.lucroDesejado,
        },
      })
    }

    return NextResponse.json({ success: true, message: "Metas salvas com sucesso" })
  } catch (error) {
    console.error("Erro ao salvar metas:", error)
    return NextResponse.json({ success: false, message: "Erro ao salvar metas" }, { status: 500 })
  }
}