import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { contaOrigemId, contaDestinoId, valor, descricao, data } = body;

    if (!contaOrigemId || !contaDestinoId) {
      return NextResponse.json(
        { error: "Contas de origem e destino são obrigatórias" },
        { status: 400 }
      );
    }

    if (contaOrigemId === contaDestinoId) {
      return NextResponse.json(
        { error: "As contas de origem e destino devem ser diferentes" },
        { status: 400 }
      );
    }

    if (!valor || valor <= 0) {
      return NextResponse.json(
        { error: "Valor da transferência deve ser maior que zero" },
        { status: 400 }
      );
    }

    // Buscar as contas
    const [contaOrigem, contaDestino] = await Promise.all([
      prisma.contaFinanceira.findFirst({
        where: { id: parseInt(contaOrigemId), userId: session.user.id },
      }),
      prisma.contaFinanceira.findFirst({
        where: { id: parseInt(contaDestinoId), userId: session.user.id },
      }),
    ]);

    if (!contaOrigem) {
      return NextResponse.json({ error: "Conta de origem não encontrada" }, { status: 404 });
    }
    if (!contaDestino) {
      return NextResponse.json({ error: "Conta de destino não encontrada" }, { status: 404 });
    }

    // Calcular saldo atual da conta de origem
    const movimentacoesOrigem = await prisma.livroDiario.aggregate({
      where: {
        userId: session.user.id,
        origemDestino: contaOrigem.nome,
      },
      _sum: {
        entrada: true,
        saida: true,
      },
    });

    const saldoOrigem =
      Number(contaOrigem.saldoInicial) +
      Number(movimentacoesOrigem._sum.entrada ?? 0) -
      Number(movimentacoesOrigem._sum.saida ?? 0);

    if (saldoOrigem < valor) {
      return NextResponse.json(
        { error: `Saldo insuficiente em ${contaOrigem.nome}. Saldo atual: ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(saldoOrigem)}` },
        { status: 400 }
      );
    }

    const dataTransacao = data ? new Date(data) : new Date();
    const descricaoTransacao = descricao || `Transferência de ${contaOrigem.nome} para ${contaDestino.nome}`;

    // Usar transação para garantir consistência
    await prisma.$transaction([
      // Saída da conta de origem (débito)
      prisma.livroDiario.create({
        data: {
          data: dataTransacao,
          conta: "5.1 Transferências Entre Contas",
          descricao: descricaoTransacao,
          clienteFornecedor: null,
          entrada: 0,
          saida: valor,
          tipo: "TRANSFERENCIA",
          origemDestino: contaOrigem.nome,
          userId: session.user.id,
        },
      }),
      // Entrada na conta de destino (crédito)
      prisma.livroDiario.create({
        data: {
          data: dataTransacao,
          conta: "5.1 Transferências Entre Contas",
          descricao: descricaoTransacao,
          clienteFornecedor: null,
          entrada: valor,
          saida: 0,
          tipo: "TRANSFERENCIA",
          origemDestino: contaDestino.nome,
          userId: session.user.id,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: `Transferência de ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor)} realizada com sucesso`,
    });
  } catch (error) {
    console.error("Erro ao realizar transferência:", error);
    return NextResponse.json({ error: "Erro ao realizar transferência" }, { status: 500 });
  }
}