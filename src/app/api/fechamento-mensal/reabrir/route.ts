import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - Reabrir o mês
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { ano, mes } = body;

    if (!ano || !mes) {
      return NextResponse.json(
        { error: "Ano e mês são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar se existe
    const existing = await prisma.fechamentoMensal.findFirst({
      where: {
        userId: session.user.id,
        ano,
        mes,
      },
    });

    if (!existing) {
      return NextResponse.json({
        success: false,
        error: "Este mês não tem registro de fechamento",
      });
    }

    // Reabrir o mês
    const fechamento = await prisma.fechamentoMensal.update({
      where: {
        userId_ano_mes: {
          userId: session.user.id,
          ano,
          mes,
        },
      },
      data: {
        status: "ABERTO",
        dataFechamento: null,
      },
    });

    return NextResponse.json({
      success: true,
      data: fechamento,
      message: "Mês reaberto com sucesso!",
    });
  } catch (error) {
    console.error("Erro ao reabrir mês:", error);
    return NextResponse.json({ error: "Erro ao reabrir mês" }, { status: 500 });
  }
}