// src/app/api/onboarding/status/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const empresaId = session.user.empresaId;
  if (!empresaId) {
    return NextResponse.json({ error: "Empresa não encontrada" }, { status: 401 });
  }

  try {
    const [produtos, fichas, despesas, funcionarios, metas] = await Promise.all([
      prisma.produto.count({ where: { empresaId } }),
      prisma.fichaTecnica.count({ where: { empresaId } }),
      prisma.despesaFixa.count({ where: { empresaId } }),
      prisma.funcionario.count({ where: { empresaId } }),
      prisma.planejamentoFaturamento.count({
        where: {
          empresaId,
          metaDiariaAlmoco: { gt: 0 }
        }
      })
    ])

    const setupStatus = {
      produtos: produtos > 0,
      fichasTecnicas: fichas > 0,
      despesasFixas: despesas > 0,
      funcionarios: funcionarios > 0,
      metas: metas > 0
    }

    const completedCount = Object.values(setupStatus).filter(Boolean).length
    const totalSteps = 5
    const percentComplete = (completedCount / totalSteps) * 100

    return NextResponse.json({
      success: true,
      status: setupStatus,
      completedCount,
      totalSteps,
      percentComplete
    })
  } catch (error) {
    console.error("Erro ao verificar status:", error)
    return NextResponse.json({
      success: true,
      status: {
        produtos: false,
        fichasTecnicas: false,
        despesasFixas: false,
        funcionarios: false,
        metas: false
      },
      completedCount: 0,
      totalSteps: 5,
      percentComplete: 0
    })
  }
}