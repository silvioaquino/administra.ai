import { describe, it, expect } from 'vitest'
import { ProductNormalizationService } from '@/lib/services/product-normalization.service'

describe('ProductNormalizationService.validarGtin', () => {
  it('valida GTIN de 13 dígitos', () => {
    expect(ProductNormalizationService.validarGtin('7891234567890')).toBe('7891234567890')
  })

  it('valida GTIN de 8, 12 e 14 dígitos', () => {
    expect(ProductNormalizationService.validarGtin('12345678')).toBe('12345678')
    expect(ProductNormalizationService.validarGtin('123456789012')).toBe('123456789012')
    expect(ProductNormalizationService.validarGtin('12345678901234')).toBe('12345678901234')
  })

  it('retorna null para "SEM GTIN" (case-insensitive)', () => {
    expect(ProductNormalizationService.validarGtin('SEM GTIN')).toBeNull()
    expect(ProductNormalizationService.validarGtin('sem gtin')).toBeNull()
  })

  it('retorna null para vazio/undefined/null', () => {
    expect(ProductNormalizationService.validarGtin('')).toBeNull()
    expect(ProductNormalizationService.validarGtin(null)).toBeNull()
    expect(ProductNormalizationService.validarGtin(undefined)).toBeNull()
  })

  it('retorna null para não-dígitos', () => {
    expect(ProductNormalizationService.validarGtin('789ABC')).toBeNull()
    expect(ProductNormalizationService.validarGtin('789-123')).toBeNull()
  })

  it('retorna null para comprimento inválido', () => {
    expect(ProductNormalizationService.validarGtin('123')).toBeNull()
    expect(ProductNormalizationService.validarGtin('123456789012345')).toBeNull()
  })

  it('aplica trim', () => {
    expect(ProductNormalizationService.validarGtin(' 7891234567890 ')).toBe('7891234567890')
  })
})
