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
import { normalizarLocalmente, parseQuantidadeOFF, limparTexto } from '@/lib/services/local-normalizer'
import { normalizationMetrics } from '@/lib/monitoring/normalization-metrics'
import { prisma } from '@/lib/prisma'
import type { OpenFoodFactsProduct, ProdutoNormalizado, ProductInput, FonteDados } from '@/types/produto-normalizacao'

export interface NormalizarOptions {
  bypassCache?: boolean
  empresaId?: string
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

    // 0. Lookup no banco de dados (antes de chamar qualquer API)
    //    Se o produto já foi normalizado anteriormente, reutiliza sem API.
    if (options?.empresaId) {
      const dbResult = await this.consultarNormalizacaoExistente(options.empresaId, input)
      if (dbResult) {
        if (dbResult.codigoBarras) setProductCache(dbResult.codigoBarras, dbResult)
        setNormalizationCache(hashName(descricao), dbResult)
        normalizationMetrics.recordFonte(dbResult.fonteDados, dbResult.precisaRevisao)
        return dbResult
      }
    }

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

  // ===== Lookup no banco de dados (cache-persistence layer) =====

  /**
   * Consulta produtos já normalizados no banco.
   * Busca primeiro pelo GTIN (barcode), depois pelo nome normalizado (limpo).
   * Retorna null se não encontrar normalização prévia — sem chamar nenhuma API.
   */
  static async consultarNormalizacaoExistente(
    empresaId: string,
    input: ProductInput,
  ): Promise<ProdutoNormalizado | null> {
    const gtin = this.validarGtin(input.codigoBarras)

    // 1. Buscar pelo GTIN (barcode) — usa índice [empresaId, codigoBarras]
    if (gtin) {
      const produto = await prisma.produto.findFirst({
        where: {
          empresaId,
          codigoBarras: gtin,
          nomeNormalizado: { not: null },
        },
        orderBy: { createdAt: 'desc' },
      })
      if (produto) {
        return this.mapProdutoParaNormalizado(produto)
      }
    }

    // 2. Buscar pelo nome normalizado (limpo = sem unidades/stopwords)
    const nomeLimpo = limparTexto(input.descricao)
    if (nomeLimpo) {
      const produto = await prisma.produto.findFirst({
        where: {
          empresaId,
          nomeNormalizado: { equals: nomeLimpo, mode: 'insensitive' as const },
        },
        orderBy: { createdAt: 'desc' },
      })
      if (produto) {
        return this.mapProdutoParaNormalizado(produto)
      }
    }

    return null
  }

  /** Converte um registro Prisma.Produto normalizado em ProdutoNormalizado. */
  private static mapProdutoParaNormalizado(produto: {
    nomeNormalizado: string | null
    marca: string | null
    categoriaSugestao: string | null
    unidadeMedida: string | null
    codigoBarras: string | null
    fonteDados: string
    precisaRevisao: boolean
    normalizadoEm: Date | null
  }): ProdutoNormalizado {
    return {
      nomeOriginal: produto.nomeNormalizado ?? '',
      nomeNormalizado: produto.nomeNormalizado ?? '',
      codigoBarras: produto.codigoBarras,
      marca: produto.marca,
      categoria: produto.categoriaSugestao,
      unidade: produto.unidadeMedida,
      quantidade: null,
      fonteDados: produto.fonteDados as FonteDados,
      precisaRevisao: produto.precisaRevisao,
      normalizadoEm: produto.normalizadoEm ?? new Date(),
    }
  }

  /** Fallback local imediato (usado quando a normalização em lote falha por completo). */
  static fallbackLocal(input: ProductInput): ProdutoNormalizado {
    return normalizarLocalmente(input.descricao, input.unidade)
  }
}
