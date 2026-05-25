// src/app/api/dashboard/route.ts
import { NextResponse } from "next/server"

export async function GET() {
  // Dados mockados para teste
  return NextResponse.json({
    success: true,
    data: {
      faturamentoHoje: 1850.00,
      faturamentoMes: 45780.00,
      ticketMedio: 89.50,
      totalClientes: 245,
      produtosEmEstoque: 156,
      margemMedia: 42.5,
      ultimasVendas: [
        { id: 1, cliente: "Cliente A", valor: 150.00, data: new Date().toISOString() },
        { id: 2, cliente: "Cliente B", valor: 89.90, data: new Date().toISOString() },
      ]
    }
  })
}