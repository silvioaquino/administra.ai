// Integração com a Open Food Facts (API gratuita de produtos por GTIN).
// - User-Agent obrigatório
// - Timeout via AbortController
// - Retry com backoff exponencial
// - Rate limiter local (~1 req / 300ms)
// - Cache de negativos (não encontrado) para não re-bater na API

import { openFoodFactsConfig } from '@/lib/config/open-food-facts.config'
import { getOffRawCache, setOffRawCache } from '@/lib/cache/produto-cache.service'
import { RateLimiter } from '@/lib/services/rate-limiter'
import { normalizationMetrics } from '@/lib/monitoring/normalization-metrics'
import type { OpenFoodFactsProduct } from '@/types/produto-normalizacao'

const rateLimiter = new RateLimiter(300)

export class OpenFoodFactsService {
  /**
   * Busca um produto pelo GTIN. Retorna null se não encontrado ou em caso de falha transitória.
   * Resultados (inclusive "não encontrado") são cacheados por 24h.
   */
  static async buscarProduto(gtin: string): Promise<OpenFoodFactsProduct | null> {
    if (!openFoodFactsConfig.enableApi) return null

    const cached = getOffRawCache(gtin)
    if (cached !== undefined) {
      // cached !== undefined significa que já consultamos: pode ser o produto ou null (não encontrado)
      return cached
    }

    const { product, cacheable } = await this.request(gtin)
    if (cacheable) {
      setOffRawCache(gtin, product)
    }
    return product
  }

  private static async request(gtin: string): Promise<{ product: OpenFoodFactsProduct | null; cacheable: boolean }> {
    const { apiUrl, userAgent, timeoutMs, retryAttempts } = openFoodFactsConfig
    const url = `${apiUrl}/product/${encodeURIComponent(gtin)}.json`

    let lastError: unknown
    for (let attempt = 0; attempt < retryAttempts; attempt++) {
      const startedAt = Date.now()
      try {
        await rateLimiter.acquire()
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), timeoutMs)
        let response: Response
        try {
          response = await fetch(url, {
            signal: controller.signal,
            headers: { 'User-Agent': userAgent },
          })
        } finally {
          clearTimeout(timer)
        }

        // 404 = não retryable; cacheia negativo
        if (response.status === 404) {
          normalizationMetrics.recordOff('not_found', Date.now() - startedAt)
          return { product: null, cacheable: true }
        }

        // 429 = rate limit: respeita o header Retry-After da API e aplica um
        // cooldown global no rate limiter para nao martelar o servidor.
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After')
          const waitMs = retryAfter
            ? parseInt(retryAfter, 10) * 1000
            : Math.min(2000 * 2 ** attempt, 10000)
          rateLimiter.penalize(waitMs)
          lastError = new Error('Open Food Facts retornou status 429 (rate limit)')
          await new Promise((resolve) => setTimeout(resolve, waitMs))
          continue
        }

        if (!response.ok) {
          // 5xx ou outro erro -> retry com backoff
          lastError = new Error(`Open Food Facts retornou status ${response.status}`)
          await this.backoff(attempt)
          continue
        }

        const data = (await response.json()) as { status?: number; product?: OpenFoodFactsProduct }
        if (data.status !== 1 || !data.product) {
          normalizationMetrics.recordOff('not_found', Date.now() - startedAt)
          return { product: null, cacheable: true }
        }

        normalizationMetrics.recordOff('success', Date.now() - startedAt)
        return { product: data.product, cacheable: true }
      } catch (error) {
        lastError = error
        // Timeout (AbortError) ou erro de rede -> retry com backoff
        await this.backoff(attempt)
      }
    }

    normalizationMetrics.recordOff('failure', 0)
    console.warn(`[OpenFoodFacts] Falha ao consultar GTIN ${gtin} após ${retryAttempts} tentativas`, lastError)
    // Falha transitória NÃO é cacheada (permite retry no próximo import)
    return { product: null, cacheable: false }
  }

  private static async backoff(attempt: number): Promise<void> {
    const delay = Math.min(100 * 2 ** attempt, 2000) + Math.random() * 50
    await new Promise((resolve) => setTimeout(resolve, delay))
  }
}
