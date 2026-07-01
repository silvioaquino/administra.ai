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

  try {
    const config = await prisma.planejamentoConfig.findFirst({
      where: {
        userId: session.user.id,
        tipo: "taxas_cartao"
      }
    })

    // Se não houver configuração, retornar a configuração padrão
    if (!config) {
      return NextResponse.json({
        success: true,
        config: {
          maquininhas: [
            { id: "1", nome: "InfinitePay", taxaDebito: 1.37, taxaCredito: 3.15, aluguel: 0, ativo: true },
            { id: "2", nome: "Stone", taxaDebito: 2.34, taxaCredito: 6.44, aluguel: 79.80, ativo: true },
            { id: "3", nome: "Caixa", taxaDebito: 4.48, taxaCredito: 5.78, aluguel: 0, ativo: true },
          ],
          distribuicaoVendas: { debito: 40, credito: 50, voucher: 10 },
          manutencao: 1.0,
          simplesNacional: 8.0
        }
      })
    }

    return NextResponse.json({
      success: true,
      config: config.dados
    })
  } catch (error) {
    console.error("Erro ao buscar taxas de cartão:", error)
    return NextResponse.json(
      { error: "Erro ao buscar taxas de cartão" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const ano = new Date().getFullYear()

    const config = await prisma.planejamentoConfig.upsert({
      where: {
        empresaId_userId_tipo_anoReferencia: {
          empresaId: session.user.empresaId || "",
          userId: session.user.id,
          tipo: "taxas_cartao",
          anoReferencia: ano
        }
      },
      update: {
        dados: body
      },
      create: {
        empresaId: session.user.empresaId || "",
        userId: session.user.id,
        tipo: "taxas_cartao",
        dados: body,
        anoReferencia: ano
      }
    })

    return NextResponse.json({ success: true, data: config })
  } catch (error) {
    console.error("Erro ao salvar taxas de cartão:", error)
    return NextResponse.json(
      { error: "Erro ao salvar taxas de cartão" },
      { status: 500 }
    )
  }
}