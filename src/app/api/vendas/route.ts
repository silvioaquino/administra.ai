import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const caixaId = searchParams.get('caixaId')

    let where = {}
    if (caixaId) {
      where = { caixaAberturaId: caixaId }
    }

    const vendas = await prisma.venda.findMany({
      where,
      include: {
        caixaAbertura: true
      },
      orderBy: {
        dataVenda: 'desc'
      }
    })

    return NextResponse.json({ data: vendas })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar vendas' },
      { status: 500 }
    )
  }
}