// src/lib/services/vision-extraction.service.ts

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai'
import { ProductNormalizationService } from './product-normalization.service'
import { ImageOptimizationService } from './image-optimization.service'

export interface NFeData {
  nome_emitente: string
  cnpj_emitente: string
  numero: string
  serie: string
  chave_acesso: string
  data_emissao: string
  valor_total: number
  produtos: Array<{
    codigo: string
    descricao: string
    codigoBarras: string | null
    ncm: string
    unidade: string
    quantidade: number
    valor_unitario: number
    valor_total: number
  }>
  desconto?: number
  formas_pagamento?: Array<{
    forma: string
    valor: number
  }>
}

export class VisionExtractionService {
  private model: GenerativeModel
  private optimizationEnabled: boolean

  constructor(options?: { optimizationEnabled?: boolean }) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY não configurada')
    }
    const genAI = new GoogleGenerativeAI(apiKey)
    this.model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash'
    })
    this.optimizationEnabled = options?.optimizationEnabled !== false
  }

  private buildPrompt(): string {
    return `Você é um especialista em extração de dados de NFC-e (Nota Fiscal de Consumidor Eletrônica) e NF-e a partir de imagens.

**Instruções:**
1. Analise a imagem fornecida (pode ser DANFE completo, cupom fiscal ou foto do documento)
2. Extraia TODAS as informações necessárias da NFC-e/NF-e
3. Retorne APENAS um JSON válido com os dados estruturados, sem texto adicional

**Formato de saída obrigatório:**
{
  "nome_emitente": "Nome do estabelecimento",
  "cnpj_emitente": "CNPJ do emitente (apenas números)",
  "numero": "Número da nota fiscal",
  "serie": "Série da nota fiscal",
  "chave_acesso": "Chave de acesso de 44 dígitos",
  "data_emissao": "AAAA-MM-DD",
  "valor_total": 0.00,
  "desconto": 0.00,
  "formas_pagamento": [
    {"forma": "Dinheiro", "valor": 0.00}
  ],
  "produtos": [
    {
      "codigo": "Código do produto",
      "descricao": "Descrição do produto",
      "codigoBarras": "Código de barras ou null",
      "ncm": "NCM do produto",
      "unidade": "UN, KG, M, etc",
      "quantidade": 0.000,
      "valor_unitario": 0.00,
      "valor_total": 0.00
    }
  ]
}

**Regras importantes:**
- Extraia TODOS os produtos listados na nota
- Valores numéricos com 2-3 casas decimais
- CNPJ apenas números (14 dígitos)
- Data no formato ISO (AAAA-MM-DD)
- Chave de acesso tem 44 dígitos
- Use null para campos não encontrados
- A forma de pagamento deve ser: "Dinheiro", "Cartão de Crédito", "Cartão de Débito", "PIX", "Boleto", "Cheque"
- VALIDE os dados: CNPJ tem 14 dígitos, chave tem 44 dígitos
- Se não encontrar um campo, coloque null

**IMPORTANTE:** Retorne APENAS o JSON válido, sem markdown, sem texto explicativo.`
  }

  async extractFromImage(imageBase64: string): Promise<NFeData> {
    try {
      // 1. Otimizar imagem (redimensionar e comprimir)
      let optimizedImage = imageBase64
      let originalSize = Buffer.from(imageBase64.split(',')[1] || imageBase64, 'base64').length

      if (this.optimizationEnabled) {
        console.log('🖼️ Otimizando imagem para redução de custos...')
        
        try {
          // Redimensionar para 768x768 mantendo proporção
          optimizedImage = await ImageOptimizationService.optimizeImage(imageBase64, 768)
          
          // Calcular economia
          const optimizedSize = Buffer.from(optimizedImage.split(',')[1] || optimizedImage, 'base64').length
          const savings = ImageOptimizationService.calculateSavings(originalSize, optimizedImage)
          
          console.log(`📊 Economia: ${savings.savingsPercent.toFixed(1)}% (${savings.savingsMB.toFixed(2)} MB economizados)`)
          console.log(`📏 Tamanho original: ${savings.originalSizeMB.toFixed(2)} MB → ${savings.optimizedSizeMB.toFixed(2)} MB`)
          
        } catch (optimizationError) {
          console.warn('⚠️ Falha na otimização, usando imagem original:', optimizationError)
          optimizedImage = imageBase64
        }
      }

      // 2. Enviar para o Gemini
      const prompt = this.buildPrompt()
      
      const result = await this.model.generateContent([
        prompt,
        {
          inlineData: {
            data: optimizedImage.replace(/^data:image\/\w+;base64,/, ''),
            mimeType: this.getMimeType(optimizedImage)
          }
        }
      ])

      const responseText = result.response.text()
      
      // 3. Extrair JSON da resposta
      let jsonString = responseText
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        jsonString = jsonMatch[0]
      }

      const data = JSON.parse(jsonString)
      
      // 4. Validar e normalizar os dados
      return this.validateAndNormalize(data)
      
    } catch (error) {
      console.error('Erro na extração por visão:', error)
      throw new Error('Falha ao extrair dados da imagem. Verifique se a foto está nítida.')
    }
  }

  private getMimeType(base64: string): string {
    if (base64.startsWith('data:image/jpeg')) return 'image/jpeg'
    if (base64.startsWith('data:image/png')) return 'image/png'
    if (base64.startsWith('data:image/webp')) return 'image/webp'
    if (base64.startsWith('data:image/heic')) return 'image/heic'
    return 'image/jpeg'
  }

  private validateAndNormalize(data: any): NFeData {
    // Validar CNPJ
    const cnpj = data.cnpj_emitente?.replace(/\D/g, '') || 'Não informado'
    if (cnpj.length === 14) {
      data.cnpj_emitente = cnpj
    }

    // Validar chave de acesso
    const chave = data.chave_acesso?.replace(/\D/g, '') || ''
    if (chave.length === 44) {
      data.chave_acesso = chave
    }

    // Garantir que produtos existe
    if (!data.produtos || !Array.isArray(data.produtos)) {
      data.produtos = []
    }

    // Normalizar produtos
    data.produtos = data.produtos.map((p: any) => ({
      codigo: p.codigo || '',
      descricao: p.descricao || 'Produto não identificado',
      codigoBarras: p.codigoBarras || null,
      ncm: p.ncm || '',
      unidade: p.unidade || 'UN',
      quantidade: Number(p.quantidade) || 0,
      valor_unitario: Number(p.valor_unitario) || 0,
      valor_total: Number(p.valor_total) || 0
    }))

    // Validar valor total
    data.valor_total = Number(data.valor_total) || 0
    
    // Validar desconto
    data.desconto = Number(data.desconto) || 0

    // Validar formas de pagamento
    if (!data.formas_pagamento || !Array.isArray(data.formas_pagamento)) {
      data.formas_pagamento = []
    }

    return data as NFeData
  }
}