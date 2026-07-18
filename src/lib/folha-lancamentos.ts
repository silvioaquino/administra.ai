import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { calcularDREAno } from "@/lib/dre-calculator";

// Contas seguem a convenção do DRE: o prefixo de código em `conta` é o que
// classifica o lançamento na linha correspondente (ver dre-calculator.ts ->
// classificarLivro). Por isso usamos os códigos 5.3.1 / 5.3.2 explicitamente.
const CONTA_SALARIO = "5.3.1 Salários de Funcionários";
const CONTA_ADIANTAMENTO = "5.3.2 Adiantamento de Salários";
const MARCADOR_ADIANTAMENTO = "Adiantamento Salarial";
const MARCADOR_SALARIO = "Salário (restante)";

const diasNoMes = (ano: number, mes: number): number =>
  new Date(ano, mes, 0).getDate();

// Data sem o deslocamento de UTC (padrão do projeto em livro-diario/route.ts)
const dataLancamento = (ano: number, mes: number, dia: number): Date => {
  const clamped = Math.min(Math.max(dia, 1), diasNoMes(ano, mes));
  return new Date(ano, mes - 1, clamped);
};

interface ParamsLancamentoFolha {
  empresaId: string;
  userId: string;
  ano: number;
  mes: number;
  diaAdiantamento: number;
  diaSalario: number;
  valorAdiantamento: number;
  valorSalario: number;
}

/**
 * Gera (ou atualiza) os lançamentos agregados de Adiantamento e Salário no
 * Livro Diário para o mês informado, e reagrega o Fluxo de Caixa / DRE.
 * Idempotente por mês: remove os lançamentos anteriores desta origem antes de criar.
 */
export async function sincronizarLancamentosFolha(
  params: ParamsLancamentoFolha
): Promise<{ sucesso: boolean; criados: number }> {
  const { empresaId, userId, ano, mes } = params;
  const dataInicio = new Date(ano, mes - 1, 1);
  const dataFim = new Date(ano, mes, 0, 23, 59, 59, 999);

  // Guard anti-duplicação: remove os lançamentos do mês desta origem
  await prisma.livroDiario.deleteMany({
    where: {
      empresaId,
      userId,
      data: { gte: dataInicio, lte: dataFim },
      OR: [
        { descricao: { startsWith: MARCADOR_ADIANTAMENTO } },
        { descricao: { startsWith: MARCADOR_SALARIO } },
      ],
    },
  });

  const referencia = `${String(mes).padStart(2, "0")}/${ano}`;
  const lancamentos: Prisma.LivroDiarioCreateManyInput[] = [];

  if (params.valorAdiantamento > 0) {
    const data = dataLancamento(ano, mes, params.diaAdiantamento);
    lancamentos.push({
      empresaId,
      userId,
      data,
      conta: CONTA_ADIANTAMENTO,
      descricao: `${MARCADOR_ADIANTAMENTO} - ${referencia}`,
      saida: params.valorAdiantamento,
      tipo: "DESPESA",
      origemDestino: "Folha de Pagamento",
      status: "PENDENTE",
      dataPagamento: null,
    });
  }

  if (params.valorSalario > 0) {
    const data = dataLancamento(ano, mes, params.diaSalario);
    lancamentos.push({
      empresaId,
      userId,
      data,
      conta: CONTA_SALARIO,
      descricao: `${MARCADOR_SALARIO} - ${referencia}`,
      saida: params.valorSalario,
      tipo: "DESPESA",
      origemDestino: "Folha de Pagamento",
      status: "PENDENTE",
      dataPagamento: null,
    });
  }

  if (lancamentos.length > 0) {
    await prisma.livroDiario.createMany({ data: lancamentos });
  }

  // Reagregar Fluxo de Caixa e DRE do mês (derivam do Livro Diário)
  await sincronizarFluxoCaixaMes(empresaId, userId, ano, mes);

  return { sucesso: true, criados: lancamentos.length };
}

async function sincronizarFluxoCaixaMes(
  empresaId: string,
  userId: string,
  ano: number,
  mes: number
): Promise<void> {
  const dataInicio = new Date(ano, mes - 1, 1);
  const dataFim = new Date(ano, mes, 0);

  const lancamentos = await prisma.livroDiario.findMany({
    where: { empresaId, data: { gte: dataInicio, lte: dataFim } },
  });

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

  for (const [data, valores] of Object.entries(fluxoPorDia)) {
    const lucro = valores.faturamento - valores.despesas;
    await prisma.fluxoCaixaDiario.upsert({
      where: {
        empresaId_userId_data: { empresaId, userId, data: new Date(data) },
      },
      update: {
        faturamentoRealizado: valores.faturamento,
        despesasRealizadas: valores.despesas,
        lucroRealizado: lucro,
      },
      create: {
        empresaId,
        userId,
        data: new Date(data),
        faturamentoRealizado: valores.faturamento,
        despesasRealizadas: valores.despesas,
        lucroRealizado: lucro,
      },
    });
  }

  try {
    await calcularDREAno(empresaId, userId, ano);
  } catch (dreErr) {
    console.error("Erro ao recalcular DRE:", dreErr);
  }
}
