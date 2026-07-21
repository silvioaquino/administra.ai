import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ProductNormalizationService } from '@/lib/services/product-normalization.service'
import { ConversionService } from '@/lib/services/conversion.service'

// POST /api/produtos/[id]/resync
// Força nova consulta à Open Food Facts (bypass de cache) e persiste o resultado.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params
    const produtoId = parseInt(id)

    const existing = await prisma.produto.findFirst({
      where: { id: produtoId, userId: session.user.id },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    }

    const normalized = await ProductNormalizationService.normalizarProduto(
      {
        descricao: existing.descricao,
        codigoBarras: existing.codigoBarras,
        unidade: existing.unidade || undefined,
      },
      { bypassCache: true }
    )

    // Deriva o peso unitário (gramas) a partir do peso de pacote da OFF.
    // Só sobrescreve quando a OFF retorna um peso válido, preservando
    // qualquer peso manual já cadastrado.
    const pesoUnitario = ConversionService.toGrams(
      normalized.quantidade ?? undefined,
      normalized.unidade,
    )

    const produto = await prisma.produto.update({
      where: { id: produtoId },
      data: {
        codigoBarras: normalized.codigoBarras || existing.codigoBarras,
        nomeNormalizado: normalized.nomeNormalizado,
        marca: normalized.marca,
        categoriaSugestao: normalized.categoria,
        unidadeMedida: normalized.unidade,
        fonteDados: normalized.fonteDados,
        precisaRevisao: normalized.precisaRevisao,
        normalizadoEm: normalized.normalizadoEm,
        ...(pesoUnitario !== null ? { pesoUnitario } : {}),
      },
    })

    return NextResponse.json({ success: true, data: produto })
  } catch (error) {
    console.error('Erro ao sincronizar produto:', error)
    return NextResponse.json({ error: 'Erro ao sincronizar produto' }, { status: 500 })
  }
}
