// src/app/api/empresa/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const empresa = await prisma.empresa.findFirst({
      where: { userId: session.user.id },
      select: {
        nome: true,
        whatsapp: true,
        segmento: true,
        cep: true,
        logradouro: true,
        numero: true,
        complemento: true,
        bairro: true,
        cidade: true,
        estado: true
      }
    })

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        email: true,
        trialEndsAt: true
      }
    })

    return NextResponse.json({
      success: true,
      empresa: {
        id: session.user.id,
        nome: empresa?.nome || session.user.name || "Administra.ai",
        whatsapp: empresa?.whatsapp || "",
        segmento: empresa?.segmento || "",
        cep: empresa?.cep || "",
        logradouro: empresa?.logradouro || "",
        numero: empresa?.numero || "",
        complemento: empresa?.complemento || "",
        bairro: empresa?.bairro || "",
        cidade: empresa?.cidade || "",
        estado: empresa?.estado || ""
      },
      usuario: {
        nome: user?.name,
        email: user?.email,
        trialEndsAt: user?.trialEndsAt
      }
    })

  } catch (error) {
    console.error("Erro ao buscar empresa:", error)
    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 }
    )
  }
}

// ============================================
// MÉTODO PUT ADICIONADO ABAIXO
// ============================================

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    const {
      nome,
      whatsapp,
      segmento,
      cep,
      logradouro,
      numero,
      complemento,
      bairro,
      cidade,
      estado
    } = body

    console.log("Dados recebidos para salvar:", body)

    // Verificar se já existe um registro da empresa para este usuário
    const existingEmpresa = await prisma.empresa.findUnique({
      where: { userId: session.user.id }
    })

    let updatedEmpresa

    if (existingEmpresa) {
      // Atualizar empresa existente
      updatedEmpresa = await prisma.empresa.update({
        where: { userId: session.user.id },
        data: {
          nome: nome,
          whatsapp: whatsapp,
          segmento: segmento,
          cep: cep,
          logradouro: logradouro,
          numero: numero,
          complemento: complemento,
          bairro: bairro,
          cidade: cidade,
          estado: estado
        }
      })
      console.log("Empresa atualizada:", updatedEmpresa)
    } else {
      // Criar novo registro de empresa
      updatedEmpresa = await prisma.empresa.create({
        data: {
          userId: session.user.id,
          nome: nome,
          whatsapp: whatsapp,
          segmento: segmento,
          cep: cep,
          logradouro: logradouro,
          numero: numero,
          complemento: complemento,
          bairro: bairro,
          cidade: cidade,
          estado: estado
        }
      })
      console.log("Empresa criada:", updatedEmpresa)
    }

    return NextResponse.json({
      success: true,
      message: "Empresa atualizada com sucesso",
      empresa: updatedEmpresa
    })

  } catch (error) {
    console.error("Erro ao atualizar empresa:", error)
    return NextResponse.json(
      { error: "Erro interno ao salvar: " + (error as Error).message },
      { status: 500 }
    )
  }
}