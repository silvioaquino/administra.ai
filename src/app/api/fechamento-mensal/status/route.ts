import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Buscar status de fechamento do mês
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const ano = parseInt(searchParams.get("ano") || new Date().getFullYear().toString());
  const mes = parseInt(searchParams.get("mes") || (new Date().getMonth() + 1).toString());

  try {
    const fechamento = await prisma.fechamentoMensal.findFirst({
      where: {
        userId: session.user.id,
        ano,
        mes,
      },
    });

    return NextResponse.json({
      success: true,
      data: fechamento || {
        id: 0,
        ano,
        mes,
        status: "ABERTO",
        dataFechamento: null,
        observacao: null,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar status:", error);
    return NextResponse.json({ error: "Erro ao buscar status" }, { status: 500 });
  }
}