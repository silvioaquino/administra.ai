// Cálculo puro dos indicadores de planejamento.
// Fonte única de verdade usada tanto pela API (indicadores-resumo) quanto
// pelo cliente (página de Planejamento), evitando recomputar no servidor
// o que o cliente já consegue derivar dos dados que já carregou.

import { calcularTotalDespesasVariaveis } from "@/lib/calculoDespesasVariaveis"

export interface MaquininhaIndicador {
  taxaDebito: number
  taxaCredito: number
  aluguel: number
  ativo: boolean
}

export interface CalcularIndicadoresParams {
  metaMensalTotal: number
  lucroDesejado: number
  despesasFixas: Array<{ nome: string; valor: number }>
  totalSalarios: number
  encargosFolha: number
  maquininhas: MaquininhaIndicador[]
  distribuicaoVendas: { debito: number; credito: number; voucher: number }
  outrasTaxas: { voucher: number; simplesNacional: number; manutencao: number }
  faturamentoBase: number
}

export interface IndicadoresResultado {
  metaFaltando: boolean
  despesasFixas: Array<{ nome: string; valor: number }>
  despesasVariaveisPct: number
  despesasVariaveisBase: number
  totalDespesasVariaveis: number
  metaMensalTotal: number
  cmv: number | null
  pctFixas: number
  markUp: number | null
  lucroDesejado: number
  folhaEncargosPercentual: number
}

export function calcularIndicadores(params: CalcularIndicadoresParams): IndicadoresResultado {
  const {
    metaMensalTotal,
    lucroDesejado,
    despesasFixas,
    totalSalarios,
    encargosFolha,
    maquininhas,
    distribuicaoVendas,
    outrasTaxas,
    faturamentoBase,
  } = params

  const metaDefinida = (metaMensalTotal || 0) > 0

  // % Fixas inclui aluguel das máquinas + salários sobre a meta mensal total
  const aluguelMaquininhas = maquininhas
    .filter((m) => m.ativo)
    .reduce((sum, m) => sum + (m.aluguel || 0), 0)

  const totalFixas = despesasFixas.reduce((sum, d) => sum + Number(d.valor ?? 0), 0)
  const totalDespesasFixas = totalFixas + aluguelMaquininhas + totalSalarios
  const pctFixas = metaMensalTotal > 0 ? (totalDespesasFixas / metaMensalTotal) * 100 : 0

  // Despesas variáveis incluem encargos da folha salarial (espelha o client).
  const faturamentoBaseCalc = faturamentoBase != null ? faturamentoBase : metaMensalTotal
  const calculoDV = calcularTotalDespesasVariaveis({
    maquininhas,
    distribuicaoVendas,
    outrasTaxas,
    faturamentoBase: faturamentoBaseCalc,
    folhaSalarialTotalMensal: encargosFolha,
  })

  const folhaEncargosPercentual = metaMensalTotal > 0 ? (encargosFolha / metaMensalTotal) * 100 : 0
  const despesasVariaveisPct = calculoDV.total
  const despesasVariaveisBase = calculoDV.base

  // Se a meta do mês não está definida, não calcula (evita default silencioso de 0)
  const cmv = metaDefinida ? Math.max(0, 100 - (pctFixas + despesasVariaveisPct + lucroDesejado)) : null
  const markUp = metaDefinida && cmv !== null && cmv > 0 ? 100 / cmv : null

  return {
    metaFaltando: !metaDefinida,
    despesasFixas: despesasFixas.map((d) => ({ nome: d.nome, valor: Number(d.valor) })),
    despesasVariaveisPct,
    despesasVariaveisBase,
    totalDespesasVariaveis: calculoDV.total,
    metaMensalTotal,
    cmv: cmv === null ? null : Math.max(0, cmv),
    pctFixas,
    markUp,
    lucroDesejado,
    folhaEncargosPercentual,
  }
}
