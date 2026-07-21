import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Listar despesas pendentes (ou todas) com vencimento/data no mês informado.
// Unifica duas fontes: despesas fixas (vencimento) e lançamentos do livro diário (data).
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const empresaId = session.user.empresaId;
  if (!empresaId) {
    return NextResponse.json({ error: "Empresa não encontrada" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const ano = parseInt(searchParams.get("ano") || new Date().getFullYear().toString());
  const mes = parseInt(searchParams.get("mes") || (new Date().getMonth() + 1).toString());
  const incluirPagas = searchParams.get("incluirPagas") === "true";

  const dataInicio = new Date(ano, mes - 1, 1);
  const dataFim = new Date(ano, mes, 0, 23, 59, 59, 999);

  try {
    const statusFiltro = incluirPagas ? undefined : { not: "PAGO" };

    const [fixas, lancamentos] = await Promise.all([
      prisma.despesaFixa.findMany({
        where: {
          empresaId,
          userId: session.user.id,
          vencimento: { gte: dataInicio, lte: dataFim },
          ...(statusFiltro ? { status: statusFiltro } : {}),
        },
        include: { conta: { select: { nome: true } } },
        orderBy: { vencimento: "asc" },
      }),
      prisma.livroDiario.findMany({
        where: {
          empresaId,
          userId: session.user.id,
          data: { gte: dataInicio, lte: dataFim },
          tipo: { in: ["DESPESA", "COMPRA"] },
          ...(statusFiltro ? { status: statusFiltro } : {}),
        },
        orderBy: { data: "asc" },
      }),
    ]);

    const fixasNorm = fixas.map((d) => ({
      id: d.id,
      origem: "FIXA",
      nome: d.nome,
      valor: Number(d.valor),
      vencimento: d.vencimento.toISOString(),
      status: d.status,
      contaId: d.contaId,
      contaNome: d.conta?.nome || null,
    }));

    const lancNorm = lancamentos.map((l) => ({
      id: l.id,
      origem: "LANCAMENTO",
      nome: l.descricao,
      valor: Number(l.saida) || 0,
      vencimento: l.data.toISOString(),
      status: l.status,
      contaId: null,
      contaNome: l.origemDestino || l.conta || null,
    }));

    const lista = [...fixasNorm, ...lancNorm].sort(
      (a, b) => new Date(a.vencimento).getTime() - new Date(b.vencimento).getTime()
    );

    return NextResponse.json({ success: true, data: lista });
  } catch (error) {
    console.error("Erro ao buscar despesas pendentes:", error);
    return NextResponse.json({ error: "Erro ao buscar despesas pendentes" }, { status: 500 });
  }
}
