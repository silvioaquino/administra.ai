// Fonte única do cálculo da Folha Salarial no servidor.
// Espelha as fórmulas de FolhaSalarialTable (client) para que o recálculo
// aconteça no backend nas mudanças de salário/provisão e na virada do mês,
// sem depender do cliente estar aberto.

import { prisma } from '@/lib/prisma';

// Tabela progressiva do INSS 2024 (espelho de FolhaSalarialTable).
const INSS_FAIXAS = [
  { limite: 1621.0, aliquota: 0.075 },
  { limite: 2902.84, aliquota: 0.09 },
  { limite: 4354.27, aliquota: 0.12 },
  { limite: 8475.55, aliquota: 0.14 },
];

function calcularINSS(salario: number): number {
  let inss = 0;
  let baseAnterior = 0;

  for (const faixa of INSS_FAIXAS) {
    if (salario <= faixa.limite) {
      inss += (salario - baseAnterior) * faixa.aliquota;
      break;
    } else {
      inss += (faixa.limite - baseAnterior) * faixa.aliquota;
      baseAnterior = faixa.limite;
    }
  }

  return inss;
}

export interface ProvisoesAtivasTipos {
  decimo_terceiro: boolean;
  ferias: boolean;
  fgts: boolean;
  inss_patronal: boolean;
  inss: boolean;
}

export const PROVISOES_ATIVAS_PADRAO: ProvisoesAtivasTipos = {
  decimo_terceiro: true,
  ferias: true,
  fgts: true,
  inss_patronal: true,
  inss: true,
};

export interface TotaisFolha {
  totalSalarios: number;
  totalDecimo: number;
  totalFerias: number;
  totalFgts: number;
  totalInss: number;
  totalInssPatronal: number;
  totalMensal: number;
}

export interface FuncionarioFolha {
  nome: string;
  salario: number;
}

type MapaProvisoes = Record<string, Partial<Record<keyof ProvisoesAtivasTipos, boolean>>>;

/**
 * Calcula os totais MENSAIS da folha a partir de funcionários, switches globais
 * por tipo de provisão e switches por funcionário.
 */
export function calcularTotaisFolha(
  funcionarios: FuncionarioFolha[],
  provisoesAtivasTipos: ProvisoesAtivasTipos,
  provisoesFuncionarios: MapaProvisoes,
): TotaisFolha {
  let totalSalarios = 0;
  let totalDecimo = 0;
  let totalFerias = 0;
  let totalFgts = 0;
  let totalInss = 0;
  let totalInssPatronal = 0;

  for (const func of funcionarios) {
    const salario = Number(func.salario) || 0;
    totalSalarios += salario;

    const ativo = (key: keyof ProvisoesAtivasTipos): boolean =>
      provisoesAtivasTipos[key] &&
      (provisoesFuncionarios[func.nome]?.[key] ?? true);

    if (ativo('decimo_terceiro')) totalDecimo += salario / 12;
    if (ativo('ferias')) totalFerias += (salario * 1.3333) / 12;
    if (ativo('fgts')) totalFgts += salario * 0.08;
    if (ativo('inss_patronal')) totalInssPatronal += salario * 0.2;
    if (ativo('inss')) totalInss += calcularINSS(salario);
  }

  const totalMensal =
    totalSalarios + totalDecimo + totalFerias + totalFgts + totalInss + totalInssPatronal;

  return { totalSalarios, totalDecimo, totalFerias, totalFgts, totalInss, totalInssPatronal, totalMensal };
}

/** Lê os switches globais por tipo de provisão (persistidos em planejamentoConfig). */
export async function carregarProvisoesAtivas(
  empresaId: string,
  userId: string,
  ano: number = new Date().getFullYear(),
): Promise<ProvisoesAtivasTipos> {
  const cfg = await prisma.planejamentoConfig.findFirst({
    where: { empresaId, userId, tipo: 'provisoes_ativas', anoReferencia: ano },
  });
  if (cfg?.dados) {
    return { ...PROVISOES_ATIVAS_PADRAO, ...(cfg.dados as Partial<ProvisoesAtivasTipos>) };
  }
  // Virada de ano: herda a configuração do ano anterior.
  const anterior = await prisma.planejamentoConfig.findFirst({
    where: { empresaId, userId, tipo: 'provisoes_ativas', anoReferencia: ano - 1 },
  });
  if (anterior?.dados) {
    return { ...PROVISOES_ATIVAS_PADRAO, ...(anterior.dados as Partial<ProvisoesAtivasTipos>) };
  }
  return PROVISOES_ATIVAS_PADRAO;

}

/** Persiste os switches globais por tipo de provisão em planejamentoConfig. */
export async function salvarProvisoesAtivas(
  empresaId: string,
  userId: string,
  provisoesAtivas: ProvisoesAtivasTipos,
  ano: number = new Date().getFullYear(),
): Promise<void> {
  await prisma.planejamentoConfig.upsert({
    where: {
      empresaId_userId_tipo_anoReferencia: { empresaId, userId, tipo: 'provisoes_ativas', anoReferencia: ano },
    },
    update: { dados: provisoesAtivas as any },
    create: { empresaId, userId, tipo: 'provisoes_ativas', dados: provisoesAtivas as any, anoReferencia: ano },
  });
}

async function carregarMapaProvisoesFuncionarios(
  empresaId: string,
  userId: string,
  ano: number,
): Promise<MapaProvisoes> {
  const provs = await prisma.provisaoFuncionario.findMany({
    where: { empresaId, userId, ano },
  });
  // Virada de ano: herda as provisões por funcionário do ano anterior.
  const base = provs.length
    ? provs
    : await prisma.provisaoFuncionario.findMany({
        where: { empresaId, userId, ano: ano - 1 },
      });

  const mapa: MapaProvisoes = {};
  for (const p of base) {
    if (!mapa[p.funcionarioNome]) mapa[p.funcionarioNome] = {};
    (mapa[p.funcionarioNome] as Record<string, boolean>)[p.provisao] = p.ativo;
  }
  return mapa;
}

async function computarTotais(
  empresaId: string,
  userId: string,
  ano: number,
): Promise<TotaisFolha> {
  const funcionarios = await prisma.funcionario.findMany({
    where: { empresaId, userId },
    select: { nome: true, salario: true },
  });
  const provisoesAtivasTipos = await carregarProvisoesAtivas(empresaId, userId, ano);
  const mapa = await carregarMapaProvisoesFuncionarios(empresaId, userId, ano);

  return calcularTotaisFolha(
    funcionarios.map((f) => ({ nome: f.nome, salario: Number(f.salario) })),
    provisoesAtivasTipos,
    mapa,
  );
}

/**
 * Recomputa e salva a folha salarial por mês.
 * - Se o ano não tem nenhuma linha: cria as 12 (baseline = estado atual).
 * - Senão: atualiza apenas os meses >= mês atual (current + futuros). Meses
 *   passados mantêm o snapshot anterior (congela histórico).
 * Não recalcula o DRE aqui — quem chama esta função deve disparar calcularDREAno.
 */
export async function recalcularFolhaSalarial(
  empresaId: string,
  userId: string,
  ano: number,
): Promise<void> {
  const totais = await computarTotais(empresaId, userId, ano);
  const mesAtual = new Date().getMonth() + 1;

  const existentes = await prisma.planejamentoFolhaSalarial.count({
    where: { empresaId, userId, anoReferencia: ano },
  });

  const meses =
    existentes === 0
      ? Array.from({ length: 12 }, (_, i) => i + 1)
      : Array.from({ length: 13 - mesAtual }, (_, i) => mesAtual + i);

  for (const mes of meses) {
    await prisma.planejamentoFolhaSalarial.upsert({
      where: {
        empresaId_userId_anoReferencia_mes: { empresaId, userId, anoReferencia: ano, mes },
      },
      update: { ...totais, folhaEncargosPercentual: 0 },
      create: { empresaId, userId, anoReferencia: ano, mes, ...totais, folhaEncargosPercentual: 0 },
    });
  }
}

/**
 * Garante que o ano tenha folha salarial para todos os meses necessários.
 * Usado na carga do DRE: preenche meses ausentes e sempre refresca o mês atual
 * com o estado vivo (virada de mês / mudanças sem disparo explícito).
 */
export async function garantirFolhaAno(
  empresaId: string,
  userId: string,
  ano: number,
): Promise<void> {
  const existentes = await prisma.planejamentoFolhaSalarial.findMany({
    where: { empresaId, userId, anoReferencia: ano },
    select: { mes: true },
  });
  const mesesExistentes = new Set(existentes.map((e) => e.mes));
  const mesAtual = new Date().getMonth() + 1;

  // Ano já completo: só refresca o mês atual para refletir dados vivos.
  if (mesesExistentes.size === 12) {
    const totais = await computarTotais(empresaId, userId, ano);
    await prisma.planejamentoFolhaSalarial.upsert({
      where: {
        empresaId_userId_anoReferencia_mes: { empresaId, userId, anoReferencia: ano, mes: mesAtual },
      },
      update: { ...totais, folhaEncargosPercentual: 0 },
      create: { empresaId, userId, anoReferencia: ano, mes: mesAtual, ...totais, folhaEncargosPercentual: 0 },
    });
    return;
  }

  const totais = await computarTotais(empresaId, userId, ano);
  for (let mes = 1; mes <= 12; mes++) {
    if (!mesesExistentes.has(mes) || mes === mesAtual) {
      await prisma.planejamentoFolhaSalarial.upsert({
        where: {
          empresaId_userId_anoReferencia_mes: { empresaId, userId, anoReferencia: ano, mes },
        },
        update: { ...totais, folhaEncargosPercentual: 0 },
        create: { empresaId, userId, anoReferencia: ano, mes, ...totais, folhaEncargosPercentual: 0 },
      });
    }
  }
}
