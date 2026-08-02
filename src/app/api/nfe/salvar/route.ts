// src/app/api/nfe/salvar/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ProductNormalizationService } from '@/lib/services/product-normalization.service'
import { ConversionService } from '@/lib/services/conversion.service'
import { encontrarNotaDuplicada } from '@/lib/nfe/duplicidade'


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
    const { nota, produtos, contaDespesa, dataCompra, valorTotal, formaPagamento, desconto, formasPagamento } = body
    const userId = session.user.id
    const empresaId = session.user.empresaId

    if (!empresaId) {
      return NextResponse.json(
        { success: false, error: 'Empresa não encontrada na sessão' },
        { status: 400 }
      )
    }

    // Verificar duplicidade: chave de acesso OU número + série + CNPJ do emitente
    const notaFiscalExistente = await encontrarNotaDuplicada(prisma, {
      empresaId,
      chaveAcesso: nota.chave_acesso,
      numero: nota.numero,
      serie: nota.serie,
      cnpjEmitente: nota.cnpj_emitente,
    })

    if (notaFiscalExistente) {
      return NextResponse.json(
        {
          success: false,
          duplicada: true,
          error: `Nota já lançada: nº ${notaFiscalExistente.numero}/série ${notaFiscalExistente.serie} de ${notaFiscalExistente.nomeEmitente}`,
          notaExistente: {
            id: notaFiscalExistente.id,
            numero: notaFiscalExistente.numero,
            serie: notaFiscalExistente.serie,
            nomeEmitente: notaFiscalExistente.nomeEmitente,
            cnpjEmitente: notaFiscalExistente.cnpjEmitente,
            dataEmissao: notaFiscalExistente.dataEmissao,
            chaveAcesso: notaFiscalExistente.chaveAcesso,
          },
        },
        { status: 409 }
      )
    }


    const [year, month, day] = nota.data_emissao.split('-').map(Number)
    const dataEmissao = new Date(year, month - 1, day)

    // Normalizar produtos (GTIN -> Open Food Facts -> fallback local).
    // Isolado da transação: qualquer falha NÃO bloqueia o salvamento da nota.
    const produtosNormalizados = produtos.map((p: any) =>
      ProductNormalizationService.fallbackLocal({
        descricao: p.descricao,
        codigoBarras: p.codigoBarras,
        unidade: p.unidade,
      })
    )
    try {
      const normalizados = await ProductNormalizationService.normalizarLote(
        produtos.map((p: any) => ({
          descricao: p.descricao,
          codigoBarras: p.codigoBarras,
          unidade: p.unidade,
        }))
      )
      normalizados.forEach((n, i) => {
        produtosNormalizados[i] = n
      })
    } catch (error) {
      console.warn('[NFe] Normalização falhou; usando fallback local para todos os itens', error)
    }

    // Criar a nota fiscal com produtos e pagamento
    const notaFiscal = await prisma.notaFiscal.create({
      data: {
        userId: userId,
        empresaId: empresaId,
        chaveAcesso: nota.chave_acesso,
        numero: parseInt(nota.numero) || 0,
        serie: parseInt(nota.serie) || 1,
        dataEmissao,
        cnpjEmitente: nota.cnpj_emitente,
        nomeEmitente: nota.nome_emitente,
        valorTotal: valorTotal || nota.valor_total,
        valorDesconto: desconto || 0,
        produtos: {
          create: produtos.map((p: any, i: number) => {
            const n = produtosNormalizados[i]
            return {
              userId: userId,
              empresaId: empresaId,
              codigo: p.codigo || '',
              descricao: p.descricao,
              codigoBarras: n.codigoBarras || p.codigoBarras || null,
              nomeNormalizado: n.nomeNormalizado,
              marca: n.marca,
              categoriaSugestao: n.categoria,
              unidadeMedida: n.unidade,
              fonteDados: n.fonteDados,
              precisaRevisao: n.precisaRevisao,
              normalizadoEm: n.normalizadoEm,
              unidade: p.unidade || 'UN',
              quantidade: p.quantidade || 0,
              valorUnitario: p.valor_unitario || 0,
              valorTotal: p.valor_total || 0,
              pesoUnitario: ConversionService.toGrams(n.quantidade ?? undefined, n.unidade) ?? 0,
              fornecedor: nota.nome_emitente || '',
              dataCompra: new Date(dataCompra),
              precoVenda: (p.valor_unitario || 0) * 1.3,
              formaPagamento: formaPagamento || 'À vista',
            }
          })
        },
        pagamentos: {
          create: (formasPagamento && formasPagamento.length > 0)
            ? formasPagamento.map((fp: any) => ({
                userId: userId,
                empresaId: empresaId,
                formaPagamento: fp.forma,
                valor: fp.valor,
              }))
            : [{
                userId: userId,
                empresaId: empresaId,
                formaPagamento: formaPagamento || 'À vista',
                valor: valorTotal || nota.valor_total,
              }]
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: notaFiscal
    })

  } catch (error) {
    console.error('Erro ao salvar nota fiscal:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao salvar nota fiscal'
      },
      { status: 500 }
    )
  }
}