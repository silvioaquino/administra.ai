// src/app/api/fichas-tecnicas/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Listar todas as fichas técnicas do usuário
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const categoria = searchParams.get("categoria")
  const busca = searchParams.get("busca")
  const skip = parseInt(searchParams.get("skip") || "0")
  const limit = parseInt(searchParams.get("limit") || "100")

  try {
    const where: any = {
      userId: session.user.id
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

    const [fichas, total] = await Promise.all([
      prisma.fichaTecnica.findMany({
        where,
        orderBy: { nome: "asc" },
        skip,
        take: limit
      }),
      prisma.fichaTecnica.count({ where })
    ])

    // Processar ingredientes (parse JSON)
    const fichasProcessadas = fichas.map(ficha => ({
      ...ficha,
      precoVenda: Number(ficha.precoVenda),
      custoTotal: Number(ficha.custoTotal),
      custoPorPorcao: Number(ficha.custoPorPorcao),
      margem: Number(ficha.margem),
      ingredientes: ficha.ingredientes ? JSON.parse(ficha.ingredientes) : []
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

    if (!custoTotal || custoTotal < 0) {
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
        userId: session.user.id,
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

    // Criar a ficha técnica
    const ficha = await prisma.fichaTecnica.create({
      data: {
        userId: session.user.id,
        nome: nome.trim(),
        categoria,
        precoVenda,
        custoTotal,
        custoPorPorcao,
        margem,
        rendimentoPorcoes,
        ingredientes: ingredientes || null,
        modoPreparo: modoPreparo || null
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
        ingredientes: ficha.ingredientes ? JSON.parse(ficha.ingredientes) : []
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

// PUT - Atualizar uma ficha técnica (por ID nos parâmetros)
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "ID da ficha é obrigatório" },
        { status: 400 }
      )
    }

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

    // Verificar se a ficha existe e pertence ao usuário
    const fichaExistente = await prisma.fichaTecnica.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!fichaExistente) {
      return NextResponse.json(
        { error: "Ficha técnica não encontrada" },
        { status: 404 }
      )
    }

    // Verificar se o novo nome não conflita com outra ficha
    if (nome && nome.trim() !== fichaExistente.nome) {
      const nomeConflito = await prisma.fichaTecnica.findFirst({
        where: {
          userId: session.user.id,
          nome: {
            equals: nome.trim(),
            mode: "insensitive"
          },
          id: { not: id }
        }
      })

      if (nomeConflito) {
        return NextResponse.json(
          { error: "Já existe outra ficha técnica com este nome" },
          { status: 400 }
        )
      }
    }

    // Atualizar a ficha
    const ficha = await prisma.fichaTecnica.update({
      where: { id },
      data: {
        nome: nome?.trim(),
        categoria,
        precoVenda,
        custoTotal,
        custoPorPorcao,
        margem,
        rendimentoPorcoes,
        ingredientes: ingredientes || null,
        modoPreparo: modoPreparo || null,
        updatedAt: new Date()
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
        ingredientes: ficha.ingredientes ? JSON.parse(ficha.ingredientes) : []
      },
      message: "Ficha técnica atualizada com sucesso"
    })
  } catch (error) {
    console.error("Erro ao atualizar ficha técnica:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar ficha técnica" },
      { status: 500 }
    )
  }
}

// DELETE - Remover uma ficha técnica (por ID nos parâmetros)
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
        { error: "ID da ficha é obrigatório" },
        { status: 400 }
      )
    }

    // Verificar se a ficha existe e pertence ao usuário
    const fichaExistente = await prisma.fichaTecnica.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!fichaExistente) {
      return NextResponse.json(
        { error: "Ficha técnica não encontrada" },
        { status: 404 }
      )
    }

    await prisma.fichaTecnica.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: "Ficha técnica removida com sucesso"
    })
  } catch (error) {
    console.error("Erro ao remover ficha técnica:", error)
    return NextResponse.json(
      { error: "Erro ao remover ficha técnica" },
      { status: 500 }
    )
  }
}