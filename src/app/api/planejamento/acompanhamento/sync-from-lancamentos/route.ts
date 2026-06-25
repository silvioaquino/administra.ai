// src/app/api/planejamento/acompanhamento/sync-from-lancamentos/route.ts
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
    const PCT_ALMOCO = 0.73
    const PCT_JANTA = 0.27

    // Buscar todos os lançamentos do ano
    const lancamentos = await prisma.livroDiario.findMany({
      where: {
        userId: session.user.id,
        data: {
          gte: new Date(ano, 0, 1),
          lt: new Date(ano + 1, 0, 1)
        },
        entrada: { gt: 0 }
      }
    })

    // Agrupar faturamento por mês
    const faturamentoPorMes: Record<number, number> = {}
    for (const lanc of lancamentos) {
      const mes = lanc.data.getMonth() + 1
      faturamentoPorMes[mes] = (faturamentoPorMes[mes] || 0) + Number(lanc.entrada)
    }

    const resultados = []
    for (let mes = 1; mes <= 12; mes++) {
      const total = faturamentoPorMes[mes] || 0
      const almoco = total * PCT_ALMOCO
      const janta = total * PCT_JANTA

      // Upsert no banco
      await prisma.planejamentoAcompanhamento.upsert({
        where: {
          empresaId_userId_ano_mes: {
            empresaId: session.user.empresaId || "",
            userId: session.user.id,
            ano,
            mes
          }
        },
        update: {
          faturamentoAlmoco: almoco,
          faturamentoJanta: janta,
          faturamentoTotal: total
        },
        create: {
          empresaId: session.user.empresaId || "",
          userId: session.user.id,
          ano,
          mes,
          faturamentoAlmoco: almoco,
          faturamentoJanta: janta,
          faturamentoTotal: total
        }
      })

      resultados.push({
        mes,
        faturamentoAlmoco: almoco,
        faturamentoJanta: janta,
        faturamentoTotal: total
      })
    }

    return NextResponse.json({
      success: true,
      message: `Acompanhamento sincronizado para ${ano}`,
      dados: resultados
    })
  } catch (error) {
    console.error("Erro ao sincronizar:", error)
    return NextResponse.json(
      { error: "Erro ao sincronizar acompanhamento" },
      { status: 500 }
    )
  }
}