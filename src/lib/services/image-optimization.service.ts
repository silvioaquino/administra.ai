// src/lib/services/image-optimization.service.ts

import sharp from 'sharp'

export class ImageOptimizationService {
  private static readonly TARGET_SIZE = 768
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

  /**
   * Redimensiona e otimiza uma imagem para processamento.
   * Usa sharp (server-side) para redimensionar mantendo proporção e comprimir.
   * @param imageBase64 - Imagem em data URI base64 (ex: "data:image/jpeg;base64,...")
   * @param targetSize - Tamanho alvo da dimensão maior (padrão: 768px)
   * @returns Imagem otimizada em data URI base64 (sempre JPEG)
   */
  static async optimizeImage(
    imageBase64: string,
    targetSize: number = this.TARGET_SIZE,
  ): Promise<string> {
    // Parse data URI: "data:image/jpeg;base64,/9j/..."
    const match = imageBase64.match(/^data:(image\/\w+);base64,(.+)$/)
    if (!match) {
      throw new Error(
        'Formato de imagem base64 inválido. Esperado: data:image/<type>;base64,<data>',
      )
    }

    const [, , base64Data] = match
    const imageBuffer = Buffer.from(base64Data, 'base64')

    const result = await sharp(imageBuffer)
      .rotate() // corrige orientação baseado em EXIF
      .flatten({ background: { r: 255, g: 255, b: 255 } }) // remove alpha (PNG transparente → JPEG)
      .resize(targetSize, targetSize, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({
        quality: 82,
        progressive: true,
        mozjpeg: true,
      })
      .toBuffer()

    const optimizedBase64 = result.toString('base64')
    return `data:image/jpeg;base64,${optimizedBase64}`
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
      savingsMB,
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
   * Versão server-side (Node.js) usando sharp com Buffer de entrada/saída.
   * Útil para processamento no servidor quando já se tem um Buffer.
   */
  static async optimizeImageServerSide(
    imageBuffer: Buffer,
    targetSize: number = this.TARGET_SIZE,
  ): Promise<Buffer> {
    return sharp(imageBuffer)
      .rotate()
      .flatten({ background: { r: 255, g: 255, b: 255 } })
      .resize(targetSize, targetSize, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({
        quality: 82,
        progressive: true,
        mozjpeg: true,
      })
      .toBuffer()
  }
}
