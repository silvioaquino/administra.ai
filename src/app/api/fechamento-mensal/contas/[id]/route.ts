import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT - Atualizar saldo inicial / dados de uma conta a partir do fechamento mensal.
// Rota própria do fechamento para NÃO alterar a regra de /api/contas-financeiras.
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const empresaId = session.user.empresaId;
  if (!empresaId) {
    return NextResponse.json({ error: "Empresa não encontrada" }, { status: 401 });
  }

  const { id } = await params;
  const idNum = parseInt(id);

  try {
    const body = await request.json();
    const { saldoInicial, nome, tipo } = body;

    const conta = await prisma.contaFinanceira.findFirst({
      where: { id: idNum, empresaId },
    });

    if (!conta) {
      return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 });
    }

    const dados: { saldoInicial?: number; nome?: string; tipo?: string } = {};
    if (saldoInicial !== undefined && saldoInicial !== null) {
      dados.saldoInicial = Number(saldoInicial);
    }
    if (nome && nome.trim()) dados.nome = nome.trim();
    if (tipo) dados.tipo = tipo;

    const atualizada = await prisma.contaFinanceira.update({
      where: { id: idNum },
      data: dados,
    });

    return NextResponse.json({
      success: true,
      data: atualizada,
      message: "Conta atualizada com sucesso",
    });
  } catch (error) {
    console.error("Erro ao atualizar conta:", error);
    return NextResponse.json({ error: "Erro ao atualizar conta" }, { status: 500 });
  }
}
