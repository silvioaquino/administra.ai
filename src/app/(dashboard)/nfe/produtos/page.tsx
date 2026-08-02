// src/app/(dashboard)/nfe/produtos/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  Package, 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  ArrowLeft
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatCurrency } from "@/lib/utils"
import { PageContainer } from "@/components/layout/PageContainer"
import { PageHeader } from "@/components/layout/PageHeader"
import { ModalNovoProduto } from "@/components/produtos/ModalNovoProduto"
import { ModalEditarProduto } from "@/components/produtos/ModalEditarProduto"


interface Produto {
  id: number
  descricao: string
  preco_venda: number
  quantidade: number
  unidade: string
  fornecedor: string
  data_compra: string
}

export default function ProdutosPage() {
  const router = useRouter()
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [novoProdutoOpen, setNovoProdutoOpen] = useState(false)
  const [editarProdutoOpen, setEditarProdutoOpen] = useState(false)
  const [produtoSelecionadoId, setProdutoSelecionadoId] = useState<number | null>(null)

  useEffect(() => {
    carregarProdutos()
  }, [])

  async function carregarProdutos() {
    try {
      const response = await fetch("/api/produtos")
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

  function handleEditarProduto(id: number) {
    setProdutoSelecionadoId(id)
    setEditarProdutoOpen(true)
  }

  const produtosFiltrados = produtos.filter(p => 
    p.descricao.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Modais */}
      <ModalNovoProduto
        isOpen={novoProdutoOpen}
        onClose={() => setNovoProdutoOpen(false)}
        onSuccess={carregarProdutos}
      />
      
      <ModalEditarProduto
        isOpen={editarProdutoOpen}
        onClose={() => {
          setEditarProdutoOpen(false)
          setProdutoSelecionadoId(null)
        }}
        produtoId={produtoSelecionadoId}
        onSuccess={carregarProdutos}
      />

      <PageContainer>
        <PageHeader
          title="Produtos"
          subtitle="Gerencie seus produtos e estoque"
          onBack={() => router.back()}
        >
        <Button 
          onClick={() => router.push("/nfe/produtos/normalizacao")}
          className="bg-primary hover:bg-primary/90 text-white px-6 rounded-full shadow-sm"
        >
          Correção Nomes
        </Button>
        <Button 
          onClick={() => setNovoProdutoOpen(true)}
          className="bg-primary hover:bg-primary/90 text-white px-6 rounded-full shadow-sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Produto
        </Button>
        </PageHeader>
        {/* Busca */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
            <Input
              placeholder="Buscar produto por nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-lg border-border focus:ring-primary focus:border-primary"
            />
          </div>
        </div>

        {/* Lista de Produtos */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : produtosFiltrados.length === 0 ? (
          <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
            <div className="flex h-80 flex-col items-center justify-center text-center p-6">
              <div className="w-20 h-20 bg-surface-2 rounded-full flex items-center justify-center mb-4">
                <Package className="h-10 w-10 text-muted-foreground/70" />
              </div>
              <p className="text-muted-foreground mb-2">Nenhum produto encontrado</p>
              <p className="text-sm text-muted-foreground/70 mb-4">
                {search ? "Tente buscar por outro termo" : "Comece cadastrando seu primeiro produto"}
              </p>
              {!search && (
                <Button 
                  onClick={() => setNovoProdutoOpen(true)}
                  className="bg-primary hover:bg-primary/90 text-white rounded-lg"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar primeiro produto
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {produtosFiltrados.map((produto) => (
              <div key={produto.id} className="bg-surface rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group">
                <div className="bg-gradient-to-r from-primary to-primary/80 h-2" />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-surface-2 rounded-xl flex items-center justify-center">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-xs text-muted-foreground/70 bg-surface-2 px-2 py-1 rounded-full">
                      #{produto.id}
                    </span>
                  </div>
                  
                  <h3 className="font-semibold text-white text-lg mb-2 line-clamp-1">{produto.descricao}</h3>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Preço de venda:</span>
                      <span className="font-semibold text-primary">
                        {formatCurrency(produto.preco_venda)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Estoque:</span>
                      <span className="font-medium text-white">
                        {produto.quantidade} {produto.unidade}
                      </span>
                    </div>
                    {produto.fornecedor && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Fornecedor:</span>
                        <span className="font-medium text-white truncate max-w-[120px]">
                          {produto.fornecedor}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 pt-2 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-border hover:border-primary hover:bg-primary/5 rounded-lg"
                      onClick={() => handleEditarProduto(produto.id)}
                    >
                      <Edit className="mr-2 h-3 w-3" />
                      Editar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </PageContainer>
    </div>
  )
}