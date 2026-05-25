// src/app/api/planejamento/metas/route.ts
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const ano = parseInt(searchParams.get("ano") || "2026")
  const mes = searchParams.get("mes") ? parseInt(searchParams.get("mes")!) : null

  // Mock de metas
  const metasMock = [
    { mes: 1, metaDiariaAlmoco: 2500, metaDiariaJanta: 3500, diasTrabalhados: 26, lucroDesejado: 15 },
    { mes: 2, metaDiariaAlmoco: 2600, metaDiariaJanta: 3600, diasTrabalhados: 26, lucroDesejado: 15 },
    { mes: 3, metaDiariaAlmoco: 2700, metaDiariaJanta: 3700, diasTrabalhados: 26, lucroDesejado: 15 },
    { mes: 4, metaDiariaAlmoco: 2800, metaDiariaJanta: 3800, diasTrabalhados: 26, lucroDesejado: 16 },
    { mes: 5, metaDiariaAlmoco: 2900, metaDiariaJanta: 3900, diasTrabalhados: 26, lucroDesejado: 16 },
    { mes: 6, metaDiariaAlmoco: 3000, metaDiariaJanta: 4000, diasTrabalhados: 27, lucroDesejado: 16 },
  ]

  if (mes) {
    const meta = metasMock.find(m => m.mes === mes)
    return NextResponse.json({ success: true, data: meta || metasMock[0] })
  }

  return NextResponse.json({ success: true, metas: metasMock })
}

export async function POST(request: NextRequest) {
  // Apenas confirma recebimento
  return NextResponse.json({ success: true, message: "Metas salvas com sucesso" })
}