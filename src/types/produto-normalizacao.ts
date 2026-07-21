// Tipos compartilhados do subsistema de normalização de produtos

export type FonteDados = 'OPEN_FOOD_FACTS' | 'NORMALIZACAO_LOCAL' | 'MANUAL'

export interface ProdutoNormalizado {
  nomeOriginal: string
  nomeNormalizado: string
  codigoBarras: string | null
  marca: string | null
  categoria: string | null
  unidade: string | null
  quantidade: number | null
  fonteDados: FonteDados
  precisaRevisao: boolean
  normalizadoEm: Date
}

export interface OpenFoodFactsProduct {
  product_name?: string
  brands?: string
  categories?: string
  quantity?: string
  [key: string]: unknown
}

export interface OpenFoodFactsResponse {
  status: number
  product: OpenFoodFactsProduct
  [key: string]: unknown
}

export interface ProductInput {
  descricao: string
  codigoBarras?: string | null
  unidade?: string
}
