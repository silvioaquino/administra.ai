// src/lib/services/image-optimization.service.ts

export class ImageOptimizationService {
  private static readonly TARGET_SIZE = 768
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

  /**
   * Redimensiona e otimiza uma imagem para processamento
   * @param imageBase64 - Imagem em base64
   * @param targetSize - Tamanho alvo (padrão: 768px)
   * @returns Imagem otimizada em base64
   */
  static async optimizeImage(
    imageBase64: string,
    targetSize: number = this.TARGET_SIZE
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const img = new Image()
        img.onload = () => {
          try {
            // Calcular proporção
            let width = img.width
            let height = img.height

            // Redimensionar mantendo proporção
            if (width > height) {
              if (width > targetSize) {
                height = Math.round((height * targetSize) / width)
                width = targetSize
              }
            } else {
              if (height > targetSize) {
                width = Math.round((width * targetSize) / height)
                height = targetSize
              }
            }

            // Criar canvas para redimensionamento
            const canvas = document.createElement('canvas')
            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext('2d')

            if (!ctx) {
              reject(new Error('Não foi possível criar contexto do canvas'))
              return
            }

            // Configurar qualidade
            ctx.imageSmoothingEnabled = true
            ctx.imageSmoothingQuality = 'high'

            // Desenhar imagem redimensionada
            ctx.drawImage(img, 0, 0, width, height)

            // Converter para base64 com compressão
            const quality = this.getOptimalQuality(width, height)
            const optimizedBase64 = canvas.toDataURL('image/jpeg', quality)

            resolve(optimizedBase64)
          } catch (error) {
            reject(error)
          }
        }

        img.onerror = () => {
          reject(new Error('Erro ao carregar imagem para redimensionamento'))
        }

        img.src = imageBase64
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Determina a qualidade ideal baseada no tamanho da imagem
   */
  private static getOptimalQuality(width: number, height: number): number {
    const pixels = width * height
    
    if (pixels < 100000) { // < 300x300
      return 0.95 // Alta qualidade para imagens pequenas
    } else if (pixels < 300000) { // < 500x500
      return 0.92
    } else if (pixels < 500000) { // < 700x700
      return 0.88
    } else { // >= 700x700
      return 0.82 // Boa compressão para imagens grandes
    }
  }

  /**
   * Calcula a economia estimada baseada no tamanho original
   */
  static calculateSavings(originalSize: number, optimizedBase64: string): {
    originalSizeMB: number
    optimizedSizeMB: number
    savingsPercent: number
    savingsMB: number
  } {
    const originalMB = originalSize / (1024 * 1024)
    const optimizedBytes = this.getBase64Size(optimizedBase64)
    const optimizedMB = optimizedBytes / (1024 * 1024)
    
    const savingsMB = originalMB - optimizedMB
    const savingsPercent = originalMB > 0 ? (savingsMB / originalMB) * 100 : 0

    return {
      originalSizeMB: originalMB,
      optimizedSizeMB: optimizedMB,
      savingsPercent,
      savingsMB
    }
  }

  /**
   * Calcula o tamanho em bytes de uma string base64
   */
  private static getBase64Size(base64: string): number {
    // Remover o cabeçalho "data:image/jpeg;base64,"
    const base64Data = base64.split(',')[1] || base64
    // Calcular tamanho: (comprimento * 3) / 4 - padding
    const padding = (base64Data.match(/=+$/) || [''])[0].length || 0
    return Math.floor((base64Data.length * 3) / 4) - padding
  }

  /**
   * Versão server-side (Node.js) usando sharp ou canvas
   * Útil para processamento no servidor
   */
  static async optimizeImageServerSide(
    imageBuffer: Buffer,
    targetSize: number = this.TARGET_SIZE
  ): Promise<Buffer> {
    try {
      // Verificar se sharp está disponível
      const sharp = await this.loadSharpModule()
      
      if (sharp) {
        // Usar sharp para processamento mais rápido
        return await sharp(imageBuffer)
          .resize(targetSize, targetSize, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .jpeg({
            quality: 82,
            progressive: true
          })
          .toBuffer()
      }
      
      // Fallback: usar canvas com JSDOM ou retornar original
      console.warn('Sharp não disponível, usando imagem original')
      return imageBuffer
      
    } catch (error) {
      console.error('Erro no redimensionamento server-side:', error)
      return imageBuffer
    }
  }

  /**
   * Tenta carregar o módulo sharp dinamicamente
   */
  private static async loadSharpModule(): Promise<any> {
    try {
      const sharp = await import('sharp')
      return sharp.default || sharp
    } catch {
      return null
    }
  }
}