import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/produtos/revisao
// Lista produtos que precisam de correção manual (precisaRevisao = true).
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)
  const skip = parseInt(searchParams.get('skip') || '0')
  const search = searchParams.get('search') || ''

  try {
    const where = {
      userId: session.user.id,
      precisaRevisao: true,
      ...(search && {
        OR: [
          { descricao: { contains: search, mode: 'insensitive' as const } },
          { nomeNormalizado: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    }

    const [produtos, total] = await Promise.all([
      prisma.produto.findMany({ where, orderBy: { createdAt: 'desc' }, take: limit, skip }),
      prisma.produto.count({ where }),
    ])

    const data = produtos.map((p) => ({
      id: p.id,
      descricao: p.descricao,
      nomeNormalizado: p.nomeNormalizado,
      marca: p.marca,
      categoriaSugestao: p.categoriaSugestao,
      codigoBarras: p.codigoBarras,
      fonteDados: p.fonteDados,
      precisaRevisao: p.precisaRevisao,
      createdAt: p.createdAt,
    }))

    return NextResponse.json({ success: true, data, total, limit, skip })
  } catch (error) {
    console.error('Erro ao listar produtos para revisão:', error)
    return NextResponse.json({ error: 'Erro ao listar produtos' }, { status: 500 })
  }
}
