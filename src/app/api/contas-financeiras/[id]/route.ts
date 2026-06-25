import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const empresaId = session.user.empresaId;
  if (!empresaId) {
    return NextResponse.json({ error: "Empresa não encontrada" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const idNum = parseInt(id);

    const conta = await prisma.contaFinanceira.findFirst({
      where: {
        id: idNum,
        empresaId,
      },
    });

    if (!conta) {
      return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 });
    }

    const movimentacoes = await prisma.livroDiario.aggregate({
      where: {
        empresaId,
        origemDestino: conta.nome,
      },
      _sum: {
        entrada: true,
        saida: true,
      },
    });

    const totalEntradas = movimentacoes._sum.entrada || 0;
    const totalSaidas = movimentacoes._sum.saida || 0;
    const saldoAtual = Number(conta.saldoInicial) + Number(totalEntradas) - Number(totalSaidas);

    return NextResponse.json({
      success: true,
      data: {
        ...conta,
        saldoInicial: Number(conta.saldoInicial),
        saldoAtual: saldoAtual,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar conta:", error);
    return NextResponse.json({ error: "Erro ao buscar conta" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const empresaId = session.user.empresaId;
  if (!empresaId) {
    return NextResponse.json({ error: "Empresa não encontrada" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const idNum = parseInt(id);
    const body = await request.json();
    const { nome, tipo, instituicao } = body;

    const contaExistente = await prisma.contaFinanceira.findFirst({
      where: { id: idNum, empresaId },
    });

    if (!contaExistente) {
      return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 });
    }

    if (nome && nome !== contaExistente.nome) {
      const conflito = await prisma.contaFinanceira.findFirst({
        where: {
          empresaId,
          nome: { equals: nome.trim(), mode: "insensitive" },
          id: { not: idNum },
        },
      });
      if (conflito) {
        return NextResponse.json({ error: "Já existe outra conta com este nome" }, { status: 400 });
      }
    }

    const contaAtualizada = await prisma.contaFinanceira.update({
      where: { id: idNum },
      data: {
        nome: nome?.trim() || contaExistente.nome,
        tipo: tipo || contaExistente.tipo,
        instituicao: instituicao !== undefined ? instituicao : contaExistente.instituicao,
      },
    });

    return NextResponse.json({
      success: true,
      data: contaAtualizada,
      message: "Conta atualizada com sucesso",
    });
  } catch (error) {
    console.error("Erro ao atualizar conta:", error);
    return NextResponse.json({ error: "Erro ao atualizar conta" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const empresaId = session.user.empresaId;
  if (!empresaId) {
    return NextResponse.json({ error: "Empresa não encontrada" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const idNum = parseInt(id);

    const conta = await prisma.contaFinanceira.findFirst({
      where: { id: idNum, empresaId },
    });

    if (!conta) {
      return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 });
    }

    const movimentacoes = await prisma.livroDiario.count({
      where: {
        empresaId,
        origemDestino: conta.nome,
      },
    });

    if (movimentacoes > 0) {
      return NextResponse.json(
        { error: "Não é possível excluir uma conta que possui movimentações. Considere inativá-la." },
        { status: 400 }
      );
    }

    await prisma.contaFinanceira.delete({ where: { id: idNum } });

    return NextResponse.json({
      success: true,
      message: "Conta excluída com sucesso",
    });
  } catch (error) {
    console.error("Erro ao excluir conta:", error);
    return NextResponse.json({ error: "Erro ao excluir conta" }, { status: 500 });
  }
}