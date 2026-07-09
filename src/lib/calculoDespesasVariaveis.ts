export interface MaquininhaCalculo {
  taxaDebito: number
  taxaCredito: number
  aluguel: number
  ativo: boolean
}

export interface CalculoDespesasVariaveisParams {
  maquininhas: MaquininhaCalculo[]
  distribuicaoVendas: { debito: number; credito: number; voucher: number }
  outrasTaxas: { voucher: number; simplesNacional: number; manutencao: number }
  faturamentoBase: number
  folhaSalarialTotalMensal?: number
}

export interface CalculoDespesasVariaveisResult {
  taxaDebitoMedia: number
  taxaCreditoMedia: number
  taxaMediaGeral: number
  aluguelTotal: number
  percentualFolhaSalarial: number
  base: number
  total: number
}

// Fonte única do cálculo de despesas variáveis.
// total = impostos/taxas base + percentual da folha salarial (encargos) sobre o faturamento.
// O aluguel NÃO entra mais no percentual total.
export function calcularTotalDespesasVariaveis({
  maquininhas,
  distribuicaoVendas,
  outrasTaxas,
  faturamentoBase,
  folhaSalarialTotalMensal = 0,
}: CalculoDespesasVariaveisParams): CalculoDespesasVariaveisResult {
  const maquininhasAtivas = maquininhas.filter((m) => m.ativo)

  const taxaDebitoMedia = maquininhasAtivas.length > 0
    ? maquininhasAtivas.reduce((sum, m) => sum + (m.taxaDebito || 0), 0) / maquininhasAtivas.length
    : 0

  const taxaCreditoMedia = maquininhasAtivas.length > 0
    ? maquininhasAtivas.reduce((sum, m) => sum + (m.taxaCredito || 0), 0) / maquininhasAtivas.length
    : 0

  const percDebito = (distribuicaoVendas.debito || 0) / 100
  const percCredito = (distribuicaoVendas.credito || 0) / 100
  const percVoucher = (distribuicaoVendas.voucher || 0) / 100
  const taxaVoucher = outrasTaxas.voucher || 7.0

  const taxaMediaGeral =
    taxaDebitoMedia * percDebito + taxaCreditoMedia * percCredito + taxaVoucher * percVoucher

  const aluguelTotal = maquininhasAtivas.reduce((sum, m) => sum + (m.aluguel || 0), 0)

  const percentualFolhaSalarial =
    faturamentoBase > 0 && folhaSalarialTotalMensal > 0
      ? (folhaSalarialTotalMensal / faturamentoBase) * 100
      : 0

  const base = (outrasTaxas.simplesNacional || 0) + taxaMediaGeral + (outrasTaxas.manutencao || 0)
  const total = base + percentualFolhaSalarial

  return {
    taxaDebitoMedia,
    taxaCreditoMedia,
    taxaMediaGeral,
    aluguelTotal,
    percentualFolhaSalarial,
    base,
    total,
  }
}
