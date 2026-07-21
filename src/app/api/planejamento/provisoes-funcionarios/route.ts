// src/app/api/planejamento/provisoes-funcionarios/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { recalcularFolhaSalarial } from "@/lib/folha"
import { calcularDREAno } from "@/lib/dre-calculator"

const PROVISOES_KEYS = [
  "decimo_terceiro",
  "ferias",
  "fgts",
  "inss_patronal",
  "inss"
]

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Não autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const ano = parseInt(searchParams.get("ano") || String(new Date().getFullYear()))

  try {
    const provisoesDb = await prisma.provisaoFuncionario.findMany({
      where: {
        userId: session.user.id,
        ano,
      },
    })

    return NextResponse.json({
      success: true,
      dados: provisoesDb.map(p => ({
        id: p.id,
        provisao: p.provisao,
        funcionarioNome: p.funcionarioNome,
        ativo: p.ativo,
        ano: p.ano,
      })),
      total: provisoesDb.length,
    })
  } catch (error) {
    console.error("Erro ao buscar provisões:", error)
    return NextResponse.json({ success: false, message: "Erro ao buscar provisões" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Não autorizado" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { dados, ano } = body

    if (!ano || !dados || !Array.isArray(dados)) {
      return NextResponse.json({ success: false, message: "Dados inválidos" }, { status: 400 })
    }

    // Salvar/atualizar cada provisão
    for (const item of dados) {
      const { provisao, funcionario_nome, ativo } = item

      if (!PROVISOES_KEYS.includes(provisao)) {
        continue
      }

      await prisma.provisaoFuncionario.upsert({
        where: {
          empresaId_userId_ano_provisao_funcionarioNome: {
            empresaId: session.user.empresaId || "sem-empresa",
            userId: session.user.id,
            ano,
            provisao,
            funcionarioNome: funcionario_nome,
          },
        },
        update: {
          ativo,
        },
        create: {
          empresaId: session.user.empresaId || "sem-empresa",
          userId: session.user.id,
          ano,
          provisao,
          funcionarioNome: funcionario_nome,
          ativo: ativo ?? true,
        },
      })
    }

    // Recalcular a folha salarial (mês a mês) e o DRE com as novas provisões.
    try {
      const empresaId = session.user.empresaId || "sem-empresa"
      await recalcularFolhaSalarial(empresaId, session.user.id, ano)
      await calcularDREAno(empresaId, session.user.id, ano)
    } catch (recalcErr) {
      console.error("Erro ao recalcular folha/DRE após provisões:", recalcErr)
    }

    return NextResponse.json({ success: true, message: "Configurações salvas com sucesso" })
  } catch (error) {
    console.error("Erro ao salvar provisões:", error)
    return NextResponse.json({ success: false, message: "Erro ao salvar provisões" }, { status: 500 })
  }
}