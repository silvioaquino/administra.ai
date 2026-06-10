// src/types/caixa.ts
export interface CaixaAbertura {
  id: string
  dataAbertura: Date | string
  valorInicial: number
  observacao?: string
  status: 'ABERTO' | 'FECHADO'
  vendas?: Venda[]
  vendasManuais?: VendaManual[]
  retiradas?: Retirada[]
  fechamento?: CaixaFechamento
  createdAt?: Date
  updatedAt?: Date
}

export interface Venda {
  id: string
  dataVenda: Date | string
  dadosPedido: any
  tipoPagamento: string
  valorTotal: number
  manual: boolean
  caixaAberturaId: string
  nomeCliente?: string
  telefoneCliente?: string
  tipoPedido?: string
  endereco?: string
  numeroPedido?: string
  produtos?: ProdutoVenda[]
  createdAt?: Date
  updatedAt?: Date
}

export interface ProdutoVenda {
  id: string
  vendaId: string
  nome: string
  quantidade: number
  valor: number
  adicionais?: any
  observacao?: string
}

export interface VendaManual {
  id: string
  dataVenda: Date | string
  tipoPagamento: string
  valor: number
  descricao?: string
  caixaAberturaId: string
}

export interface Retirada {
  id: string
  dataRetirada: Date | string
  valor: number
  observacao?: string
  caixaAberturaId: string
}

export interface CaixaFechamento {
  id: string
  dataFechamento?: Date | string
  valorAbertura?: number
  totalVendas?: number
  retiradas?: number
  saldoFinal?: number
  observacoes?: string
  caixaAberturaId?: string
  // Campos para consulta
  valor_abertura?: number
  vendas_dinheiro?: number
  total_vendas?: number
  total_retiradas?: number
  saldo_final?: number
  vendas_por_forma_pagamento?: { [key: string]: number }
  dataAbertura?: string | Date
  data_abertura?: string
  data_fechamento?: string
  observacao?: string
  status?: string
  // Array de retiradas para consulta detalhada
  retiradasList?: Array<{
    data: Date | string
    valor: number
    observacao?: string
  }>
  // Alias para array no modal
  retiradas?: Array<{
    data: Date | string
    valor: number
    observacao?: string
  }>
  //dataFechamento?: string
  observacao?: string
  status?: string
  fechamento?: {
    data_fechamento: string
    valor_abertura: number
    total_vendas: number
    retiradas: number
    saldo_final: number
    observacoes: string
  }
  total_vendas_sistema?: number
  total_vendas_manuais?: number
  quantidade_vendas?: number
  quantidade_vendas_manuais?: number
  quantidade_retiradas?: number
}