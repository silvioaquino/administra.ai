import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { recalcularFolhaSalarial, garantirFolhaAno } from "@/lib/folha"
import { calcularDREAno } from "@/lib/dre-calculator"

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const userId = session.user.id
  const empresaId = session.user.empresaId || "sem-empresa"
  const { searchParams } = new URL(request.url)
  const ano = parseInt(searchParams.get("ano") || new Date().getFullYear().toString())
  const mesParam = searchParams.get("mes")
  const mes = mesParam ? parseInt(mesParam) : null

  try {
    // Garante que o mês atual (e eventuais ausentes) estejam salvos/atualizados.
    await garantirFolhaAno(empresaId, userId, ano)

    if (mes) {
      const folha = await prisma.planejamentoFolhaSalarial.findUnique({
        where: {
          empresaId_userId_anoReferencia_mes: { empresaId, userId, anoReferencia: ano, mes },
        },
      })
      if (!folha) {
        return NextResponse.json({ success: true, dados: null })
      }
      return NextResponse.json({
        success: true,
        dados: {
          totalSalarios: Number(folha.totalSalarios),
          totalDecimo: Number(folha.totalDecimo),
          totalFerias: Number(folha.totalFerias),
          totalFgts: Number(folha.totalFgts),
          totalInss: Number(folha.totalInss),
          totalInssPatronal: Number(folha.totalInssPatronal),
          totalMensal: Number(folha.totalMensal),
          folhaEncargosPercentual: folha.folhaEncargosPercentual,
        },
      })
    }

    // Sem mês: retorna as 12 linhas do ano (índice por mês).
    const folhas = await prisma.planejamentoFolhaSalarial.findMany({
      where: { empresaId, userId, anoReferencia: ano },
      orderBy: { mes: "asc" },
    })
    const porMes: Record<number, any> = {}
    for (const f of folhas) {
      porMes[f.mes] = {
        totalSalarios: Number(f.totalSalarios),
        totalDecimo: Number(f.totalDecimo),
        totalFerias: Number(f.totalFerias),
        totalFgts: Number(f.totalFgts),
        totalInss: Number(f.totalInss),
        totalInssPatronal: Number(f.totalInssPatronal),
        totalMensal: Number(f.totalMensal),
        folhaEncargosPercentual: f.folhaEncargosPercentual,
      }
    }
    return NextResponse.json({ success: true, dados: porMes })
  } catch (error) {
    console.error("Erro ao buscar folha salarial:", error)
    return NextResponse.json(
      { error: "Erro ao buscar dados da folha salarial" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const ano = parseInt(body.ano || new Date().getFullYear().toString())

    const userId = session.user.id
    const empresaId = session.user.empresaId || "sem-empresa"

    // Recálculo server-side a partir de funcionários + provisões (fonte única).
    // Os totais enviados pelo cliente são ignorados — o servidor recomputa.
    await recalcularFolhaSalarial(empresaId, userId, ano)

    // Reagrega o DRE (Fluxo de Caixa) com a folha atualizada.
    try {
      await calcularDREAno(empresaId, userId, ano)
    } catch (dreErr) {
      console.error("Erro ao recalcular DRE após folha:", dreErr)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao salvar folha salarial:", error)
    return NextResponse.json(
      { error: "Erro ao salvar folha salarial" },
      { status: 500 }
    )
  }
}
