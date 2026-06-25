import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const parseDateStart = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const parseDateEnd = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 23, 59, 59, 999);
};

// GET - Listar lançamentos do livro diário
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const data_inicio = searchParams.get("data_inicio");
  const data_fim = searchParams.get("data_fim");
  const conta = searchParams.get("conta");
  const tipo = searchParams.get("tipo");
  const origem_destino = searchParams.get("origem_destino");
  const status_boleto = searchParams.get("status_boleto");
  const limit = parseInt(searchParams.get("limit") || "100");
  const skip = parseInt(searchParams.get("skip") || "0");

  try {
    const where: any = {
      userId: session.user.id,
    };

    if (data_inicio) {
      where.data = { gte: parseDateStart(data_inicio) };
    }
    if (data_fim) {
      where.data = { ...where.data, lte: parseDateEnd(data_fim) };
    }
    if (conta) {
      where.conta = { contains: conta, mode: "insensitive" };
    }
    if (tipo) {
      where.tipo = tipo;
    }
    if (origem_destino) {
      where.origemDestino = origem_destino;
    }
    if (status_boleto) {
      const boletoFilter =
        status_boleto === "PENDENTE"
          ? { OR: [{ statusBoleto: null }, { statusBoleto: "PENDENTE" }], dataPagamento: null }
          : status_boleto === "PAGO"
            ? { dataPagamento: { not: null } }
            : { status_boleto };

      where.OR = [boletoFilter];
    }

    const [lancamentos, total] = await Promise.all([
      prisma.livroDiario.findMany({
        where,
        orderBy: { data: "desc" },
        take: limit,
        skip,
      }),
      prisma.livroDiario.count({ where }),
    ]);

    // Converter Decimal para number
    const lancamentosConvertidos = lancamentos.map(l => ({
      ...l,
      entrada: Number(l.entrada),
      saida: Number(l.saida),
    }));

    return NextResponse.json({
      success: true,
      data: lancamentosConvertidos,
      total,
      limit,
      skip,
    });
  } catch (error) {
    console.error("Erro ao buscar lançamentos:", error);
    return NextResponse.json(
      { error: "Erro ao buscar lançamentos" },
      { status: 500 }
    );
  }
}

// POST - Criar um novo lançamento no livro diário
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      data,
      conta,
      descricao,
      cliente_fornecedor,
      entrada,
      saida,
      tipo,
      origemDestino, // NOVO CAMPO
      notaFiscalId, // ID da nota fiscal relacionada
    } = body;

    // Validações
    if (!data) {
      return NextResponse.json(
        { error: "Data é obrigatória" },
        { status: 400 }
      );
    }
    if (!conta || !conta.trim()) {
      return NextResponse.json(
        { error: "Conta é obrigatória" },
        { status: 400 }
      );
    }
    if (!descricao || !descricao.trim()) {
      return NextResponse.json(
        { error: "Descrição é obrigatória" },
        { status: 400 }
      );
    }
    if ((!entrada || entrada <= 0) && (!saida || saida <= 0)) {
      return NextResponse.json(
        { error: "Informe um valor de entrada ou saída maior que zero" },
        { status: 400 }
      );
    }
    if (entrada > 0 && saida > 0) {
      return NextResponse.json(
        { error: "Um lançamento não pode ter entrada e saída simultaneamente" },
        { status: 400 }
      );
    }

    // Corrigir a data para não usar UTC (que pode voltar o dia)
    const [year, month, day] = data.split('-').map(Number)
    const dataLancamento = new Date(year, month - 1, day)

    const novoLancamento = await prisma.livroDiario.create({
      data: {
        empresaId,
        data: dataLancamento,
        conta: conta.trim(),
        descricao: descricao.trim(),
        clienteFornecedor: cliente_fornecedor || null,
        entrada: entrada || 0,
        saida: saida || 0,
        tipo: tipo || (entrada > 0 ? "RECEITA" : "DESPESA"),
        origemDestino: origemDestino || null, // NOVO CAMPO
        notaFiscalId: notaFiscalId || null,
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...novoLancamento,
        entrada: Number(novoLancamento.entrada),
        saida: Number(novoLancamento.saida),
      },
      message: "Lançamento criado com sucesso",
    });
  } catch (error) {
    console.error("Erro ao criar lançamento:", error);
    return NextResponse.json(
      { error: "Erro ao criar lançamento" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar um lançamento
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID do lançamento é obrigatório" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      data,
      conta,
      descricao,
      cliente_fornecedor,
      entrada,
      saida,
      tipo,
      origemDestino,
    } = body;

    // Verificar se o lançamento existe e pertence ao usuário
    const lancamentoExistente = await prisma.livroDiario.findFirst({
      where: {
        id: parseInt(id),
        userId: session.user.id,
      },
    });

    if (!lancamentoExistente) {
      return NextResponse.json(
        { error: "Lançamento não encontrado" },
        { status: 404 }
      );
    }

    // Corrigir a data para não usar UTC
    let dataConvertida: Date | undefined
    if (data) {
      const [year, month, day] = data.split('-').map(Number)
      dataConvertida = new Date(year, month - 1, day)
    }

    const lancamentoAtualizado = await prisma.livroDiario.update({
      where: { id: parseInt(id) },
      data: {
        data: dataConvertida,
        conta: conta?.trim(),
        descricao: descricao?.trim(),
        clienteFornecedor: cliente_fornecedor,
        entrada: entrada !== undefined ? entrada : undefined,
        saida: saida !== undefined ? saida : undefined,
        tipo: tipo,
        origemDestino: origemDestino,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...lancamentoAtualizado,
        entrada: Number(lancamentoAtualizado.entrada),
        saida: Number(lancamentoAtualizado.saida),
      },
      message: "Lançamento atualizado com sucesso",
    });
  } catch (error) {
    console.error("Erro ao atualizar lançamento:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar lançamento" },
      { status: 500 }
    );
  }
}

// DELETE - Remover um lançamento
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID do lançamento é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se o lançamento existe e pertence ao usuário
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

    await prisma.livroDiario.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({
      success: true,
      message: "Lançamento removido com sucesso",
    });
  } catch (error) {
    console.error("Erro ao remover lançamento:", error);
    return NextResponse.json(
      { error: "Erro ao remover lançamento" },
      { status: 500 }
    );
  }
}