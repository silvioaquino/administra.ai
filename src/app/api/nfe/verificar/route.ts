// src/app/api/nfe/verificar/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { encontrarNotaDuplicada } from '@/lib/nfe/duplicidade'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const chaveAcesso = searchParams.get('chaveAcesso') || ''
  const numero = searchParams.get('numero') || ''
  const serie = searchParams.get('serie') || ''
  const cnpjEmitente = searchParams.get('cnpjEmitente') || ''

  try {
    const existente = await encontrarNotaDuplicada(prisma, {
      empresaId: session.user.empresaId || '',
      chaveAcesso,
      numero,
      serie,
      cnpjEmitente,
    })

    return NextResponse.json({
      success: true,
      duplicada: !!existente,
      notaExistente: existente
        ? {
            id: existente.id,
            numero: existente.numero,
            serie: existente.serie,
            nomeEmitente: existente.nomeEmitente,
            cnpjEmitente: existente.cnpjEmitente,
            dataEmissao: existente.dataEmissao,
            chaveAcesso: existente.chaveAcesso,
          }
        : null,
    })
  } catch (error) {
    console.error('Erro ao verificar duplicidade da nota:', error)
    return NextResponse.json(
      { error: 'Erro ao verificar duplicidade da nota' },
      { status: 500 }
    )
  }
}
