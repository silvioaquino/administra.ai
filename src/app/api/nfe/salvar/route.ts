// src/app/api/nfe/salvar/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
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
    const { nota, produtos, contaDespesa, dataCompra, valorTotal } = body
    const userId = session.user.id
    const empresaId = session.user.empresaId

    if (!empresaId) {
      return NextResponse.json(
        { success: false, error: 'Empresa não encontrada na sessão' },
        { status: 400 }
      )
    }

    // Verificar se a nota já existe
    const notaFiscalExistente = await prisma.notaFiscal.findUnique({
      where: { chaveAcesso: nota.chave_acesso }
    })

    if (notaFiscalExistente) {
      return NextResponse.json({
        success: true,
        data: notaFiscalExistente,
        message: 'Nota fiscal já existe'
      })
    }

    const [year, month, day] = nota.data_emissao.split('-').map(Number)
    const dataEmissao = new Date(year, month - 1, day)

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
        produtos: {
          create: produtos.map((p: any) => ({
            userId: userId,
            empresaId: empresaId,
            codigo: p.codigo || '',
            descricao: p.descricao,
            unidade: p.unidade || 'UN',
            quantidade: p.quantidade || 0,
            valorUnitario: p.valor_unitario || 0,
            valorTotal: p.valor_total || 0,
            fornecedor: nota.nome_emitente || '',
            dataCompra: new Date(dataCompra),
            precoVenda: (p.valor_unitario || 0) * 1.3
          }))
        },
        pagamentos: {
          create: [{
            userId: userId,
            empresaId: empresaId,
            formaPagamento: 'À vista',
            valor: valorTotal || nota.valor_total
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