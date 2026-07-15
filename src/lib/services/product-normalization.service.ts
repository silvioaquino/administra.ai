// Serviço de normalização de produtos com fallback em cascata:
// OPEN_FOOD_FACTS (cache -> API) -> NORMALIZACAO_LOCAL.
// Nunca lança exceção: em caso de erro, retorna normalização local.

import {
  getProductCache,
  setProductCache,
  getNormalizationCache,
  setNormalizationCache,
  hashName,
} from '@/lib/cache/produto-cache.service'
import { OpenFoodFactsService } from '@/lib/services/open-food-facts.service'
import { normalizarLocalmente, parseQuantidadeOFF } from '@/lib/services/local-normalizer'
import { normalizationMetrics } from '@/lib/monitoring/normalization-metrics'
import type { OpenFoodFactsProduct, ProdutoNormalizado, ProductInput } from '@/types/produto-normalizacao'

export interface NormalizarOptions {
  bypassCache?: boolean
}

export class ProductNormalizationService {
  /** Valida e normaliza um GTIN (8/12/13/14 dígitos). "SEM GTIN" ou inválido -> null. */
  static validarGtin(value: string | null | undefined): string | null {
    if (!value) return null
    const cleaned = value.trim()
    if (cleaned === '' || cleaned.toUpperCase() === 'SEM GTIN') return null
    if (!/^\d+$/.test(cleaned)) return null
    if (![8, 12, 13, 14].includes(cleaned.length)) return null
    return cleaned
  }

  static async normalizarProduto(input: ProductInput, options?: NormalizarOptions): Promise<ProdutoNormalizado> {
    const descricao = input.descricao?.trim() || ''
    const gtin = this.validarGtin(input.codigoBarras)

    // 1. Cache do resultado normalizado (OFF hit anterior)
    if (gtin && !options?.bypassCache) {
      const cached = getProductCache(gtin)
      if (cached) {
        normalizationMetrics.recordFonte(cached.fonteDados, cached.precisaRevisao)
        return cached
      }
    }

    // 2. API da Open Food Facts
    if (gtin) {
      try {
        const offProduct = await OpenFoodFactsService.buscarProduto(gtin)
        if (offProduct && offProduct.product_name) {
          const normalized = this.mapearOffParaNormalizado(offProduct, gtin, descricao)
          setProductCache(gtin, normalized)
          normalizationMetrics.recordFonte('OPEN_FOOD_FACTS', false)
          return normalized
        }
      } catch (error) {
        console.warn(`[Normalização] Erro ao consultar Open Food Facts para ${gtin}`, error)
      }
    }

    // 3. Fallback local (cacheado por hash do nome)
    const nameKey = hashName(descricao)
    if (!options?.bypassCache) {
      const cachedLocal = getNormalizationCache(nameKey)
      if (cachedLocal) {
        normalizationMetrics.recordFonte('NORMALIZACAO_LOCAL', true)
        return cachedLocal
      }
    }
    const local = normalizarLocalmente(descricao, input.unidade)
    setNormalizationCache(nameKey, local)
    normalizationMetrics.recordFonte('NORMALIZACAO_LOCAL', true)
    return local
  }

  /** Normaliza um lote com concorrência limitada. O lote nunca lança. */
  static async normalizarLote(inputs: ProductInput[], concurrency = 5): Promise<ProdutoNormalizado[]> {
    const results: ProdutoNormalizado[] = new Array(inputs.length)
    let cursor = 0

    const worker = async (): Promise<void> => {
      while (cursor < inputs.length) {
        const index = cursor++
        try {
          results[index] = await this.normalizarProduto(inputs[index])
        } catch (error) {
          console.warn('[Normalização] Falha no item; usando fallback local', error)
          results[index] = normalizarLocalmente(inputs[index].descricao, inputs[index].unidade)
        }
      }
    }

    const workerCount = Math.min(concurrency, Math.max(inputs.length, 1))
    await Promise.all(Array.from({ length: workerCount }, () => worker()))
    return results
  }

  private static mapearOffParaNormalizado(
    off: OpenFoodFactsProduct,
    gtin: string,
    descricaoOriginal: string,
  ): ProdutoNormalizado {
    const { unidade, quantidade } = parseQuantidadeOFF(off.quantity)
    return {
      nomeOriginal: descricaoOriginal,
      nomeNormalizado: off.product_name!.trim(),
      codigoBarras: gtin,
      marca: off.brands ? off.brands.split(',')[0].trim() : null,
      categoria: off.categories ? off.categories.split(',')[0].trim() : null,
      unidade,
      quantidade,
      fonteDados: 'OPEN_FOOD_FACTS',
      precisaRevisao: false,
      normalizadoEm: new Date(),
    }
  }

  /** Fallback local imediato (usado quando a normalização em lote falha por completo). */
  static fallbackLocal(input: ProductInput): ProdutoNormalizado {
    return normalizarLocalmente(input.descricao, input.unidade)
  }
}
