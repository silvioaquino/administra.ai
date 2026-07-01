// src/app/api/planejamento/despesas-variaveis/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Schema para validação dos dados
const DespesasVariaveisSchema = z.object({
  dados: z.object({
    maquininhas: z.array(z.object({
      id: z.string(),
      nome: z.string(),
      taxaDebito: z.number(),
      taxaCredito: z.number(),
      aluguel: z.number(),
      ativo: z.boolean()
    })),
    distribuicaoVendas: z.object({
      debito: z.number(),
      credito: z.number(),
      voucher: z.number()
    }),
    manutencao: z.number(),
    simplesNacional: z.number()
  }),
  ano: z.number(),
  mes: z.number().optional(),
  faturamentoBase: z.number()
})

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Não autorizado" }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const ano = parseInt(searchParams.get("ano") || new Date().getFullYear().toString())
    const mes = searchParams.get("mes") ? parseInt(searchParams.get("mes")!) : undefined

    // Buscar configuração
    const config = await prisma.planejamentoConfig.findFirst({
      where: {
        userId: session.user.id,
        tipo: "despesas_variaveis",
        anoReferencia: ano
      }
    })

    // Buscar resultados salvos
    const resultados = await prisma.despesasVariaveisResultado.findFirst({
      where: {
        userId: session.user.id,
        ano,
        mes: mes || null
      }
    })

    return NextResponse.json({
      success: true,
      dados: config?.dados || null,
      resultados: resultados || null
    })

  } catch (error) {
    console.error("Erro ao buscar despesas variáveis:", error)
    return NextResponse.json(
      { success: false, message: "Erro ao buscar dados" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Não autorizado" }, { status: 401 })
    }

    const body = await req.json()
    const validation = DespesasVariaveisSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: "Dados inválidos", errors: validation.error },
        { status: 400 }
      )
    }

    const { dados, ano, mes, faturamentoBase } = validation.data

    // Buscar empresa do usuário
    const empresa = await prisma.empresa.findFirst({
      where: { userId: session.user.id }
    })

    if (!empresa) {
      return NextResponse.json(
        { success: false, message: "Empresa não encontrada" },
        { status: 404 }
      )
    }

    // Calcular resultados
    const resultados = calcularResultados(dados, faturamentoBase || 52000)

    // 1. Salvar configuração no PlanejamentoConfig
    await prisma.planejamentoConfig.upsert({
      where: {
        empresaId_userId_tipo_anoReferencia: {
          empresaId: empresa.id,
          userId: session.user.id,
          tipo: "despesas_variaveis",
          anoReferencia: ano
        }
      },
      update: {
        dados: dados,
        updatedAt: new Date()
      },
      create: {
        empresaId: empresa.id,
        userId: session.user.id,
        tipo: "despesas_variaveis",
        dados: dados,
        anoReferencia: ano
      }
    })

    // 2. Salvar resultados calculados
    const resultadosData = {
      empresaId: empresa.id,
      userId: session.user.id,
      ano,
      mes: mes ?? 0,
      faturamentoBase: faturamentoBase || 52000,
      distribuicaoDebito: dados.distribuicaoVendas.debito,
      distribuicaoCredito: dados.distribuicaoVendas.credito,
      distribuicaoVoucher: dados.distribuicaoVendas.voucher,
      manutencao: dados.manutencao,
      simplesNacional: dados.simplesNacional,
      maquininhasConfig: dados.maquininhas,
      debitoMedia: resultados.debitoMedia,
      creditoMedia: resultados.creditoMedia,
      taxaMediaGeral: resultados.taxaMediaGeral,
      aluguelTotal: resultados.aluguelTotal,
      percentualAluguel: resultados.percentualAluguel,
      totalDespesasVariaveis: resultados.totalDespesasVariaveis
    }

    // Usar upsert para evitar duplicatas
    const mesValue = mes ?? 0
    const resultadoSalvo = await prisma.despesasVariaveisResultado.upsert({
      where: {
        empresaId_userId_ano_mes: {
          empresaId: empresa.id,
          userId: session.user.id,
          ano,
          mes: mesValue
        }
      },
      update: resultadosData,
      create: resultadosData
    })

    return NextResponse.json({
      success: true,
      message: "Configurações e resultados salvos com sucesso",
      data: {
        config: dados,
        resultados: resultadoSalvo
      }
    })

  } catch (error) {
    console.error("Erro ao salvar despesas variáveis:", error)
    return NextResponse.json(
      { success: false, message: "Erro ao salvar dados" },
      { status: 500 }
    )
  }
}

// Função para calcular os resultados
function calcularResultados(dados: any, faturamentoBase: number = 52000) {
  const maquininhasAtivas = dados.maquininhas.filter((m: any) => m.ativo)

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

  const distribuicaoMaquininhas = 100 / maquininhasAtivas.length

  let taxaDebitoMedia = 0
  let taxaCreditoMedia = 0
  let aluguelTotal = 0

  for (const maquina of maquininhasAtivas) {
    const peso = distribuicaoMaquininhas / 100
    taxaDebitoMedia += maquina.taxaDebito * peso
    taxaCreditoMedia += maquina.taxaCredito * peso
    aluguelTotal += maquina.aluguel
  }

  const percDebito = dados.distribuicaoVendas.debito / 100
  const percCredito = dados.distribuicaoVendas.credito / 100
  const percVoucher = dados.distribuicaoVendas.voucher / 100

  const taxaVoucher = 7.0

  const taxaMediaGeral = (taxaDebitoMedia * percDebito) + (taxaCreditoMedia * percCredito) + (taxaVoucher * percVoucher)
  // Calcular percentualAluguel como valor absoluto (não como percentual)
  const percentualAluguel = aluguelTotal
  const totalDespesasVariaveis = dados.simplesNacional + taxaMediaGeral + dados.manutencao + percentualAluguel

  return {
    debitoMedia: parseFloat(taxaDebitoMedia.toFixed(2)),
    creditoMedia: parseFloat(taxaCreditoMedia.toFixed(2)),
    taxaMediaGeral: parseFloat(taxaMediaGeral.toFixed(2)),
    aluguelTotal: parseFloat(aluguelTotal.toFixed(2)),
    percentualAluguel: parseFloat(percentualAluguel.toFixed(2)),
    totalDespesasVariaveis: parseFloat(totalDespesasVariaveis.toFixed(2))
  }
}