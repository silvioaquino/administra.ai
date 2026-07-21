import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/services/open-food-facts.service', () => ({
  OpenFoodFactsService: { buscarProduto: vi.fn() },
}))

import { ProductNormalizationService } from '@/lib/services/product-normalization.service'
import { memoryCache, getProductCache } from '@/lib/cache/produto-cache.service'
import { OpenFoodFactsService } from '@/lib/services/open-food-facts.service'

function offMock() {
  return OpenFoodFactsService.buscarProduto as unknown as ReturnType<typeof vi.fn>
}

describe('ProductNormalizationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    memoryCache.clear()
  })

  it('fallback local quando API retorna null (404)', async () => {
    offMock().mockResolvedValue(null)
    const r = await ProductNormalizationService.normalizarProduto({ descricao: 'LEITE 1L', codigoBarras: '7891234567890' })
    expect(r.fonteDados).toBe('NORMALIZACAO_LOCAL')
    expect(r.precisaRevisao).toBe(true)
    expect(r.nomeNormalizado).toBe('Leite')
    expect(r.codigoBarras).toBeNull()
  })

  it('fallback local quando GTIN é SEM GTIN (não consulta API)', async () => {
    const r = await ProductNormalizationService.normalizarProduto({ descricao: 'ARROZ', codigoBarras: 'SEM GTIN' })
    expect(offMock()).not.toHaveBeenCalled()
    expect(r.fonteDados).toBe('NORMALIZACAO_LOCAL')
  })

  it('usa API quando retorna produto', async () => {
    offMock().mockResolvedValue({
      product_name: 'Leite Integral',
      brands: 'MarcaX',
      categories: 'Laticinios',
      quantity: '1 L',
    })
    const r = await ProductNormalizationService.normalizarProduto({ descricao: 'LEITE 1L', codigoBarras: '7891234567890' })
    expect(r.fonteDados).toBe('OPEN_FOOD_FACTS')
    expect(r.precisaRevisao).toBe(false)
    expect(r.nomeNormalizado).toBe('Leite Integral')
    expect(r.marca).toBe('MarcaX')
    expect(r.categoria).toBe('Laticinios')
    expect(r.codigoBarras).toBe('7891234567890')
    expect(r.unidade).toBe('L')
    expect(r.quantidade).toBe(1)
  })

  it('é resiliente quando a API lança', async () => {
    offMock().mockRejectedValue(new Error('boom'))
    const r = await ProductNormalizationService.normalizarProduto({ descricao: 'FEIJAO', codigoBarras: '7891234567890' })
    expect(r.fonteDados).toBe('NORMALIZACAO_LOCAL')
  })

  it('cacheia resultado OFF por gtin e evita nova chamada', async () => {
    offMock().mockResolvedValue({ product_name: 'Leite' })
    await ProductNormalizationService.normalizarProduto({ descricao: 'X', codigoBarras: '7891234567890' })
    expect(getProductCache('7891234567890')).toBeDefined()
    offMock().mockClear()
    await ProductNormalizationService.normalizarProduto({ descricao: 'X', codigoBarras: '7891234567890' })
    expect(offMock()).not.toHaveBeenCalled()
  })

  it('normalizarLote respeita concorrência <= 5', async () => {
    let inFlight = 0
    let maxInFlight = 0
    offMock().mockImplementation(async () => {
      inFlight++
      maxInFlight = Math.max(maxInFlight, inFlight)
      await new Promise((res) => setTimeout(res, 10))
      inFlight--
      return { product_name: 'X' }
    })
    const inputs = Array.from({ length: 20 }, (_, i) => ({
      descricao: `P${i}`,
      codigoBarras: String(1000000000000 + i),
    }))
    const results = await ProductNormalizationService.normalizarLote(inputs, 5)
    expect(results).toHaveLength(20)
    expect(maxInFlight).toBeLessThanOrEqual(5)
    expect(results.every((r) => r.fonteDados === 'OPEN_FOOD_FACTS')).toBe(true)
  }, 15000)
})
