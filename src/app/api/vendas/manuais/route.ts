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

    const vendasManuais = await prisma.vendaManual.findMany({
      where,
      orderBy: {
        dataVenda: 'desc'
      }
    })

    return NextResponse.json({ data: vendasManuais })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar vendas manuais' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { tipo_pagamento, valor, descricao, caixa_abertura_id } = await request.json()

    const vendaManual = await prisma.vendaManual.create({
      data: {
        tipoPagamento: tipo_pagamento,
        valor: parseFloat(valor),
        descricao: descricao || '',
        empresaId: session.user.empresaId || '',
        userId: session.user.id,
        caixaAberturaId: caixa_abertura_id
      }
    })

    return NextResponse.json({ data: vendaManual })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao criar venda manual' },
      { status: 500 }
    )
  }
}