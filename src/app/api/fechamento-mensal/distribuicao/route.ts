import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Retorna o lucro líquido do DRE e as linhas de distribuição salvas
// (ou um scaffold padrão caso ainda não existam).
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

  try {
    const dre = await prisma.dreResultado.findMany({
      where: { empresaId, userId: session.user.id, ano, mes },
    });
    const lucroLiquido = Number(dre.find((r) => r.linha === "LUCRO_LIQUIDO")?.valor || 0);

    const salvas = await prisma.distribuicaoLucro.findMany({
      where: { empresaId, userId: session.user.id, ano, mes },
      orderBy: { id: "asc" },
    });

    if (salvas.length > 0) {
      const contaIds = salvas.filter((s) => s.contaId).map((s) => s.contaId as number);
      const contas = contaIds.length
        ? await prisma.contaFinanceira.findMany({
            where: { id: { in: contaIds }, empresaId },
            select: { id: true, nome: true },
          })
        : [];
      const nomeConta = (id: number | null) =>
        contas.find((c) => c.id === id)?.nome || null;

      return NextResponse.json({
        success: true,
        data: {
          lucroLiquido,
          jaRegistrada: salvas.some((s) => s.pago),
          linhas: salvas.map((s) => ({
            id: s.id,
            nome: s.nome,
            percentual: Number(s.percentual),
            valor: Number(s.valor),
            contaId: s.contaId,
            contaNome: nomeConta(s.contaId),
            pago: s.pago,
          })),
        },
      });
    }

    const linhas = [
      { nome: "Capital de Giro", percentual: 10, valor: lucroLiquido * 0.1, contaId: null },
      { nome: "Fundo de Investimento", percentual: 10, valor: lucroLiquido * 0.1, contaId: null },
      { nome: "Provisões", percentual: 5, valor: lucroLiquido * 0.05, contaId: null },
      { nome: "Lucro Distribuído", percentual: 75, valor: lucroLiquido * 0.75, contaId: null },
    ];

    return NextResponse.json({
      success: true,
      data: { lucroLiquido, jaRegistrada: false, linhas, scaffold: true },
    });
  } catch (error) {
    console.error("Erro ao buscar distribuição:", error);
    return NextResponse.json({ error: "Erro ao buscar distribuição" }, { status: 500 });
  }
}

// POST - Salva as linhas de distribuição e, na primeira vez, gera os lançamentos
// (saídas) no livro diário por destino.
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const empresaId = session.user.empresaId;
  if (!empresaId) {
    return NextResponse.json({ error: "Empresa não encontrada" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { ano, mes, linhas } = body;

    if (!Array.isArray(linhas) || linhas.length === 0) {
      return NextResponse.json({ error: "Nenhuma linha de distribuição enviada" }, { status: 400 });
    }

    const dre = await prisma.dreResultado.findMany({
      where: { empresaId, userId: session.user.id, ano, mes },
    });
    const lucroLiquido = Number(dre.find((r) => r.linha === "LUCRO_LIQUIDO")?.valor || 0);

    // Substituir configuração anterior do mês por uma limpa.
    await prisma.distribuicaoLucro.deleteMany({
      where: { empresaId, userId: session.user.id, ano, mes },
    });

    const criadas = await prisma.$transaction(
      linhas.map((l: any) =>
        prisma.distribuicaoLucro.create({
          data: {
            empresaId,
            userId: session.user.id,
            ano,
            mes,
            nome: String(l.nome),
            percentual: l.percentual,
            valor: l.valor,
            contaId: l.contaId ? parseInt(l.contaId) : null,
            pago: false,
          },
        })
      )
    );

    // Evitar lançamentos duplicados: só gera se ainda não houver do mês.
    const jaLancado = await prisma.livroDiario.count({
      where: {
        empresaId,
        userId: session.user.id,
        data: { gte: new Date(ano, mes - 1, 1), lte: new Date(ano, mes, 0, 23, 59, 59, 999) },
        descricao: { contains: "Distribuição:" },
      },
    });

    let lancamentosCriados = 0;
    if (jaLancado === 0) {
      const contaIds = linhas
        .filter((l: any) => l.contaId)
        .map((l: any) => parseInt(l.contaId));
      const contas = await prisma.contaFinanceira.findMany({
        where: { id: { in: contaIds }, empresaId },
        select: { id: true, nome: true },
      });
      const nomeConta = (id: number) => contas.find((c) => c.id === id)?.nome || null;

      const lancamentos = linhas
        .filter((l: any) => Number(l.valor) > 0 && l.contaId)
        .map((l: any) => ({
          empresaId,
          userId: session.user.id,
          data: new Date(ano, mes - 1, 1),
          conta: "Distribuição de Lucro",
          descricao: `Distribuição: ${l.nome}`,
          clienteFornecedor: null,
          entrada: 0,
          saida: Number(l.valor),
          tipo: "DESPESA",
          origemDestino: nomeConta(parseInt(l.contaId)),
          status: "PAGO",
          dataPagamento: new Date(ano, mes - 1, 1, 12, 0, 0, 0),
        }));

      if (lancamentos.length > 0) {
        await prisma.livroDiario.createMany({ data: lancamentos });
        lancamentosCriados = lancamentos.length;
        await prisma.distribuicaoLucro.updateMany({
          where: { empresaId, userId: session.user.id, ano, mes },
          data: { pago: true },
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: { lucroLiquido, linhas: criadas },
      lancamentosCriados,
      message: lancamentosCriados > 0
        ? "Distribuição registrada e lançamentos gerados"
        : "Configuração salva (lançamentos já existem para este mês)",
    });
  } catch (error) {
    console.error("Erro ao registrar distribuição:", error);
    return NextResponse.json({ error: "Erro ao registrar distribuição" }, { status: 500 });
  }
}
