// app/api/planejamento/indicadores-resumo/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Função para calcular despesas variáveis (MESMA lógica do page.tsx)
function calcularDespesasVariaveis(config: {
  maquininhas: Array<{
    id: string
    nome: string
    taxaDebito: number
    taxaCredito: number
    aluguel: number
    ativo: boolean
  }>
  distribuicaoVendas: { debito: number; credito: number; voucher: number }
  manutencao: number
  simplesNacional: number
}, faturamentoBase: number) {
  const maquininhasAtivas = config.maquininhas.filter(m => m.ativo)
  if (maquininhasAtivas.length === 0) {
    return {
      debitoMedia: 0,
      creditoMedia: 0,
      taxaMediaGeral: 0,
      aluguelTotal: 0,
      percentualAluguel: 0,
      totalDespesasVariaveis: 0
    }
  }

  // Distribuição igual entre maquininhas ativas
  const distribuicaoMaquininhas = 100 / maquininhasAtivas.length

  let debitoMedia = 0
  let creditoMedia = 0
  let aluguelTotal = 0

  for (const maquina of maquininhasAtivas) {
    const peso = distribuicaoMaquininhas / 100
    debitoMedia += maquina.taxaDebito * peso
    creditoMedia += maquina.taxaCredito * peso
    aluguelTotal += maquina.aluguel
  }

  const percDebito = config.distribuicaoVendas.debito / 100
  const percCredito = config.distribuicaoVendas.credito / 100
  const percVoucher = config.distribuicaoVendas.voucher / 100
  
  // Taxa voucher padrão
  const taxaVoucher = 7.0
  
  const taxaMediaGeral = (debitoMedia * percDebito) + (creditoMedia * percCredito) + (taxaVoucher * percVoucher)
  const percentualAluguel = faturamentoBase > 0 ? (aluguelTotal / faturamentoBase) * 100 : 0
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
  const empresaId = session.user.empresaId || "sem-empresa"
  const { searchParams } = new URL(request.url)
  const ano = parseInt(searchParams.get("ano") || new Date().getFullYear().toString())

  try {
    // 1. Buscar meta do mês atual
    const mesAtual = new Date().getMonth() + 1
    const metaAtual = await prisma.planejamentoFaturamento.findFirst({
      where: {
        empresaId,
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

    // 2. Buscar despesas fixas (DA TABELA DESPESA FIXA, igual ao page.tsx)
    const despesasFixasDb = await prisma.despesaFixa.findMany({
      where: {
        userId,
        empresaId
      },
      orderBy: { nome: "asc" }
    })

    let despesasFixas: Array<{ nome: string; valor: number }> = []
    
    // Se encontrou na tabela principal, usar ela
    if (despesasFixasDb.length > 0) {
      despesasFixas = despesasFixasDb.map(d => ({
        nome: d.nome,
        valor: Number(d.valor)
      }))
    } else {
      // Fallback: buscar do planejamentoConfig
      const configFixas = await prisma.planejamentoConfig.findFirst({
        where: {
          empresaId,
          userId,
          tipo: "despesas_fixas",
          anoReferencia: ano
        }
      })
      despesasFixas = (configFixas?.dados as Array<{ nome: string; valor: number }>) || []
    }

    // 3. Buscar configuração de despesas variáveis (MESMA estrutura do page.tsx)
    const taxasResponse = await fetch(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/planejamento/despesas-variaveis?ano=${ano}`,
      {
        headers: {
          cookie: request.headers.get('cookie') || ''
        }
      }
    )
    const taxasData = await taxasResponse.json()

    // Configuração padrão (mesma do page.tsx)
    const configMaquininhas = taxasData.success && taxasData.dados ? taxasData.dados : {
      maquininhas: [
        { id: "1", nome: "InfinitePay", taxaDebito: 1.37, taxaCredito: 3.15, aluguel: 0, ativo: true },
        { id: "2", nome: "Stone", taxaDebito: 2.34, taxaCredito: 6.44, aluguel: 79.80, ativo: true },
        { id: "3", nome: "Caixa", taxaDebito: 4.48, taxaCredito: 5.78, aluguel: 0, ativo: true },
      ],
      distribuicaoVendas: { debito: 40, credito: 50, voucher: 10 },
      manutencao: 1.0,
      simplesNacional: 8.0
    }

    // 4. Calcular despesas variáveis usando a MESMA função do page.tsx
    // Usar meta do mês atual
    const referenciaCalculo = metaMensalTotal
    const despesasVariaveisCalculadas = calcularDespesasVariaveis(configMaquininhas, referenciaCalculo)
    const despesasVariaveisPct = despesasVariaveisCalculadas.totalDespesasVariaveis

    // 5. Calcular percentual de despesas fixas
    // Usar a mesma referência (meta do mês atual ou 52000 como fallback)
    const totalFixas = despesasFixas.reduce((sum, d) => sum + Number(d.valor ?? 0), 0)
    const pctFixas = referenciaCalculo > 0 ? (totalFixas / referenciaCalculo) * 100 : 0

    // 6. Calcular CMV e Mark-Up
    const cmv = 100 - (pctFixas + despesasVariaveisPct + lucroDesejado)
    const markUp = cmv > 0 ? 100 / cmv : 0

    console.log("📊 Indicadores calculados:", {
      totalFixas,
      referenciaCalculo,
      pctFixas: pctFixas.toFixed(2) + '%',
      despesasVariaveisPct: despesasVariaveisPct.toFixed(2) + '%',
      totalDespesasVariaveis: despesasVariaveisCalculadas.totalDespesasVariaveis,
      lucroDesejado,
      cmv: cmv.toFixed(2) + '%',
      markUp: markUp.toFixed(2)
    })

    return NextResponse.json({
      success: true,
      despesasFixas: despesasFixas.map(d => ({ nome: d.nome, valor: Number(d.valor) })),
      despesasVariaveisPct,
      totalDespesasVariaveis: despesasVariaveisCalculadas.totalDespesasVariaveis,
      metaMensalTotal: referenciaCalculo,
      cmv: Math.max(0, cmv),
      pctFixas,
      markUp
    })

  } catch (error) {
    console.error("Erro ao buscar indicadores:", error)
    return NextResponse.json({
      success: false,
      error: "Erro ao buscar dados dos indicadores"
    }, { status: 500 })
  }
}