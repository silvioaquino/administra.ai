// src/app/api/produtos/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Obter produto específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const produto = await prisma.produto.findFirst({
      where: {
        id: parseInt(params.id),
        userId: session.user.id
      }
    })

    if (!produto) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: produto })
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
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const body = await request.json()
    
    const produto = await prisma.produto.updateMany({
      where: {
        id: parseInt(params.id),
        userId: session.user.id
      },
      data: {
        descricao: body.descricao,
        precoVenda: body.preco_venda || body.precoVenda,
        quantidade: body.quantidade,
        unidade: body.unidade,
        fornecedor: body.fornecedor,
        valorUnitario: body.valor_unitario || body.valorUnitario,
        valorTotal: body.valor_total || body.valorTotal
      }
    })

    if (produto.count === 0) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Produto atualizado" })
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
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const result = await prisma.produto.deleteMany({
      where: {
        id: parseInt(params.id),
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