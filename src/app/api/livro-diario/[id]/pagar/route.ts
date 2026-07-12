// src/app/api/livro-diario/[id]/pagar/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT - Marcar lançamento do livro diário como pago
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { dataPagamento } = body;

    if (!dataPagamento) {
      return NextResponse.json(
        { error: "Data de pagamento é obrigatória" },
        { status: 400 }
      );
    }

    const lancamento = await prisma.livroDiario.findFirst({
      where: {
        id: parseInt(id),
        userId: session.user.id,
      },
    });

    if (!lancamento) {
      return NextResponse.json(
        { error: "Lançamento não encontrado" },
        { status: 404 }
      );
    }

    if (lancamento.status === "PAGO") {
      return NextResponse.json(
        { error: "Lançamento já foi pago" },
        { status: 400 }
      );
    }

    const dataPagamentoDate = new Date(dataPagamento);
    dataPagamentoDate.setHours(12, 0, 0, 0); // Meio-dia para evitar problemas de timezone

    const lancamentoAtualizado = await prisma.livroDiario.update({
      where: { id: parseInt(id) },
      data: {
        status: "PAGO",
        dataPagamento: dataPagamentoDate,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...lancamentoAtualizado,
        entrada: Number(lancamentoAtualizado.entrada),
        saida: Number(lancamentoAtualizado.saida),
      },
      message: "Lançamento marcado como pago",
    });
  } catch (error) {
    console.error("Erro ao marcar lançamento como pago:", error);
    return NextResponse.json(
      { error: "Erro ao marcar lançamento como pago" },
      { status: 500 }
    );
  }
}
