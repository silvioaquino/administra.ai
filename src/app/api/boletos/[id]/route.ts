// src/app/api/boletos/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET - Buscar um boleto específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const boleto = await prisma.boleto.findUnique({
      where: { id: parseInt(id) },
      include: { lancamento: true }
    })

    if (!boleto) {
      return NextResponse.json(
        { error: "Boleto não encontrado" },
        { status: 404 }
      )
    }

    // Calcular status atualizado
    if (!boleto.dataPagamento) {
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)
      const vencimento = new Date(boleto.dataVencimento)
      vencimento.setHours(0, 0, 0, 0)

      if (vencimento < hoje) {
        return NextResponse.json({ ...boleto, status: "VENCIDO" })
      }
    }

    return NextResponse.json(boleto)
  } catch (error) {
    console.error("Erro ao buscar boleto:", error)
    return NextResponse.json(
      { error: "Erro ao buscar boleto" },
      { status: 500 }
    )
  }
}