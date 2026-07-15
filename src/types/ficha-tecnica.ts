// src/types/ficha-tecnica.ts
export type UnitType = 'G' | 'KG' | 'MG' | 'L' | 'ML' | 'UN'

export interface ConversionResult {
  gramsUsed: number
  packagesUsed: number
  cost: number
  isFractional: boolean
  fractionalAlert?: string
  formatted: {
    grams: string
    packages: string
    cost: string
  }
}

export interface ItemCalculation extends ConversionResult {
  itemId: string
  productId: number
  productName: string
  quantity: number
  unitUsed: UnitType
  purchaseUnit: UnitType
  purchaseQuantity: number
  unitPrice: number
}
