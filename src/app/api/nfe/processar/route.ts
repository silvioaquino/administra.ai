// src/app/api/produtos/route.ts
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

  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get("limit") || "100")
  const skip = parseInt(searchParams.get("skip") || "0")
  const search = searchParams.get("search") || ""

  try {
    const where = {
      userId: session.user.id,
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

    return NextResponse.json({
      success: true,
      data: produtos,
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
    
    const produto = await prisma.produto.create({
      data: {
        userId: session.user.id,
        descricao: body.descricao,
        unidade: body.unidade || "UN",
        precoVenda: body.precoVenda || 0,
        quantidade: body.quantidade || 0,
        fornecedor: body.fornecedor || null,
        dataCompra: body.dataCompra ? new Date(body.dataCompra) : null,
        codigo: body.codigo || null,
        valorUnitario: body.valorUnitario || 0,
        valorTotal: body.valorTotal || 0
      }
    })

    return NextResponse.json({ success: true, data: produto })
  } catch (error) {
    console.error("Erro ao criar produto:", error)
    return NextResponse.json(
      { error: "Erro ao criar produto" },
      { status: 500 }
    )
  }
}