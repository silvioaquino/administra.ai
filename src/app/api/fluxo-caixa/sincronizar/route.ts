import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - Sincronizar dados do livro diário para o fluxo de caixa
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const empresaId = session.user.empresaId;
  if (!empresaId) {
    return NextResponse.json({ error: "Empresa não encontrada" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const ano = parseInt(searchParams.get("ano") || new Date().getFullYear().toString());
  const mes = parseInt(searchParams.get("mes") || (new Date().getMonth() + 1).toString());

  try {
    const dataInicio = new Date(ano, mes - 1, 1);
    const dataFim = new Date(ano, mes, 0);

    // Buscar todos os lançamentos do período
    const lancamentos = await prisma.livroDiario.findMany({
      where: {
        empresaId,
        data: {
          gte: dataInicio,
          lte: dataFim,
        },
      },
    });

    // Agrupar por dia
    const fluxoPorDia: Record<string, { faturamento: number; despesas: number }> = {};

    lancamentos.forEach(lanc => {
      const dataKey = lanc.data.toISOString().split("T")[0];
      if (!fluxoPorDia[dataKey]) {
        fluxoPorDia[dataKey] = { faturamento: 0, despesas: 0 };
      }

      if (lanc.tipo === "VENDA" || lanc.tipo === "RECEITA") {
        fluxoPorDia[dataKey].faturamento += Number(lanc.entrada);
      } else if (lanc.tipo === "COMPRA" || lanc.tipo === "DESPESA") {
        fluxoPorDia[dataKey].despesas += Number(lanc.saida);
      }
    });

    // Salvar ou atualizar no FluxoCaixaDiario
    for (const [data, valores] of Object.entries(fluxoPorDia)) {
      const lucro = valores.faturamento - valores.despesas;

      await prisma.fluxoCaixaDiario.upsert({
        where: {
          empresaId_userId_data: {
            empresaId,
            userId: session.user.id,
            data: new Date(data),
          },
        },
        update: {
          faturamentoRealizado: valores.faturamento,
          despesasRealizadas: valores.despesas,
          lucroRealizado: lucro,
        },
        create: {
          empresaId,
          userId: session.user.id,
          data: new Date(data),
          faturamentoRealizado: valores.faturamento,
          despesasRealizadas: valores.despesas,
          lucroRealizado: lucro,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Sincronizados ${Object.keys(fluxoPorDia).length} dias`,
    });
  } catch (error) {
    console.error("Erro ao sincronizar fluxo de caixa:", error);
    return NextResponse.json({ error: "Erro ao sincronizar fluxo de caixa" }, { status: 500 });
  }
}