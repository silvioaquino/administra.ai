// src/app/api/nfe/processar-imagem/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { VisionExtractionService } from '@/lib/services/vision-extraction.service'
import { ImageOptimizationService } from '@/lib/services/image-optimization.service'

export async function POST(request: NextRequest) {
  try {
    // 1. Autenticação
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    // 2. Processar imagem
    const formData = await request.formData()
    const imagem = formData.get('imagem') as File
    
    if (!imagem) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Nenhuma imagem fornecida. Selecione uma foto da nota fiscal.' 
        },
        { status: 400 }
      )
    }

    // 3. Validar tipo de arquivo
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
    if (!tiposPermitidos.includes(imagem.type)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Formato de imagem não suportado. Use: ${tiposPermitidos.join(', ')}` 
        },
        { status: 400 }
      )
    }

    // 4. Validar tamanho (máximo 10MB)
    if (imagem.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Imagem muito grande. Máximo 10MB. Reduza a qualidade da foto.' 
        },
        { status: 400 }
      )
    }

    // 5. Validar tamanho mínimo (muito pequena = baixa qualidade)
    if (imagem.size < 50 * 1024) { // 50KB
      return NextResponse.json(
        { 
          success: false, 
          error: 'Imagem muito pequena. Tire uma foto com melhor qualidade.' 
        },
        { status: 400 }
      )
    }

    // 6. Converter para base64
    const bytes = await imagem.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const imagemBase64 = `data:${imagem.type};base64,${base64}`

    // 7. Tentar extrair com Gemini
    try {
      const visionService = new VisionExtractionService({
        optimizationEnabled: true,
        maxRetries: 2
      })
      
      const dados = await visionService.extractFromImage(imagemBase64)

      // 8. Validar dados extraídos
      if (!dados.produtos || dados.produtos.length === 0) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Não foi possível identificar produtos na imagem. Verifique se a foto mostra claramente a lista de produtos da nota fiscal.' 
          },
          { status: 422 }
        )
      }

      // 9. Verificar se tem dados mínimos
      if (!dados.nome_emitente || dados.nome_emitente === 'Não informado') {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Não foi possível identificar o emitente da nota. Verifique se a foto mostra o nome do estabelecimento.' 
          },
          { status: 422 }
        )
      }

      // 10. Retornar dados padronizados
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

    } catch (extractionError) {
      console.error('Erro na extração:', extractionError)
      
      // Mensagens de erro mais amigáveis
      let errorMessage = 'Erro ao processar a imagem. '
      
      if (extractionError instanceof Error) {
        const msg = extractionError.message.toLowerCase()
        if (msg.includes('api key') || msg.includes('api_key')) {
          errorMessage = 'Erro de configuração: Chave API do Gemini não configurada corretamente.'
        } else if (msg.includes('quota') || msg.includes('limit')) {
          errorMessage = 'Limite de uso da API atingido. Tente novamente mais tarde.'
        } else if (msg.includes('timeout') || msg.includes('time out')) {
          errorMessage = 'Tempo limite excedido. Tente com uma imagem menor ou melhor qualidade.'
        } else if (msg.includes('image') || msg.includes('photo')) {
          errorMessage = 'Não foi possível ler a imagem. Verifique se a foto está nítida e bem iluminada.'
        } else {
          errorMessage = extractionError.message
        }
      }
      
      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          details: process.env.NODE_ENV === 'development' ? extractionError instanceof Error ? extractionError.stack : null : null
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Erro geral:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error 
          ? error.message 
          : 'Erro inesperado ao processar a imagem. Tente novamente.'
      },
      { status: 500 }
    )
  }
}