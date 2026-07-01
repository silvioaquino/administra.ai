// src/types/maquininhas.ts
export interface Maquininha {
  id: string
  nome: string
  taxaDebito: number
  taxaCredito: number
  aluguel: number
  ativo: boolean
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