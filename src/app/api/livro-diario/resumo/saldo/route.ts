// src/app/api/livro-diario/resumo/saldo/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const parseDateStart = (value: string) => {
  const [year, month, day] = value.split("-").map(Number)
  return new Date(year, month - 1, day)
}

const parseDateEnd = (value: string) => {
  const [year, month, day] = value.split("-").map(Number)
  return new Date(year, month - 1, day, 23, 59, 59, 999)
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const data_inicio = searchParams.get('data_inicio')
    const data_fim = searchParams.get('data_fim')

    // Construir filtro de data
    const where: any = {
      userId: session.user.id
    }

    if (data_inicio || data_fim) {
      where.data = {}
      if (data_inicio) {
        where.data.gte = parseDateStart(data_inicio)
      }
      if (data_fim) {
        where.data.lte = parseDateEnd(data_fim)
      }
    }

    // Buscar todos os lançamentos do usuário
    const lancamentos = await prisma.livroDiario.findMany({
      where,
      select: {
        entrada: true,
        saida: true
      }
    })

    // Calcular totais
    const total_entradas = lancamentos.reduce((sum, l) => sum + Number(l.entrada ?? 0), 0)
    const total_saidas = lancamentos.reduce((sum, l) => sum + Number(l.saida ?? 0), 0)
    const saldo_atual = total_entradas - total_saidas

    return NextResponse.json({
      total_entradas,
      total_saidas,
      saldo_atual,
      total_lancamentos: lancamentos.length
    })

  } catch (error) {
    console.error("Erro ao buscar resumo:", error)
    return NextResponse.json(
      { error: "Erro ao buscar resumo do livro diário" },
      { status: 500 }
    )
  }
}