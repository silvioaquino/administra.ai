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
    const dados = await prisma.planejamentoFaturamentoNovo.findMany({
      where: {
        userId: session.user.id,
        empresaId: session.user.empresaId || 'sem-empresa',
        ano
      },
      orderBy: { mes: 'asc' }
    })

    return NextResponse.json({
      success: true,
      dados: dados.map(d => ({
        mes: d.mes,
        metaDiaria: Number(d.metaDiaria),
        diasTrabalhados: d.diasTrabalhados,
        metaTotal: Number(d.metaTotal) || (Number(d.metaDiaria) * d.diasTrabalhados),
        periodos: d.periodos || { turnoUnico: Number(d.metaDiaria) }
      }))
    })
  } catch (error) {
    console.error('Erro ao buscar faturamento:', error)
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
    const { ano, meses } = await request.json()
    const empresaId = session.user.empresaId || 'sem-empresa'

    // Deletar existentes
    await prisma.planejamentoFaturamentoNovo.deleteMany({
      where: {
        userId: session.user.id,
        empresaId,
        ano
      }
    })

    // Criar novos registros
    const createPromises = meses.map((m: any) => {
      // Se tem periodos, usa eles; senão calcula do metaDiaria
      let periodos = m.periodos
      let metaDiaria = m.metaDiaria || 0

      if (!periodos) {
        periodos = { turnoUnico: metaDiaria }
      } else {
        // Recalcular metaDiaria baseado nos periodos para compatibilidade
        const p = m.periodos
        const temTurnoUnico = (p.turnoUnico ?? 0) > 0
        const temRefeicoes = (p.cafe ?? 0) > 0 || (p.almoco ?? 0) > 0 || (p.janta ?? 0) > 0
        if (temTurnoUnico && !temRefeicoes) {
          metaDiaria = p.turnoUnico || 0
        } else {
          metaDiaria = (p.cafe || 0) + (p.almoco || 0) + (p.janta || 0)
        }
      }

      return prisma.planejamentoFaturamentoNovo.create({
        data: {
          empresaId,
          userId: session.user.id,
          ano,
          mes: m.mes,
          metaDiaria,
          diasTrabalhados: m.diasTrabalhados || 26,
          metaTotal: (metaDiaria || 0) * (m.diasTrabalhados || 26),
          periodos: periodos as any
        }
      })
    })

    await Promise.all(createPromises)

    return NextResponse.json({ success: true, message: 'Dados salvos com sucesso' })
  } catch (error) {
    console.error('Erro ao salvar faturamento:', error)
    return NextResponse.json(
      { success: false, message: 'Erro ao salvar dados' },
      { status: 500 }
    )
  }
}