// src/app/api/nfe/processar/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ProductNormalizationService } from '@/lib/services/product-normalization.service'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { xmlContent, url } = body

    let xmlString = ''

    if (url) {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })

      if (!response.ok) {
        throw new Error(`Erro ao buscar URL: ${response.status}`)
      }

      xmlString = await response.text()
    } else if (xmlContent) {
      xmlString = xmlContent
    } else {
      return NextResponse.json(
        { success: false, error: 'Nenhum XML ou URL fornecido' },
        { status: 400 }
      )
    }

    if (!xmlString.trim().startsWith('<')) {
      throw new Error('O conteúdo não parece ser um XML válido')
    }

    // APENAS extrai os dados do XML, NÃO SALVA NO BANCO
    const dados = extrairDadosDoXML(xmlString)

    return NextResponse.json({
      success: true,
      data: dados,
    })

  } catch (error) {
    console.error('Erro ao processar XML:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao processar o XML. Verifique se o arquivo é uma NF-e válida.',
      },
      { status: 500 }
    )
  }
}

function extrairDadosDoXML(xml: string) {
  function extractTag(content: string, tag: string): string {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i')
    const match = content.match(regex)
    return match ? match[1].trim() : ''
  }

  function extractNumber(content: string, tag: string): number {
    const value = extractTag(content, tag)
    return value ? parseFloat(value.replace(',', '.')) : 0
  }

  const emitSection = extractTag(xml, 'emit')
  const nomeEmitente = extractTag(emitSection, 'xNome') || 'Não informado'
  const cnpjEmitente = extractTag(emitSection, 'CNPJ') || extractTag(emitSection, 'CPF') || 'Não informado'

  const ideSection = extractTag(xml, 'ide')
  const numero = extractTag(ideSection, 'nNF') || 'Não informado'
  const serie = extractTag(ideSection, 'serie') || '1'
  const chaveAcesso = extractTag(xml, 'chave') || extractTag(ideSection, 'cNF') || ''

  let dataEmissao = extractTag(ideSection, 'dEmi')
  if (!dataEmissao) {
    const dhEmi = extractTag(ideSection, 'dhEmi')
    dataEmissao = dhEmi.split('T')[0]
  }
  if (!dataEmissao) {
    dataEmissao = new Date().toISOString().split('T')[0]
  }

  const totalSection = extractTag(xml, 'total')
  const icmsTotSection = extractTag(totalSection, 'ICMSTot')
  const valorTotal = extractNumber(icmsTotSection, 'vNF')

  const produtos: any[] = []
  const detRegex = /<det[^>]*>([\s\S]*?)<\/det>/gi
  let match: RegExpExecArray | null

  while ((match = detRegex.exec(xml)) !== null) {
    const produtoXml = match[1]
    const prodSection = extractTag(produtoXml, 'prod')

    const codigo = extractTag(prodSection, 'cProd')
    const descricao = extractTag(prodSection, 'xProd')
    const ncm = extractTag(prodSection, 'NCM')
    const unidade = extractTag(prodSection, 'uCom') || extractTag(prodSection, 'uTrib') || 'UN'
    const cEAN = extractTag(prodSection, 'cEAN')
    const cEANTrib = extractTag(prodSection, 'cEANTrib')
    const codigoBarras = ProductNormalizationService.validarGtin(cEAN) ?? ProductNormalizationService.validarGtin(cEANTrib)
    const quantidade = extractNumber(prodSection, 'qCom') || extractNumber(prodSection, 'qTrib')
    const valorUnitario = extractNumber(prodSection, 'vUnCom') || extractNumber(prodSection, 'vUnTrib')
    const valorTotalProduto = extractNumber(prodSection, 'vProd')

    if (descricao) {
      produtos.push({
        codigo,
        descricao,
        codigoBarras,
        ncm,
        unidade,
        quantidade,
        valor_unitario: valorUnitario,
        valor_total: valorTotalProduto,
      })
    }
  }

  // Mapear códigos de pagamento (tPag) para nomes
  const formaPagamentoMap: Record<string, string> = {
    '01': 'Dinheiro',
    '02': 'Cheque',
    '03': 'Cartão de Crédito',
    '04': 'Cartão de Débito',
    '05': 'Crédito de Conta',
    '08': 'Boleto',
    '09': 'Título de Crédito',
    '10': 'Financiamento',
    '11': 'PIX',
    '12': 'Compensação Tesouraria',
    '13': 'Conta Corrente',
    '14': 'Conta Poupança',
    '15': 'Conta Corrente Conjunto',
    '16': 'Conta Poupança Conjunto',
    '99': 'Outros',
  }

  const formasPagamento: Array<{ forma: string; valor: number }> = []
  const detPagRegex = /<detPag[^>]*>([\s\S]*?)<\/detPag>/gi
  let detPagMatch: RegExpExecArray | null

  while ((detPagMatch = detPagRegex.exec(xml)) !== null) {
    const detPagContent = detPagMatch[1]
    const tPag = extractTag(detPagContent, 'tPag')
    const vPag = extractNumber(detPagContent, 'vPag')
    if (tPag) {
      const forma = formaPagamentoMap[tPag] || 'Outros'
      formasPagamento.push({ forma, valor: vPag })
    }
  }

  return {
    nome_emitente: nomeEmitente,
    cnpj_emitente: cnpjEmitente,
    numero,
    serie,
    chave_acesso: chaveAcesso,
    data_emissao: dataEmissao,
    valor_total: valorTotal,
    produtos,
    formas_pagamento: formasPagamento,
  }
}