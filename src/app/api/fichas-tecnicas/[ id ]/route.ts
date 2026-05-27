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
      }
    })

    if (!ficha) {
      return NextResponse.json({ error: "Ficha não encontrada" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: ficha
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

    if (!nome || !categoria || !precoVenda || !custoTotal || !rendimentoPorcoes) {
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

    const ficha = await prisma.fichaTecnica.update({
      where: { id: params.id },
      data: {
        nome,
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
      data: ficha,
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