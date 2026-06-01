// src/app/api/fichas-tecnicas/atualizar-por-produto/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
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
          userId: session.user.id
        }
      })
    }
    
    if (!produtoMaisRecente && produto_nome) {
      const produtos = await prisma.produto.findMany({
        where: {
          userId: session.user.id,
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

    // Buscar todas as fichas técnicas do usuário com seus itens
    const fichas = await prisma.fichaTecnica.findMany({
      where: { userId: session.user.id },
      include: {
        fichaItems: true
      }
    })

    let fichasAtualizadas = 0
    const fichasDetalhes = []

    for (const ficha of fichas) {
      let ingredientesModificados = false
      const itensAtualizados = []

      for (const item of ficha.fichaItems) {
        // Verificar se o item corresponde ao produto (não atualizar produtos acabados)
        if (!item.isProdutoAcabado && item.produtoId === produtoMaisRecente.id) {
          const precoAntigo = Number(item.valorUnitario)
          
          if (Math.abs(precoAntigo - novoPreco) > 0.01) {
            console.log(`Atualizando ficha "${ficha.nome}": ${item.produtoId} - R$ ${precoAntigo} -> R$ ${novoPreco}`)
            
            itensAtualizados.push({
              ...item,
              valorUnitario: novoPreco,
              custo: item.quantidade * novoPreco,
              unidade: novaUnidade
            })
            ingredientesModificados = true
          } else {
            itensAtualizados.push(item)
          }
        } else {
          itensAtualizados.push(item)
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