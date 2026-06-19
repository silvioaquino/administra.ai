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

// Função para parsear data no formato DD/MM/YYYY ou YYYY-MM-DD
function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null

  // Tenta formato DD/MM/YYYY
  if (dateStr.includes("/")) {
    const parts = dateStr.split("/")
    if (parts.length === 3) {
      const dia = parseInt(parts[0])
      const mes = parseInt(parts[1]) - 1
      const ano = parseInt(parts[2])
      return new Date(ano, mes, dia)
    }
  }

  // Tenta formato YYYY-MM-DD - corrigir para não usar UTC
  if (dateStr.includes("-")) {
    const parts = dateStr.split("-")
    if (parts.length === 3) {
      const ano = parseInt(parts[0])
      const mes = parseInt(parts[1]) - 1
      const dia = parseInt(parts[2])
      return new Date(ano, mes, dia)
    }
  }

  return null
}

function getPeriodoRange(
  periodo: PeriodoDashboard,
  dataEspecifica: string | null,
  dataInicio: string | null,
  dataFim: string | null,
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

  if (periodo === "especifico") {
    const parsedInicio = dataInicio ? parseDate(dataInicio) : null
    const parsedFim = dataFim ? parseDate(dataFim) : null
    const parsedEspecifica = dataEspecifica ? parseDate(dataEspecifica) : null

    if (parsedInicio && parsedFim) {
      const inicio = new Date(parsedInicio.getFullYear(), parsedInicio.getMonth(), parsedInicio.getDate())
      const fim = new Date(parsedFim.getFullYear(), parsedFim.getMonth(), parsedFim.getDate(), 23, 59, 59, 999)

      return {
        inicio,
        fim,
        label: `${inicio.toLocaleDateString("pt-BR")} a ${fim.toLocaleDateString("pt-BR")}`
      }
    }
    if (parsedInicio) {
      const inicio = new Date(parsedInicio.getFullYear(), parsedInicio.getMonth(), parsedInicio.getDate())
      const fim = new Date(parsedInicio.getFullYear(), parsedInicio.getMonth(), parsedInicio.getDate(), 23, 59, 59, 999)

      return {
        inicio,
        fim,
        label: inicio.toLocaleDateString("pt-BR")
      }
    }
    if (parsedEspecifica) {
      const inicio = new Date(parsedEspecifica.getFullYear(), parsedEspecifica.getMonth(), parsedEspecifica.getDate())
      const fim = new Date(parsedEspecifica.getFullYear(), parsedEspecifica.getMonth(), parsedEspecifica.getDate(), 23, 59, 59, 999)

      return {
        inicio,
        fim,
        label: inicio.toLocaleDateString("pt-BR")
      }
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

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const periodo = (searchParams.get("periodo") || "mes") as PeriodoDashboard
  const dataEspecifica = searchParams.get("data")
  const dataInicio = searchParams.get("dataInicio")
  const dataFim = searchParams.get("dataFim")
  const anoParam = searchParams.get("ano")
  const mesParam = searchParams.get("mes")

  try {
    const range = getPeriodoRange(periodo, dataEspecifica, dataInicio, dataFim, anoParam, mesParam)

    // Buscar dados reais do período (livroDiario)
    let totalReceitas = 0
    let totalDespesas = 0
    let chartData: Array<{ periodo: string; receitas: number; despesas: number; lucro: number }> = []

    // Para todos os períodos, usar livroDiario
    const lancamentos = await prisma.livroDiario.findMany({
      where: {
        userId: session.user.id,
        data: {
          gte: range.inicio,
          lte: range.fim
        }
      },
      orderBy: { data: "asc" }
    })

    // Agrupar por data
    const dadosPorData = new Map<string, { receitas: number; despesas: number }>()
    for (const lanc of lancamentos) {
      const dataKey = lanc.data.toISOString().split("T")[0]
      const existing = dadosPorData.get(dataKey) || { receitas: 0, despesas: 0 }
      existing.receitas += Number(lanc.entrada)
      existing.despesas += Number(lanc.saida)
      dadosPorData.set(dataKey, existing)
    }

    chartData = Array.from(dadosPorData.entries()).map(([data, vals]) => ({
      periodo: new Date(data).toLocaleDateString("pt-BR"),
      receitas: vals.receitas,
      despesas: vals.despesas,
      lucro: vals.receitas - vals.despesas
    }))

    totalReceitas = chartData.reduce((sum, d) => sum + d.receitas, 0)
    totalDespesas = chartData.reduce((sum, d) => sum + d.despesas, 0)

    const saldo = totalReceitas - totalDespesas
    const margem = totalReceitas > 0 ? (saldo / totalReceitas) * 100 : 0

    // Buscar METAS do PLANEJAMENTO (planejamentoFaturamento) - mesmo lugar do Planejamento
    const anoMeta = range.inicio.getFullYear()
    const mesMeta = range.inicio.getMonth() + 1

    const metaPlanejamento = await prisma.planejamentoFaturamento.findFirst({
      where: {
        userId: session.user.id,
        ano: anoMeta,
        mes: mesMeta
      }
    })

    // Calcular metas baseado no planejamentoFaturamento (mesmo cálculo da página Planejamento)
    const diasTrabalhados = metaPlanejamento?.diasTrabalhados || 26
    const metaDiariaAlmoco = metaPlanejamento?.metaDiariaAlmoco || 0
    const metaDiariaJanta = metaPlanejamento?.metaDiariaJanta || 0
    const lucroDesejado = metaPlanejamento?.lucroDesejado || 15

    const metaMensalAlmoco = metaDiariaAlmoco * diasTrabalhados
    const metaMensalJanta = metaDiariaJanta * diasTrabalhados
    const metaFaturamento = metaMensalAlmoco + metaMensalJanta
    const metaLucro = lucroDesejado

    // Para meta de despesa, estima baseado no faturamento meta (assumindo 70% de despesa)
    // Ou busca das despesas fixas + variáveis do planejamento
    const metaDespesa = metaFaturamento * 0.7
    const metaDespesaDiaria = metaDespesa / diasTrabalhados

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