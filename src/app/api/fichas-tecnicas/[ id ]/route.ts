// src/app/api/fichas-tecnicas/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Buscar uma ficha técnica específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const ficha = await prisma.fichaTecnica.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      },
      include: {
        fichaItems: {
          include: {
            produto: true
          }
        }
      }
    })

    if (!ficha) {
      return NextResponse.json({ error: "Ficha não encontrada" }, { status: 404 })
    }

    // Formatar os dados para o frontend
    const fichaFormatada = {
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
    }

    return NextResponse.json({
      success: true,
      data: fichaFormatada
    })
  } catch (error) {
    console.error("Erro ao buscar ficha:", error)
    return NextResponse.json(
      { error: "Erro ao buscar ficha técnica" },
      { status: 500 }
    )
  }
}

// PUT - Atualizar uma ficha técnica
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

    if (!nome || !categoria || !precoVenda || custoTotal === undefined || !rendimentoPorcoes) {
      return NextResponse.json(
        { error: "Campos obrigatórios não preenchidos" },
        { status: 400 }
      )
    }

    // Verificar se a ficha existe
    const fichaExistente = await prisma.fichaTecnica.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!fichaExistente) {
      return NextResponse.json({ error: "Ficha não encontrada" }, { status: 404 })
    }

    // Parse dos ingredientes
    let ingredientesArray = []
    if (typeof ingredientes === 'string') {
      ingredientesArray = JSON.parse(ingredientes)
    } else if (Array.isArray(ingredientes)) {
      ingredientesArray = ingredientes
    }

    // Atualizar a ficha e seus itens em uma transação
    const ficha = await prisma.$transaction(async (tx) => {
      // 1. Atualizar os dados principais da ficha
      const updatedFicha = await tx.fichaTecnica.update({
        where: { id: params.id },
        data: {
          nome,
          categoria,
          precoVenda,
          custoTotal,
          custoPorPorcao,
          margem,
          rendimentoPorcoes,
          modoPreparo: modoPreparo || null,
          updatedAt: new Date()
        }
      })

      // 2. Remover todos os itens antigos
      await tx.fichaItem.deleteMany({
        where: { fichaId: params.id }
      })

      // 3. Criar os novos itens
      if (ingredientesArray.length > 0) {
        await tx.fichaItem.createMany({
          data: ingredientesArray.map((ing: any) => ({
            fichaId: params.id,
            produtoId: ing.produtoId,
            quantidade: ing.quantidade,
            unidade: ing.unidade,
            valorUnitario: ing.valorUnitario,
            custo: ing.custo,
            isProdutoAcabado: ing.isProdutoAcabado || false
          }))
        })
      }

      return updatedFicha
    })

    // Buscar a ficha atualizada com os itens
    const fichaComItens = await prisma.fichaTecnica.findFirst({
      where: { id: params.id },
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
        ...fichaComItens,
        precoVenda: Number(fichaComItens?.precoVenda),
        custoTotal: Number(fichaComItens?.custoTotal),
        custoPorPorcao: Number(fichaComItens?.custoPorPorcao),
        margem: Number(fichaComItens?.margem),
        ingredientes: fichaComItens?.fichaItems.map(item => ({
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
      message: "Ficha técnica atualizada com sucesso"
    })
  } catch (error) {
    console.error("Erro ao atualizar ficha:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar ficha técnica" },
      { status: 500 }
    )
  }
}

// DELETE - Remover uma ficha técnica
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    // Verificar se a ficha existe
    const fichaExistente = await prisma.fichaTecnica.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!fichaExistente) {
      return NextResponse.json({ error: "Ficha não encontrada" }, { status: 404 })
    }

    // Os itens serão deletados automaticamente devido ao onDelete: Cascade
    await prisma.fichaTecnica.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: "Ficha técnica removida com sucesso"
    })
  } catch (error) {
    console.error("Erro ao remover ficha:", error)
    return NextResponse.json(
      { error: "Erro ao remover ficha técnica" },
      { status: 500 }
    )
  }
}