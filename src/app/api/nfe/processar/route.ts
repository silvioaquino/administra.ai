import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// REMOVENDO A VERIFICAÇÃO DE AUTENTICAÇÃO TEMPORARIAMENTE
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Usuário não autenticado" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { xmlContent, url } = body
    const userId = session.user.id

    let xmlString = ""

    // Processar por URL ou conteúdo XML direto
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
        { success: false, error: "Nenhum XML ou URL fornecido" },
        { status: 400 }
      )
    }

    // Validar se é um XML válido
    if (!xmlString.trim().startsWith('<')) {
      throw new Error("O conteúdo não parece ser um XML válido")
    }

    // Extrair dados do XML
    const dados = extrairDadosDoXML(xmlString)

    // Salvar nota fiscal no banco
    const notaFiscalExistente = await prisma.notaFiscal.findUnique({
      where: { chaveAcesso: dados.chave_acesso }
    })

    if (!notaFiscalExistente) {
      // Corrigir a data para não usar UTC (que pode voltar o dia)
      const [year, month, day] = dados.data_emissao.split('-').map(Number)
      const dataEmissao = new Date(year, month - 1, day)

      const notaFiscal = await prisma.notaFiscal.create({
        data: {
          userId: userId,
          chaveAcesso: dados.chave_acesso,
          numero: parseInt(dados.numero) || 0,
          serie: parseInt(dados.serie) || 1,
          dataEmissao: dataEmissao,
          cnpjEmitente: dados.cnpj_emitente,
          nomeEmitente: dados.nome_emitente,
          valorTotal: dados.valor_total,
          produtos: {
            create: (dados.produtos || []).map((p: any) => ({
              userId: userId,
              codigo: p.codigo || "",
              descricao: p.descricao,
              unidade: p.unidade || "",
              quantidade: p.quantidade || 0,
              valorUnitario: p.valor_unitario || 0,
              valorTotal: p.valor_total || 0,
            }))
          },
          pagamentos: {
            create: [{
              userId: userId,
              formaPagamento: "À vista",
              valor: dados.valor_total
            }]
          }
        }
      })

      // Atualizar os dados com o ID da nota fiscal criada
      ;(dados as any).notaFiscalId = notaFiscal.id
    } else {
      ;(dados as any).notaFiscalId = notaFiscalExistente.id
    }

    return NextResponse.json({
      success: true,
      data: dados,
    })

  } catch (error) {
    console.error("Erro ao processar XML:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao processar o XML. Verifique se o arquivo é uma NF-e válida.",
      },
      { status: 500 }
    )
  }
}

function extrairDadosDoXML(xml: string) {
  // Função auxiliar para extrair texto entre tags
  function extractTag(content: string, tag: string): string {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i')
    const match = content.match(regex)
    return match ? match[1].trim() : ""
  }

  // Função auxiliar para extrair número (float)
  function extractNumber(content: string, tag: string): number {
    const value = extractTag(content, tag)
    return value ? parseFloat(value.replace(',', '.')) : 0
  }

  // Extrair dados do emitente
  const emitSection = extractTag(xml, 'emit')
  const nomeEmitente = extractTag(emitSection, 'xNome') || "Não informado"
  const cnpjEmitente = extractTag(emitSection, 'CNPJ') || extractTag(emitSection, 'CPF') || "Não informado"

  // Extrair dados da nota (IDE)
  const ideSection = extractTag(xml, 'ide')
  const numero = extractTag(ideSection, 'nNF') || "Não informado"
  const serie = extractTag(ideSection, 'serie') || "1"
  const chaveAcesso = extractTag(xml, 'chave') || extractTag(ideSection, 'cNF') || ""

  let dataEmissao = extractTag(ideSection, 'dEmi')
  if (!dataEmissao) {
    const dhEmi = extractTag(ideSection, 'dhEmi')
    dataEmissao = dhEmi.split('T')[0]
  }
  if (!dataEmissao) {
    dataEmissao = new Date().toISOString().split('T')[0]
  }

  // Extrair valor total
  const totalSection = extractTag(xml, 'total')
  const icmsTotSection = extractTag(totalSection, 'ICMSTot')
  const valorTotal = extractNumber(icmsTotSection, 'vNF')

  // Extrair produtos
  const produtos: any[] = []
  
  const detRegex = /<det[^>]*>([\s\S]*?)<\/det>/gi
  let match

  while ((match = detRegex.exec(xml)) !== null) {
    const produtoXml = match[1]
    const prodSection = extractTag(produtoXml, 'prod')
    
    const codigo = extractTag(prodSection, 'cProd')
    const descricao = extractTag(prodSection, 'xProd')
    const ncm = extractTag(prodSection, 'NCM')
    const unidade = extractTag(prodSection, 'uCom') || extractTag(prodSection, 'uTrib') || "UN"
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
  } as any
}