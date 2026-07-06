import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Não autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const ano = parseInt(searchParams.get('ano') || new Date().getFullYear().toString())

  try {
    const dados = await prisma.planejamentoMaquininhaNovo.findMany({
      where: {
        userId: session.user.id,
        empresaId: session.user.empresaId || 'sem-empresa',
        ano
      },
      orderBy: { ordem: 'asc' }
    })

    return NextResponse.json({
      success: true,
      dados: dados
    })
  } catch (error) {
    console.error('Erro ao buscar maquininhas:', error)
    return NextResponse.json(
      { success: false, message: 'Erro ao buscar dados' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { ano, maquininhas } = await request.json()
    const empresaId = session.user.empresaId || 'sem-empresa'

    // Deletar existentes
    await prisma.planejamentoMaquininhaNovo.deleteMany({
      where: {
        userId: session.user.id,
        empresaId,
        ano
      }
    })

    // Criar novas maquininhas
    if (maquininhas && maquininhas.length > 0) {
      await prisma.planejamentoMaquininhaNovo.createMany({
        data: maquininhas.map((m: any, index: number) => ({
          empresaId,
          userId: session.user.id,
          ano,
          nome: m.nome,
          taxaDebito: m.taxaDebito || 0,
          taxaCredito: m.taxaCredito || 0,
          aluguel: m.aluguel || 0,
          ativo: m.ativo ?? true,
          ordem: m.ordem ?? index
        }))
      })
    }

    return NextResponse.json({ success: true, message: 'Dados salvos com sucesso' })
  } catch (error) {
    console.error('Erro ao salvar maquininhas:', error)
    return NextResponse.json(
      { success: false, message: 'Erro ao salvar dados' },
      { status: 500 }
    )
  }
}