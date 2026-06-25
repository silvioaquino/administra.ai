import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Listar produtos
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const empresaId = session.user.empresaId;
  if (!empresaId) {
    return NextResponse.json({ error: "Empresa não encontrada" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get("limit") || "100")
  const skip = parseInt(searchParams.get("skip") || "0")
  const search = searchParams.get("search") || ""

  try {
    const where = {
      empresaId,
      ...(search && {
        descricao: { contains: search, mode: "insensitive" as const }
      })
    }

    const [produtos, total] = await Promise.all([
      prisma.produto.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip
      }),
      prisma.produto.count({ where })
    ])

    // Converter Decimal para number e snake_case para o frontend
    const produtosConvertidos = produtos.map(prod => ({
      id: prod.id,
      descricao: prod.descricao,
      unidade: prod.unidade,
      preco_venda: prod.precoVenda ? Number(prod.precoVenda) : 0,
      quantidade: prod.quantidade ? Number(prod.quantidade) : 0,
      fornecedor: prod.fornecedor,
      data_compra: prod.dataCompra ? prod.dataCompra.toISOString().split("T")[0] : null,
      codigo: prod.codigo,
      valor_unitario: prod.valorUnitario ? Number(prod.valorUnitario) : 0,
      valor_total: prod.valorTotal ? Number(prod.valorTotal) : 0,
      categoria: 'INSUMOS',
      createdAt: prod.createdAt,
    }))

    return NextResponse.json({
      success: true,
      data: produtosConvertidos,
      total,
      limit,
      skip
    })
  } catch (error) {
    console.error("Erro ao listar produtos:", error)
    return NextResponse.json(
      { error: "Erro ao listar produtos" },
      { status: 500 }
    )
  }
}

// POST - Criar produto
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const body = await request.json()
    
    console.log("Recebendo produto:", body)
    
    // Validar campos obrigatórios
    if (!body.descricao || body.descricao.trim() === "") {
      return NextResponse.json(
        { error: "Descrição do produto é obrigatória" },
        { status: 400 }
      )
    }

    // Converter valores para número
    const quantidade = body.quantidade ? Number(body.quantidade) : 0
    const precoVenda = body.precoVenda ? Number(body.precoVenda) : 0
    const valorUnitario = body.valorUnitario ? Number(body.valorUnitario) : precoVenda
    const valorTotal = body.valorTotal ? Number(body.valorTotal) : (quantidade * precoVenda)

    // Corrigir data para não usar UTC
    let dataCompraDate: Date
    if (body.dataCompra) {
      const [year, month, day] = body.dataCompra.split('-').map(Number)
      dataCompraDate = new Date(year, month - 1, day)
    } else {
      const hoje = new Date()
      dataCompraDate = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
    }

    // Preparar dados para o Prisma
    const produtoData = {
      userId: session.user.id,
      empresaId: session.user.empresaId || "",
      descricao: body.descricao.trim(),
      unidade: body.unidade || "UN",
      precoVenda: precoVenda,
      quantidade: quantidade,
      fornecedor: body.fornecedor?.trim() || null,
      dataCompra: dataCompraDate,
      codigo: body.codigo?.trim() || null,
      valorUnitario: valorUnitario,
      valorTotal: valorTotal,
    }

    console.log("Dados para salvar:", produtoData)

    const produto = await prisma.produto.create({
      data: produtoData
    })

    // Converter para snake_case na resposta
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
      categoria: 'INSUMOS',
    }

    console.log("Produto criado:", produtoResponse)

    return NextResponse.json({ 
      success: true, 
      data: produtoResponse,
      message: "Produto criado com sucesso"
    })
    
  } catch (error) {
    console.error("Erro detalhado ao criar produto:", error)
    
    return NextResponse.json(
      { 
        error: "Erro ao criar produto",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

// PUT - Atualizar produto (opcional, para manter consistência)
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { error: "ID do produto é obrigatório" },
        { status: 400 }
      )
    }

    // Verificar se o produto existe e pertence ao usuário
    const existingProduto = await prisma.produto.findFirst({
      where: {
        id: parseInt(id),
        userId: session.user.id
      }
    })

    if (!existingProduto) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      )
    }

    // Converter valores
    const quantidade = updateData.quantidade !== undefined ? Number(updateData.quantidade) : Number(existingProduto.quantidade)
    const precoVenda = updateData.precoVenda !== undefined ? Number(updateData.precoVenda) : Number(existingProduto.precoVenda)
    const valorUnitario = updateData.valorUnitario !== undefined ? Number(updateData.valorUnitario) : Number(existingProduto.valorUnitario)
    const valorTotal = updateData.valorTotal !== undefined ? Number(updateData.valorTotal) : (quantidade * precoVenda)

    // Corrigir data se fornecida
    let dataCompraUpdate: Date | undefined
    if (updateData.dataCompra !== undefined) {
      if (updateData.dataCompra) {
        const [year, month, day] = updateData.dataCompra.split('-').map(Number)
        dataCompraUpdate = new Date(year, month - 1, day)
      } else {
        dataCompraUpdate = existingProduto.dataCompra || undefined
      }
    }

    const produto = await prisma.produto.update({
      where: { id: parseInt(id) },
      data: {
        descricao: updateData.descricao || existingProduto.descricao,
        unidade: updateData.unidade || existingProduto.unidade,
        precoVenda: precoVenda,
        quantidade: quantidade,
        fornecedor: updateData.fornecedor !== undefined ? updateData.fornecedor : existingProduto.fornecedor,
        dataCompra: dataCompraUpdate !== undefined ? dataCompraUpdate : existingProduto.dataCompra,
        codigo: updateData.codigo !== undefined ? updateData.codigo : existingProduto.codigo,
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
      categoria: 'INSUMOS',
    }

    return NextResponse.json({
      success: true,
      data: produtoResponse,
      message: "Produto atualizado com sucesso"
    })
    
  } catch (error) {
    console.error("Erro ao atualizar produto:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar produto" },
      { status: 500 }
    )
  }
}

// DELETE - Remover produto (opcional, para manter consistência)
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "ID do produto é obrigatório" },
        { status: 400 }
      )
    }

    const result = await prisma.produto.deleteMany({
      where: {
        id: parseInt(id),
        userId: session.user.id
      }
    })

    if (result.count === 0) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: "Produto removido com sucesso" 
    })
    
  } catch (error) {
    console.error("Erro ao remover produto:", error)
    return NextResponse.json(
      { error: "Erro ao remover produto" },
      { status: 500 }
    )
  }
}