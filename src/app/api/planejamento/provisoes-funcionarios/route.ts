// src/app/api/planejamento/provisoes-funcionarios/route.ts
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const ano = parseInt(searchParams.get("ano") || "2026")

  const provisoesMock = [
    { id: 1, provisao: "13º Salário", funcionarioNome: "João Silva", ativo: true, ano },
    { id: 2, provisao: "Férias", funcionarioNome: "João Silva", ativo: true, ano },
    { id: 3, provisao: "FGTS", funcionarioNome: "João Silva", ativo: true, ano },
    { id: 4, provisao: "INSS", funcionarioNome: "João Silva", ativo: true, ano },
    { id: 5, provisao: "13º Salário", funcionarioNome: "Maria Santos", ativo: true, ano },
    { id: 6, provisao: "Férias", funcionarioNome: "Maria Santos", ativo: true, ano },
  ]

  return NextResponse.json({
    success: true,
    dados: provisoesMock,
    total: provisoesMock.length
  })
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ success: true, message: "Configurações salvas com sucesso" })
}