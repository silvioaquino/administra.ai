import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const userId = session.user.id
  const empresaId = session.user.empresaId || "sem-empresa"
  const { searchParams } = new URL(request.url)
  const ano = parseInt(searchParams.get("ano") || new Date().getFullYear().toString())

  try {
    const folha = await prisma.planejamentoFolhaSalarial.findUnique({
      where: {
        empresaId_userId_anoReferencia: {
          empresaId,
          userId,
          anoReferencia: ano
        }
      }
    })

    if (!folha) {
      return NextResponse.json({ success: true, dados: null })
    }

    return NextResponse.json({
      success: true,
      dados: {
        totalSalarios: Number(folha.totalSalarios),
        totalDecimo: Number(folha.totalDecimo),
        totalFerias: Number(folha.totalFerias),
        totalFgts: Number(folha.totalFgts),
        totalInss: Number(folha.totalInss),
        totalInssPatronal: Number(folha.totalInssPatronal),
        totalMensal: Number(folha.totalMensal),
        folhaEncargosPercentual: folha.folhaEncargosPercentual
      }
    })
  } catch (error) {
    console.error("Erro ao buscar folha salarial:", error)
    return NextResponse.json(
      { error: "Erro ao buscar dados da folha salarial" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const {
      ano,
      totalSalarios,
      totalDecimo,
      totalFerias,
      totalFgts,
      totalInss,
      totalInssPatronal,
      totalMensal,
      folhaEncargosPercentual
    } = await request.json()

    const userId = session.user.id
    const empresaId = session.user.empresaId || "sem-empresa"

    const folha = await prisma.planejamentoFolhaSalarial.upsert({
      where: {
        empresaId_userId_anoReferencia: {
          empresaId,
          userId,
          anoReferencia: ano
        }
      },
      update: {
        totalSalarios,
        totalDecimo,
        totalFerias,
        totalFgts,
        totalInss,
        totalInssPatronal,
        totalMensal,
        folhaEncargosPercentual
      },
      create: {
        empresaId,
        userId,
        anoReferencia: ano,
        totalSalarios: totalSalarios || 0,
        totalDecimo: totalDecimo || 0,
        totalFerias: totalFerias || 0,
        totalFgts: totalFgts || 0,
        totalInss: totalInss || 0,
        totalInssPatronal: totalInssPatronal || 0,
        totalMensal: totalMensal || 0,
        folhaEncargosPercentual: folhaEncargosPercentual || 0
      }
    })

    return NextResponse.json({ success: true, dados: folha })
  } catch (error) {
    console.error("Erro ao salvar folha salarial:", error)
    return NextResponse.json(
      { error: "Erro ao salvar folha salarial" },
      { status: 500 }
    )
  }
}