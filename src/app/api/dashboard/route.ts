import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type PeriodoDashboard = "hoje" | "mes" | "ano" | "especifico"

interface PeriodoRange {
  inicio: Date
  fim: Date
  label: string
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return value

  if (value && typeof (value as { toNumber?: () => number }).toNumber === "function") {
    return (value as { toNumber: () => number }).toNumber()
  }

  return 0
}

function getPeriodoRange(
  periodo: PeriodoDashboard,
  dataEspecifica: string | null,
  anoParam: string | null,
  mesParam: string | null
): PeriodoRange {
  const hoje = new Date()
  const ano = anoParam ? parseInt(anoParam) : hoje.getFullYear()
  const mes = mesParam ? parseInt(mesParam) : hoje.getMonth() + 1

  if (periodo === "hoje") {
    return {
      inicio: new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()),
      fim: hoje,
      label: hoje.toLocaleDateString("pt-BR")
    }
  }

  if (periodo === "mes") {
    const inicio = new Date(ano, mes - 1, 1)
    const fim = new Date(ano, mes, 0, 23, 59, 59, 999)

    return {
      inicio,
      fim,
      label: inicio.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    }
  }

  if (periodo === "ano") {
    const inicio = new Date(ano, 0, 1)
    const fim = new Date(ano, 11, 31, 23, 59, 59, 999)

    return {
      inicio,
      fim,
      label: String(ano)
    }
  }

  if (dataEspecifica) {
    const data = new Date(`${dataEspecifica}T00:00:00`)
    const fim = new Date(`${dataEspecifica}T23:59:59.999`)

    return {
      inicio: data,
      fim,
      label: data.toLocaleDateString("pt-BR")
    }
  }

  return {
    inicio: new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()),
    fim: hoje,
    label: hoje.toLocaleDateString("pt-BR")
  }
}

function getPeriodoLabel(item: { data: Date }, periodo: PeriodoDashboard): string {
  if (periodo === "ano") {
    return item.data.toLocaleDateString("pt-BR", { month: "short" })
  }

  if (periodo === "mes") {
    return String(item.data.getDate())
  }

  return item.data.toLocaleDateString("pt-BR")
}

function diasUteis(meta: { diasUteis: number }): number {
  return meta.diasUteis > 0 ? meta.diasUteis : 26
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const periodo = (searchParams.get("periodo") || "mes") as PeriodoDashboard
  const dataEspecifica = searchParams.get("data")
  const anoParam = searchParams.get("ano")
  const mesParam = searchParams.get("mes")

  try {
    const range = getPeriodoRange(periodo, dataEspecifica, anoParam, mesParam)
    const fluxoDiario = await prisma.fluxoCaixaDiario.findMany({
      where: {
        userId: session.user.id,
        data: {
          gte: range.inicio,
          lte: range.fim
        }
      },
      orderBy: {
        data: "asc"
      }
    })

    const chartData = fluxoDiario.map(item => {
      const receitas = toNumber(item.faturamentoRealizado)
      const despesas = toNumber(item.despesasRealizadas)
      const lucro = toNumber(item.lucroRealizado)

      return {
        periodo: getPeriodoLabel(item, periodo),
        receitas,
        despesas,
        lucro
      }
    })

    const totalReceitas = chartData.reduce((total, item) => total + item.receitas, 0)
    const totalDespesas = chartData.reduce((total, item) => total + item.despesas, 0)
    const saldo = totalReceitas - totalDespesas
    const margem = totalReceitas > 0 ? (saldo / totalReceitas) * 100 : 0

    const anoMeta = range.inicio.getFullYear()
    const mesMeta = range.inicio.getMonth() + 1
    const metas = periodo === "ano"
      ? await prisma.metaFluxoCaixa.findMany({
          where: {
            userId: session.user.id,
            ano: anoMeta
          }
        })
      : []

    const meta = metas[0] ?? await prisma.metaFluxoCaixa.findFirst({
      where: {
        userId: session.user.id,
        ano: anoMeta,
        mes: mesMeta
      }
    })

    const diasPeriodo = Math.max(1, Math.ceil((range.fim.getTime() - range.inicio.getTime()) / 86400000) + 1)
    const metaFaturamento = metas.length > 0
      ? metas.reduce((total, item) => total + Number(item.metaFaturamentoDiaria) * diasUteis(item), 0)
      : meta
        ? Number(meta.metaFaturamentoDiaria) * diasPeriodo
        : 2500 * diasPeriodo
    const metaDespesaDiaria = meta ? Number(meta.metaDespesasDiaria) : 1700
    const metaDespesa = metas.length > 0
      ? metas.reduce((total, item) => total + Number(item.metaDespesasDiaria) * diasUteis(item), 0)
      : metaDespesaDiaria * diasPeriodo
    const metaLucro = metas.length > 0
      ? metas.reduce((total, item) => total + Number(item.metaLucroPercentual), 0) / metas.length
      : meta
        ? Number(meta.metaLucroPercentual)
        : 20

    const ultimosLancamentos = await prisma.livroDiario.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        data: "desc"
      },
      take: 5
    })

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalReceitas,
          totalDespesas,
          saldo,
          margem
        },
        chartData,
        metas: {
          faturamento: {
            atual: totalReceitas,
            meta: metaFaturamento,
            percentual: metaFaturamento > 0 ? Math.min(100, Math.max(0, (totalReceitas / metaFaturamento) * 100)) : 0
          },
          despesa: {
            atual: totalDespesas,
            meta: metaDespesa,
            diaria: metaDespesaDiaria,
            percentual: metaDespesa > 0 ? Math.min(100, Math.max(0, (totalDespesas / metaDespesa) * 100)) : 0
          },
          lucro: {
            atual: margem,
            meta: metaLucro,
            percentual: metaLucro > 0 ? Math.min(100, Math.max(0, (margem / metaLucro) * 100)) : 0
          }
        },
        ultimosLancamentos: ultimosLancamentos.map(lancamento => ({
          id: lancamento.id,
          data: lancamento.data.toISOString(),
          descricao: lancamento.descricao,
          cliente_fornecedor: lancamento.clienteFornecedor,
          entrada: Number(lancamento.entrada),
          saida: Number(lancamento.saida)
        })),
        periodoTexto: range.label
      }
    })
  } catch (error) {
    console.error("Erro ao buscar dados do dashboard:", error)
    return NextResponse.json({ error: "Erro ao buscar dados do dashboard" }, { status: 500 })
  }
}
