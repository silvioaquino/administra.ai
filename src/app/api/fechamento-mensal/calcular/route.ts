import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - Calcular DRE para um mês específico
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const empresaId = session.user.empresaId;
  if (!empresaId) {
    return NextResponse.json({ error: "Empresa não encontrada" }, { status: 401 });
  }

  const body = await request.json();
  const { ano, mes } = body;

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

    // Buscar configuração do plano de contas
    const planoContas = await prisma.planoContas.findMany({
      where: { empresaId, ativo: true },
    });

    // Inicializar totais por grupo
    const totais: Record<string, number> = {
      RECEITA_BRUTA: 0,
      CMV: 0,
      DESPESAS_OPERACIONAIS: 0,
    };

    // Agrupar lançamentos por grupo
    lancamentos.forEach(lanc => {
      const contaPlano = planoContas.find(p => lanc.conta.includes(p.codigo));
      if (contaPlano) {
        const valor = Number(lanc.entrada) - Number(lanc.saida);
        totais[contaPlano.grupo] = (totais[contaPlano.grupo] || 0) + valor;
      } else {
        // Classificação padrão baseada no tipo
        if (lanc.tipo === "VENDA" || lanc.tipo === "RECEITA") {
          totais.RECEITA_BRUTA += Number(lanc.entrada);
        } else if (lanc.tipo === "COMPRA") {
          totais.CMV += Number(lanc.saida);
        } else if (lanc.tipo === "DESPESA") {
          totais.DESPESAS_OPERACIONAIS += Number(lanc.saida);
        }
      }
    });

    const receitaBruta = totais.RECEITA_BRUTA;
    const cmv = totais.CMV;
    const lucroBruto = receitaBruta - cmv;
    const despesasOperacionais = totais.DESPESAS_OPERACIONAIS;
    const lucroLiquido = lucroBruto - despesasOperacionais;

    // Montar DRE
    const dreLinhas = [
      { linha: "RECEITA_BRUTA", descricao: "RECEITA BRUTA", valor: receitaBruta, percentual: 100 },
      { linha: "CMV", descricao: "(-) CUSTO DA MERCADORIA VENDIDA (CMV)", valor: -cmv, percentual: receitaBruta > 0 ? (-cmv / receitaBruta) * 100 : 0 },
      { linha: "LUCRO_BRUTO", descricao: "= LUCRO BRUTO", valor: lucroBruto, percentual: receitaBruta > 0 ? (lucroBruto / receitaBruta) * 100 : 0 },
      { linha: "DESPESAS_OPERACIONAIS", descricao: "(-) DESPESAS OPERACIONAIS", valor: -despesasOperacionais, percentual: receitaBruta > 0 ? (-despesasOperacionais / receitaBruta) * 100 : 0 },
      { linha: "LUCRO_LIQUIDO", descricao: "= LUCRO LÍQUIDO", valor: lucroLiquido, percentual: receitaBruta > 0 ? (lucroLiquido / receitaBruta) * 100 : 0 },
    ];

    // Salvar resultados no banco
    await prisma.$transaction(
      dreLinhas.map(linha =>
        prisma.dreResultado.upsert({
          where: {
            empresaId_userId_ano_mes_linha: {
              empresaId,
              userId: session.user.id,
              ano,
              mes,
              linha: linha.linha,
            },
          },
          update: {
            valor: linha.valor,
            percentual: linha.percentual,
          },
          create: {
            empresaId,
            userId: session.user.id,
            ano,
            mes,
            linha: linha.linha,
            descricao: linha.descricao,
            valor: linha.valor,
            percentual: linha.percentual,
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      data: dreLinhas,
      message: "DRE calculado com sucesso",
    });
  } catch (error) {
    console.error("Erro ao calcular DRE:", error);
    return NextResponse.json({ error: "Erro ao calcular DRE" }, { status: 500 });
  }
}