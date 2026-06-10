// app/api/vendas/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    console.log('📥 Recebendo atualização para venda:', id)

    // Verificar se o ID foi fornecido
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID da venda é obrigatório' },
        { status: 400 }
      )
    }

    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error('❌ Erro ao parsear JSON:', parseError)
      return NextResponse.json(
        { success: false, error: 'JSON inválido' },
        { status: 400 }
      )
    }

    const { tipo_pagamento } = body

    if (!tipo_pagamento) {
      return NextResponse.json(
        { success: false, error: 'Tipo de pagamento é obrigatório' },
        { status: 400 }
      )
    }

    // Validar se o tipo de pagamento é válido
    const tiposValidos = ['DINHEIRO', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'PIX', 'VR', 'OUTRO', 'PENDENTE']
    if (!tiposValidos.includes(tipo_pagamento)) {
      return NextResponse.json(
        { success: false, error: 'Tipo de pagamento inválido' },
        { status: 400 }
      )
    }

    // Verificar se a venda existe
    const vendaExistente = await prisma.venda.findUnique({
      where: { id }
    })

    if (!vendaExistente) {
      return NextResponse.json(
        { success: false, error: 'Venda não encontrada' },
        { status: 404 }
      )
    }

    console.log('🔄 Atualizando venda:', {
      id,
      tipoPagamentoAntigo: vendaExistente.tipoPagamento,
      tipoPagamentoNovo: tipo_pagamento
    })

    // Atualizar a venda no banco de dados
    const vendaAtualizada = await prisma.venda.update({
      where: { id },
      data: {
        tipoPagamento: tipo_pagamento,
        updatedAt: new Date()
      }
    })

    console.log('✅ Venda atualizada com sucesso:', {
      id: vendaAtualizada.id,
      tipoPagamento: vendaAtualizada.tipoPagamento,
      nomeCliente: vendaAtualizada.nomeCliente,
      valorTotal: vendaAtualizada.valorTotal
    })

    return NextResponse.json({
      success: true,
      message: 'Venda atualizada com sucesso',
      data: {
        id: vendaAtualizada.id,
        tipoPagamento: vendaAtualizada.tipoPagamento,
        nomeCliente: vendaAtualizada.nomeCliente,
        valorTotal: vendaAtualizada.valorTotal,
        dataVenda: vendaAtualizada.dataVenda
      }
    }, { status: 200 })

  } catch (error: any) {
    console.error('❌ Erro ao atualizar venda:', error)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Venda não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor: ' + error.message },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const venda = await prisma.venda.findUnique({
      where: { id }
    })

    if (!venda) {
      return NextResponse.json(
        { success: false, error: 'Venda não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: venda
    })

  } catch (error: any) {
    console.error('❌ Erro ao buscar venda:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('🗑️ Recebendo solicitação de exclusão para venda:', id)

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID da venda é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se a venda existe
    const vendaExistente = await prisma.venda.findUnique({
      where: { id },
      include: {
        produtos: true
      }
    })

    if (!vendaExistente) {
      return NextResponse.json(
        { success: false, error: 'Venda não encontrada' },
        { status: 404 }
      )
    }

    console.log('🔄 Excluindo venda:', {
      id: vendaExistente.id,
      nomeCliente: vendaExistente.nomeCliente,
      valorTotal: vendaExistente.valorTotal,
      produtosCount: vendaExistente.produtos?.length || 0
    })

    // Excluir a venda
    await prisma.venda.delete({
      where: { id }
    })

    console.log('✅ Venda excluída com sucesso:', id)

    return NextResponse.json({
      success: true,
      message: 'Venda excluída com sucesso',
      data: {
        id: vendaExistente.id,
        nomeCliente: vendaExistente.nomeCliente,
        valorTotal: vendaExistente.valorTotal
      }
    }, { status: 200 })

  } catch (error: any) {
    console.error('❌ Erro ao excluir venda:', error)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Venda não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor: ' + error.message },
      { status: 500 }
    )
  }
}