// src/app/(dashboard)/precificacao/produtos-venda/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, Filter, Package, CalendarRange, ShoppingBag, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatCurrency, formatPercentage } from "@/lib/utils"
import { PageContainer } from "@/components/layout/PageContainer"
import { PageHeader } from "@/components/layout/PageHeader"

interface ProdutoVenda {
  id: number
  descricao: string
  preco_venda: number
  valor_unitario?: number
  valorUnitario?: number
  quantidade: number
  unidade: string
  fornecedor?: string
}

export default function ProdutosVendaPage() {
  const router = useRouter()
  const [produtos, setProdutos] = useState<ProdutoVenda[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [ordem, setOrdem] = useState<"nome" | "preco" | "margem">("nome")

  useEffect(() => {
    carregarProdutos()
  }, [])

  async function carregarProdutos() {
    try {
      const response = await fetch("/api/produtos?limit=500")
      const data = await response.json()
      if (data.success) {
        setProdutos(data.data)
      }
    } catch (error) {
      console.error("Erro ao carregar produtos:", error)
    } finally {
      setLoading(false)
    }
  }

  const custoDe = (p: ProdutoVenda) => Number(p.valor_unitario ?? p.valorUnitario ?? 0)
  const margemDe = (p: ProdutoVenda) => {
    const preco = Number(p.preco_venda || 0)
    if (preco <= 0) return 0
    return ((preco - custoDe(p)) / preco) * 100
  }

  const produtosVenda = produtos.filter((p) => Number(p.preco_venda || 0) > 0)

  const filtrados = produtosVenda
    .filter((p) => p.descricao.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (ordem === "preco") return Number(b.preco_venda) - Number(a.preco_venda)
      if (ordem === "margem") return margemDe(b) - margemDe(a)
      return a.descricao.localeCompare(b.descricao)
    })

  const precoMedio =
    produtosVenda.length > 0
      ? produtosVenda.reduce((s, p) => s + Number(p.preco_venda || 0), 0) / produtosVenda.length
      : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-2 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <PageContainer>
        <PageHeader
          title="Produtos para Vendas"
          subtitle="Itens precificados disponíveis para venda"
          backHref="/precificacao"
        >
          <Button
            onClick={() => router.push("/nfe/produtos")}
            className="bg-primary hover:bg-primary/90 text-white rounded-full px-5"
          >
            <Package className="mr-2 h-4 w-4" />
            Gerenciar Produtos
          </Button>
        </PageHeader>

        {/* Filtros */}
        <div className="bg-surface rounded-2xl shadow-sm overflow-hidden mb-6">
          <div className="py-3 px-5">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1">
              <div className="flex items-center gap-1 flex-shrink-0">
                <Filter className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-white text-sm hidden sm:inline">Filtros</h3>
              </div>

              <div className="flex items-center gap-2 flex-grow min-w-0">
                <div className="relative flex-shrink-0">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
                  <Input
                    placeholder="Buscar produto..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 pr-3 py-2 text-sm rounded-lg border-border focus:ring-primary focus:border-transparent min-w-[200px]"
                  />
                </div>

                <select
                  value={ordem}
                  onChange={(e) => setOrdem(e.target.value as "nome" | "preco" | "margem")}
                  className="rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-w-[140px]"
                >
                  <option value="nome">Ordenar por nome</option>
                  <option value="preco">Maior preço</option>
                  <option value="margem">Maior margem</option>
                </select>

                <div className="rounded-lg bg-surface-2 px-3 py-2 text-sm font-medium text-white flex-shrink-0">
                  <CalendarRange className="h-4 w-4 inline mr-1" />
                  {produtosVenda.length} produto{produtosVenda.length !== 1 ? "s" : ""}
                </div>

                <div className="rounded-lg bg-surface-2 px-3 py-2 text-sm font-medium text-white flex-shrink-0">
                  <TrendingUp className="h-4 w-4 inline mr-1" />
                  Preço médio: {formatCurrency(precoMedio)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lista */}
        <div className="mt-6">
          {filtrados.length === 0 ? (
            <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
              <div className="flex h-80 flex-col items-center justify-center text-center p-6">
                <div className="w-20 h-20 bg-surface-2 rounded-full flex items-center justify-center mb-4">
                  <ShoppingBag className="h-10 w-10 text-muted-foreground/70" />
                </div>
                <p className="text-muted-foreground mb-2">Nenhum produto para venda encontrado</p>
                <p className="text-sm text-muted-foreground/70 mb-4">
                  {search ? "Tente buscar por outro termo" : "Defina um preço de venda nos seus produtos"}
                </p>
                {!search && (
                  <Button
                    onClick={() => router.push("/nfe/produtos")}
                    className="bg-primary hover:bg-primary/90 text-white rounded-lg"
                  >
                    Ir para Produtos
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtrados.map((produto) => {
                const margem = margemDe(produto)
                return (
                  <div
                    key={produto.id}
                    className="bg-surface rounded-2xl shadow-sm p-5 transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
                    onClick={() => router.push(`/nfe/produtos/${produto.id}/edit`)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-white leading-tight line-clamp-2">
                        {produto.descricao}
                      </h3>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          margem >= 30
                            ? "bg-success/10 text-success"
                            : margem > 0
                              ? "bg-warning/10 text-warning"
                              : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {formatPercentage(margem)}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Preço de venda</span>
                        <span className="font-semibold text-white">
                          {formatCurrency(Number(produto.preco_venda || 0))}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Custo</span>
                        <span className="text-white">{formatCurrency(custoDe(produto))}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Estoque</span>
                        <span className="text-white">
                          {Number(produto.quantidade || 0)} {produto.unidade || "UN"}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </PageContainer>
    </div>
  )
}
