import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/config/open-food-facts.config', () => ({
  openFoodFactsConfig: {
    apiUrl: 'https://world.openfoodfacts.org/api/v2',
    userAgent: 'Test/1.0 (test@test.com)',
    timeoutMs: 1000,
    retryAttempts: 3,
    ttlProductSec: 86400,
    ttlNormalizationSec: 604800,
    enableApi: true,
    enableAutoCategorization: true,
  },
}))

import { OpenFoodFactsService } from '@/lib/services/open-food-facts.service'
import { memoryCache, getOffRawCache } from '@/lib/cache/produto-cache.service'
import { openFoodFactsConfig } from '@/lib/config/open-food-facts.config'

function fetchMock() {
  return fetch as unknown as ReturnType<typeof vi.fn>
}

describe('OpenFoodFactsService', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
    vi.clearAllMocks()
    memoryCache.clear()
  })

  it('mapeia produto 200 com sucesso', async () => {
    fetchMock().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        status: 1,
        product: { product_name: 'Leite Integral', brands: 'MarcaX', categories: 'Laticinios' },
      }),
    })
    const result = await OpenFoodFactsService.buscarProduto('7891234567890')
    expect(result).not.toBeNull()
    expect(result!.product_name).toBe('Leite Integral')
    expect(fetchMock()).toHaveBeenCalledTimes(1)
  })

  it('404 cacheia negativo e não refaz fetch', async () => {
    fetchMock().mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({}) })
    const first = await OpenFoodFactsService.buscarProduto('1111111111111')
    expect(first).toBeNull()
    expect(fetchMock()).toHaveBeenCalledTimes(1)
    const second = await OpenFoodFactsService.buscarProduto('1111111111111')
    expect(second).toBeNull()
    expect(fetchMock()).toHaveBeenCalledTimes(1) // veio do cache
    expect(getOffRawCache('1111111111111')).toBeNull()
  })

  it('status != 1 também cacheia negativo', async () => {
    fetchMock().mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ status: 0 }) })
    const r = await OpenFoodFactsService.buscarProduto('2222222222222')
    expect(r).toBeNull()
    expect(getOffRawCache('2222222222222')).toBeNull()
  })

  it('timeout/erro de rede faz retry e depois sucesso', async () => {
    fetchMock()
      .mockRejectedValueOnce(new Error('timeout'))
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ status: 1, product: { product_name: 'A' } }),
      })
    const result = await OpenFoodFactsService.buscarProduto('3333333333333')
    expect(result!.product_name).toBe('A')
    expect(fetchMock()).toHaveBeenCalledTimes(3)
  }, 15000)

  it('falha de rede repetida retorna null sem cachear', async () => {
    fetchMock().mockRejectedValue(new Error('network'))
    const result = await OpenFoodFactsService.buscarProduto('4444444444444')
    expect(result).toBeNull()
    expect(fetchMock()).toHaveBeenCalledTimes(3)
    expect(getOffRawCache('4444444444444')).toBeUndefined()
  }, 15000)

  it('retorna null e não chama fetch quando API desabilitada', async () => {
    const prev = openFoodFactsConfig.enableApi
    openFoodFactsConfig.enableApi = false
    const r = await OpenFoodFactsService.buscarProduto('5555555555555')
    expect(r).toBeNull()
    expect(fetchMock()).not.toHaveBeenCalled()
    openFoodFactsConfig.enableApi = prev
  })
})
