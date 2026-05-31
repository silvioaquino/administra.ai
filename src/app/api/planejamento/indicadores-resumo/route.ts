// app/api/planejamento/indicadores-resumo/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const userId = session.user.id
  const anoAtual = new Date().getFullYear()

  try {
    // Buscar despesas fixas
    const despesasFixas = await prisma.despesasFixas.findMany({
      where: {
        userId,
        ano: anoAtual
      }
    })

    // Buscar despesas variáveis
    const despesasVariaveis = await prisma.despesasVariaveis.findMany({
      where: {
        userId,
        ano: anoAtual
      }
    })
    const despesasVariaveisPct = despesasVariaveis.reduce((sum, item) => sum + (item.percentual || 0), 0)

    // Buscar metas do mês atual
    const mesAtual = new Date().getMonth() + 1
    const metaAtual = await prisma.metasMensais.findFirst({
      where: {
        userId,
        ano: anoAtual,
        mes: mesAtual
      }
    })

    const diasTrabalhados = metaAtual?.diasTrabalhados || 26
    const metaDiariaAlmoco = metaAtual?.metaDiariaAlmoco || 0
    const metaDiariaJanta = metaAtual?.metaDiariaJanta || 0
    const lucroDesejado = metaAtual?.lucroDesejado || 15

    const metaMensalAlmoco = metaDiariaAlmoco * diasTrabalhados
    const metaMensalJanta = metaDiariaJanta * diasTrabalhados
    const metaMensalTotal = metaMensalAlmoco + metaMensalJanta

    // Calcular CMV
    const totalFixas = despesasFixas.reduce((sum, d) => sum + d.valor, 0)
    const pctFixas = metaMensalTotal > 0 ? (totalFixas / metaMensalTotal) * 100 : 0
    const cmv = 100 - (pctFixas + despesasVariaveisPct + lucroDesejado)

    return NextResponse.json({
      success: true,
      despesasFixas: despesasFixas.map(d => ({ nome: d.nome, valor: d.valor })),
      despesasVariaveisPct,
      metaMensalTotal,
      cmv: Math.max(0, cmv)
    })

  } catch (error) {
    console.error("Erro ao buscar indicadores:", error)
    return NextResponse.json({
      success: false,
      error: "Erro ao buscar dados dos indicadores"
    }, { status: 500 })
  }
}