// app/api/livro-diario/resumo/grafico/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

interface ChartDataPoint {
  periodo: string
  receitas: number
  despesas: number
  lucro: number
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const periodo = searchParams.get("periodo") || "mensal"

  // Dados mockados para desenvolvimento
  const chartData: ChartDataPoint[] = []
  const today = new Date()
  
  if (periodo === "diario") {
    // Últimos 7 dias
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      chartData.push({
        periodo: date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        receitas: Math.floor(Math.random() * 5000) + 2000,
        despesas: Math.floor(Math.random() * 3000) + 1000,
        lucro: 0
      })
    }
  } else if (periodo === "semanal") {
    // Últimas 12 semanas
    for (let i = 11; i >= 0; i--) {
      chartData.push({
        periodo: `Sem ${12 - i}`,
        receitas: Math.floor(Math.random() * 15000) + 5000,
        despesas: Math.floor(Math.random() * 10000) + 3000,
        lucro: 0
      })
    }
  } else if (periodo === "quinzenal") {
    // Últimos 6 meses (12 quinzenas)
    for (let i = 11; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(today.getDate() - (i * 15))
      chartData.push({
        periodo: `${date.toLocaleDateString("pt-BR", { month: "short" })} ${i % 2 === 0 ? "1ª Q" : "2ª Q"}`,
        receitas: Math.floor(Math.random() * 25000) + 10000,
        despesas: Math.floor(Math.random() * 15000) + 5000,
        lucro: 0
      })
    }
  } else {
    // Últimos 12 meses
    for (let i = 11; i >= 0; i--) {
      const date = new Date(today)
      date.setMonth(today.getMonth() - i)
      chartData.push({
        periodo: date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
        receitas: Math.floor(Math.random() * 30000) + 15000,
        despesas: Math.floor(Math.random() * 20000) + 8000,
        lucro: 0
      })
    }
  }
  
  // Calcular lucro para cada período
  chartData.forEach(item => {
    item.lucro = item.receitas - item.despesas
  })
  
  return NextResponse.json({
    success: true,
    data: chartData
  })
}