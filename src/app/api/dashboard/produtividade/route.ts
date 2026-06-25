import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const empresaId = session.user.empresaId
  if (!empresaId) {
    return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const ano = parseInt(searchParams.get('ano') || new Date().getFullYear().toString())
  const mes = parseInt(searchParams.get('mes') || (new Date().getMonth() + 1).toString())

  try {
    // Calcular faturamento total do mês
    const faturamentoResult = await prisma.livroDiario.aggregate({
      where: {
        empresaId,
        data: {
          gte: new Date(ano, mes - 1, 1),
          lte: new Date(ano, mes, 0)
        },
        tipo: { in: ['VENDA', 'RECEITA'] }
      },
      _sum: {
        entrada: true
      }
    })

    const faturamento = Number(faturamentoResult._sum.entrada || 0)

    // Calcular custos variáveis do mês (despesas variáveis + CMV das compras)
    const despesasVariaveisResult = await prisma.livroDiario.aggregate({
      where: {
        empresaId,
        data: {
          gte: new Date(ano, mes - 1, 1),
          lte: new Date(ano, mes, 0)
        },
        tipo: { in: ['COMPRA', 'DESPESA'] }
      },
      _sum: {
        saida: true
      }
    })

    const custosVariaveis = Number(despesasVariaveisResult._sum.saida || 0)

    // Contar funcionários ativos
    const funcionariosCount = await prisma.funcionario.count({
      where: { empresaId }
    })

    // Calcular produtividade
    const produtividade = funcionariosCount > 0
      ? (faturamento - custosVariaveis) / funcionariosCount
      : 0

    return NextResponse.json({
      success: true,
      data: {
        ano,
        mes,
        faturamento,
        custosVariaveis,
        funcionarios: funcionariosCount,
        produtividade
      }
    })

  } catch (error) {
    console.error('Erro ao calcular produtividade:', error)
    return NextResponse.json(
      { error: 'Erro ao calcular produtividade' },
      { status: 500 }
    )
  }
}