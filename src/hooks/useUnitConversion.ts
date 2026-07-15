// src/hooks/useUnitConversion.ts
import { useCallback } from 'react'
import { ConversionService } from '@/lib/services/conversion.service'
import { ConversionResult, UnitType } from '@/types/ficha-tecnica'

interface ProductInput {
  purchaseUnit: UnitType
  purchaseQuantity: number
  unitPrice: number
  pesoUnitario?: number
  densidade?: number
}

/**
 * Hook cliente para calcular a conversão de um ingrediente para gramas/custo,
 * reutilizando o ConversionService.
 */
export function useUnitConversion() {
  const calculate = useCallback(
    (quantity: number, unitUsed: UnitType, product: ProductInput): ConversionResult => {
      return ConversionService.calculateConsumption(quantity, unitUsed, product)
    },
    []
  )

  return { calculate }
}
