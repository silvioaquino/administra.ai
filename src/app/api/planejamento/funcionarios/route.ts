// src/app/api/planejamento/funcionarios/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const ano = parseInt(searchParams.get("ano") || new Date().getFullYear().toString())

  try {
    // Buscar da tabela Funcionario (principal)
    const funcionarios = await prisma.funcionario.findMany({
      where: {
        userId: session.user.id,
        empresaId: session.user.empresaId || "sem-empresa"
      },
      orderBy: { nome: "asc" }
    })

    // Se não encontrar, buscar na tabela planejamentoConfig
    if (funcionarios.length === 0) {
      const config = await prisma.planejamentoConfig.findFirst({
        where: {
          userId: session.user.id,
          tipo: "funcionarios",
          anoReferencia: ano
        }
      })
      if (config?.dados) {
        return NextResponse.json({
          success: true,
          dados: config.dados
        })
      }
    }

    return NextResponse.json({
      success: true,
      dados: funcionarios
    })
  } catch (error) {
    console.error("Erro ao buscar funcionários:", error)
    return NextResponse.json(
      { error: "Erro ao buscar funcionários" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const { dados, ano } = await request.json()

    // Validar dados
    if (!dados || !Array.isArray(dados)) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
    }

    const empresaId = session.user.empresaId || "sem-empresa"

    // SALVAR na tabela Funcionario (principal)
    await prisma.funcionario.deleteMany({
      where: {
        userId: session.user.id,
        empresaId
      }
    })

    await prisma.funcionario.createMany({
      data: dados.map((func: any) => ({
        nome: func.nome,
        salario: func.salario,
        userId: session.user.id,
        empresaId
      }))
    })

    // SALVAR também na tabela planejamentoConfig
    await prisma.planejamentoConfig.upsert({
      where: {
        empresaId_userId_tipo_anoReferencia: {
          empresaId,
          userId: session.user.id,
          tipo: "funcionarios",
          anoReferencia: ano
        }
      },
      update: { dados },
      create: {
        empresaId,
        userId: session.user.id,
        tipo: "funcionarios",
        dados,
        anoReferencia: ano
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao salvar funcionários:", error)
    return NextResponse.json(
      { error: "Erro ao salvar funcionários" },
      { status: 500 }
    )
  }
}