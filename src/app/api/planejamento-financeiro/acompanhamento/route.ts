import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Buscar dados de acompanhamento
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Não autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const ano = parseInt(searchParams.get('ano') || new Date().getFullYear().toString())
  const mes = parseInt(searchParams.get('mes') || (new Date().getMonth() + 1).toString())

  try {
    const dados = await prisma.planejamentoAcompanhamentoNovo.findMany({
      where: {
        userId: session.user.id,
        empresaId: session.user.empresaId || 'sem-empresa',
        ano,
        mes
      }
    })

    return NextResponse.json({
      success: true,
      dados: dados
    })
  } catch (error) {
    console.error('Erro ao buscar acompanhamento:', error)
    return NextResponse.json(
      { success: false, message: 'Erro ao buscar dados' },
      { status: 500 }
    )
  }
}

// POST - Salvar dados de acompanhamento
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { ano, mes, dados } = await request.json()
    const empresaId = session.user.empresaId || 'sem-empresa'

    const resultado = await prisma.planejamentoAcompanhamentoNovo.upsert({
      where: {
        empresaId_userId_ano_mes: {
          empresaId,
          userId: session.user.id,
          ano,
          mes
        }
      },
      update: {
        faturamentoAlmoco: dados.faturamentoAlmoco || 0,
        faturamentoJanta: dados.faturamentoJanta || 0,
        faturamentoTotal: dados.faturamentoTotal || 0,
        observacao: dados.observacao
      },
      create: {
        empresaId,
        userId: session.user.id,
        ano,
        mes,
        faturamentoAlmoco: dados.faturamentoAlmoco || 0,
        faturamentoJanta: dados.faturamentoJanta || 0,
        faturamentoTotal: dados.faturamentoTotal || 0,
        observacao: dados.observacao
      }
    })

    return NextResponse.json({ success: true, message: 'Dados salvos com sucesso', dados: resultado })
  } catch (error) {
    console.error('Erro ao salvar acompanhamento:', error)
    return NextResponse.json(
      { success: false, message: 'Erro ao salvar dados' },
      { status: 500 }
    )
  }
}