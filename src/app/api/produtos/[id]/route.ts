import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Obter produto específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const { id } = await params
    const produto = await prisma.produto.findFirst({
      where: {
        id: parseInt(id),
        userId: session.user.id
      }
    })

    if (!produto) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
    }

    const produtoResponse = {
      id: produto.id,
      descricao: produto.descricao,
      unidade: produto.unidade,
      preco_venda: produto.precoVenda ? Number(produto.precoVenda) : 0,
      quantidade: produto.quantidade ? Number(produto.quantidade) : 0,
      fornecedor: produto.fornecedor,
      data_compra: produto.dataCompra ? produto.dataCompra.toISOString().split("T")[0] : null,
      codigo: produto.codigo,
      valor_unitario: produto.valorUnitario ? Number(produto.valorUnitario) : 0,
      valor_total: produto.valorTotal ? Number(produto.valorTotal) : 0,
    }

    return NextResponse.json({ success: true, data: produtoResponse })
  } catch (error) {
    console.error("Erro ao buscar produto:", error)
    return NextResponse.json(
      { error: "Erro ao buscar produto" },
      { status: 500 }
    )
  }
}

// PUT - Atualizar produto
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()

    const existingProduto = await prisma.produto.findFirst({
      where: {
        id: parseInt(id),
        userId: session.user.id
      }
    })

    if (!existingProduto) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
    }

    const quantidade = body.quantidade !== undefined ? Number(body.quantidade) : Number(existingProduto.quantidade)
    const precoVenda = body.preco_venda !== undefined ? Number(body.preco_venda) : Number(existingProduto.precoVenda)
    const valorUnitario = body.valor_unitario !== undefined ? Number(body.valor_unitario) : Number(existingProduto.valorUnitario)
    const valorTotal = body.valor_total !== undefined ? Number(body.valor_total) : (quantidade * precoVenda)

    // Corrigir data para não usar UTC
    let dataCompraDate: Date | undefined
    if (body.data_compra) {
      const [year, month, day] = body.data_compra.split('-').map(Number)
      dataCompraDate = new Date(year, month - 1, day)
    }

    const produto = await prisma.produto.update({
      where: { id: parseInt(id) },
      data: {
        descricao: body.descricao !== undefined ? body.descricao : existingProduto.descricao,
        unidade: body.unidade !== undefined ? body.unidade : existingProduto.unidade,
        precoVenda: precoVenda,
        quantidade: quantidade,
        fornecedor: body.fornecedor !== undefined ? body.fornecedor : existingProduto.fornecedor,
        dataCompra: dataCompraDate !== undefined ? dataCompraDate : existingProduto.dataCompra,
        codigo: body.codigo !== undefined ? body.codigo : existingProduto.codigo,
        valorUnitario: valorUnitario,
        valorTotal: valorTotal,
      }
    })

    const produtoResponse = {
      id: produto.id,
      descricao: produto.descricao,
      unidade: produto.unidade,
      preco_venda: produto.precoVenda ? Number(produto.precoVenda) : 0,
      quantidade: produto.quantidade ? Number(produto.quantidade) : 0,
      fornecedor: produto.fornecedor,
      data_compra: produto.dataCompra ? produto.dataCompra.toISOString().split("T")[0] : null,
      codigo: produto.codigo,
      valor_unitario: produto.valorUnitario ? Number(produto.valorUnitario) : 0,
      valor_total: produto.valorTotal ? Number(produto.valorTotal) : 0,
    }

    return NextResponse.json({ success: true, data: produtoResponse })
  } catch (error) {
    console.error("Erro ao atualizar produto:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar produto" },
      { status: 500 }
    )
  }
}

// DELETE - Remover produto
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const { id } = await params
    const result = await prisma.produto.deleteMany({
      where: {
        id: parseInt(id),
        userId: session.user.id
      }
    })

    if (result.count === 0) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Produto removido" })
  } catch (error) {
    console.error("Erro ao remover produto:", error)
    return NextResponse.json(
      { error: "Erro ao remover produto" },
      { status: 500 }
    )
  }
}