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
    <div className="min-h-screen bg-gray-50">
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

      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.back()}
            className="rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-gray-800">Produtos</h1>
            <p className="text-sm text-gray-500">Gerencie seus produtos e estoque</p>
          </div>
        </div>
        <Button 
          onClick={() => setNovoProdutoOpen(true)}
          className="bg-[#de4838] hover:bg-[#c73d2e] text-white px-6 rounded-full shadow-sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Produto
        </Button>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Busca */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar produto por nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-lg border-gray-300 focus:ring-[#de4838] focus:border-[#de4838]"
            />
          </div>
        </div>

        {/* Lista de Produtos */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#de4838] border-t-transparent" />
          </div>
        ) : produtosFiltrados.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="flex h-80 flex-col items-center justify-center text-center p-6">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Package className="h-10 w-10 text-gray-400" />
              </div>
              <p className="text-gray-500 mb-2">Nenhum produto encontrado</p>
              <p className="text-sm text-gray-400 mb-4">
                {search ? "Tente buscar por outro termo" : "Comece cadastrando seu primeiro produto"}
              </p>
              {!search && (
                <Button 
                  onClick={() => setNovoProdutoOpen(true)}
                  className="bg-[#de4838] hover:bg-[#c73d2e] text-white rounded-lg"
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
              <div key={produto.id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group">
                <div className="bg-gradient-to-r from-[#de4838] to-[#de4838]/80 h-2" />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                      <Package className="h-5 w-5 text-[#de4838]" />
                    </div>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                      #{produto.id}
                    </span>
                  </div>
                  
                  <h3 className="font-semibold text-gray-800 text-lg mb-2 line-clamp-1">{produto.descricao}</h3>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Preço de venda:</span>
                      <span className="font-semibold text-[#de4838]">
                        {formatCurrency(produto.preco_venda)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Estoque:</span>
                      <span className="font-medium text-gray-700">
                        {produto.quantidade} {produto.unidade}
                      </span>
                    </div>
                    {produto.fornecedor && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Fornecedor:</span>
                        <span className="font-medium text-gray-700 truncate max-w-[120px]">
                          {produto.fornecedor}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-gray-200 hover:border-[#de4838] hover:bg-[#de4838]/5 rounded-lg"
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
      </div>
    </div>
  )
}