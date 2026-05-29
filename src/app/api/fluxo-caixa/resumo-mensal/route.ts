import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Buscar resumo mensal do fluxo de caixa
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const ano = parseInt(searchParams.get("ano") || new Date().getFullYear().toString());

  try {
    const fluxoDiario = await prisma.fluxoCaixaDiario.findMany({
      where: {
        userId: session.user.id,
        data: {
          gte: new Date(ano, 0, 1),
          lte: new Date(ano, 11, 31),
        },
      },
    });

    // Agrupar por mês
    const resumoMensal: Record<number, { faturamento: number; despesas: number; lucro: number }> = {};

    for (let i = 1; i <= 12; i++) {
      resumoMensal[i] = { faturamento: 0, despesas: 0, lucro: 0 };
    }

    fluxoDiario.forEach(item => {
      const mes = item.data.getMonth() + 1;
      resumoMensal[mes].faturamento += Number(item.faturamentoRealizado);
      resumoMensal[mes].despesas += Number(item.despesasRealizadas);
      resumoMensal[mes].lucro += Number(item.lucroRealizado);
    });

    const resultado = Object.entries(resumoMensal).map(([mes, valores]) => ({
      mes: parseInt(mes),
      faturamentoTotal: valores.faturamento,
      despesasTotal: valores.despesas,
      lucroTotal: valores.lucro,
      percentualFaturamento: 0,
      percentualDespesas: 0,
      percentualLucro: 0,
    }));

    return NextResponse.json({
      success: true,
      data: resultado,
    });
  } catch (error) {
    console.error("Erro ao buscar resumo mensal:", error);
    return NextResponse.json({ error: "Erro ao buscar resumo mensal" }, { status: 500 });
  }
}