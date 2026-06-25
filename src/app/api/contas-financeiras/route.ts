import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Listar todas as contas da empresa com saldo atual
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const empresaId = session.user.empresaId;
  if (!empresaId) {
    return NextResponse.json({ error: "Empresa não encontrada" }, { status: 401 });
  }

  try {
    const contas = await prisma.contaFinanceira.findMany({
      where: { empresaId },
      orderBy: { nome: "asc" },
    });

    // Calcular saldo atual para cada conta
    const contasComSaldo = await Promise.all(
      contas.map(async (conta) => {
        // Somar entradas e saídas do livro diário para esta conta (origem/destino)
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

        return {
          ...conta,
          saldoInicial: Number(conta.saldoInicial),
          saldoAtual: saldoAtual,
        };
      })
    );

    return NextResponse.json({ success: true, data: contasComSaldo });
  } catch (error) {
    console.error("Erro ao buscar contas:", error);
    return NextResponse.json({ error: "Erro ao buscar contas" }, { status: 500 });
  }
}

// POST - Criar uma nova conta financeira
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const empresaId = session.user.empresaId;
  if (!empresaId) {
    return NextResponse.json({ error: "Empresa não encontrada" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { nome, tipo, saldoInicial, instituicao } = body;

    if (!nome || !nome.trim()) {
      return NextResponse.json({ error: "Nome da conta é obrigatório" }, { status: 400 });
    }

    // Verificar se já existe uma conta com o mesmo nome
    const contaExistente = await prisma.contaFinanceira.findFirst({
      where: {
        empresaId,
        nome: { equals: nome.trim(), mode: "insensitive" },
      },
    });

    if (contaExistente) {
      return NextResponse.json({ error: "Já existe uma conta com este nome" }, { status: 400 });
    }

    const novaConta = await prisma.contaFinanceira.create({
      data: {
        empresaId,
        nome: nome.trim(),
        tipo: tipo || "CONTA_CORRENTE",
        saldoInicial: saldoInicial || 0,
        instituicao: instituicao || null,
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: novaConta,
      message: "Conta criada com sucesso",
    });
  } catch (error) {
    console.error("Erro ao criar conta:", error);
    return NextResponse.json({ error: "Erro ao criar conta" }, { status: 500 });
  }
}