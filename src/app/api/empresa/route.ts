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

    const empresa = await prisma.empresa.findUnique({
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
        nome: empresa?.nome || "Administra.ai",
        whatsapp: empresa?.whatsapp,
        segmento: empresa?.segmento,
        endereco: {
          cep: empresa?.cep,
          logradouro: empresa?.logradouro,
          numero: empresa?.numero,
          complemento: empresa?.complemento,
          bairro: empresa?.bairro,
          cidade: empresa?.cidade,
          estado: empresa?.estado
        }
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