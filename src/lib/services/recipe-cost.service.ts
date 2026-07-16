// src/lib/services/recipe-cost.service.ts
import { prisma } from '@/lib/prisma'
import { ConversionService } from '@/lib/services/conversion.service'
import { ItemCalculation, UnitType } from '@/types/ficha-tecnica'

/**
 * Calcula o custo de uma ficha técnica convertendo unidades de medida,
 * persiste os totais e o consumo de cada item, e retorna o detalhamento.
 */
export async function calculateRecipeCost(fichaId: string) {
  try {
    const ficha = await prisma.fichaTecnica.findUnique({
      where: { id: fichaId },
      include: {
        fichaItems: {
          include: {
            produto: true,
          },
        },
      },
    })

    if (!ficha) {
      return { success: false, error: 'Ficha não encontrada' }
    }

    const calculations: ItemCalculation[] = ficha.fichaItems.map((item) => {
      const product = item.produto

      const result = ConversionService.calculateConsumption(
        item.quantidade,
        (item.unidade as UnitType) || 'UN',
        {
          purchaseUnit: (product.unidade as UnitType) || 'UN',
          unitPrice: Number(product.valorUnitario) || 0,
          pesoUnitario: product.pesoUnitario ? Number(product.pesoUnitario) : undefined,
          densidade: product.densidade ? Number(product.densidade) : undefined,
        }
      )

      return {
        itemId: item.id,
        productId: product.id,
        productName: product.descricao,
        quantity: item.quantidade,
        unitUsed: (item.unidade as UnitType) || 'UN',
        purchaseUnit: (product.unidade as UnitType) || 'UN',
        unitPrice: Number(product.valorUnitario) || 0,
        ...result,
      }
    })

    const totalCost = calculations.reduce((sum, item) => sum + item.cost, 0)
    const costPerPortion = totalCost / (ficha.rendimentoPorcoes || 1)

    await prisma.fichaTecnica.update({
      where: { id: fichaId },
      data: {
        custoTotal: totalCost,
        custoPorPorcao: costPerPortion,
        fichaItems: {
          update: calculations.map((calc) => ({
            where: { id: calc.itemId },
            data: {
              custo: calc.cost,
              gramasEquivalentes: calc.gramsUsed,
            },
          })),
        },
      },
    })

    return {
      success: true,
      data: {
        items: calculations,
        totalCost,
        costPerPortion,
        rendimento: ficha.rendimentoPorcoes,
      },
    }
  } catch (error) {
    console.error('Erro ao calcular custo:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao calcular custo',
    }
  }
}
