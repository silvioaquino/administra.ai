// src/app/(dashboard)/fichas-tecnicas/nova/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Plus, Trash2, Calculator, Package, BookOpen, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatCurrency, formatPercentage } from "@/lib/utils"

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

export default function NovaFichaTecnicaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [fichas, setFichas] = useState<Ficha[]>([])
  
  const [formData, setFormData] = useState({
    nome: "",
    categoria: "Almoço",
    precoVenda: 0,
    rendimentoPorcoes: 1,
    modoPreparo: ""
  })
  
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([])
  const [selectedProdutoId, setSelectedProdutoId] = useState("")
  const [selectedFichaId, setSelectedFichaId] = useState("")
  const [quantidade, setQuantidade] = useState(1)
  const [produtoOpen, setProdutoOpen] = useState(false)
  const [fichaOpen, setFichaOpen] = useState(false)
  const [produtoSearch, setProdutoSearch] = useState("")
  const [fichaSearch, setFichaSearch] = useState("")

  const [despesasFixasPercentual, setDespesasFixasPercentual] = useState(25)
  const [despesasVariaveisPercentual, setDespesasVariaveisPercentual] = useState(10.87)

  useEffect(() => {
    carregarProdutos()
    carregarFichas()
    carregarPercentuaisDespesas()
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
    }
  }

  async function carregarFichas() {
    try {
      const response = await fetch("/api/fichas-tecnicas")
      const data = await response.json()
      if (data.success) {
        setFichas(data.data)
      }
    } catch (error) {
      console.error("Erro ao carregar fichas:", error)
    }
  }

  async function carregarPercentuaisDespesas() {
    try {
      const anoAtual = new Date().getFullYear()
      const response = await fetch(`/api/planejamento/despesas-variaveis?ano=${anoAtual}`)
      const data = await response.json()
      if (data.success && data.dados) {
        const total = data.dados.reduce((sum: number, item: any) => sum + (item.percentual || 0), 0)
        setDespesasVariaveisPercentual(total)
      }
    } catch (error) {
      console.error("Erro ao carregar percentuais:", error)
    }
  }

  const produtosFiltrados = produtos.filter(p => 
    (p.nome || p.descricao).toLowerCase().includes(produtoSearch.toLowerCase())
  )

  const fichasFiltradas = fichas.filter(f => 
    f.nome.toLowerCase().includes(fichaSearch.toLowerCase())
  )

  function adicionarIngrediente() {
    if (!selectedProdutoId) {
      alert("Selecione um produto")
      return
    }
    if (quantidade <= 0) {
      alert("Informe uma quantidade válida")
      return
    }

    const produto = produtos.find(p => p.id === parseInt(selectedProdutoId))
    if (!produto) return

    const valorUnitario = produto.precoVenda || 0
    const custo = quantidade * valorUnitario

    const novoIngrediente: Ingrediente = {
      id: Date.now().toString(),
      produtoId: produto.id,
      nome: produto.nome || produto.descricao,
      quantidade,
      unidade: produto.unidade || "UN",
      valorUnitario,
      custo,
      isProdutoAcabado: false
    }

    setIngredientes([...ingredientes, novoIngrediente])
    setSelectedProdutoId("")
    setProdutoSearch("")
    setProdutoOpen(false)
    setQuantidade(1)
  }

  function adicionarProdutoAcabado() {
    if (!selectedFichaId) {
      alert("Selecione uma ficha técnica")
      return
    }
    if (quantidade <= 0) {
      alert("Informe uma quantidade válida")
      return
    }

    const ficha = fichas.find(f => f.id === selectedFichaId)
    if (!ficha) return

    const custoUnitario = ficha.custoTotal || 0
    const custo = quantidade * custoUnitario

    const novoIngrediente: Ingrediente = {
      id: Date.now().toString(),
      produtoId: 0,
      nome: ficha.nome,
      quantidade,
      unidade: "UN",
      valorUnitario: custoUnitario,
      custo,
      isProdutoAcabado: true
    }

    setIngredientes([...ingredientes, novoIngrediente])
    setSelectedFichaId("")
    setFichaSearch("")
    setFichaOpen(false)
    setQuantidade(1)
  }

  function removerIngrediente(id: string) {
    setIngredientes(ingredientes.filter(i => i.id !== id))
  }

  const custoTotal = ingredientes.reduce((sum, i) => sum + i.custo, 0)
  const custoPorPorcao = custoTotal / formData.rendimentoPorcoes
  const lucro = formData.precoVenda - custoPorPorcao - (formData.precoVenda * despesasFixasPercentual / 100) - (formData.precoVenda * despesasVariaveisPercentual / 100)
  const margem = formData.precoVenda > 0 ? (lucro / formData.precoVenda) * 100 : 0
  
  const precoSugerido = custoPorPorcao / (1 - (despesasFixasPercentual + despesasVariaveisPercentual + 20) / 100)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nome) {
      alert("Informe o nome do prato")
      return
    }
    if (ingredientes.length === 0) {
      alert("Adicione pelo menos um ingrediente")
      return
    }
    if (formData.precoVenda <= 0) {
      alert("Informe o preço de venda")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/fichas-tecnicas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: formData.nome,
          categoria: formData.categoria,
          precoVenda: formData.precoVenda,
          custoTotal: custoTotal,
          custoPorPorcao: custoPorPorcao,
          margem: margem,
          rendimentoPorcoes: formData.rendimentoPorcoes,
          ingredientes: JSON.stringify(ingredientes),
          modoPreparo: formData.modoPreparo
        })
      })

      const data = await response.json()
      if (data.success) {
        alert("Ficha técnica criada com sucesso!")
        router.push("/fichas-tecnicas")
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("Erro ao salvar:", error)
      alert("Erro ao criar ficha técnica")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
            <h1 className="text-xl font-semibold text-gray-800">Nova Ficha Técnica</h1>
            <p className="text-sm text-gray-500">Cadastre uma nova receita com seus ingredientes e custos</p>
          </div>
        </div>
        <Button 
          type="submit" 
          form="ficha-form"
          disabled={loading}
          className="bg-[#de4838] hover:bg-[#c73d2e] text-white rounded-full px-5"
        >
          <Save className="mr-2 h-4 w-4" />
          {loading ? "Salvando..." : "Salvar Ficha Técnica"}
        </Button>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-6 max-w-7xl">
        <form id="ficha-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Informações Básicas */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-gray-50 p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800">Informações Básicas</h3>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Nome do Prato <span className="text-[#de4838]">*</span>
                  </Label>
                  <Input
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Macarrão ao Molho, Frango Grelhado..."
                    className="rounded-lg border-gray-200 focus:ring-[#de4838]"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Categoria</Label>
                    <div className="relative">
                      <select
                        className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#de4838] appearance-none"
                        value={formData.categoria}
                        onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                      >
                        <option value="Almoço">Almoço</option>
                        <option value="Janta">Janta</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Rendimento (porções)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.rendimentoPorcoes}
                      onChange={(e) => setFormData({ ...formData, rendimentoPorcoes: parseInt(e.target.value) })}
                      className="rounded-lg border-gray-200 focus:ring-[#de4838]"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Modo de Preparo</Label>
                  <Textarea
                    value={formData.modoPreparo}
                    onChange={(e) => setFormData({ ...formData, modoPreparo: e.target.value })}
                    rows={3}
                    placeholder="Instruções de preparo..."
                    className="rounded-lg border-gray-200 focus:ring-[#de4838]"
                  />
                </div>
              </div>
            </div>

            {/* Ingredientes */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-gray-50 p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800">Ingredientes</h3>
              </div>
              <div className="p-5 space-y-4">
                {/* Adicionar Produto */}
                <div className="rounded-xl border border-gray-200 overflow-hidden">
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
                      >
                        <span className={selectedProdutoId ? "text-gray-800" : "text-gray-400"}>
                          {selectedProdutoId 
                            ? produtos.find(p => p.id === parseInt(selectedProdutoId))?.nome || "Produto selecionado"
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
                      />
                      <Button 
                        type="button" 
                        onClick={adicionarIngrediente} 
                        disabled={!selectedProdutoId}
                        className="bg-[#de4838] hover:bg-[#c73d2e] rounded-lg"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar
                      </Button>
                    </div>
                    {selectedProdutoId && (
                      <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
                        Preço unitário: {formatCurrency(produtos.find(p => p.id === parseInt(selectedProdutoId))?.precoVenda || 0)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Adicionar Produto Acabado */}
                <div className="rounded-xl border border-gray-200 overflow-hidden">
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
                      >
                        <span className={selectedFichaId ? "text-gray-800" : "text-gray-400"}>
                          {selectedFichaId 
                            ? fichas.find(f => f.id === selectedFichaId)?.nome || "Ficha selecionada"
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
                      />
                      <Button 
                        type="button" 
                        onClick={adicionarProdutoAcabado} 
                        disabled={!selectedFichaId}
                        className="bg-[#de4838] hover:bg-[#c73d2e] rounded-lg"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar
                      </Button>
                    </div>
                    {selectedFichaId && (
                      <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
                        Custo unitário: {formatCurrency(fichas.find(f => f.id === selectedFichaId)?.custoTotal || 0)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Lista de Ingredientes */}
                <div className="mt-4">
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Lista de Ingredientes</Label>
                  <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-200">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ingrediente</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qtd</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Unit.</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Custo</th>
                          <th className="px-4 py-3 text-center w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {ingredientes.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-gray-400">
                              <Package className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                              Nenhum ingrediente adicionado
                            </td>
                          </tr>
                        ) : (
                          ingredientes.map(ing => (
                            <tr key={ing.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="px-4 py-2">
                                <div className="flex items-center gap-2">
                                  {ing.isProdutoAcabado ? (
                                    <BookOpen className="h-3 w-3 text-blue-500" />
                                  ) : (
                                    <Package className="h-3 w-3 text-[#de4838]" />
                                  )}
                                  <span className="text-gray-700">{ing.nome}</span>
                                  {ing.isProdutoAcabado && (
                                    <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                                      Ficha
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-2 text-right font-mono text-gray-600">
                                {ing.quantidade.toFixed(3)} {ing.unidade}
                              </td>
                              <td className="px-4 py-2 text-right font-mono text-gray-600">{formatCurrency(ing.valorUnitario)}</td>
                              <td className="px-4 py-2 text-right font-mono font-medium text-gray-800">{formatCurrency(ing.custo)}</td>
                              <td className="px-4 py-2 text-center">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removerIngrediente(ing.id)}
                                  className="h-8 w-8 p-0 rounded-lg hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      <tfoot className="border-t-2 border-gray-200 bg-gray-50">
                        <tr className="font-semibold">
                          <td colSpan={3} className="px-4 py-3 text-right text-gray-700">Custo Total:</td>
                          <td className="px-4 py-3 text-right text-[#de4838] text-lg">{formatCurrency(custoTotal)}</td>
                          <td className="px-4 py-3"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Análise Financeira */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gray-50 p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-[#de4838]" />
                <h3 className="font-semibold text-gray-800">Análise Financeira</h3>
              </div>
            </div>
            <div className="p-5">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Preço de Venda Praticado (R$) *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">R$</span>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.precoVenda}
                        onChange={(e) => setFormData({ ...formData, precoVenda: parseFloat(e.target.value) })}
                        className="pl-8 rounded-lg border-gray-200 focus:ring-[#de4838]"
                        required
                      />
                    </div>
                  </div>
                  <div className="rounded-xl bg-blue-50 p-4">
                    <p className="text-sm font-medium text-blue-700 mb-1">Preço Sugerido</p>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(precoSugerido)}</p>
                    <p className="text-xs text-blue-600 mt-1">
                      Baseado em custo + 20% de lucro + {despesasFixasPercentual + despesasVariaveisPercentual}% de despesas
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Custo Total da Ficha:</span>
                    <span className="font-medium text-gray-700">{formatCurrency(custoTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Custo por Porção:</span>
                    <span className="font-medium text-gray-700">{formatCurrency(custoPorPorcao)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Despesas Fixas ({formatPercentage(despesasFixasPercentual)}):</span>
                    <span className="text-gray-700">{formatCurrency(formData.precoVenda * despesasFixasPercentual / 100)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Despesas Variáveis ({formatPercentage(despesasVariaveisPercentual)}):</span>
                    <span className="text-gray-700">{formatCurrency(formData.precoVenda * despesasVariaveisPercentual / 100)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                    <span className="font-semibold text-gray-700">Lucro:</span>
                    <span className={`font-bold ${lucro >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatCurrency(lucro)} ({formatPercentage(margem)})
                    </span>
                  </div>
                </div>
              </div>

              {/* Barra de Composição */}
              <div className="mt-5">
                <div className="flex h-8 rounded-lg overflow-hidden">
                  <div 
                    className="bg-red-500 flex items-center justify-center text-xs text-white font-medium"
                    style={{ width: `${Math.min(100, (custoPorPorcao / formData.precoVenda) * 100)}%` }}
                  >
                    {((custoPorPorcao / formData.precoVenda) * 100) > 8 ? `Custo ${formatPercentage((custoPorPorcao / formData.precoVenda) * 100)}` : ''}
                  </div>
                  <div 
                    className="bg-blue-500 flex items-center justify-center text-xs text-white font-medium"
                    style={{ width: `${despesasFixasPercentual}%` }}
                  >
                    {despesasFixasPercentual > 8 ? `Fixas ${formatPercentage(despesasFixasPercentual)}` : ''}
                  </div>
                  <div 
                    className="bg-amber-500 flex items-center justify-center text-xs text-white font-medium"
                    style={{ width: `${despesasVariaveisPercentual}%` }}
                  >
                    {despesasVariaveisPercentual > 8 ? `Variáveis ${formatPercentage(despesasVariaveisPercentual)}` : ''}
                  </div>
                  <div 
                    className="bg-emerald-500 flex items-center justify-center text-xs text-white font-medium"
                    style={{ width: `${Math.max(0, Math.min(100, margem))}%` }}
                  >
                    {Math.max(0, margem) > 8 ? `Lucro ${formatPercentage(Math.max(0, margem))}` : ''}
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Custo</span>
                  <span>Despesas Fixas</span>
                  <span>Despesas Variáveis</span>
                  <span>Lucro</span>
                </div>
              </div>

              {margem < 30 && margem > 0 && (
                <Alert className="mt-4 bg-amber-50 border-amber-200 rounded-xl">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-sm text-amber-700">
                    Margem de lucro está baixa ({formatPercentage(margem)}). 
                    Considere aumentar o preço de venda ou reduzir custos.
                  </AlertDescription>
                </Alert>
              )}

              {margem >= 50 && (
                <Alert className="mt-4 bg-emerald-50 border-emerald-200 rounded-xl">
                  <AlertCircle className="h-4 w-4 text-emerald-600" />
                  <AlertDescription className="text-sm text-emerald-700">
                    Excelente! Margem de lucro de {formatPercentage(margem)}. Continue assim!
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}