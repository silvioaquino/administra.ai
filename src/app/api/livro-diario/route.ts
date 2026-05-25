// src/app/api/livro-diario/route.ts
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const data_inicio = searchParams.get('data_inicio')
  const data_fim = searchParams.get('data_fim')
  const limit = parseInt(searchParams.get('limit') || '10')

  // Dados mockados
  const mockLancamentos = [
    {
      id: 1,
      data: new Date().toISOString(),
      tipo: "VENDA",
      descricao: "Venda - Mesa 5",
      valor: 187.50,
      forma_pagamento: "PIX"
    },
    {
      id: 2,
      data: new Date().toISOString(),
      tipo: "VENDA",
      descricao: "Venda - Delivery",
      valor: 94.90,
      forma_pagamento: "Cartão Crédito"
    },
    {
      id: 3,
      data: new Date().toISOString(),
      tipo: "COMPRA",
      descricao: "Compra de insumos",
      valor: 450.00,
      forma_pagamento: "Transferência"
    },
    {
      id: 4,
      data: new Date().toISOString(),
      tipo: "DESPESA",
      descricao: "Água e Luz",
      valor: 320.00,
      forma_pagamento: "Débito Automático"
    }
  ]

  return NextResponse.json({
    success: true,
    data: mockLancamentos.slice(0, limit),
    total: mockLancamentos.length
  })
}