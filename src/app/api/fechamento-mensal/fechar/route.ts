import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - Fechar o mês
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { ano, mes, observacao } = body;

    if (!ano || !mes) {
      return NextResponse.json(
        { error: "Ano e mês são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar se já está fechado
    const existing = await prisma.fechamentoMensal.findFirst({
      where: {
        userId: session.user.id,
        ano,
        mes,
      },
    });

    if (existing?.status === "FECHADO") {
      return NextResponse.json({
        success: false,
        error: "Este mês já está fechado",
      });
    }

    // Fechar o mês
    const fechamento = await prisma.fechamentoMensal.upsert({
      where: {
        userId_ano_mes: {
          userId: session.user.id,
          ano,
          mes,
        },
      },
      update: {
        status: "FECHADO",
        dataFechamento: new Date(),
        observacao: observacao || null,
      },
      create: {
        userId: session.user.id,
        ano,
        mes,
        status: "FECHADO",
        dataFechamento: new Date(),
        observacao: observacao || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: fechamento,
      message: "Mês fechado com sucesso!",
    });
  } catch (error) {
    console.error("Erro ao fechar mês:", error);
    return NextResponse.json({ error: "Erro ao fechar mês" }, { status: 500 });
  }
}