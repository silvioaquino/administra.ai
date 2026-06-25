import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentEmpresaId } from '@/lib/prisma-middleware'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const empresaId = session.user.empresaId
    if (!empresaId) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 401 })
    }

    const { caixa_abertura_id, observacoes } = await request.json()

    const caixa = await prisma.caixaAbertura.findUnique({
      where: { id: caixa_abertura_id, empresaId },
      include: {
        vendas: true,
        retiradas: true,
        vendasManuais: true
      }
    })

    if (!caixa) {
      return NextResponse.json(
        { error: 'Caixa não encontrado' },
        { status: 404 }
      )
    }

    const totalVendas = caixa.vendas.reduce((sum, venda) => sum + venda.valorTotal, 0)
    const totalRetiradas = caixa.retiradas.reduce((sum, retirada) => sum + retirada.valor, 0)
    const saldoFinal = caixa.valorInicial + totalVendas - totalRetiradas

    const fechamento = await prisma.caixaFechamento.create({
      data: {
        empresaId,
        userId: session.user.id,
        valorAbertura: caixa.valorInicial,
        totalVendas,
        retiradas: totalRetiradas,
        saldoFinal,
        observacoes,
        caixaAberturaId: caixa.id
      }
    })

    await prisma.caixaAbertura.update({
      where: { id: caixa.id },
      data: { status: 'FECHADO' }
    })

    return NextResponse.json({ data: fechamento })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao fechar caixa' },
      { status: 500 }
    )
  }
}