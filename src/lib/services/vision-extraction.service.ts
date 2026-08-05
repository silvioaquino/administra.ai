// src/lib/services/vision-extraction.service.ts

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai'
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
  private maxRetries: number

  constructor(options?: { optimizationEnabled?: boolean, maxRetries?: number }) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY não configurada. Configure no .env.local')
    }
    const genAI = new GoogleGenerativeAI(apiKey)
    this.model = genAI.getGenerativeModel({
      model: 'gemini-3-flash-preview'
    })
    this.optimizationEnabled = options?.optimizationEnabled !== false
    this.maxRetries = options?.maxRetries || 2
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

**Para imagens de baixa qualidade:**
- Tente identificar mesmo textos parcialmente visíveis
- Use o contexto para preencher informações faltantes
- Se o QR Code estiver visível, extraia a chave de acesso

**IMPORTANTE:** Retorne APENAS o JSON válido, sem markdown, sem texto explicativo.`
  }

  async extractFromImage(imageBase64: string): Promise<NFeData> {
    let lastError: Error | null = null
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🔄 Tentativa ${attempt + 1}/${this.maxRetries + 1} de extração`)
        
        // 1. Otimizar imagem
        let optimizedImage = imageBase64
        if (this.optimizationEnabled) {
          try {
            optimizedImage = await ImageOptimizationService.optimizeImage(imageBase64, 768)
            console.log('✅ Imagem otimizada com sucesso')
          } catch (optimizationError) {
            console.warn('⚠️ Falha na otimização, usando imagem original:', optimizationError)
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
        console.log('📝 Resposta do Gemini recebida, tamanho:', responseText.length)
        
        // 3. Extrair JSON da resposta
        let jsonString = responseText
        const jsonMatch = responseText.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          jsonString = jsonMatch[0]
        }

        // 4. Parse do JSON
        const data = JSON.parse(jsonString)
        
        // 5. Validar dados
        const validatedData = this.validateAndNormalize(data)
        
        // 6. Verificar se tem produtos
        if (!validatedData.produtos || validatedData.produtos.length === 0) {
          throw new Error('Nenhum produto encontrado na nota fiscal')
        }

        console.log(`✅ Extração bem-sucedida: ${validatedData.produtos.length} produtos encontrados`)
        return validatedData
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        console.error(`❌ Erro na tentativa ${attempt + 1}:`, lastError.message)
        
        // Se não for a última tentativa, espera antes de tentar novamente
        if (attempt < this.maxRetries) {
          const waitTime = (attempt + 1) * 1000
          console.log(`⏳ Aguardando ${waitTime}ms antes de tentar novamente...`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
        }
      }
    }

    // Se chegou aqui, todas as tentativas falharam
    throw new Error(
      `Não foi possível extrair os dados da imagem após ${this.maxRetries + 1} tentativas. ` +
      `Último erro: ${lastError?.message || 'Erro desconhecido'}. ` +
      `Verifique se a foto está nítida e mostra claramente a nota fiscal.`
    )
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