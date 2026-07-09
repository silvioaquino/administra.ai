import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Não autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const ano = parseInt(searchParams.get('ano') || new Date().getFullYear().toString())

  try {
    const dados = await prisma.planejamentoConfig.findFirst({
      where: {
        userId: session.user.id,
        empresaId: session.user.empresaId || 'sem-empresa',
        tipo: 'periodos-selecionados',
        anoReferencia: ano
      }
    })

    const periodos = dados?.dados as string[] || ['turnoUnico']

    return NextResponse.json({
      success: true,
      periodos
    })
  } catch (error) {
    console.error('Erro ao buscar períodos:', error)
    return NextResponse.json(
      { success: false, message: 'Erro ao buscar dados', periodos: ['turnoUnico'] },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { ano, periodos } = await request.json()
    const empresaId = session.user.empresaId || 'sem-empresa'

    await prisma.planejamentoConfig.upsert({
      where: {
        empresaId_userId_tipo_anoReferencia: {
          empresaId,
          userId: session.user.id,
          tipo: 'periodos-selecionados',
          anoReferencia: ano
        }
      },
      create: {
        userId: session.user.id,
        empresaId,
        tipo: 'periodos-selecionados',
        anoReferencia: ano,
        dados: periodos
      },
      update: {
        dados: periodos
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao salvar períodos:', error)
    return NextResponse.json(
      { success: false, message: 'Erro ao salvar dados' },
      { status: 500 }
    )
  }
}