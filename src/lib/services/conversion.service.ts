// src/lib/services/conversion.service.ts
import { UnitType, ConversionResult } from '@/types/ficha-tecnica'

const CONVERSION_TO_GRAMS: Record<UnitType, number | null> = {
  G: 1,
  KG: 1000,
  MG: 0.001,
  L: 1000, // Considerando densidade 1:1 (água/leite)
  ML: 1,
  UN: null, // Especial: precisa de pesoUnitario
}

export class ConversionService {
  /**
   * Converte qualquer unidade para gramas
   */
  static convertToGrams(
    value: number,
    unit: UnitType,
    pesoUnitario?: number,
    densidade?: number
  ): number {
    if (value <= 0) throw new Error('Quantidade deve ser maior que zero')

    if (unit === 'UN') {
      if (!pesoUnitario || pesoUnitario <= 0) {
        throw new Error('Produto em UN precisa ter peso unitário definido')
      }
      return value * pesoUnitario
    }

    if (unit === 'L' || unit === 'ML') {
      const factor = CONVERSION_TO_GRAMS[unit] || 1
      const density = densidade || 1
      return value * factor * density
    }

    const factor = CONVERSION_TO_GRAMS[unit]
    if (factor === null || factor === undefined) {
      throw new Error(`Unidade ${unit} não suportada`)
    }
    return value * factor
  }

  /**
   * Calcula o consumo de um item da ficha
   */
  static calculateConsumption(
    quantity: number,
    unitUsed: UnitType,
    product: {
      purchaseUnit: UnitType
      purchaseQuantity: number
      unitPrice: number
      pesoUnitario?: number
      densidade?: number
    }
  ): ConversionResult {
    // 1. Converter quantidade usada para gramas
    const gramsUsed = this.convertToGrams(
      quantity,
      unitUsed,
      product.pesoUnitario,
      product.densidade
    )

    // 2. Converter unidade de compra para gramas
    const gramsPerPackage = this.convertToGrams(
      product.purchaseQuantity,
      product.purchaseUnit,
      product.pesoUnitario,
      product.densidade
    )

    // 3. Calcular quantos pacotes foram usados
    const packagesUsed = gramsUsed / gramsPerPackage

    // 4. Calcular custo
    const cost = packagesUsed * product.unitPrice

    // 5. Verificar se é fracionado
    const isFractional = packagesUsed % 1 !== 0
    const fractionalAlert = isFractional
      ? `Usou ${packagesUsed.toFixed(3)} ${this.getUnitLabel(product.purchaseUnit)} de ${product.purchaseQuantity}${product.purchaseUnit}`
      : undefined

    return {
      gramsUsed,
      packagesUsed,
      cost,
      isFractional,
      fractionalAlert,
      formatted: {
        grams: `${gramsUsed.toFixed(0)}g`,
        packages: `${packagesUsed.toFixed(3)} ${this.getUnitLabel(product.purchaseUnit)}`,
        cost: `R$ ${cost.toFixed(2)}`,
      },
    }
  }

  static getUnitLabel(unit: UnitType): string {
    const labels: Record<UnitType, string> = {
      G: 'gramas',
      KG: 'quilos',
      MG: 'miligramas',
      L: 'litros',
      ML: 'mililitros',
      UN: 'unidades',
    }
    return labels[unit] || unit
  }

  static getUnitSymbol(unit: UnitType): string {
    return unit
  }
}
