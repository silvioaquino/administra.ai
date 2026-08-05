// src/app/api/nfe/processar-imagem/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { VisionExtractionService } from '@/lib/services/vision-extraction.service'
import { ImageOptimizationService } from '@/lib/services/image-optimization.service'

export async function POST(request: NextRequest) {
  try {
    // Autenticação
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    // Processar imagem
    const formData = await request.formData()
    const imagem = formData.get('imagem') as File
    
    if (!imagem) {
      return NextResponse.json(
        { success: false, error: 'Nenhuma imagem fornecida' },
        { status: 400 }
      )
    }

    // Validar tipo de arquivo
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
    if (!tiposPermitidos.includes(imagem.type)) {
      return NextResponse.json(
        { success: false, error: 'Formato de imagem não suportado. Use JPEG, PNG, WEBP ou HEIC.' },
        { status: 400 }
      )
    }

    // Validar tamanho (máximo 10MB)
    if (imagem.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'Imagem muito grande. Máximo 10MB.' },
        { status: 400 }
      )
    }

    // Converter para base64
    const bytes = await imagem.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const imagemBase64 = `data:${imagem.type};base64,${base64}`

    // Otimizar imagem no servidor (opcional)
    // Se preferir otimizar no servidor, use:
    // const optimizedBuffer = await ImageOptimizationService.optimizeImageServerSide(buffer, 768)
    // const optimizedBase64 = `data:image/jpeg;base64,${optimizedBuffer.toString('base64')}`

    // Extrair dados com IA (com otimização automática)
    const visionService = new VisionExtractionService({
      optimizationEnabled: true // Habilita otimização
    })
    
    const dados = await visionService.extractFromImage(imagemBase64)

    // Validar dados extraídos
    if (!dados.produtos || dados.produtos.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Não foi possível extrair produtos da imagem. Verifique se a foto está nítida e mostra a nota fiscal completa.' 
        },
        { status: 422 }
      )
    }

    // Retornar dados padronizados
    return NextResponse.json({
      success: true,
      data: {
        nome_emitente: dados.nome_emitente || 'Não informado',
        cnpj_emitente: dados.cnpj_emitente || 'Não informado',
        numero: dados.numero || 'Não informado',
        serie: dados.serie || '1',
        chave_acesso: dados.chave_acesso || '',
        data_emissao: dados.data_emissao || new Date().toISOString().split('T')[0],
        valor_total: dados.valor_total || 0,
        desconto: dados.desconto || 0,
        formas_pagamento: dados.formas_pagamento || [],
        produtos: dados.produtos
      }
    })

  } catch (error) {
    console.error('Erro ao processar imagem:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error 
          ? error.message 
          : 'Erro ao processar imagem. Verifique se a foto está nítida e contém as informações da nota fiscal.'
      },
      { status: 500 }
    )
  }
}