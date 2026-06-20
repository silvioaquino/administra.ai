/**
 * Tipos para a página de DRE / Fluxo de Caixa
 */

export type DreItemType = 'receita' | 'despesa' | 'subtotal' | 'total';

export interface DreMeses {
  janeiro: number;
  fevereiro: number;
  marco: number;
  abril: number;
  maio: number;
  junho: number;
  julho: number;
  agosto: number;
  setembro: number;
  outubro: number;
  novembro: number;
  dezembro: number;
  jan?: number;
  fev?: number;
  mar?: number;
  abr?: number;
  mai?: number;
  jun?: number;
  jul?: number;
  ago?: number;
  set?: number;
  out?: number;
  nov?: number;
  dez?: number;
}

export interface DreItem {
  id: string;
  nome: string;
  nivel: number;
  tipo: DreItemType;
  previsao: number;
  meses: DreMeses;
  av: number; // Análise Vertical (%)
  ah: number; // Análise Horizontal (%)
  isBold?: boolean;
  isSubtotal?: boolean;
  isHeader?: boolean;
  isCalcRow?: boolean;
}

export interface DreResponse {
  success: boolean;
  data: DreItem[];
  error?: string;
}

export interface ProdutoItem {
  nome: string;
  valorTotal: number;
}

export interface FiltrosDRE {
  ano: number;
  mes?: number;
}

// Linhas de subtotal definidas
export const SUBTOTAL_LINES = [
  'RECEITA_LIQUIDA',
  'LUCRO_BRUTO',
  'LUCRO_OPERACIONAL_ANTES_INVESTIMENTOS',
  'LUCRO_OPERACIONAL',
  'LUCRO_LIQUIDO',
];