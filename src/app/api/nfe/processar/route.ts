// src/app/api/nfe/processar/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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
    const quantidade = extractNumber(prodSection, 'qCom') || extractNumber(prodSection, 'qTrib')
    const valorUnitario = extractNumber(prodSection, 'vUnCom') || extractNumber(prodSection, 'vUnTrib')
    const valorTotalProduto = extractNumber(prodSection, 'vProd')

    if (descricao) {
      produtos.push({
        codigo,
        descricao,
        ncm,
        unidade,
        quantidade,
        valor_unitario: valorUnitario,
        valor_total: valorTotalProduto,
      })
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
  }
}