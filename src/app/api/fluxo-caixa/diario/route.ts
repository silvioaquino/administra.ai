import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Buscar fluxo de caixa diário
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const ano = parseInt(searchParams.get("ano") || new Date().getFullYear().toString());
  const mes = parseInt(searchParams.get("mes") || (new Date().getMonth() + 1).toString());

  try {
    const dataInicio = new Date(ano, mes - 1, 1);
    const dataFim = new Date(ano, mes, 0);

    const fluxoDiario = await prisma.fluxoCaixaDiario.findMany({
      where: {
        userId: session.user.id,
        data: {
          gte: dataInicio,
          lte: dataFim,
        },
      },
      orderBy: { data: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: fluxoDiario.map(f => ({
        ...f,
        faturamentoRealizado: Number(f.faturamentoRealizado),
        despesasRealizadas: Number(f.despesasRealizadas),
        lucroRealizado: Number(f.lucroRealizado),
      })),
    });
  } catch (error) {
    console.error("Erro ao buscar fluxo diário:", error);
    return NextResponse.json({ error: "Erro ao buscar fluxo diário" }, { status: 500 });
  }
}