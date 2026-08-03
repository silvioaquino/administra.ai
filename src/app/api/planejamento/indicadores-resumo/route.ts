// app/api/planejamento/indicadores-resumo/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { obterIndicadoresResumo } from "@/lib/planejamento/indicadoresResumo"

/**
 * Resumo dos indicadores financeiros.
 * A regra de cálculo vive em `@/lib/planejamento/indicadoresResumo` e é
 * compartilhada com o motor de alertas (`/api/alertas`), garantindo que o
 * que o usuário vê nos cards seja exatamente o que gera alertas.
 */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const userId = session.user.id
  const empresaId = session.user.empresaId || "sem-empresa"
  const { searchParams } = new URL(request.url)
  const ano = parseInt(searchParams.get("ano") || new Date().getFullYear().toString())

  try {
    const resultado = await obterIndicadoresResumo(empresaId, userId, ano)
    return NextResponse.json({ success: true, ...resultado })
  } catch (error) {
    console.error("Erro ao buscar indicadores:", error)
    return NextResponse.json(
      { success: false, error: "Erro ao buscar dados dos indicadores" },
      { status: 500 }
    )
  }
}
