// src/app/api/vendas/[id]/maquininha/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatarTipoPagamento } from '@/lib/utils'

const CONTA_POR_TIPO: Record<string, 'contaCreditoId' | 'contaDebitoId' | 'contaPixId'> = {
  CARTAO_CREDITO: 'contaCreditoId',
  CARTAO_DEBITO: 'contaDebitoId',
  PIX: 'contaPixId',
  VR: 'contaCreditoId'
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const empresaId = session.user.empresaId
  if (!empresaId) {
    return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const maquininhaId: string | null = body?.maquininha_id || null

    const venda = await prisma.venda.findFirst({ where: { id, empresaId } })
    if (!venda) {
      return NextResponse.json({ error: 'Venda não encontrada' }, { status: 404 })
    }

    // Remove lançamentos antigos vinculados a esta venda (reatribuição)
    await prisma.livroDiario.deleteMany({ where: { empresaId, vendaId: venda.id } })

    if (!maquininhaId) {
      const atualizada = await prisma.venda.update({
        where: { id: venda.id },
        data: { maquininhaId: null, contaFinanceiraId: null }
      })
      return NextResponse.json({ success: true, data: atualizada })
    }

    const maquininha = await prisma.maquininha.findFirst({
      where: { id: maquininhaId, empresaId },
      include: {
        contaCredito: { select: { id: true, nome: true } },
        contaDebito: { select: { id: true, nome: true } },
        contaPix: { select: { id: true, nome: true } }
      }
    })

    if (!maquininha) {
      return NextResponse.json({ error: 'Maquininha não encontrada' }, { status: 404 })
    }

    const campo = CONTA_POR_TIPO[venda.tipoPagamento]
    if (!campo) {
      return NextResponse.json(
        { error: 'Maquininha só pode ser vinculada a vendas em crédito, débito ou Pix' },
        { status: 400 }
      )
    }

    const conta =
      campo === 'contaCreditoId'
        ? maquininha.contaCredito
        : campo === 'contaDebitoId'
          ? maquininha.contaDebito
          : maquininha.contaPix

    if (!conta) {
      return NextResponse.json(
        {
          error: `A maquininha "${maquininha.nome}" não tem conta configurada para ${formatarTipoPagamento(
            venda.tipoPagamento
          )}`
        },
        { status: 400 }
      )
    }

    const [atualizada] = await prisma.$transaction([
      prisma.venda.update({
        where: { id: venda.id },
        data: { maquininhaId: maquininha.id, contaFinanceiraId: conta.id }
      }),
      prisma.livroDiario.create({
        data: {
          empresaId,
          userId: session.user.id,
          data: venda.dataVenda,
          conta: 'Vendas',
          descricao: `Venda ${formatarTipoPagamento(venda.tipoPagamento)} - ${maquininha.nome}`,
          clienteFornecedor: venda.nomeCliente || null,
          entrada: venda.valorTotal,
          saida: 0,
          tipo: 'VENDA',
          origemDestino: conta.nome,
          status: 'PAGO',
          dataPagamento: venda.dataVenda,
          vendaId: venda.id
        }
      })
    ])

    return NextResponse.json({
      success: true,
      data: atualizada,
      conta: { id: conta.id, nome: conta.nome }
    })
  } catch (error) {
    console.error('Erro ao vincular maquininha:', error)
    return NextResponse.json({ error: 'Erro ao vincular maquininha à venda' }, { status: 500 })
  }
}
