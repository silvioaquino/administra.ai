import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizationMetrics } from '@/lib/monitoring/normalization-metrics'

// PATCH /api/produtos/[id]/normalizacao
// Correção manual: define fonte MANUAL, zera precisaRevisao e persiste os campos normalizados.
export async function PATCH(
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
    const body = await request.json()

    const existing = await prisma.produto.findFirst({
      where: { id: produtoId, userId: session.user.id },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    }

    const data: Record<string, unknown> = {
      fonteDados: 'MANUAL',
      precisaRevisao: false,
      normalizadoEm: new Date(),
    }
    if (typeof body.nomeNormalizado === 'string' && body.nomeNormalizado.trim()) {
      data.nomeNormalizado = body.nomeNormalizado.trim()
    }
    if (typeof body.marca === 'string') data.marca = body.marca.trim() || null
    if (typeof body.categoriaSugestao === 'string') {
      data.categoriaSugestao = body.categoriaSugestao.trim() || null
    }
    if (typeof body.unidadeMedida === 'string') {
      data.unidadeMedida = body.unidadeMedida.trim() || null
    }
    if (body.pesoUnitario !== undefined) {
      const peso = body.pesoUnitario === null || body.pesoUnitario === ''
        ? null
        : Number(body.pesoUnitario)
      data.pesoUnitario = peso !== null && Number.isFinite(peso) && peso > 0 ? peso : null
    }

    const produto = await prisma.produto.update({ where: { id: produtoId }, data })
    normalizationMetrics.recordManualCorrection()

    return NextResponse.json({ success: true, data: produto })
  } catch (error) {
    console.error('Erro ao corrigir normalização:', error)
    return NextResponse.json({ error: 'Erro ao corrigir produto' }, { status: 500 })
  }
}
