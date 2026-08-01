import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export type SearchResult = {
  id: string
  tipo: "FICHA" | "PRODUTO" | "LANCAMENTO"
  titulo: string
  subtitulo: string
  href: string
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }
  const empresaId = session.user.empresaId
  if (!empresaId) {
    return NextResponse.json({ error: "Empresa não encontrada" }, { status: 401 })
  }

  const q = (new URL(request.url).searchParams.get("q") || "").trim()
  if (q.length < 2) {
    return NextResponse.json({ success: true, data: [] as SearchResult[] })
  }

  const like = { contains: q, mode: "insensitive" as const }

  try {
    const [fichas, produtos, lancamentos] = await Promise.all([
      prisma.fichaTecnica.findMany({
        where: { empresaId, nome: like },
        select: { id: true, nome: true, categoria: true, margem: true },
        take: 6,
      }),
      prisma.produto.findMany({
        where: { empresaId, descricao: like },
        select: { id: true, descricao: true, fornecedor: true, valorUnitario: true },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      prisma.livroDiario.findMany({
        where: {
          empresaId,
          OR: [{ descricao: like }, { conta: like }, { clienteFornecedor: like }],
        },
        select: { id: true, descricao: true, conta: true, data: true, entrada: true, saida: true },
        orderBy: { data: "desc" },
        take: 6,
      }),
    ])

    const fmt = (v: unknown) =>
      new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v ?? 0))

    const data: SearchResult[] = [
      ...fichas.map((f) => ({
        id: `ficha-${f.id}`,
        tipo: "FICHA" as const,
        titulo: f.nome,
        subtitulo: `${f.categoria} · margem ${Number(f.margem).toFixed(1)}%`,
        href: `/fichas-tecnicas/${f.id}/edit`,
      })),
      ...produtos.map((p) => ({
        id: `produto-${p.id}`,
        tipo: "PRODUTO" as const,
        titulo: p.descricao,
        subtitulo: `${p.fornecedor || "Sem fornecedor"} · ${fmt(p.valorUnitario)}`,
        href: `/nfe/produtos`,
      })),
      ...lancamentos.map((l) => ({
        id: `lanc-${l.id}`,
        tipo: "LANCAMENTO" as const,
        titulo: l.descricao,
        subtitulo: `${l.conta} · ${new Date(l.data).toLocaleDateString("pt-BR")} · ${fmt(
          Number(l.entrada) > 0 ? l.entrada : l.saida
        )}`,
        href: `/livro-diario`,
      })),
    ]

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Erro na busca global:", error)
    return NextResponse.json({ error: "Erro ao buscar" }, { status: 500 })
  }
}
