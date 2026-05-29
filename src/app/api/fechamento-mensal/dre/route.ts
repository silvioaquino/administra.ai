import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Buscar DRE do mês ou acumulado
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const ano = parseInt(searchParams.get("ano") || new Date().getFullYear().toString());
  const mes = searchParams.get("mes") ? parseInt(searchParams.get("mes")!) : null;
  const acumulado = searchParams.get("acumulado") === "true";

  try {
    let whereCondition: any = {
      userId: session.user.id,
      ano,
    };

    if (!acumulado && mes) {
      whereCondition.mes = mes;
    } else if (acumulado && mes) {
      whereCondition.mes = { lte: mes };
    }

    const resultados = await prisma.dreResultado.findMany({
      where: whereCondition,
      orderBy: { linha: "asc" },
    });

    // Agrupar e somar valores se for acumulado
    let dreMap: Record<string, { valor: number; percentual: number; descricao: string }> = {};

    if (acumulado && mes) {
      resultados.forEach(r => {
        if (!dreMap[r.linha]) {
          dreMap[r.linha] = {
            valor: 0,
            percentual: 0,
            descricao: r.descricao,
          };
        }
        dreMap[r.linha].valor += Number(r.valor);
      });

      // Calcular percentuais baseado na receita bruta acumulada
      const receitaBruta = dreMap["RECEITA_BRUTA"]?.valor || 0;
      Object.keys(dreMap).forEach(linha => {
        dreMap[linha].percentual = receitaBruta > 0 ? (dreMap[linha].valor / receitaBruta) * 100 : 0;
      });
    }

    const dreData = acumulado && mes
      ? Object.entries(dreMap).map(([linha, data]) => ({
          id: linha,
          descricao: data.descricao,
          valor: data.valor,
          percentual: data.percentual,
          isGroup: ["RECEITA_BRUTA", "CMV", "LUCRO_BRUTO", "DESPESAS_OPERACIONAIS", "LUCRO_LIQUIDO"].includes(linha),
        }))
      : resultados.map(r => ({
          id: r.linha,
          descricao: r.descricao,
          valor: Number(r.valor),
          percentual: Number(r.percentual),
          isGroup: ["RECEITA_BRUTA", "CMV", "LUCRO_BRUTO", "DESPESAS_OPERACIONAIS", "LUCRO_LIQUIDO"].includes(r.linha),
        }));

    // Montar hierarquia
    const hierarquia: any[] = [];
    const ordem = ["RECEITA_BRUTA", "CMV", "LUCRO_BRUTO", "DESPESAS_OPERACIONAIS", "LUCRO_LIQUIDO"];
    
    ordem.forEach(linhaId => {
      const linha = dreData.find(d => d.id === linhaId);
      if (linha) {
        hierarquia.push(linha);
      }
    });

    return NextResponse.json({
      success: true,
      data: hierarquia,
    });
  } catch (error) {
    console.error("Erro ao buscar DRE:", error);
    return NextResponse.json({ error: "Erro ao buscar DRE" }, { status: 500 });
  }
}