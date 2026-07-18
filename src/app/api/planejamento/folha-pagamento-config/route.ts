import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sincronizarLancamentosFolha } from "@/lib/folha-lancamentos";

const formatar = (reg: any) => ({
  id: reg.id,
  ano: reg.ano,
  mes: reg.mes,
  diaAdiantamento: reg.diaAdiantamento,
  percentualAdiantamento: Number(reg.percentualAdiantamento),
  diaSalario: reg.diaSalario,
  totalSalarios: Number(reg.totalSalarios),
  valorAdiantamento: Number(reg.valorAdiantamento),
  valorSalario: Number(reg.valorSalario),
});

// GET - Busca a config do mês; se não existir, cria o registro do mês
// (herdando defaults do mês anterior) para atender "salvar mês a mês".
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const empresaId = session.user.empresaId || "sem-empresa";
  const { searchParams } = new URL(request.url);
  const ano = parseInt(searchParams.get("ano") || new Date().getFullYear().toString());
  const mes = parseInt(searchParams.get("mes") || (new Date().getMonth() + 1).toString());

  try {
    const existente = await prisma.folhaPagamentoConfig.findUnique({
      where: { empresaId_userId_ano_mes: { empresaId, userId: session.user.id, ano, mes } },
    });

    if (existente) {
      return NextResponse.json({ success: true, dados: formatar(existente) });
    }

    // Buscar config do mês anterior para herdar dia/percentual
    const anterior = await prisma.folhaPagamentoConfig.findFirst({
      where: {
        empresaId,
        userId: session.user.id,
        OR: [{ ano: { lt: ano } }, { AND: [{ ano }, { mes: { lt: mes } }] }],
      },
      orderBy: [{ ano: "desc" }, { mes: "desc" }],
    });

    // Total de salários atual (snapshot do mês)
    const agg = await prisma.funcionario.aggregate({
      where: { userId: session.user.id, empresaId },
      _sum: { salario: true },
    });
    const totalSalarios = Number(agg._sum.salario || 0);

    const criado = await prisma.folhaPagamentoConfig.create({
      data: {
        empresaId,
        userId: session.user.id,
        ano,
        mes,
        diaAdiantamento: anterior?.diaAdiantamento ?? 15,
        percentualAdiantamento: anterior?.percentualAdiantamento ?? 40,
        diaSalario: anterior?.diaSalario ?? 5,
        totalSalarios,
        valorAdiantamento: 0,
        valorSalario: 0,
      },
    });

    return NextResponse.json({ success: true, dados: formatar(criado), criado: true });
  } catch (error) {
    console.error("Erro ao buscar config de pagamento:", error);
    return NextResponse.json({ error: "Erro ao buscar config de pagamento" }, { status: 500 });
  }
}

// POST - Salva a config do mês e gera os lançamentos no Livro Diário
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const empresaId = session.user.empresaId || "sem-empresa";

  try {
    const body = await request.json();
    const { ano, mes, diaAdiantamento, percentualAdiantamento, diaSalario, totalSalarios, funcionarios } = body;

    if (!ano || !mes) {
      return NextResponse.json({ error: "ano e mes são obrigatórios" }, { status: 400 });
    }

    const pct = Number(percentualAdiantamento) || 0;
    const total = Number(totalSalarios) || 0;
    const valorAdiantamento = Math.round((total * pct) / 100 * 100) / 100;
    const valorSalario = Math.round((total - valorAdiantamento) * 100) / 100;

    const salvo = await prisma.folhaPagamentoConfig.upsert({
      where: { empresaId_userId_ano_mes: { empresaId, userId: session.user.id, ano, mes } },
      update: {
        diaAdiantamento,
        percentualAdiantamento: pct,
        diaSalario,
        totalSalarios: total,
        valorAdiantamento,
        valorSalario,
        funcionariosSnapshot: Array.isArray(funcionarios) ? funcionarios : undefined,
      },
      create: {
        empresaId,
        userId: session.user.id,
        ano,
        mes,
        diaAdiantamento,
        percentualAdiantamento: pct,
        diaSalario,
        totalSalarios: total,
        valorAdiantamento,
        valorSalario,
        funcionariosSnapshot: Array.isArray(funcionarios) ? funcionarios : undefined,
      },
    });

    await sincronizarLancamentosFolha({
      empresaId,
      userId: session.user.id,
      ano,
      mes,
      diaAdiantamento: Number(diaAdiantamento),
      diaSalario: Number(diaSalario),
      valorAdiantamento,
      valorSalario,
    });

    return NextResponse.json({ success: true, dados: formatar(salvo) });
  } catch (error) {
    console.error("Erro ao salvar config de pagamento:", error);
    return NextResponse.json({ error: "Erro ao salvar config de pagamento" }, { status: 500 });
  }
}
