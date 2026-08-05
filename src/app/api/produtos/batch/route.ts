// src/app/api/produtos/batch/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ProductNormalizationService } from "@/lib/services/product-normalization.service"

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const produtos = await request.json()

    const empresaId = session.user.empresaId || ""
    const created = []
    for (const prod of produtos) {
      // Corrigir data para não usar UTC
      let dataCompraDate: Date | null = null
      if (prod.data_compra) {
        const [year, month, day] = prod.data_compra.split('-').map(Number)
        dataCompraDate = new Date(year, month - 1, day)
      }

      // Normalizar produto (DB lookup -> cache -> API OFF -> fallback local)
      let normalizado
      try {
        normalizado = await ProductNormalizationService.normalizarProduto(
          {
            descricao: prod.descricao,
            codigoBarras: prod.codigo_barras || prod.codigoBarras || null,
            unidade: prod.unidade || "UN",
          },
          { empresaId },
        )
      } catch (normError) {
        console.warn("Normalização falhou; usando dados brutos:", normError)
        normalizado = {
          nomeNormalizado: prod.descricao,
          codigoBarras: prod.codigo_barras || prod.codigoBarras || null,
          marca: null,
          categoria: null,
          unidade: prod.unidade || "UN",
          fonteDados: "NORMALIZACAO_LOCAL" as const,
          precisaRevisao: true,
          normalizadoEm: new Date(),
        }
      }

      const produto = await prisma.produto.create({
        data: {
          userId: session.user.id,
          empresaId: empresaId,
          descricao: prod.descricao,
          unidade: prod.unidade || "UN",
          precoVenda: prod.preco_venda || prod.precoVenda || 0,
          quantidade: prod.quantidade || 0,
          fornecedor: prod.fornecedor || null,
          dataCompra: dataCompraDate,
          codigo: prod.codigo || null,
          valorUnitario: prod.valor_unitario || prod.valorUnitario || 0,
          valorTotal: prod.valor_total || prod.valorTotal || 0,
          codigoBarras: normalizado.codigoBarras || prod.codigo_barras || prod.codigoBarras || null,
          nomeNormalizado: normalizado.nomeNormalizado,
          marca: normalizado.marca,
          categoriaSugestao: normalizado.categoria,
          unidadeMedida: normalizado.unidade,
          fonteDados: normalizado.fonteDados,
          precisaRevisao: normalizado.precisaRevisao,
          normalizadoEm: normalizado.normalizadoEm,
        }
      })
      created.push({
        id: produto.id,
        descricao: produto.descricao,
        nomeNormalizado: produto.nomeNormalizado,
        codigo_barras: produto.codigoBarras,
        categoria: produto.categoriaSugestao || 'INSUMOS',
        fonte_dados: produto.fonteDados,
      })
    }

    return NextResponse.json({
      success: true,
      message: `${created.length} produtos criados`,
      produtos: created
    })
  } catch (error) {
    console.error("Erro ao criar produtos em lote:", error)
    return NextResponse.json(
      { error: "Erro ao criar produtos" },
      { status: 500 }
    )
  }
}