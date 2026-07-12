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
        tipo: 'percentuais-periodos',
        anoReferencia: ano
      }
    })

    const percentuais = (dados?.dados as any) || {
      cafe: 0,
      almoco: 73,
      janta: 27,
      turnoUnico: 100
    }

    return NextResponse.json({
      success: true,
      percentuais
    })
  } catch (error) {
    console.error('Erro ao buscar percentuais:', error)
    return NextResponse.json(
      { success: false, message: 'Erro ao buscar dados' },
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
    const { ano, percentuais } = await request.json()
    const empresaId = session.user.empresaId || 'sem-empresa'

    await prisma.planejamentoConfig.upsert({
      where: {
        empresaId_userId_tipo_anoReferencia: {
          empresaId,
          userId: session.user.id,
          tipo: 'percentuais-periodos',
          anoReferencia: ano
        }
      },
      update: {
        dados: percentuais
      },
      create: {
        userId: session.user.id,
        empresaId,
        tipo: 'percentuais-periodos',
        anoReferencia: ano,
        dados: percentuais
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao salvar percentuais:', error)
    return NextResponse.json(
      { success: false, message: 'Erro ao salvar dados' },
      { status: 500 }
    )
  }
}