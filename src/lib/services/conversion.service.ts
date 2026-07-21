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
  // Unidades contáveis (peça, caixa, pacote, dúzia): equivalem a UN,
  // exigem peso unitário para conversão em gramas.
  private static readonly COUNTABLE_UNITS = new Set<string>([
    'UN', 'PC', 'PCT', 'CX', 'PT', 'DZ', 'UND',
  ])

  static convertToGrams(
    value: number,
    unit: UnitType,
    pesoUnitario?: number,
    densidade?: number
  ): number {
    if (value <= 0) throw new Error('Quantidade deve ser maior que zero')

    // Normaliza o caso (ex.: "un"/"Un" da NFe) para bater com os mapas.
    const u = (unit || '').toUpperCase() as UnitType

    if (this.COUNTABLE_UNITS.has(u)) {
      if (!pesoUnitario || pesoUnitario <= 0) {
        throw new Error(`Produto em ${u} precisa ter peso unitário definido`)
      }
      return value * pesoUnitario
    }

    if (u === 'L' || u === 'ML') {
      const factor = CONVERSION_TO_GRAMS[u] || 1
      const density = densidade || 1
      return value * factor * density
    }

    const factor = CONVERSION_TO_GRAMS[u]
    if (factor === null || factor === undefined) {
      throw new Error(`Unidade ${u} não suportada`)
    }
    return value * factor
  }

  /**
   * Converte uma quantidade+unidade (ex.: 400 "G", 1 "KG") para gramas.
   * Usado para derivar o pesoUnitario a partir do peso de pacote da Open Food Facts.
   * Retorna null se a unidade não for massa/volume convertível.
   */
  static toGrams(
    value: number | null | undefined,
    unit: string | null | undefined,
    densidade = 1,
  ): number | null {
    if (!value || value <= 0) return null
    const normalized = (unit || '').toUpperCase() as UnitType
    const factor = CONVERSION_TO_GRAMS[normalized]
    if (factor === null || factor === undefined) return null
    return value * factor * densidade
  }

  /**
   * Calcula o consumo (em gramas e custo) de um item da ficha.
   *
   * O modelo de dados do produto NÃO possui um campo de "tamanho de embalagem":
   * a embalagem é sempre 1 unidade de compra (1 KG, 1 G, 1 UN...). Portanto o
   * custo é o preço de 1 unidade de compra (unitPrice = valorUnitario do produto)
   * dividido pelos gramas de 1 unidade.
   */
  static calculateConsumption(
    quantity: number,
    unitUsed: UnitType,
    product: {
      purchaseUnit: UnitType
      unitPrice: number
      pesoUnitario?: number
      densidade?: number
      // Fator de correção (peso bruto ÷ peso líquido). >= 1. Default 1 = sem perda.
      fatorCorrecao?: number
    }
  ): ConversionResult {
    // 1. Quantidade usada na receita -> gramas
    const gramsUsed = this.convertToGrams(
      quantity,
      unitUsed,
      product.pesoUnitario,
      product.densidade
    )

    // 2. Gramas de 1 unidade de compra (embalagem = 1 unidade)
    const gramsPerUnit = this.convertToGrams(
      1,
      product.purchaseUnit,
      product.pesoUnitario,
      product.densidade
    )

    // 3. Quantas unidades de compra foram usadas
    const unitsUsed = gramsUsed / gramsPerUnit

    // 4. Custo sem correção = unidades usadas × custo de 1 unidade (valorUnitario)
    const costWithoutCorrection = unitsUsed * product.unitPrice

    // 5. Aplicar fator de correção: para usar a qtd líquida foi preciso comprar
    //    (qtd × FC) de peso bruto, então o custo real sobe proporcionalmente.
    const fatorCorrecao = product.fatorCorrecao && product.fatorCorrecao > 0
      ? product.fatorCorrecao
      : 1
    const cost = costWithoutCorrection * fatorCorrecao
    const perdaValor = cost - costWithoutCorrection

    // 6. Verificar se é fracionado
    const isFractional = unitsUsed % 1 !== 0
    const fractionalAlert = isFractional
      ? `Usou ${unitsUsed.toFixed(3)} ${this.getUnitLabel(product.purchaseUnit)} de ${product.purchaseUnit}`
      : undefined

    return {
      gramsUsed,
      packagesUsed: unitsUsed,
      cost,
      costWithoutCorrection,
      fatorCorrecao,
      perdaValor,
      isFractional,
      fractionalAlert,
      formatted: {
        grams: `${gramsUsed.toFixed(0)}g`,
        packages: `${unitsUsed.toFixed(3)} ${this.getUnitLabel(product.purchaseUnit)}`,
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
