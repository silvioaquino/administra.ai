/**
 * Calculadora REAL do DRE (Fluxo de Caixa).
 *
 * Substitui a versão antiga de /api/dre que inventava números com
 * % fixas (ex.: receita * 0.25) e literais (700/500).
 *
 * Agora cada folha é preenchida com dado REAL do banco:
 *  - livroDiario classificado por prefixo de código em `conta`
 *  - produto (insumos) por dataCompra
 *  - despesaFixa (por nome) por vencimento
 *  - funcionario / provisaoFuncionario / planejamentoFolhaSalarial (pessoal)
 *  - retirada (não operacional)
 * Linhas calculadas (cabeçalhos/subtotais) são obtidas por roll-up
 * (soma de descendentes ou fórmula explícita) — nunca por % fixa.
 *
 * O resultado é persistido em `dreResultado` (1 linha por mês) para
 * que /api/dre leia de l de verdade e o botão Sincronizar o atualize.
 */

import { prisma } from '@/lib/prisma';
import {
  DRE_TEMPLATE,
  type DreNo,
  type DreFonte,
} from '@/lib/dre-template';
import { garantirFolhaAno } from '@/lib/folha';

const ZEROS = (): number[] => new Array(12).fill(0);

/** Nós do DRE (template + categorias personalizadas do banco). */
export async function obterNodes(empresaId: string): Promise<DreNo[]> {
  const userCats = await prisma.categoria.findMany({
    where: { empresaId },
  });
  const templateCodigos = new Set(DRE_TEMPLATE.map((n) => n.codigo));
  const extras: DreNo[] = userCats
    .filter((c) => !templateCodigos.has(c.codigo))
    .map((c) => ({
      codigo: c.codigo,
      nome: c.nome,
      nivel: c.nivel,
      tipo: (c.tipo === 'receita' ? 'receita' : 'despesa') as 'receita' | 'despesa',
      isHeader: c.isHeader,
      fonte: 'livro' as DreFonte,
    }));
  return [...DRE_TEMPLATE, ...extras];
}

/** Classifica livroDiario por prefixo de código em `conta`. */
function classificarLivro(
  lancamentos: Array<{
    conta: string | null;
    tipo: string;
    entrada: number;
    saida: number;
    data: Date;
  }>,
  nodes: DreNo[]
): Record<string, number[]> {
  const livroNodes = nodes.filter((n) => n.fonte === 'livro');
  const map: Record<string, number[]> = {};
  livroNodes.forEach((n) => (map[n.codigo] = ZEROS()));

  for (const l of lancamentos) {
    if (!l.conta) continue;
    const mes = l.data.getMonth();
    const valor =
      l.tipo === 'VENDA' || l.tipo === 'RECEITA'
        ? Number(l.entrada) || 0
        : -(Number(l.saida) || 0);

    // Pega o nó cujo código é o MAIOR prefixo contido em `conta`
    // (evita contar 3.1.2 em ambos 3.1 e 3.1.2).
    let melhor: DreNo | null = null;
    for (const n of livroNodes) {
      if (l.conta.includes(n.codigo)) {
        if (!melhor || n.codigo.length > melhor.codigo.length) melhor = n;
      }
    }
    if (melhor) map[melhor.codigo][mes] += valor;
  }
  return map;
}

/** Soma mensal de produtos (insumos) por dataCompra. */
function insumosPorMes(
  produtos: Array<{ valorTotal: number | null; dataCompra: Date | null }>
): number[] {
  const r = ZEROS();
  for (const p of produtos) {
    if (!p.dataCompra) continue;
    const mes = p.dataCompra.getMonth();
    r[mes] += Number(p.valorTotal) || 0;
  }
  return r;
}

/** Despesas fixas pareadas por nome (categoria) e agrupadas por vencimento. */
function despesasFixasPorNome(
  despesas: Array<{
    nome: string;
    valor: number | null;
    vencimento: Date;
    contaNome?: string | null;
  }>,
  nomeCategoria: string
): number[] {
  const r = ZEROS();
  const alvo = nomeCategoria.toLowerCase();
  for (const d of despesas) {
    const texto = `${d.nome} ${d.contaNome || ''}`.toLowerCase();
    if (!texto.includes(alvo)) continue;
    const mes = d.vencimento.getMonth();
    r[mes] += Number(d.valor) || 0;
  }
  return r;
}

/** Retiradas (saídas não operacionais) por dataRetirada. */
function retiradasPorMes(retiradas: Array<{ valor: number; dataRetirada: Date }>): number[] {
  const r = ZEROS();
  for (const rt of retiradas) {
    const mes = rt.dataRetirada.getMonth();
    r[mes] += Number(rt.valor) || 0;
  }
  return r;
}

const isZero = (v: number[]): boolean => v.every((x) => Math.abs(x) < 0.005);

export interface DreValores {
  valores: Record<string, number[]>; // codigo -> [12] mensal (sinalizado)
  previsoes: Record<string, number>; // codigo -> previsão anual
}

/**
 * Calcula o DRE real do ano (em memória, sem persistir).
 */
export async function montarDRE(
  empresaId: string,
  userId: string,
  ano: number
): Promise<DreValores> {
  const nodes = await obterNodes(empresaId);
  const inicio = new Date(ano, 0, 1);
  const fim = new Date(ano, 11, 31, 23, 59, 59);

  const [
    lancamentos,
    produtos,
    despesasFixas,
    folha,
    retiradas,
    metas,
  ] = await Promise.all([
    prisma.livroDiario.findMany({
      where: { empresaId, data: { gte: inicio, lte: fim } },
      select: { conta: true, tipo: true, entrada: true, saida: true, data: true },
    }),
    prisma.produto.findMany({
      where: { empresaId, dataCompra: { gte: inicio, lte: fim } },
      select: { valorTotal: true, dataCompra: true },
    }),
    prisma.despesaFixa.findMany({
      where: { empresaId, vencimento: { gte: inicio, lte: fim } },
      include: { conta: { select: { nome: true } } },
    }),
    prisma.planejamentoFolhaSalarial.findMany({
      where: { empresaId, anoReferencia: ano },
    }),
    prisma.retirada.findMany({
      where: { empresaId, dataRetirada: { gte: inicio, lte: fim } },
      select: { valor: true, dataRetirada: true },
    }),
    prisma.metaFluxoCaixa.findMany({ where: { empresaId, ano } }),
  ]);

  const livro = classificarLivro(lancamentos as any, nodes);
  const insumos = insumosPorMes(produtos as any);
  const retird = retiradasPorMes(retiradas as any);
  const folhaMeses = (folha as any[]) || [];

  // Índice mês -> registro da folha salarial (1 linha por mês/ano).
  const folhaPorMes: Record<number, any> = {};
  folhaMeses.forEach((f) => {
    folhaPorMes[f.mes] = f;
  });

  // Valor da linha de provisão para um mês específico.
  // Os totais em planejamentoFolhaSalarial JÁ SÃO mensais (rateados por 12 no
  // FolhaSalarialTable). totalFerias inclui o 1/3 (salário * 1,3333 / 12):
  // separamos em 5.4.1 (base 1x) e 5.4.2 (1/3) para não duplicar no total de 5.4.
  const valorProvisaoLinha = (codigo: string, folhaMes: any): number => {
    if (!folhaMes) return 0;
    const feriasTotal = Number(folhaMes.totalFerias) || 0;
    const feriasBase = feriasTotal / 1.3333;
    switch (codigo) {
      case '5.4.1':
        return feriasBase;
      case '5.4.2':
        return feriasTotal - feriasBase;
      case '5.4.3':
        return Number(folhaMes.totalFgts) || 0;
      case '5.4.4':
        return Number(folhaMes.totalInss) || 0;
      case '5.4.5':
        return Number(folhaMes.totalDecimo) || 0;
      case '5.4.6':
        return Number(folhaMes.totalInssPatronal) || 0;
      default:
        return 0;
    }
  };

  // ---- Folhas ----
  const valores: Record<string, number[]> = {};
  for (const n of nodes) {
    if (!n.fonte) continue; // nó calculado, preenchido depois
    let v = livro[n.codigo] ? [...livro[n.codigo]] : ZEROS();
    if (isZero(v)) {
      switch (n.fonte) {
        case 'insumos':
          v = [...insumos];
          break;
        case 'despesasFixas':
          v = despesasFixasPorNome(despesasFixas as any, n.nome);
          break;
        case 'provisoes': {
          // Cada mês recebe o valor da folha salva para aquele mês (já mensal).
          const arr = new Array(12).fill(0);
          for (let m = 1; m <= 12; m++) {
            arr[m - 1] = valorProvisaoLinha(n.codigo, folhaPorMes[m]);
          }
          v = arr;
          break;
        }
        case 'retiradas':
          v = [...retird];
          break;
        case 'livro':
        default:
          v = ZEROS();
      }
    }
    valores[n.codigo] = v;
  }

  // ---- Nós calculados (roll-up) ----
  const calcularNo = (codigo: string): number[] => {
    const no = nodes.find((n) => n.codigo === codigo);
    if (!no) return ZEROS();
    if (no.fonte) return valores[codigo] ?? ZEROS();

    if (no.calc?.tipo === 'sum') {
      const filhos = nodes.filter(
        (n) => n.codigo !== codigo && n.codigo.startsWith(codigo + '.')
      );
      const r = ZEROS();
      for (const f of filhos) {
        const fv = calcularNo(f.codigo);
        for (let i = 0; i < 12; i++) r[i] += fv[i];
      }
      valores[codigo] = r;
      return r;
    }

    if (no.calc?.tipo === 'formula') {
      const r = ZEROS();
      for (const c of no.calc.add ?? []) {
        const cv = calcularNo(c);
        for (let i = 0; i < 12; i++) r[i] += cv[i];
      }
      for (const c of no.calc.sub ?? []) {
        const cv = calcularNo(c);
        for (let i = 0; i < 12; i++) r[i] -= cv[i];
      }
      valores[codigo] = r;
      return r;
    }
    return ZEROS();
  };
  for (const n of nodes) if (!n.fonte) calcularNo(n.codigo);

  // ---- Previsão ----
  const previsoes: Record<string, number> = {};
  // Receita: soma das metas (faturamento diário × dias úteis)
  const prevReceita = metas.reduce(
    (s, m) => s + (Number(m.metaFaturamentoDiaria) || 0) * (m.diasUteis || 0),
    0
  );
  previsoes['3.1'] = prevReceita;

  // Overrides de previsão (edição manual) em planejamentoConfig
  const overrideCfg = await prisma.planejamentoConfig.findFirst({
    where: { empresaId, tipo: 'DRE_PREVISAO', anoReferencia: ano },
  });
  if (overrideCfg?.dados) {
    const ov = overrideCfg.dados as Record<string, number>;
    Object.entries(ov).forEach(([cod, val]) => (previsoes[cod] = val));
  }
  nodes.forEach((n) => {
    if (previsoes[n.codigo] === undefined) previsoes[n.codigo] = 0;
  });

  return { valores, previsoes };
}

/**
 * Previsão anual por linha (leve: só metas + override de edição).
 * Lido separado do realizado (que vem de dreResultado).
 */
export async function obterPrevisoesAno(
  empresaId: string,
  ano: number
): Promise<Record<string, number>> {
  const nodes = await obterNodes(empresaId);
  const [metas, overrideCfg] = await Promise.all([
    prisma.metaFluxoCaixa.findMany({ where: { empresaId, ano } }),
    prisma.planejamentoConfig.findFirst({
      where: { empresaId, tipo: 'DRE_PREVISAO', anoReferencia: ano },
    }),
  ]);

  const previsoes: Record<string, number> = {};
  const prevReceita = metas.reduce(
    (s, m) => s + (Number(m.metaFaturamentoDiaria) || 0) * (m.diasUteis || 0),
    0
  );
  previsoes['3.1'] = prevReceita;

  if (overrideCfg?.dados) {
    const ov = overrideCfg.dados as Record<string, number>;
    Object.entries(ov).forEach(([cod, val]) => (previsoes[cod] = val));
  }
  nodes.forEach((n) => {
    if (previsoes[n.codigo] === undefined) previsoes[n.codigo] = 0;
  });
  return previsoes;
}

/**
 * Calcula e PERSISTE o DRE do ano em dreResultado.
 * Chamado pelo botão "Sincronizar" e no first-load se não houver dados.
 */
export async function calcularDREAno(
  empresaId: string,
  userId: string,
  ano: number
  ): Promise<void> {
  const nodes = await obterNodes(empresaId);
  // Garante que a folha salarial tenha linhas para todos os meses (e o mês
  // atual refrescado) antes de montar o DRE — evita valores obsoletos/ausentes.
  await garantirFolhaAno(empresaId, userId, ano);
  const { valores } = await montarDRE(empresaId, userId, ano);

  const receitaBrutaAnual = (valores['3.1'] ?? ZEROS()).reduce((s, v) => s + v, 0);

  const rows: Array<{
    empresaId: string;
    userId: string;
    ano: number;
    mes: number;
    linha: string;
    descricao: string;
    valor: number;
    percentual: number;
  }> = [];

  for (const n of nodes) {
    const vMes = valores[n.codigo] ?? ZEROS();
    const anual = vMes.reduce((s, v) => s + v, 0);
    const percentual =
      receitaBrutaAnual > 0 ? (anual / receitaBrutaAnual) * 100 : 0;
    for (let mes = 1; mes <= 12; mes++) {
      rows.push({
        empresaId,
        userId,
        ano,
        mes,
        linha: n.codigo,
        descricao: n.nome,
        valor: Math.round((vMes[mes - 1] || 0) * 100) / 100,
        percentual: Math.round(percentual * 100) / 100,
      });
    }
  }

  // Remove todas as linhas gerenciadas por este DRE para o ano, recriando
  // em seguida. Preserva o DRE de 5 linhas do fechamento-mensal
  // (RECEITA_BRUTA, CMV, LUCRO_BRUTO, DESPESAS_OPERACIONAIS, LUCRO_LIQUIDO),
  // que usa outros códigos e não deve ser tocado aqui. Isso também elimina
  // linhas stale cujo código saiu do template (ex.: "5.3.3 Pro-Labore").
  const LINHAS_FECHAMENTO = [
    'RECEITA_BRUTA',
    'CMV',
    'LUCRO_BRUTO',
    'DESPESAS_OPERACIONAIS',
    'LUCRO_LIQUIDO',
  ];
  await prisma.dreResultado.deleteMany({
    where: { empresaId, userId, ano, NOT: { linha: { in: LINHAS_FECHAMENTO } } },
  });
  if (rows.length > 0) {
    await prisma.dreResultado.createMany({ data: rows });
  }
}
