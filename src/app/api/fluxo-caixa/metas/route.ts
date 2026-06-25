import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Buscar metas de fluxo de caixa
export async function GET(request: NextRequest) {
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
  const mes = searchParams.get("mes") ? parseInt(searchParams.get("mes")!) : null;

  try {
    if (mes) {
      const meta = await prisma.metaFluxoCaixa.findFirst({
        where: {
          empresaId,
          ano,
          mes,
        },
      });

      if (!meta) {
        // Retornar meta padrão
        return NextResponse.json({
          success: true,
          data: {
            ano,
            mes,
            metaFaturamentoDiaria: 2500,
            metaDespesasDiaria: 1700,
            metaLucroPercentual: 20,
            diasUteis: 26,
          },
        });
      }

      return NextResponse.json({
        success: true,
        data: {
          ...meta,
          metaFaturamentoDiaria: Number(meta.metaFaturamentoDiaria),
          metaDespesasDiaria: Number(meta.metaDespesasDiaria),
        },
      });
    }

    const metas = await prisma.metaFluxoCaixa.findMany({
      where: {
        empresaId,
        ano,
      },
      orderBy: { mes: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: metas.map(m => ({
        ...m,
        metaFaturamentoDiaria: Number(m.metaFaturamentoDiaria),
        metaDespesasDiaria: Number(m.metaDespesasDiaria),
      })),
    });
  } catch (error) {
    console.error("Erro ao buscar metas:", error);
    return NextResponse.json({ error: "Erro ao buscar metas" }, { status: 500 });
  }
}

// POST - Salvar metas de fluxo de caixa
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const empresaId = session.user.empresaId;
  if (!empresaId) {
    return NextResponse.json({ error: "Empresa não encontrada" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { ano, metas } = body;

    // Usar transação para salvar todas as metas
    await prisma.$transaction(
      metas.map((meta: any) =>
        prisma.metaFluxoCaixa.upsert({
          where: {
            empresaId_userId_ano_mes: {
              empresaId,
              userId: session.user.id,
              ano,
              mes: meta.mes,
            },
          },
          update: {
            metaFaturamentoDiaria: meta.metaFaturamentoDiaria,
            metaDespesasDiaria: meta.metaDespesasDiaria,
            metaLucroPercentual: meta.metaLucroPercentual,
            diasUteis: meta.diasUteis,
          },
          create: {
            empresaId,
            userId: session.user.id,
            ano,
            mes: meta.mes,
            metaFaturamentoDiaria: meta.metaFaturamentoDiaria,
            metaDespesasDiaria: meta.metaDespesasDiaria,
            metaLucroPercentual: meta.metaLucroPercentual,
            diasUteis: meta.diasUteis,
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: "Metas salvas com sucesso",
    });
  } catch (error) {
    console.error("Erro ao salvar metas:", error);
    return NextResponse.json({ error: "Erro ao salvar metas" }, { status: 500 });
  }
}