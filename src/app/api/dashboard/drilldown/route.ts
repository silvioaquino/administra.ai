import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"

export type DrilldownItem = {
  id: number
  data: string
  descricao: string
  conta: string
  clienteFornecedor: string
  entrada: number
  saida: number
  status: string
}

function parseDate(value: string | null): Date | null {
  if (!value) return null
  const [ano, mes, dia] = value.split("-").map(Number)
  if (!ano || !mes || !dia) return null
  return new Date(ano, mes - 1, dia)
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const inicio = parseDate(searchParams.get("inicio"))
  const fim = parseDate(searchParams.get("fim"))
  const tipo = searchParams.get("tipo") || "todos" // todos | receitas | despesas
  const conta = (searchParams.get("conta") || "").trim()

  if (!inicio || !fim) {
    return NextResponse.json({ error: "Período inválido" }, { status: 400 })
  }

  const fimDia = new Date(fim.getFullYear(), fim.getMonth(), fim.getDate(), 23, 59, 59, 999)

  const where: Prisma.LivroDiarioWhereInput = {
    userId: session.user.id,
    data: { gte: inicio, lte: fimDia },
  }

  if (tipo === "receitas") where.entrada = { gt: 0 }
  if (tipo === "despesas") where.saida = { gt: 0 }
  if (conta) where.conta = { contains: conta, mode: "insensitive" }

  try {
    const lancamentos = await prisma.livroDiario.findMany({
      where,
      orderBy: { data: "desc" },
      take: 200,
    })

    const data: DrilldownItem[] = lancamentos.map((l) => ({
      id: l.id,
      data: l.data.toISOString(),
      descricao: l.descricao,
      conta: l.conta,
      clienteFornecedor: l.clienteFornecedor || "",
      entrada: Number(l.entrada),
      saida: Number(l.saida),
      status: l.status || "",
    }))

    const totalEntrada = data.reduce((sum, item) => sum + item.entrada, 0)
    const totalSaida = data.reduce((sum, item) => sum + item.saida, 0)

    return NextResponse.json({
      success: true,
      data,
      resumo: { totalEntrada, totalSaida, saldo: totalEntrada - totalSaida, quantidade: data.length },
    })
  } catch (error) {
    console.error("Erro no drill-down do dashboard:", error)
    return NextResponse.json({ error: "Erro ao carregar lançamentos" }, { status: 500 })
  }
}
