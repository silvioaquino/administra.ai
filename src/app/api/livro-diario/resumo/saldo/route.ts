// src/app/api/livro-diario/resumo/saldo/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const data_inicio = searchParams.get('data_inicio')
    const data_fim = searchParams.get('data_fim')
    
    // Construir filtro de data
    const where: any = {}
    
    if (data_inicio || data_fim) {
      where.data = {}
      if (data_inicio) {
        where.data.gte = new Date(data_inicio)
      }
      if (data_fim) {
        where.data.lte = new Date(data_fim)
      }
    }
    
    // Buscar todos os lançamentos do usuário atual
    // Se você tem autenticação, use o userId da sessão
    const lancamentos = await prisma.livroDiario.findMany({
      where,
      select: {
        entrada: true,
        saida: true
      }
    })
    
    // Calcular totais
    const total_entradas = lancamentos.reduce((sum, l) => sum + (l.entrada || 0), 0)
    const total_saidas = lancamentos.reduce((sum, l) => sum + (l.saida || 0), 0)
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