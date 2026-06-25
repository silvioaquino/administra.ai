// src/app/api/planejamento/taxas-cartao/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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
      config: config?.config || {
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

    const saved = await prisma.taxasCartaoConfig.upsert({
      where: { empresaId },
      update: { config },
      create: {
        empresaId,
        userId: session.user.id,
        config
      }
    })

    return NextResponse.json({ success: true, data: saved })
  } catch (error) {
    console.error("Erro ao salvar taxas cartão:", error)
    return NextResponse.json(
      { error: "Erro ao salvar taxas cartão" },
      { status: 500 }
    )
  }
}