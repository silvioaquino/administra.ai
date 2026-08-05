import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/services/open-food-facts.service', () => ({
  OpenFoodFactsService: { buscarProduto: vi.fn() },
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    produto: {
      findFirst: vi.fn(),
    },
  },
}))

import { ProductNormalizationService } from '@/lib/services/product-normalization.service'
import { memoryCache, getProductCache } from '@/lib/cache/produto-cache.service'
import { OpenFoodFactsService } from '@/lib/services/open-food-facts.service'
import { prisma } from '@/lib/prisma'

function offMock() {
  return OpenFoodFactsService.buscarProduto as unknown as ReturnType<typeof vi.fn>
}

function prismaMock() {
  return (prisma.produto.findFirst as unknown) as ReturnType<typeof vi.fn>
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

  // ===== Testes do lookup no banco de dados =====

  describe('consultarNormalizacaoExistente', () => {
    it('encontra produto pelo GTIN e retorna normalização sem chamar API', async () => {
      prismaMock().mockResolvedValue({
        nomeNormalizado: 'Leite Integral',
        marca: 'MarcaX',
        categoriaSugestao: 'Laticínios',
        unidadeMedida: 'L',
        codigoBarras: '7891234567890',
        fonteDados: 'OPEN_FOOD_FACTS',
        precisaRevisao: false,
        normalizadoEm: new Date('2025-01-01'),
      })

      const r = await ProductNormalizationService.consultarNormalizacaoExistente(
        'emp-123',
        { descricao: 'Leite', codigoBarras: '7891234567890' },
      )

      expect(prismaMock()).toHaveBeenCalledWith({
        where: {
          empresaId: 'emp-123',
          codigoBarras: '7891234567890',
          nomeNormalizado: { not: null },
        },
        orderBy: { createdAt: 'desc' },
      })
      expect(offMock()).not.toHaveBeenCalled()
      expect(r).not.toBeNull()
      expect(r!.nomeNormalizado).toBe('Leite Integral')
      expect(r!.fonteDados).toBe('OPEN_FOOD_FACTS')
      expect(r!.precisaRevisao).toBe(false)
      expect(r!.codigoBarras).toBe('7891234567890')
    })

    it('encontra produto pelo nome normalizado quando não tem GTIN', async () => {
      prismaMock().mockResolvedValue({
        nomeNormalizado: 'Arroz',
        marca: null,
        categoriaSugestao: 'Mercearia',
        unidadeMedida: 'KG',
        codigoBarras: null,
        fonteDados: 'NORMALIZACAO_LOCAL',
        precisaRevisao: true,
        normalizadoEm: new Date('2025-01-01'),
      })

      const r = await ProductNormalizationService.consultarNormalizacaoExistente(
        'emp-123',
        { descricao: 'ARROZ 1KG' },
      )

      expect(r).not.toBeNull()
      expect(r!.nomeNormalizado).toBe('Arroz')
      expect(r!.fonteDados).toBe('NORMALIZACAO_LOCAL')
    })

    it('retorna null quando não encontra produto no DB', async () => {
      prismaMock().mockResolvedValue(null)

      const r = await ProductNormalizationService.consultarNormalizacaoExistente(
        'emp-123',
        { descricao: 'Produto Inexistente', codigoBarras: '7891234567890' },
      )

      expect(r).toBeNull()
    })

    it('retorna null quando GTIN é inválido', async () => {
      const r = await ProductNormalizationService.consultarNormalizacaoExistente(
        'emp-123',
        { descricao: 'Produto', codigoBarras: 'SEM GTIN' },
      )
      expect(r).toBeNull()
      expect(prismaMock()).not.toHaveBeenCalled()
    })
  })

  describe('normalizarProduto com empresaId (cache-first DB)', () => {
    it('não chama a API quando o produto está no DB', async () => {
      prismaMock().mockResolvedValue({
        nomeNormalizado: 'Leite Integral',
        marca: 'MarcaX',
        categoriaSugestao: 'Laticínios',
        unidadeMedida: 'L',
        codigoBarras: '7891234567890',
        fonteDados: 'OPEN_FOOD_FACTS',
        precisaRevisao: false,
        normalizadoEm: new Date('2025-01-01'),
      })

      const r = await ProductNormalizationService.normalizarProduto(
        { descricao: 'Leite', codigoBarras: '7891234567890' },
        { empresaId: 'emp-123' },
      )

      expect(offMock()).not.toHaveBeenCalled()
      expect(r.fonteDados).toBe('OPEN_FOOD_FACTS')
      expect(r.nomeNormalizado).toBe('Leite Integral')
      // Verifica que populou o cache em memória
      expect(getProductCache('7891234567890')).toBeDefined()
    })

    it('continua para a API quando o DB não tem o produto', async () => {
      prismaMock().mockResolvedValue(null)
      offMock().mockResolvedValue({ product_name: 'Leite Integral', brands: 'MarcaX' })

      const r = await ProductNormalizationService.normalizarProduto(
        { descricao: 'Leite', codigoBarras: '7891234567890' },
        { empresaId: 'emp-123' },
      )

      expect(prismaMock()).toHaveBeenCalled()
      expect(offMock()).toHaveBeenCalled()
      expect(r.fonteDados).toBe('OPEN_FOOD_FACTS')
    })

    it('pula o DB lookup quando empresaId não é fornecido', async () => {
      offMock().mockResolvedValue({ product_name: 'Leite' })

      const r = await ProductNormalizationService.normalizarProduto(
        { descricao: 'Leite', codigoBarras: '7891234567890' },
      )

      expect(prismaMock()).not.toHaveBeenCalled()
      expect(r.fonteDados).toBe('OPEN_FOOD_FACTS')
    })
  })
})
