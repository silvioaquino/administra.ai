// src/app/api/planejamento/taxas-cartao/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const CONFIG_PADRAO = {
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

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const empresaId = session.user.empresaId;
  if (!empresaId) {
    return NextResponse.json({ error: "Empresa não encontrada" }, { status: 401 });
  }

  try {
    const config = await prisma.taxasCartaoConfig.findUnique({
      where: { empresaId }
    })

    return NextResponse.json({
      success: true,
      config: config?.config || CONFIG_PADRAO
    })
  } catch (error) {
    console.error("Erro ao buscar taxas cartão:", error)
    return NextResponse.json(
      { error: "Erro ao buscar taxas cartão" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const empresaId = session.user.empresaId;
  if (!empresaId) {
    return NextResponse.json({ error: "Empresa não encontrada" }, { status: 401 });
  }

  try {
    const config = await request.json()

    // Validar dados
    if (!config || typeof config !== "object") {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
    }

    // SALVAR na tabela taxasCartaoConfig (principal)
    await prisma.taxasCartaoConfig.upsert({
      where: { empresaId },
      update: { config },
      create: {
        empresaId,
        userId: session.user.id,
        config
      }
    })

    // SALVAR também na tabela despesasVariaveis
    // Primeiro deletar registros existentes
    await prisma.despesaVariavel.deleteMany({
      where: {
        userId: session.user.id,
        empresaId
      }
    })

    // Calcular taxas médias
    const taxasDebito = config.taxas?.debito || { infinitepay: 1.37, stone: 2.34, caixa: 4.48 }
    const taxasCredito = config.taxas?.credito || { infinitepay: 3.15, stone: 6.44, caixa: 5.78 }
    const debitoValues = Object.values(taxasDebito).map(v => Number(v))
    const creditoValues = Object.values(taxasCredito).map(v => Number(v))
    const mediaDebito = debitoValues.reduce((a, b) => a + b, 0) / debitoValues.length
    const mediaCredito = creditoValues.reduce((a, b) => a + b, 0) / creditoValues.length

    // Criar registros separados para cada tipo de despesa
    const despesasVariaveis = [
      { nome: "Taxa Débito", percentual: mediaDebito },
      { nome: "Taxa Crédito", percentual: mediaCredito },
      { nome: "Taxa Voucher", percentual: config.taxas?.voucher || 7.0 },
      { nome: "Manutenção", percentual: config.manutencao || 1.0 },
      { nome: "Simples Nacional", percentual: config.simplesNacional || 8.0 }
    ]

    await prisma.despesaVariavel.createMany({
      data: despesasVariaveis.map(d => ({
        nome: d.nome,
        percentual: d.percentual,
        userId: session.user.id,
        empresaId
      }))
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao salvar taxas cartão:", error)
    return NextResponse.json(
      { error: "Erro ao salvar taxas cartão" },
      { status: 500 }
    )
  }
}