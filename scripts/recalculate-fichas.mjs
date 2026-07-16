// scripts/recalculate-fichas.mjs
// Recálculo em massa do custo das fichas técnicas já salvas.
// Reutiliza a mesma lógica de ConversionService.calculateConsumption:
//   custo = (gramasUsadas / gramasDe1Unidade) * valorUnitario (custo)
// Atualiza fichas_tecnicas.custo_total / custo_por_porcao e
// ficha_itens.custo / gramas_equivalentes.
//
// Uso: node scripts/recalculate-fichas.mjs

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const CONVERSION_TO_GRAMS = { G: 1, KG: 1000, MG: 0.001, L: 1000, ML: 1, UN: null }
const COUNTABLE_UNITS = new Set(['UN', 'PC', 'PCT', 'CX', 'PT', 'DZ', 'UND'])

function convertToGrams(value, unit, pesoUnitario, densidade) {
  if (!value || value <= 0) throw new Error('Quantidade deve ser maior que zero')
  const u = (unit || '').toUpperCase()
  if (COUNTABLE_UNITS.has(u)) {
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

function toNumber(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

async function recalcFicha(ficha) {
  const calculations = ficha.fichaItems.map((item) => {
    const product = item.produto
    const pesoUnitario = product.pesoUnitario != null ? toNumber(product.pesoUnitario) : undefined
    const densidade = product.densidade != null ? toNumber(product.densidade) : undefined
    const unitPrice = toNumber(product.valorUnitario)

    const gramsUsed = convertToGrams(
      toNumber(item.quantidade),
      item.unidade,
      pesoUnitario,
      densidade
    )
    const gramsPerUnit = convertToGrams(1, product.unidade, pesoUnitario, densidade)
    const unitsUsed = gramsUsed / gramsPerUnit
    const cost = unitsUsed * unitPrice

    return { itemId: item.id, cost, gramsUsed }
  })

  const totalCost = calculations.reduce((sum, c) => sum + c.cost, 0)
  const costPerPortion = totalCost / (ficha.rendimentoPorcoes || 1)

  await prisma.fichaTecnica.update({
    where: { id: ficha.id },
    data: {
      custoTotal: totalCost,
      custoPorPorcao: costPerPortion,
      fichaItems: {
        update: calculations.map((c) => ({
          where: { id: c.itemId },
          data: { custo: c.cost, gramasEquivalentes: c.gramsUsed },
        })),
      },
    },
  })

  return { totalCost, costPerPortion }
}

async function main() {
  const fichas = await prisma.fichaTecnica.findMany({
    include: {
      fichaItems: { include: { produto: true } },
    },
  })

  console.log(`Encontradas ${fichas.length} fichas técnicas. Recalculando...\n`)

  let ok = 0
  let falhas = 0

  for (const ficha of fichas) {
    try {
      const { totalCost, costPerPortion } = await recalcFicha(ficha)
      ok++
      console.log(
        `✓ [${ficha.id}] ${ficha.nome} — custoTotal: R$ ${totalCost.toFixed(2)} | porção: R$ ${costPerPortion.toFixed(2)}`
      )
    } catch (error) {
      falhas++
      console.error(`✗ [${ficha.id}] ${ficha.nome} — ERRO: ${error.message}`)
    }
  }

  console.log(`\nConcluído. ${ok} fichas recalculadas, ${falhas} falharam.`)
}

main()
  .catch((e) => {
    console.error('Erro fatal:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
