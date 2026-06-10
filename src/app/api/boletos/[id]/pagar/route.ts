// src/app/api/boletos/[id]/pagar/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// PUT - Marcar boleto como pago
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { dataPagamento } = body

    if (!dataPagamento) {
      return NextResponse.json(
        { error: "Data de pagamento é obrigatória" },
        { status: 400 }
      )
    }

    // Buscar o boleto com o lançamento relacionado
    const client = prisma as any
    const boleto = await client.boleto.findUnique({
      where: { id: parseInt(id) },
      include: { lancamento: true }
    })

    if (!boleto) {
      return NextResponse.json(
        { error: "Boleto não encontrado" },
        { status: 404 }
      )
    }

    if (boleto.status === "PAGO") {
      return NextResponse.json(
        { error: "Boleto já foi pago" },
        { status: 400 }
      )
    }

    const dataPagamentoDate = new Date(dataPagamento)
    dataPagamentoDate.setHours(12, 0, 0, 0) // Meio-dia para evitar problemas de timezone

    // Usar transação para atualizar boleto e lançamento
    const result = await client.$transaction(async (tx: any) => {
      // 1. Atualizar o boleto
      const boletoAtualizado = await tx.boleto.update({
        where: { id: parseInt(id) },
        data: {
          dataPagamento: dataPagamentoDate,
          status: "PAGO"
        }
      })

      // 2. Atualizar o lançamento no livro diário
      if (boleto.lancamento) {
        await tx.livroDiario.update({
          where: { id: boleto.lancamento.id },
          data: {
            statusBoleto: "PAGO",
            dataPagamento: dataPagamentoDate,
            data: dataPagamentoDate
          }
        })
      }

      return boletoAtualizado
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Erro ao marcar boleto como pago:", error)
    return NextResponse.json(
      { error: "Erro ao marcar boleto como pago" },
      { status: 500 }
    )
  }
}