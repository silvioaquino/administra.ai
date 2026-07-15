// Configuração da integração com a Open Food Facts.
// Lê variáveis de ambiente com fallbacks seguros (ver .env.example).

export interface OpenFoodFactsConfig {
  apiUrl: string
  userAgent: string
  timeoutMs: number
  retryAttempts: number
  ttlProductSec: number
  ttlNormalizationSec: number
  enableApi: boolean
  enableAutoCategorization: boolean
}

function toBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback
  return value === 'true' || value === '1'
}

function toInt(value: string | undefined, fallback: number): number {
  const parsed = value ? parseInt(value, 10) : NaN
  return Number.isFinite(parsed) ? parsed : fallback
}

export const openFoodFactsConfig: OpenFoodFactsConfig = {
  apiUrl: process.env.OPEN_FOOD_FACTS_API_URL || 'https://world.openfoodfacts.org/api/v2',
  userAgent: process.env.OPEN_FOOD_FACTS_USER_AGENT || 'MeuSaaS/1.0 (contato@meusaaS.com)',
  timeoutMs: toInt(process.env.OPEN_FOOD_FACTS_TIMEOUT, 5000),
  retryAttempts: toInt(process.env.OPEN_FOOD_FACTS_RETRY_ATTEMPTS, 3),
  ttlProductSec: toInt(process.env.CACHE_TTL_PRODUCT, 86400),
  ttlNormalizationSec: toInt(process.env.CACHE_TTL_NORMALIZATION, 604800),
  enableApi: toBool(process.env.ENABLE_OPEN_FOOD_FACTS, true),
  enableAutoCategorization: toBool(process.env.ENABLE_AUTO_CATEGORIZATION, true),
}
