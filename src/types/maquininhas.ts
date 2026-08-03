// src/types/maquininhas.ts
export interface Maquininha {
  id: string
  nome: string
  taxaDebito: number
  taxaCredito: number
  taxaPix: number
  aluguel: number
  ativo: boolean
  ordem?: number
  contaCreditoId?: number | null
  contaDebitoId?: number | null
  contaPixId?: number | null
  contaCredito?: { id: number; nome: string } | null
  contaDebito?: { id: number; nome: string } | null
  contaPix?: { id: number; nome: string } | null
}

export interface ConfiguracaoMaquininhas {
  maquininhas: Maquininha[]
  distribuicaoVendas: {
    debito: number
    credito: number
    voucher: number
  }
  manutencao: number
  simplesNacional: number
}
