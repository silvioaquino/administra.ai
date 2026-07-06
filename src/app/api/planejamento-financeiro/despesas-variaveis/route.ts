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
  const mes = searchParams.get('mes') ? parseInt(searchParams.get('mes')!) : undefined

  try {
    const whereClause: any = {
      userId: session.user.id,
      empresaId: session.user.empresaId || 'sem-empresa',
      ano
    }

    if (mes !== undefined) {
      whereClause.mes = mes
    }

    const dados = await prisma.planejamentoDespesaVariavelNovo.findMany({
      where: whereClause
    })

    return NextResponse.json({
      success: true,
      dados: dados.length > 0 ? dados[0] : null
    })
  } catch (error) {
    console.error('Erro ao buscar despesas variáveis:', error)
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
    const { ano, mes, percentualTotal, faturamentoBase, impactoMensal, config, resultados } = await request.json()
    const empresaId = session.user.empresaId || 'sem-empresa'

    const dados = await prisma.planejamentoDespesaVariavelNovo.upsert({
      where: {
        empresaId_userId_ano_mes: {
          empresaId,
          userId: session.user.id,
          ano,
          mes: mes ?? 0
        }
      },
      update: {
        percentualTotal,
        faturamentoBase,
        impactoMensal,
        config,
        resultados
      },
      create: {
        empresaId,
        userId: session.user.id,
        ano,
        mes: mes ?? 0,
        percentualTotal,
        faturamentoBase,
        impactoMensal,
        config: config || {},
        resultados: resultados || {}
      }
    })

    return NextResponse.json({ success: true, message: 'Dados salvos com sucesso', dados })
  } catch (error) {
    console.error('Erro ao salvar despesas variáveis:', error)
    return NextResponse.json(
      { success: false, message: 'Erro ao salvar dados' },
      { status: 500 }
    )
  }
}