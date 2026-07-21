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
    it('should calculate cost from cost-per-unit (1 purchase unit = 1 package)', () => {
      // 100g de açúcar, custo R$2,99 por KG
      const result = ConversionService.calculateConsumption(100, 'G', {
        purchaseUnit: 'KG',
        unitPrice: 2.99
      })

      expect(result.gramsUsed).toBe(100)
      expect(result.packagesUsed).toBeCloseTo(0.1, 5)
      expect(result.cost).toBeCloseTo(0.299, 5)
      expect(result.isFractional).toBe(true)
      expect(result.fractionalAlert).toContain('0.100')
    })

    it('should be exact when using a whole purchase unit', () => {
      // 1 KG de açúcar, custo R$2,99 por KG
      const result = ConversionService.calculateConsumption(1000, 'G', {
        purchaseUnit: 'KG',
        unitPrice: 2.99
      })

      expect(result.gramsUsed).toBe(1000)
      expect(result.packagesUsed).toBe(1)
      expect(result.cost).toBe(2.99)
      expect(result.isFractional).toBe(false)
      expect(result.fractionalAlert).toBeUndefined()
    })

    it('should convert UN items using pesoUnitario', () => {
      // 300g de ovo, R$0,50 por ovo (60g cada) -> 5 ovos -> R$2,50
      const result = ConversionService.calculateConsumption(300, 'G', {
        purchaseUnit: 'UN',
        unitPrice: 0.5,
        pesoUnitario: 60
      })

      expect(result.gramsUsed).toBe(300)
      expect(result.packagesUsed).toBe(5)
      expect(result.cost).toBe(2.5)
      expect(result.isFractional).toBe(false)
    })
  })
})
