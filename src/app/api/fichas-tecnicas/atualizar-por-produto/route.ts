// src/app/api/fichas-tecnicas/atualizar-por-produto/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Tipos para evitar implicit any
type FichaItemUpdate = {
  id: string
  fichaId: string
  produtoId: number
  quantidade: number
  unidade: string
  valorUnitario: number
  custo: number
  isProdutoAcabado: boolean
}

type FichaDetalhe = {
  id: string
  nome: string
  custoAntigo: number
  custoNovo: number
  margemAntiga: number
  margemNova: number
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const empresaId = session.user.empresaId;
  if (!empresaId) {
    return NextResponse.json({ error: "Empresa não encontrada" }, { status: 401 });
  }

  try {
    const body = await request.json()
    const { produto_nome, produto_id } = body

    if (!produto_nome && !produto_id) {
      return NextResponse.json({ error: "Produto não identificado" }, { status: 400 })
    }

    console.log(`=== ATUALIZANDO FICHAS PARA PRODUTO: ${produto_nome} (ID: ${produto_id}) ===`)

    // Buscar o produto mais recente
    let produtoMaisRecente = null

    if (produto_id) {
      produtoMaisRecente = await prisma.produto.findFirst({
        where: {
          id: parseInt(produto_id.toString()),
          empresaId
        }
      })
    }

    if (!produtoMaisRecente && produto_nome) {
      const produtos = await prisma.produto.findMany({
        where: {
          empresaId,
          descricao: {
            contains: produto_nome,
            mode: "insensitive"
          }
        },
        orderBy: { createdAt: "desc" }
      })

      if (produtos.length > 0) {
        produtoMaisRecente = produtos[0]
      }
    }

    if (!produtoMaisRecente) {
      return NextResponse.json({
        success: false,
        message: `Produto não encontrado: ${produto_nome}`
      })
    }

    const novoPreco = Number(produtoMaisRecente.valorUnitario) || Number(produtoMaisRecente.precoVenda) || 0
    const novoNome = produtoMaisRecente.descricao
    const novaUnidade = produtoMaisRecente.unidade || "UN"

    console.log(`Produto encontrado: ${novoNome} - Preço: R$ ${novoPreco}`)

    // Buscar todas as fichas técnicas da empresa com seus itens
    const fichas = await prisma.fichaTecnica.findMany({
      where: { empresaId },
      include: {
        fichaItems: true
      }
    })

    let fichasAtualizadas = 0
    const fichasDetalhes: FichaDetalhe[] = []

    for (const ficha of fichas) {
      let ingredientesModificados = false
      const itensAtualizados: FichaItemUpdate[] = []

      for (const item of ficha.fichaItems) {
        // Verificar se o item corresponde ao produto (não atualizar produtos acabados)
        if (!item.isProdutoAcabado && item.produtoId === produtoMaisRecente.id) {
          const precoAntigo = Number(item.valorUnitario)

          if (Math.abs(precoAntigo - novoPreco) > 0.01) {
            console.log(`Atualizando ficha "${ficha.nome}": ${item.produtoId} - R$ ${precoAntigo} -> R$ ${novoPreco}`)

            itensAtualizados.push({
              id: item.id,
              fichaId: item.fichaId,
              produtoId: item.produtoId,
              quantidade: item.quantidade,
              unidade: novaUnidade,
              valorUnitario: novoPreco,
              custo: item.quantidade * novoPreco,
              isProdutoAcabado: item.isProdutoAcabado
            })
            ingredientesModificados = true
          } else {
            itensAtualizados.push({
              id: item.id,
              fichaId: item.fichaId,
              produtoId: item.produtoId,
              quantidade: item.quantidade,
              unidade: item.unidade || novaUnidade,
              valorUnitario: Number(item.valorUnitario),
              custo: Number(item.custo || 0),
              isProdutoAcabado: item.isProdutoAcabado
            })
          }
        } else {
          itensAtualizados.push({
            id: item.id,
            fichaId: item.fichaId,
            produtoId: item.produtoId,
            quantidade: item.quantidade,
            unidade: item.unidade || novaUnidade,
            valorUnitario: Number(item.valorUnitario || 0),
            custo: Number(item.custo || 0),
            isProdutoAcabado: item.isProdutoAcabado
          })
        }
      }

      if (ingredientesModificados) {
        // Recalcular custos da ficha
        const novoCustoTotal = itensAtualizados.reduce((sum, item) => sum + Number(item.custo || 0), 0)
        const rendimento = ficha.rendimentoPorcoes || 1
        const novoCustoPorPorcao = novoCustoTotal / rendimento
        const precoVenda = Number(ficha.precoVenda) || 0
        const novaMargem = precoVenda > 0 ? ((precoVenda - novoCustoTotal) / precoVenda) * 100 : 0

        // Atualizar os itens e a ficha em uma transação
        await prisma.$transaction(async (tx) => {
          // Atualizar cada item individualmente
          for (const item of itensAtualizados) {
            if (Math.abs(Number(item.valorUnitario) - novoPreco) > 0.01) {
              await tx.fichaItem.update({
                where: { id: item.id },
                data: {
                  valorUnitario: novoPreco,
                  custo: item.quantidade * novoPreco,
                  unidade: novaUnidade
                }
              })
            }
          }

          // Atualizar a ficha
          await tx.fichaTecnica.update({
            where: { id: ficha.id },
            data: {
              custoTotal: novoCustoTotal,
              custoPorPorcao: novoCustoPorPorcao,
              margem: novaMargem,
              updatedAt: new Date()
            }
          })
        })

        fichasAtualizadas++
        fichasDetalhes.push({
          id: ficha.id,
          nome: ficha.nome,
          custoAntigo: Number(ficha.custoTotal),
          custoNovo: novoCustoTotal,
          margemAntiga: Number(ficha.margem),
          margemNova: novaMargem
        })
      }
    }

    console.log(`${fichasAtualizadas} fichas atualizadas para o produto ${novoNome}`)

    return NextResponse.json({
      success: true,
      message: `${fichasAtualizadas} ficha(s) atualizada(s) com o novo preço do produto`,
      produto: {
        id: produtoMaisRecente.id,
        nome: novoNome,
        precoNovo: novoPreco,
        unidade: novaUnidade
      },
      fichasAtualizadas,
      detalhes: fichasDetalhes
    })

  } catch (error) {
    console.error("Erro ao atualizar fichas:", error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    )
  }
}