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

    // Buscar o produto mais recente com este nome
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
      // Busca produtos com nome similar (case insensitive)
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

    // Buscar todas as fichas técnicas do usuário
    const fichas = await prisma.fichaTecnica.findMany({
      where: { userId: session.user.id }
    })

    let fichasAtualizadas = 0
    const fichasDetalhes = []

    for (const ficha of fichas) {
      if (!ficha.ingredientes) continue

      try {
        const ingredientes = JSON.parse(ficha.ingredientes)
        if (!Array.isArray(ingredientes)) continue

        let ingredientesModificados = false
        const novosIngredientes = []

        for (const ing of ingredientes) {
          // Não atualizar produtos acabados automaticamente
          if (ing.isProdutoAcabado) {
            novosIngredientes.push(ing)
            continue
          }

          const nomeIng = (ing.nome || "").toLowerCase().trim()
          const nomeProduto = produto_nome.toLowerCase().trim()

          if (nomeIng === nomeProduto || nomeIng.includes(nomeProduto) || nomeProduto.includes(nomeIng)) {
            const precoAntigo = ing.valorUnitario || 0
            
            if (Math.abs(precoAntigo - novoPreco) > 0.01) {
              console.log(`Atualizando ficha "${ficha.nome}": ${ing.nome} - R$ ${precoAntigo} -> R$ ${novoPreco}`)
              
              ing.valorUnitario = novoPreco
              ing.custo = (ing.quantidade || 0) * novoPreco
              ing.unidade = novaUnidade
              ing.produtoId = produtoMaisRecente.id
              ingredientesModificados = true
              novosIngredientes.push(ing)
            } else {
              novosIngredientes.push(ing)
            }
          } else {
            novosIngredientes.push(ing)
          }
        }

        if (ingredientesModificados) {
          // Recalcular custos da ficha
          const novoCustoTotal = novosIngredientes.reduce((sum, ing) => sum + (ing.custo || 0), 0)
          const rendimento = ficha.rendimentoPorcoes || 1
          const novoCustoPorPorcao = novoCustoTotal / rendimento
          const precoVenda = Number(ficha.precoVenda) || 0
          const novaMargem = precoVenda > 0 ? ((precoVenda - novoCustoTotal) / precoVenda) * 100 : 0

          await prisma.fichaTecnica.update({
            where: { id: ficha.id },
            data: {
              custoTotal: novoCustoTotal,
              custoPorPorcao: novoCustoPorPorcao,
              margem: novaMargem,
              ingredientes: JSON.stringify(novosIngredientes),
              updatedAt: new Date()
            }
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
      } catch (e) {
        console.error(`Erro ao processar ficha ${ficha.id}:`, e)
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