import { ConversionService } from '@/lib/services/conversion.service'

describe('ConversionService', () => {
  describe('convertToGrams', () => {
    it('should convert KG to grams', () => {
      expect(ConversionService.convertToGrams(2.5, 'KG')).toBe(2500)
    })

    it('should convert G to grams', () => {
      expect(ConversionService.convertToGrams(400, 'G')).toBe(400)
    })

    it('should convert L to grams with density', () => {
      expect(ConversionService.convertToGrams(1, 'L', undefined, 1.03)).toBe(1030)
    })

    it('should convert UN with pesoUnitario', () => {
      expect(ConversionService.convertToGrams(3, 'UN', 60)).toBe(180)
    })

    it('should throw error for UN without pesoUnitario', () => {
      expect(() => ConversionService.convertToGrams(3, 'UN'))
        .toThrow('Produto em UN precisa ter peso unitário definido')
    })
  })

  describe('calculateConsumption', () => {
    it('should calculate consumption correctly', () => {
      const result = ConversionService.calculateConsumption(2.5, 'KG', {
        purchaseUnit: 'G',
        purchaseQuantity: 400,
        unitPrice: 5.00
      })

      expect(result.gramsUsed).toBe(2500)
      expect(result.packagesUsed).toBe(6.25)
      expect(result.cost).toBe(31.25)
      expect(result.isFractional).toBe(true)
      expect(result.fractionalAlert).toContain('6.25')
    })

    it('should not be fractional when exact', () => {
      const result = ConversionService.calculateConsumption(800, 'G', {
        purchaseUnit: 'G',
        purchaseQuantity: 400,
        unitPrice: 5.00
      })

      expect(result.packagesUsed).toBe(2)
      expect(result.isFractional).toBe(false)
      expect(result.fractionalAlert).toBeUndefined()
    })
  })
})
