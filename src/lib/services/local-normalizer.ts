// Normalizador local (fallback) — funções puras e testáveis.
// Limpa o texto do nome original, remove unidades/quantidades, stopwords e
// duplicatas, aplica Title Case e sugere categoria por palavras-chave.

import type { ProdutoNormalizado } from '@/types/produto-normalizacao'
import { openFoodFactsConfig } from '@/lib/config/open-food-facts.config'

const STOPWORDS = new Set<string>([
  'de', 'da', 'do', 'das', 'dos', 'com', 'em', 'sem', 'para', 'e', 'un', 'kg', 'g', 'mg', 'l', 'ml',
  'pct', 'cx', 'und', 'tp', 'c/', 's/', 'produto', 'item', 'mercadoria', 'tipo', 'modelo', 'marca',
])

// Captura quantidade + unidade, ex.: "500g", "1 KG", "2 L"
const UNIT_PATTERN = /(\d+(?:[.,]\d+)?)\s*(kg|g|mg|l|ml|un|und|pct|cx|dz)\b/i

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Laticínios': ['leite', 'queijo', 'iogurte', 'yogurt', 'manteiga', 'requeijao', 'requeijão', 'creme de leite'],
  'Bebidas': ['refri', 'suco', 'agua', 'água', 'cerveja', 'cafe', 'café', 'cha', 'chá', 'energetico', 'isotonic', 'energético'],
  'Limpeza': ['sabao', 'sabão', 'detergente', 'sabonete', 'amaciante', 'desinfetante', 'limpador', 'bucha'],
  'Mercearia': ['arroz', 'feijao', 'feijão', 'macarrao', 'macarrão', 'acucar', 'açúcar', 'sal', 'farofa', 'molho', 'azeite', 'oleo', 'óleo', 'cafe', 'café', 'farinha'],
  'Higiene': ['papel', 'shampoo', 'creme', 'condicionador', 'escova', 'fio dental', 'absorvente', 'higiene'],
  'Carnes': ['frango', 'carne', 'picanha', 'alcatra', 'linguica', 'linguiça', 'bacon', 'peito', 'peru'],
  'Padaria': ['pao', 'pão', 'bolo', 'torrada', 'bisnaga', 'frances', 'rosca'],
  'Frutas e Legumes': ['banana', 'maca', 'maçã', 'tomate', 'cebola', 'alface', 'batata', 'laranja', 'cenoura'],
  'Congelados': ['pizza', 'lasanha', 'congelad', 'sorvete'],
}

function titleCase(text: string): string {
  return text
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

function dedupeWords(words: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const word of words) {
    const key = word.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      result.push(word)
    }
  }
  return result
}

/** Remove unidades/quantidades, stopwords, números puros e duplicatas; aplica Title Case. */
export function limparTexto(descricao: string): string {
  let text = descricao || ''
  text = text.replace(UNIT_PATTERN, ' ')
  text = text.replace(/\([^)]*\)/g, ' ')
  const tokens = text
    .split(/[^a-zA-ZÀ-ÿ0-9]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .filter((t) => !STOPWORDS.has(t.toLowerCase()))
    .filter((t) => !/^\d+$/.test(t))
  return titleCase(dedupeWords(tokens).join(' ')).trim()
}

/** Extrai unidade e quantidade de um nome (ex.: "Leite 1L" → { unidade: 'L', quantidade: 1 }). */
export function inferirUnidadeQuantidade(descricao: string): { unidade: string | null; quantidade: number | null } {
  const match = descricao.match(UNIT_PATTERN)
  if (!match) return { unidade: null, quantidade: null }
  const quantidade = parseFloat(match[1].replace(',', '.'))
  const unitMap: Record<string, string> = {
    kg: 'KG', g: 'G', mg: 'MG', l: 'L', ml: 'ML', un: 'UN', und: 'UN', cx: 'CX', pct: 'PCT', dz: 'DZ',
  }
  const unidade = unitMap[match[2].toLowerCase()] || match[2].toUpperCase()
  return {
    unidade,
    quantidade: Number.isFinite(quantidade) ? quantidade : null,
  }
}

/** Sugere categoria a partir de palavras-chave (pode ser desativado por env). */
export function sugerirCategoria(descricao: string): string | null {
  if (!openFoodFactsConfig.enableAutoCategorization) return null
  const lower = (descricao || '').toLowerCase()
  for (const [categoria, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return categoria
  }
  return null
}

/** Parser do campo `quantity` da Open Food Facts (ex.: "500 g", "1kg", "2 x 500g"). */
export function parseQuantidadeOFF(qty?: string): { unidade: string | null; quantidade: number | null } {
  if (!qty) return { unidade: null, quantidade: null }
  const match = qty.match(/(\d+(?:[.,]\d+)?)\s*(kg|g|mg|l|ml|cl|unit|units|oz|lb)?/i)
  if (!match) return { unidade: null, quantidade: null }
  const quantidade = parseFloat(match[1].replace(',', '.'))
  const unitMap: Record<string, string> = {
    kg: 'KG', g: 'G', mg: 'MG', l: 'L', ml: 'ML', cl: 'CL', unit: 'UN', units: 'UN', oz: 'OZ', lb: 'LB',
  }
  const unidade = match[2] ? (unitMap[match[2].toLowerCase()] || match[2].toUpperCase()) : null
  return { unidade, quantidade: Number.isFinite(quantidade) ? quantidade : null }
}

/** Fallback local: produz um ProdutoNormalizado a partir do nome (fonte NORMALIZACAO_LOCAL). */
export function normalizarLocalmente(descricao: string, unidade?: string): ProdutoNormalizado {
  const nomeNormalizado = limparTexto(descricao) || descricao.trim()
  const categoria = sugerirCategoria(descricao)
  return {
    nomeOriginal: descricao,
    nomeNormalizado,
    codigoBarras: null,
    marca: null,
    categoria,
    unidade: unidade || null,
    quantidade: null,
    fonteDados: 'NORMALIZACAO_LOCAL',
    precisaRevisao: true,
    normalizadoEm: new Date(),
  }
}
