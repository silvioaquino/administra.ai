// app/api/planejamento/indicadores-resumo/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Função para calcular despesas variáveis (compatível com nova estrutura)
function calcularDespesasVariaveis(config: any, faturamentoBase: number) {
  // Suportar ambas as estruturas: com outrasTaxas OU sem (campos diretos)
  const outrasTaxas = config.outrasTaxas || {
    voucher: config.taxaVoucher || 7.0,
    simplesNacional: config.simplesNacional || 0,
    manutencao: config.manutencao || 0
  }

  const maquininhasAtivas = config.maquininhas?.filter((m: any) => m.ativo) ?? []

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

  const distribuicao = config.distribuicaoVendas || { debito: 0, credito: 0, voucher: 0 }
  const percDebito = (distribuicao.debito || 0) / 100
  const percCredito = (distribuicao.credito || 0) / 100
  const percVoucher = (distribuicao.voucher || 0) / 100

  // Taxa voucher padrão
  const taxaVoucher = outrasTaxas.voucher || 7.0

  const taxaMediaGeral = (debitoMedia * percDebito) + (creditoMedia * percCredito) + (taxaVoucher * percVoucher)
  const percentualAluguel = faturamentoBase > 0 ? (aluguelTotal / faturamentoBase) * 100 : 0
  const totalDespesasVariaveis = (outrasTaxas.simplesNacional || 0) + taxaMediaGeral + (outrasTaxas.manutencao || 0) + percentualAluguel

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
    // 1. Buscar meta do mês atual (usando tabela NOVA)
    const mesAtual = new Date().getMonth() + 1
    const metaAtual = await prisma.planejamentoFaturamentoNovo.findFirst({
      where: {
        empresaId,
        userId,
        ano,
        mes: mesAtual
      }
    })

    // Usar metaTotal diretamente se disponível
    const metaMensalTotal = metaAtual?.metaTotal || 0
    const lucroDesejado = 15 // Valor padrão (não está no PlanejamentoFaturamentoNovo)

    // 2. Buscar despesas fixas (DA NOVA TABELA primeiro, depois fallback para tabela antiga)
    const despesasFixasNova = await prisma.planejamentoDespesaFixaNovo.findMany({
      where: {
        userId,
        empresaId,
        ano
      },
      orderBy: { nome: "asc" }
    })

    let despesasFixas: Array<{ nome: string; valor: number }> = []

    // Se encontrou na nova tabela, usar ela
    if (despesasFixasNova.length > 0) {
      despesasFixas = despesasFixasNova.map(d => ({
        nome: d.nome,
        valor: Number(d.valor)
      }))
    } else {
      // Fallback: buscar da tabela principal DespesaFixa
      const despesasFixasDb = await prisma.despesaFixa.findMany({
        where: {
          userId,
          empresaId
        },
        orderBy: { nome: "asc" }
      })

      // Se não encontrou na tabela principal, buscar do planejamentoConfig
      if (despesasFixasDb.length > 0) {
        despesasFixas = despesasFixasDb.map(d => ({
          nome: d.nome,
          valor: Number(d.valor)
        }))
      } else {
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
    }

    // 3. Buscar configuração de despesas variáveis (usando API NOVA)
    const taxasResponse = await fetch(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/planejamento-financeiro/despesas-variaveis?ano=${ano}&mes=${mesAtual}`,
      {
        headers: {
          cookie: request.headers.get('cookie') || ''
        }
      }
    )
    const taxasData = await taxasResponse.json()

    // Configuração padrão com estrutura compatível para DespesasVariaveisTable
    const configMaquininhas = taxasData.success && taxasData.dados ? {
      maquininhas: taxasData.dados.config?.maquininhas || [],
      distribuicaoVendas: taxasData.dados.config?.distribuicaoVendas || { debito: 40, credito: 50, voucher: 10 },
      outrasTaxas: {
        voucher: taxasData.dados.config?.taxaVoucher || 7.0,
        simplesNacional: taxasData.dados.config?.simplesNacional || 0,
        manutencao: taxasData.dados.config?.manutencao || 0
      }
    } : {
      maquininhas: [
        { id: "1", nome: "InfinitePay", taxaDebito: 1.37, taxaCredito: 3.15, aluguel: 0, ativo: true },
        { id: "2", nome: "Stone", taxaDebito: 2.34, taxaCredito: 6.44, aluguel: 79.80, ativo: true },
        { id: "3", nome: "Caixa", taxaDebito: 4.48, taxaCredito: 5.78, aluguel: 0, ativo: true },
      ],
      distribuicaoVendas: { debito: 40, credito: 50, voucher: 10 },
      outrasTaxas: {
        voucher: 7.0,
        simplesNacional: 8.0,
        manutencao: 1.0
      }
    }

    // 4. Calcular despesas variáveis usando a MESMA função do page.tsx
    // Usar meta do mês atual
    const referenciaCalculo = metaMensalTotal || 52000
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