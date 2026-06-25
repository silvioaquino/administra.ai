// src/app/api/planejamento/acompanhamento/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const empresaId = session.user.empresaId;
  if (!empresaId) {
    return NextResponse.json({ error: "Empresa não encontrada" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url)
  const ano = parseInt(searchParams.get("ano") || new Date().getFullYear().toString())
  const mes = searchParams.get("mes") ? parseInt(searchParams.get("mes")!) : null

  try {
    if (mes) {
      // Buscar acompanhamento de um mês específico
      const acompanhamento = await prisma.planejamentoAcompanhamento.findFirst({
        where: {
          empresaId,
          ano,
          mes
        }
      })

      if (!acompanhamento) {
        return NextResponse.json({
          success: true,
          data: {
            ano,
            mes,
            faturamentoAlmoco: 0,
            faturamentoJanta: 0,
            faturamentoTotal: 0,
            observacao: null
          }
        })
      }

      return NextResponse.json({
        success: true,
        data: acompanhamento
      })
    }

    // Buscar todos os acompanhamentos do ano
    const acompanhamentos = await prisma.planejamentoAcompanhamento.findMany({
      where: {
        empresaId,
        ano
      },
      orderBy: {
        mes: "asc"
      }
    })

    return NextResponse.json({
      success: true,
      dados: acompanhamentos,
      total: acompanhamentos.length
    })

  } catch (error) {
    console.error("Erro ao buscar acompanhamento:", error)
    return NextResponse.json(
      { error: "Erro ao buscar acompanhamento" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const empresaId = session.user.empresaId;
  if (!empresaId) {
    return NextResponse.json({ error: "Empresa não encontrada" }, { status: 401 });
  }

  try {
    const body = await request.json()
    const { ano, mes, faturamentoAlmoco, faturamentoJanta, observacao } = body

    if (!ano || !mes) {
      return NextResponse.json(
        { error: "Ano e mês são obrigatórios" },
        { status: 400 }
      )
    }

    const faturamentoTotal = (faturamentoAlmoco || 0) + (faturamentoJanta || 0)

    const acompanhamento = await prisma.planejamentoAcompanhamento.upsert({
      where: {
        empresaId_userId_ano_mes: {
          empresaId,
          userId: session.user.id,
          ano,
          mes
        }
      },
      update: {
        faturamentoAlmoco: faturamentoAlmoco || 0,
        faturamentoJanta: faturamentoJanta || 0,
        faturamentoTotal: faturamentoTotal,
        observacao: observacao || null,
        updatedAt: new Date()
      },
      create: {
        empresaId,
        userId: session.user.id,
        ano,
        mes,
        faturamentoAlmoco: faturamentoAlmoco || 0,
        faturamentoJanta: faturamentoJanta || 0,
        faturamentoTotal: faturamentoTotal,
        observacao: observacao || null
      }
    })

    return NextResponse.json({
      success: true,
      message: "Acompanhamento salvo com sucesso",
      data: acompanhamento
    })

  } catch (error) {
    console.error("Erro ao salvar acompanhamento:", error)
    return NextResponse.json(
      { error: "Erro ao salvar acompanhamento" },
      { status: 500 }
    )
  }
}