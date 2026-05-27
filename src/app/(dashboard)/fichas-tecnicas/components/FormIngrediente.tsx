// src/app/(dashboard)/fichas-tecnicas/components/FormIngrediente.tsx
"use client"

import { useState, useEffect } from "react"
import { Plus, Package, BookOpen, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatCurrency } from "@/lib/utils"

interface Produto {
  id: number
  nome: string
  descricao: string
  precoVenda: number
  unidade: string
  quantidade: number
}

interface Ficha {
  id: string
  nome: string
  custoTotal: number
  precoVenda: number
}

interface Ingrediente {
  id: string
  produtoId: number
  nome: string
  quantidade: number
  unidade: string
  valorUnitario: number
  custo: number
  isProdutoAcabado: boolean
}

interface FormIngredienteProps {
  produtos: Produto[]
  fichas: Ficha[]
  onAddIngrediente: (ingrediente: Omit<Ingrediente, "id">) => void
  onAddProdutoAcabado: (ingrediente: Omit<Ingrediente, "id">) => void
  disabled?: boolean
  fichaIdAtual?: string
}

export function FormIngrediente({
  produtos,
  fichas,
  onAddIngrediente,
  onAddProdutoAcabado,
  disabled = false,
  fichaIdAtual
}: FormIngredienteProps) {
  const [selectedProdutoId, setSelectedProdutoId] = useState("")
  const [selectedFichaId, setSelectedFichaId] = useState("")
  const [quantidade, setQuantidade] = useState(1)
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null)
  const [fichaSelecionada, setFichaSelecionada] = useState<Ficha | null>(null)
  const [produtoSearch, setProdutoSearch] = useState("")
  const [fichaSearch, setFichaSearch] = useState("")
  const [produtoOpen, setProdutoOpen] = useState(false)
  const [fichaOpen, setFichaOpen] = useState(false)

  const fichasDisponiveis = fichas.filter(f => f.id !== fichaIdAtual)

  const produtosFiltrados = produtos.filter(p => 
    (p.nome || p.descricao).toLowerCase().includes(produtoSearch.toLowerCase())
  )

  const fichasFiltradas = fichasDisponiveis.filter(f => 
    f.nome.toLowerCase().includes(fichaSearch.toLowerCase())
  )

  useEffect(() => {
    if (selectedProdutoId) {
      const produto = produtos.find(p => p.id === parseInt(selectedProdutoId))
      setProdutoSelecionado(produto || null)
    } else {
      setProdutoSelecionado(null)
    }
  }, [selectedProdutoId, produtos])

  useEffect(() => {
    if (selectedFichaId) {
      const ficha = fichasDisponiveis.find(f => f.id === selectedFichaId)
      setFichaSelecionada(ficha || null)
    } else {
      setFichaSelecionada(null)
    }
  }, [selectedFichaId, fichasDisponiveis])

  const handleAddProduto = () => {
    if (!selectedProdutoId || !produtoSelecionado) {
      alert("Selecione um produto")
      return
    }
    if (quantidade <= 0) {
      alert("Informe uma quantidade válida")
      return
    }

    const valorUnitario = produtoSelecionado.precoVenda || 0
    const custo = quantidade * valorUnitario

    onAddIngrediente({
      produtoId: produtoSelecionado.id,
      nome: produtoSelecionado.nome || produtoSelecionado.descricao,
      quantidade,
      unidade: produtoSelecionado.unidade || "UN",
      valorUnitario,
      custo,
      isProdutoAcabado: false
    })

    setSelectedProdutoId("")
    setProdutoSearch("")
    setProdutoOpen(false)
    setQuantidade(1)
  }

  const handleAddFicha = () => {
    if (!selectedFichaId || !fichaSelecionada) {
      alert("Selecione uma ficha técnica")
      return
    }
    if (quantidade <= 0) {
      alert("Informe uma quantidade válida")
      return
    }

    const custoUnitario = fichaSelecionada.custoTotal || 0
    const custo = quantidade * custoUnitario

    onAddProdutoAcabado({
      produtoId: 0,
      nome: fichaSelecionada.nome,
      quantidade,
      unidade: "UN",
      valorUnitario: custoUnitario,
      custo,
      isProdutoAcabado: true
    })

    setSelectedFichaId("")
    setFichaSearch("")
    setFichaOpen(false)
    setQuantidade(1)
  }

  const valorTotalProduto = produtoSelecionado
    ? quantidade * produtoSelecionado.precoVenda
    : 0

  const valorTotalFicha = fichaSelecionada
    ? quantidade * fichaSelecionada.custoTotal
    : 0

  return (
    <div className="space-y-4">
      {/* Adicionar Produto */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-[#de4838]" />
            <h4 className="text-sm font-medium text-gray-700">Adicionar Produto</h4>
          </div>
        </div>
        <div className="p-4 space-y-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setProdutoOpen(!produtoOpen)}
              className="w-full flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#de4838]"
              disabled={disabled}
            >
              <span className={selectedProdutoId ? "text-gray-800" : "text-gray-400"}>
                {selectedProdutoId && produtoSelecionado 
                  ? `${produtoSelecionado.nome || produtoSelecionado.descricao} - ${formatCurrency(produtoSelecionado.precoVenda)}/${produtoSelecionado.unidade}`
                  : "Selecione um produto..."}
              </span>
              <svg className={`h-4 w-4 text-gray-400 transition-transform ${produtoOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {produtoOpen && (
              <div className="absolute z-10 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg">
                <div className="p-2 border-b border-gray-100">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Pesquisar produto..."
                      className="w-full rounded-lg border border-gray-200 pl-8 pr-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#de4838]"
                      value={produtoSearch}
                      onChange={(e) => setProdutoSearch(e.target.value)}
                    />
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {produtosFiltrados.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex justify-between"
                      onClick={() => {
                        setSelectedProdutoId(p.id.toString())
                        setProdutoSearch("")
                        setProdutoOpen(false)
                      }}
                    >
                      <span>{p.nome || p.descricao}</span>
                      <span className="text-gray-400 text-xs">{formatCurrency(p.precoVenda)}/{p.unidade}</span>
                    </button>
                  ))}
                  {produtosFiltrados.length === 0 && (
                    <div className="px-3 py-2 text-sm text-gray-400 text-center">
                      Nenhum produto encontrado
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              type="number"
              step="0.001"
              placeholder="Quantidade"
              value={quantidade}
              onChange={(e) => setQuantidade(parseFloat(e.target.value))}
              className="flex-1 rounded-lg border-gray-200 focus:ring-[#de4838]"
              disabled={disabled}
            />
            <Button 
              type="button" 
              onClick={handleAddProduto} 
              disabled={disabled || !selectedProdutoId}
              className="bg-[#de4838] hover:bg-[#c73d2e] rounded-lg"
            >
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
          </div>
          {produtoSelecionado && (
            <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
              Valor total: {formatCurrency(valorTotalProduto)} | 
              Estoque: {produtoSelecionado.quantidade} {produtoSelecionado.unidade}
            </div>
          )}
        </div>
      </div>

      {/* Adicionar Produto Acabado */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-[#de4838]" />
            <h4 className="text-sm font-medium text-gray-700">Adicionar Produto Acabado (Ficha Técnica)</h4>
          </div>
        </div>
        <div className="p-4 space-y-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setFichaOpen(!fichaOpen)}
              className="w-full flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#de4838]"
              disabled={disabled}
            >
              <span className={selectedFichaId ? "text-gray-800" : "text-gray-400"}>
                {selectedFichaId && fichaSelecionada 
                  ? `${fichaSelecionada.nome} - Custo: ${formatCurrency(fichaSelecionada.custoTotal)}/UN`
                  : "Selecione uma ficha técnica..."}
              </span>
              <svg className={`h-4 w-4 text-gray-400 transition-transform ${fichaOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {fichaOpen && (
              <div className="absolute z-10 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg">
                <div className="p-2 border-b border-gray-100">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Pesquisar ficha..."
                      className="w-full rounded-lg border border-gray-200 pl-8 pr-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#de4838]"
                      value={fichaSearch}
                      onChange={(e) => setFichaSearch(e.target.value)}
                    />
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {fichasFiltradas.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex justify-between"
                      onClick={() => {
                        setSelectedFichaId(f.id)
                        setFichaSearch("")
                        setFichaOpen(false)
                      }}
                    >
                      <span>{f.nome}</span>
                      <span className="text-gray-400 text-xs">{formatCurrency(f.custoTotal)}/UN</span>
                    </button>
                  ))}
                  {fichasFiltradas.length === 0 && (
                    <div className="px-3 py-2 text-sm text-gray-400 text-center">
                      Nenhuma ficha técnica encontrada
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              type="number"
              step="0.001"
              placeholder="Quantidade"
              value={quantidade}
              onChange={(e) => setQuantidade(parseFloat(e.target.value))}
              className="flex-1 rounded-lg border-gray-200 focus:ring-[#de4838]"
              disabled={disabled}
            />
            <Button 
              type="button" 
              onClick={handleAddFicha} 
              disabled={disabled || !selectedFichaId}
              className="bg-[#de4838] hover:bg-[#c73d2e] rounded-lg"
            >
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
          </div>
          {fichaSelecionada && (
            <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
              Valor total: {formatCurrency(valorTotalFicha)} | 
              Custo unitário: {formatCurrency(fichaSelecionada.custoTotal)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}