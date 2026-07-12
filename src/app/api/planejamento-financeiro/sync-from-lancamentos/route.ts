import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Sincronizar dados do livro diário com o planejamento
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Não autorizado' }, { status: 401 })
  }

  const { ano, mes } = await request.json()
  const empresaId = session.user.empresaId || 'sem-empresa'

  if (!ano || !mes) {
    return NextResponse.json({ success: false, message: 'Ano e mês são obrigatórios' }, { status: 400 })
  }

  try {
    // Buscar lançamentos do livro diário para o mês
    const lancamentos = await prisma.livroDiario.findMany({
      where: {
        userId: session.user.id,
        empresaId,
        data: {
          gte: new Date(ano, mes - 1, 1),
          lt: new Date(ano, mes, 1)
        }
      }
    })

    // Calcular totais
    const entradas = lancamentos
      .filter(l => Number(l.entrada) > 0)
      .reduce((sum, l) => sum + Number(l.entrada), 0)

    const saidas = lancamentos
      .filter(l => Number(l.saida) > 0)
      .reduce((sum, l) => sum + Number(l.saida), 0)

    const faturamentoTotal = entradas

    // Buscar despesas fixas do mês
    const despesasFixas = await prisma.despesaFixa.findMany({
      where: {
        userId: session.user.id,
        empresaId,
        vencimento: {
          gte: new Date(ano, mes - 1, 1),
          lt: new Date(ano, mes, 1)
        }
      }
    })

    const totalDespesasFixas = despesasFixas.reduce((sum, d) => sum + Number(d.valor), 0)

    // Atualizar ou criar registro de acompanhamento
    const acompanhamento = await prisma.planejamentoAcompanhamentoNovo.upsert({
      where: {
        empresaId_userId_ano_mes: {
          empresaId,
          userId: session.user.id,
          ano,
          mes
        }
      },
      update: {
        faturamentoTotal,
        observacao: 'Sincronizado do livro diário'
      },
      create: {
        empresaId,
        userId: session.user.id,
        ano,
        mes,
        faturamentoTotal,
        observacao: 'Sincronizado do livro diário'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Dados sincronizados com sucesso',
      dados: {
        faturamentoTotal,
        totalDespesasFixas,
        quantidadeLancamentos: lancamentos.length
      }
    })
  } catch (error) {
    console.error('Erro ao sincronizar dados:', error)
    return NextResponse.json(
      { success: false, message: 'Erro ao sincronizar dados' },
      { status: 500 }
    )
  }
}