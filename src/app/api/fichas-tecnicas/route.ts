// src/app/api/fichas-tecnicas/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Listar todas as fichas técnicas da empresa
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const empresaId = session.user.empresaId
  if (!empresaId) {
    return NextResponse.json({ error: "Empresa não encontrada" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const categoria = searchParams.get("categoria")
  const busca = searchParams.get("busca")
  const skip = parseInt(searchParams.get("skip") || "0")
  const limit = parseInt(searchParams.get("limit") || "100")

  try {
    const where: any = {
      empresaId
    }

    if (categoria) {
      where.categoria = categoria
    }

    if (busca) {
      where.nome = {
        contains: busca,
        mode: "insensitive"
      }
    }

    const fichas = await prisma.fichaTecnica.findMany({
      where,
      orderBy: { nome: "asc" },
      skip,
      take: limit,
      include: {
        fichaItems: {
          include: {
            produto: true
          }
        }
      }
    })

    const total = await prisma.fichaTecnica.count({ where })

    // Processar os itens para o formato esperado pelo frontend
    const fichasProcessadas = fichas.map(ficha => ({
      ...ficha,
      precoVenda: Number(ficha.precoVenda),
      custoTotal: Number(ficha.custoTotal),
      custoPorPorcao: Number(ficha.custoPorPorcao),
      margem: Number(ficha.margem),
      ingredientes: ficha.fichaItems.map(item => ({
        id: item.id,
        produtoId: item.produtoId,
        nome: item.produto.descricao,
        quantidade: item.quantidade,
        unidade: item.unidade,
        valorUnitario: Number(item.valorUnitario),
        custo: Number(item.custo),
        isProdutoAcabado: item.isProdutoAcabado
      }))
    }))

    return NextResponse.json({
      success: true,
      data: fichasProcessadas,
      total,
      skip,
      limit
    })
  } catch (error) {
    console.error("Erro ao listar fichas técnicas:", error)
    return NextResponse.json(
      { error: "Erro ao listar fichas técnicas" },
      { status: 500 }
    )
  }
}

// POST - Criar uma nova ficha técnica
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const empresaId = session.user.empresaId
  if (!empresaId) {
    return NextResponse.json({ error: "Empresa não encontrada" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      nome,
      categoria,
      precoVenda,
      custoTotal,
      custoPorPorcao,
      margem,
      rendimentoPorcoes,
      ingredientes,
      modoPreparo
    } = body

    // Validações
    if (!nome || !nome.trim()) {
      return NextResponse.json(
        { error: "Nome do prato é obrigatório" },
        { status: 400 }
      )
    }

    if (!categoria || (categoria !== "Almoço" && categoria !== "Janta")) {
      return NextResponse.json(
        { error: "Categoria inválida. Use 'Almoço' ou 'Janta'" },
        { status: 400 }
      )
    }

    if (!precoVenda || precoVenda <= 0) {
      return NextResponse.json(
        { error: "Preço de venda deve ser maior que zero" },
        { status: 400 }
      )
    }

    if (custoTotal === undefined || custoTotal < 0) {
      return NextResponse.json(
        { error: "Custo total inválido" },
        { status: 400 }
      )
    }

    if (!rendimentoPorcoes || rendimentoPorcoes < 1) {
      return NextResponse.json(
        { error: "Rendimento deve ser pelo menos 1 porção" },
        { status: 400 }
      )
    }

    // Verificar se já existe uma ficha com o mesmo nome
    const fichaExistente = await prisma.fichaTecnica.findFirst({
      where: {
        empresaId,
        nome: {
          equals: nome.trim(),
          mode: "insensitive"
        }
      }
    })

    if (fichaExistente) {
      return NextResponse.json(
        { error: "Já existe uma ficha técnica com este nome" },
        { status: 400 }
      )
    }

    // Parse dos ingredientes (pode vir como string ou array)
    let ingredientesArray = []
    if (typeof ingredientes === 'string') {
      ingredientesArray = JSON.parse(ingredientes)
    } else if (Array.isArray(ingredientes)) {
      ingredientesArray = ingredientes
    }

    // Criar a ficha técnica com os itens
    const ficha = await prisma.fichaTecnica.create({
      data: {
        empresaId,
        userId: session.user.id,
        nome: nome.trim(),
        categoria,
        precoVenda,
        custoTotal,
        custoPorPorcao,
        margem,
        rendimentoPorcoes,
        modoPreparo: modoPreparo || null,
        fichaItems: {
          create: ingredientesArray.map((ing: any) => ({
            produtoId: ing.produtoId,
            quantidade: ing.quantidade,
            unidade: ing.unidade,
            valorUnitario: ing.valorUnitario,
            custo: ing.custo,
            isProdutoAcabado: ing.isProdutoAcabado || false
          }))
        }
      },
      include: {
        fichaItems: {
          include: {
            produto: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        ...ficha,
        precoVenda: Number(ficha.precoVenda),
        custoTotal: Number(ficha.custoTotal),
        custoPorPorcao: Number(ficha.custoPorPorcao),
        margem: Number(ficha.margem),
        ingredientes: ficha.fichaItems.map(item => ({
          id: item.id,
          produtoId: item.produtoId,
          nome: item.produto.descricao,
          quantidade: item.quantidade,
          unidade: item.unidade,
          valorUnitario: Number(item.valorUnitario),
          custo: Number(item.custo),
          isProdutoAcabado: item.isProdutoAcabado
        }))
      },
      message: "Ficha técnica criada com sucesso"
    })
  } catch (error) {
    console.error("Erro ao criar ficha técnica:", error)
    return NextResponse.json(
      { error: "Erro ao criar ficha técnica" },
      { status: 500 }
    )
  }
}