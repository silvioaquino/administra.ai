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

    const dados = await prisma.planejamentoDespesaFixaNovo.findMany({
      where: whereClause,
      orderBy: { nome: 'asc' }
    })

    // Buscar percentual do período salvo
    const percentualConfig = await prisma.planejamentoConfig.findFirst({
      where: {
        userId: session.user.id,
        empresaId: session.user.empresaId || 'sem-empresa',
        tipo: 'percentual-periodo',
        anoReferencia: ano
      }
    })

    const percentualPeriodo = (percentualConfig?.dados as any)?.percentualPeriodo ?? null

    return NextResponse.json({
      success: true,
      dados: dados.map(d => ({
        ...d,
        valor: Number(d.valor)
      })),
      percentualPeriodo
    })
  } catch (error) {
    console.error('Erro ao buscar despesas fixas:', error)
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
    const { ano, mes, despesas, percentualPeriodo } = await request.json()
    const empresaId = session.user.empresaId || 'sem-empresa'

    // Deletar existentes
    await prisma.planejamentoDespesaFixaNovo.deleteMany({
      where: {
        userId: session.user.id,
        empresaId,
        ano,
        ...(mes !== undefined && { mes })
      }
    })

    // Criar novas despesas
    if (despesas && despesas.length > 0) {
      await prisma.planejamentoDespesaFixaNovo.createMany({
        data: despesas.map((d: any) => ({
          empresaId,
          userId: session.user.id,
          ano,
          mes: mes,
          nome: d.nome,
          valor: d.valor || 0,
          status: d.status || 'PENDENTE',
          dataVencimento: d.dataVencimento ? new Date(d.dataVencimento) : null,
          dataPagamento: d.dataPagamento ? new Date(d.dataPagamento) : null,
          contaFinanceira: d.contaFinanceira
        }))
      })
    }

    // Salvar percentual do período na configuração
    if (percentualPeriodo !== undefined && percentualPeriodo !== null) {
      await prisma.planejamentoConfig.upsert({
        where: {
          empresaId_userId_tipo_anoReferencia: {
            empresaId,
            userId: session.user.id,
            tipo: 'percentual-periodo',
            anoReferencia: ano
          }
        },
        update: {
          dados: { percentualPeriodo }
        },
        create: {
          empresaId,
          userId: session.user.id,
          tipo: 'percentual-periodo',
          anoReferencia: ano,
          dados: { percentualPeriodo }
        }
      })
    }

    return NextResponse.json({ success: true, message: 'Dados salvos com sucesso' })
  } catch (error) {
    console.error('Erro ao salvar despesas fixas:', error)
    return NextResponse.json(
      { success: false, message: 'Erro ao salvar dados' },
      { status: 500 }
    )
  }
}