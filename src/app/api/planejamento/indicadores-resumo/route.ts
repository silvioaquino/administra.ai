// app/api/planejamento/indicadores-resumo/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Função para calcular despesas variáveis (mesma lógica da página de Planejamento)
function calcularDespesasVariaveis(config: {
  distribuicaoVendas: { debito: number; credito: number; voucher: number }
  distribuicaoMaquininhas: { infinitepay: number; stone: number; caixa: number }
  taxas: {
    debito: { infinitepay: number; stone: number; caixa: number }
    credito: { infinitepay: number; stone: number; caixa: number }
    voucher: number
  }
  aluguelMaquininhas: { stone1: number; stone2: number }
  manutencao: number
  simplesNacional: number
}, faturamentoBase: number) {
  let debitoMedia = 0
  for (const [maquina, percentual] of Object.entries(config.distribuicaoMaquininhas)) {
    debitoMedia += config.taxas.debito[maquina as keyof typeof config.taxas.debito] * (percentual / 100)
  }

  let creditoMedia = 0
  for (const [maquina, percentual] of Object.entries(config.distribuicaoMaquininhas)) {
    creditoMedia += config.taxas.credito[maquina as keyof typeof config.taxas.credito] * (percentual / 100)
  }

  const percDebito = config.distribuicaoVendas.debito / 100
  const percCredito = config.distribuicaoVendas.credito / 100
  const percVoucher = config.distribuicaoVendas.voucher / 100
  const taxaMediaGeral = (debitoMedia * percDebito) + (creditoMedia * percCredito) + (config.taxas.voucher * percVoucher)
  const aluguelTotal = config.aluguelMaquininhas.stone1 + config.aluguelMaquininhas.stone2
  const percentualAluguel = (aluguelTotal / faturamentoBase) * 100
  const totalDespesasVariaveis = config.simplesNacional + taxaMediaGeral + config.manutencao + percentualAluguel

  return {
    debitoMedia,
    creditoMedia,
    taxaMediaGeral,
    aluguelTotal,
    percentualAluguel,
    totalDespesasVariaveis
  }
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const userId = session.user.id
  const { searchParams } = new URL(request.url)
  const ano = parseInt(searchParams.get("ano") || new Date().getFullYear().toString())

  try {
    // 1. Buscar despesas fixas do PlanejamentoConfig (mesma fonte da página de Planejamento)
    const configFixas = await prisma.planejamentoConfig.findFirst({
      where: {
        userId,
        tipo: "despesas_fixas",
        anoReferencia: ano
      }
    })
    const despesasFixas = configFixas?.dados as Array<{ nome: string; valor: number }> || []

    // 2. Buscar configuração de taxas de cartão para calcular despesas variáveis
    const taxasConfig = await prisma.taxasCartaoConfig.findUnique({
      where: { userId }
    })
    const defaultTaxasCartao = {
      distribuicaoVendas: { debito: 40, credito: 50, voucher: 10 },
      distribuicaoMaquininhas: { infinitepay: 50, stone: 30, caixa: 20 },
      taxas: {
        debito: { infinitepay: 1.37, stone: 2.34, caixa: 4.48 },
        credito: { infinitepay: 3.15, stone: 6.44, caixa: 5.78 },
        voucher: 7.0
      },
      aluguelMaquininhas: { stone1: 59.90, stone2: 19.90 },
      manutencao: 1.0,
      simplesNacional: 8.0
    }
    const taxasCartao = (taxasConfig?.config as typeof defaultTaxasCartao) || defaultTaxasCartao

    // Usar faturamento base do localStorage ou valor padrão (igual à página de Planejamento)
    const faturamentoBase = 30000 // Valor padrão, o frontend pode passar se necessário
    const despesasVariaveisCalculadas = calcularDespesasVariaveis(taxasCartao, faturamentoBase)
    const despesasVariaveisPct = despesasVariaveisCalculadas.totalDespesasVariaveis

    // 3. Buscar meta do mês atual
    const mesAtual = new Date().getMonth() + 1
    const metaAtual = await prisma.planejamentoFaturamento.findFirst({
      where: {
        userId,
        ano,
        mes: mesAtual
      }
    })

    const diasTrabalhados = metaAtual?.diasTrabalhados || 26
    const metaDiariaAlmoco = metaAtual?.metaDiariaAlmoco || 0
    const metaDiariaJanta = metaAtual?.metaDiariaJanta || 0
    const lucroDesejado = metaAtual?.lucroDesejado || 15

    const metaMensalAlmoco = metaDiariaAlmoco * diasTrabalhados
    const metaMensalJanta = metaDiariaJanta * diasTrabalhados
    const metaMensalTotal = metaMensalAlmoco + metaMensalJanta

    // 4. Calcular CMV (mesma fórmula da página de Planejamento)
    const totalFixas = despesasFixas.reduce((sum, d) => sum + Number(d.valor ?? 0), 0)
    const pctFixas = metaMensalTotal > 0 ? (totalFixas / metaMensalTotal) * 100 : 0
    const cmv = 100 - (pctFixas + despesasVariaveisPct + lucroDesejado)

    return NextResponse.json({
      success: true,
      despesasFixas: despesasFixas.map(d => ({ nome: d.nome, valor: Number(d.valor) })),
      despesasVariaveisPct,
      metaMensalTotal,
      cmv: Math.max(0, cmv)
    })

  } catch (error) {
    console.error("Erro ao buscar indicadores:", error)
    return NextResponse.json({
      success: false,
      error: "Erro ao buscar dados dos indicadores"
    }, { status: 500 })
  }
}