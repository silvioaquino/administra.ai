import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentEmpresaId } from '@/lib/prisma-middleware'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

async function getCurrentUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions)
  return session?.user?.id ?? null
}

export async function GET() {
  try {
    const empresaId = await getCurrentEmpresaId()

    if (!empresaId) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 401 })
    }

    const caixaAberto = await prisma.caixaAbertura.findFirst({
      where: { status: 'ABERTO', empresaId },
      include: {
        vendas: true,
        retiradas: true,
        vendasManuais: true
      }
    })

    return NextResponse.json({
      caixaAberto: !!caixaAberto,
      caixaAtual: caixaAberto
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao verificar estado do caixa' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const empresaId = await getCurrentEmpresaId()
    const userId = await getCurrentUserId()

    if (!empresaId || !userId) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    const { valor_inicial, observacao } = await request.json()

    const caixaExistente = await prisma.caixaAbertura.findFirst({
      where: { status: 'ABERTO', empresaId }
    })

    if (caixaExistente) {
      return NextResponse.json(
        { error: 'Já existe um caixa aberto' },
        { status: 400 }
      )
    }

    const caixa = await prisma.caixaAbertura.create({
      data: {
        empresaId,
        userId,
        valorInicial: parseFloat(valor_inicial),
        observacao: observacao || '',
        status: 'ABERTO'
      }
    })

    return NextResponse.json({ data: caixa })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao abrir caixa' },
      { status: 500 }
    )
  }
}