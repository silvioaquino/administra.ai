// src/lib/nfe/duplicidade.ts
import type { PrismaClient } from '@prisma/client'

export interface DadosNotaIdentificacao {
  empresaId: string
  chaveAcesso?: string | null
  numero?: string | number | null
  serie?: string | number | null
  cnpjEmitente?: string | null
}

export function somenteDigitos(valor?: string | null): string {
  return (valor || '').replace(/\D/g, '')
}

/**
 * Localiza uma nota já lançada:
 * 1) pela chave de acesso da NFC-e/NF-e (44 dígitos), ou
 * 2) pela combinação número + série + CNPJ do emitente (dentro da mesma empresa).
 */
export async function encontrarNotaDuplicada(
  prisma: PrismaClient,
  dados: DadosNotaIdentificacao
) {
  const chave = somenteDigitos(dados.chaveAcesso)
  const cnpj = somenteDigitos(dados.cnpjEmitente)
  const numero = parseInt(String(dados.numero ?? ''), 10)
  const serie = parseInt(String(dados.serie ?? ''), 10)

  if (chave.length === 44) {
    const porChave = await prisma.notaFiscal.findUnique({
      where: { chaveAcesso: chave },
    })
    if (porChave) return porChave
  }

  if (dados.chaveAcesso && chave.length !== 44) {
    const porChaveBruta = await prisma.notaFiscal.findUnique({
      where: { chaveAcesso: dados.chaveAcesso },
    })
    if (porChaveBruta) return porChaveBruta
  }

  if (!dados.empresaId || !cnpj || !Number.isFinite(numero) || numero <= 0) {
    return null
  }

  const candidatos = await prisma.notaFiscal.findMany({
    where: {
      empresaId: dados.empresaId,
      numero,
      ...(Number.isFinite(serie) ? { serie } : {}),
    },
  })

  return candidatos.find(n => somenteDigitos(n.cnpjEmitente) === cnpj) ?? null
}
