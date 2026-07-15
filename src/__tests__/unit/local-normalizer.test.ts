import { describe, it, expect } from 'vitest'
import {
  limparTexto,
  inferirUnidadeQuantidade,
  sugerirCategoria,
  normalizarLocalmente,
} from '@/lib/services/local-normalizer'

describe('local-normalizer', () => {
  it('remove unidade/quantidade e aplica Title Case', () => {
    expect(limparTexto('LEITE INTEGRAL 1L')).toBe('Leite Integral')
    expect(limparTexto('SABÃO EM PÓ 500G')).toBe('Sabão Pó')
  })

  it('remove número puro e stopwords', () => {
    expect(limparTexto('ARROZ TIPO 1 5KG')).toBe('Arroz')
  })

  it('remove duplicatas de palavras', () => {
    expect(limparTexto('BIS BIS BIS').split(' ')).toEqual(['Bis'])
  })

  it('inferirUnidadeQuantidade extrai unidade e quantidade', () => {
    expect(inferirUnidadeQuantidade('LEITE 1L')).toEqual({ unidade: 'L', quantidade: 1 })
    expect(inferirUnidadeQuantidade('ARROZ 5 KG')).toEqual({ unidade: 'KG', quantidade: 5 })
    expect(inferirUnidadeQuantidade('SEM UNIDADE')).toEqual({ unidade: null, quantidade: null })
  })

  it('sugerirCategoria reconhece palavras-chave', () => {
    expect(sugerirCategoria('LEITE INTEGRAL')).toBe('Laticínios')
    expect(sugerirCategoria('REFRI COLA')).toBe('Bebidas')
    expect(sugerirCategoria('XYZ GENERICO')).toBeNull()
  })

  it('normalizarLocalmente marca fonte local e precisaRevisao', () => {
    const r = normalizarLocalmente('LEITE 1L', 'UN')
    expect(r.fonteDados).toBe('NORMALIZACAO_LOCAL')
    expect(r.precisaRevisao).toBe(true)
    expect(r.nomeNormalizado).toBe('Leite')
    expect(r.codigoBarras).toBeNull()
  })
})
