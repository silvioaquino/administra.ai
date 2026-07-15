// Cache em memória (Map + TTL) para resultados da Open Food Facts e normalizações locais.
// Implementa uma interface swappable: pode ser trocado por Redis no futuro sem mudar os serviços.

import { openFoodFactsConfig } from '@/lib/config/open-food-facts.config'
import type { OpenFoodFactsProduct, ProdutoNormalizado } from '@/types/produto-normalizacao'

interface CacheEntry {
  value: unknown
  expiresAt: number
}

export interface CacheStore {
  get<T>(key: string): T | undefined
  set<T>(key: string, value: T, ttlMs: number): void
  delete(key: string): void
  clear(): void
  has(key: string): boolean
}

class MemoryCache implements CacheStore {
  private store = new Map<string, CacheEntry>()

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key)
    if (!entry) return undefined
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return undefined
    }
    return entry.value as T
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs })
  }

  delete(key: string): void {
    this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
  }

  has(key: string): boolean {
    return this.get(key) !== undefined
  }

  // Varre entradas expiradas para evitar crescimento ilimitado
  sweep(): void {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) this.store.delete(key)
    }
  }
}

// Singleton ao nível do módulo (sobrevive a requests no mesmo processo).
export const memoryCache = new MemoryCache()

// ===== Hash estável para chaves de normalização local =====
export function hashName(name: string): string {
  let hash = 5381
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) + hash) + name.charCodeAt(i)
    hash = hash & hash
  }
  return (hash >>> 0).toString(36)
}

// ===== Cache bruto da Open Food Facts (inclui negativos p/ não re-bater na API) =====
export function setOffRawCache(gtin: string, product: OpenFoodFactsProduct | null): void {
  memoryCache.set(`offraw:${gtin}`, product, openFoodFactsConfig.ttlProductSec * 1000)
}

export function getOffRawCache(gtin: string): OpenFoodFactsProduct | null | undefined {
  return memoryCache.get<OpenFoodFactsProduct | null>(`offraw:${gtin}`)
}

// ===== Cache do produto normalizado final (conforme nomenclatura da spec) =====
export function setProductCache(gtin: string, data: ProdutoNormalizado): void {
  memoryCache.set(`off:${gtin}`, data, openFoodFactsConfig.ttlProductSec * 1000)
}

export function getProductCache(gtin: string): ProdutoNormalizado | undefined {
  return memoryCache.get<ProdutoNormalizado>(`off:${gtin}`)
}

export function clearCache(gtin: string): void {
  memoryCache.delete(`off:${gtin}`)
  memoryCache.delete(`offraw:${gtin}`)
}

// ===== Cache de normalização local (TTL maior: 7 dias) =====
export function setNormalizationCache(key: string, data: ProdutoNormalizado): void {
  memoryCache.set(`norm:${key}`, data, openFoodFactsConfig.ttlNormalizationSec * 1000)
}

export function getNormalizationCache(key: string): ProdutoNormalizado | undefined {
  return memoryCache.get<ProdutoNormalizado>(`norm:${key}`)
}
