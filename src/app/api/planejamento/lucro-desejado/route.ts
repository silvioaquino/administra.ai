// src/app/api/planejamento/lucro-desejado/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const TIPO = "lucro_desejado"
const LUCRO_PADRAO = 15

interface LucroDados {
  lucroDesejado?: number
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Não autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const ano = parseInt(searchParams.get("ano") || new Date().getFullYear().toString())

  try {
    const config = await prisma.planejamentoConfig.findFirst({
      where: {
        userId: session.user.id,
        tipo: TIPO,
        anoReferencia: ano
      }
    })

    const lucroDesejado = (config?.dados as LucroDados | null)?.lucroDesejado ?? LUCRO_PADRAO

    return NextResponse.json({ success: true, lucroDesejado })
  } catch (error) {
    console.error("Erro ao buscar lucro desejado:", error)
    return NextResponse.json({ success: false, message: "Erro ao buscar dados" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Não autorizado" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const ano = parseInt(body.ano) || new Date().getFullYear()
    const lucroDesejado = Number(body.lucroDesejado)

    if (Number.isNaN(lucroDesejado)) {
      return NextResponse.json({ success: false, message: "lucroDesejado inválido" }, { status: 400 })
    }

    const empresaId = session.user.empresaId || "sem-empresa"

    const config = await prisma.planejamentoConfig.upsert({
      where: {
        empresaId_userId_tipo_anoReferencia: {
          empresaId,
          userId: session.user.id,
          tipo: TIPO,
          anoReferencia: ano
        }
      },
      update: {
        dados: { lucroDesejado }
      },
      create: {
        empresaId,
        userId: session.user.id,
        tipo: TIPO,
        anoReferencia: ano,
        dados: { lucroDesejado }
      }
    })

    const salvo = (config.dados as LucroDados).lucroDesejado ?? lucroDesejado

    return NextResponse.json({ success: true, lucroDesejado: salvo })
  } catch (error) {
    console.error("Erro ao salvar lucro desejado:", error)
    return NextResponse.json({ success: false, message: "Erro ao salvar dados" }, { status: 500 })
  }
}
