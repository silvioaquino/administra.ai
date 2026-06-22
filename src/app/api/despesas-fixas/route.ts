import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Buscar despesas fixas
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const despesas = await prisma.despesaFixa.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        vencimento: "asc",
      },
      include: {
        conta: {
          select: { nome: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: despesas.map(d => ({
        ...d,
        vencimento: d.vencimento.toISOString(),
        contaId: d.contaId,
        conta: d.conta?.nome,
      })),
    });
  } catch (error) {
    console.error("Erro ao buscar despesas fixas:", error);
    return NextResponse.json({ error: "Erro ao buscar despesas fixas" }, { status: 500 });
  }
}

// POST - Criar despesa fixa
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { nome, valor, vencimento, contaId, status } = body;

    if (!nome || !valor || !vencimento) {
      return NextResponse.json(
        { error: "Nome, valor e vencimento são obrigatórios" },
        { status: 400 }
      );
    }

    const despesa = await prisma.despesaFixa.create({
      data: {
        userId: session.user.id,
        nome,
        valor: parseFloat(valor),
        vencimento: new Date(vencimento),
        contaId: contaId || null,
        status: status || "PENDENTE",
      },
      include: {
        conta: { select: { nome: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...despesa,
        vencimento: despesa.vencimento.toISOString(),
        conta: despesa.conta?.nome,
      },
      message: "Despesa fixa criada com sucesso!",
    });
  } catch (error) {
    console.error("Erro ao criar despesa fixa:", error);
    return NextResponse.json({ error: "Erro ao criar despesa fixa" }, { status: 500 });
  }
}