// src/app/(dashboard)/fichas-tecnicas/[id]/edit/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Save, Plus, Trash2, Calculator, Package, BookOpen } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { formatCurrency, formatPercentage } from "@/lib/utils"

interface Produto {
  id: number
  nome: string
  descricao: string
  precoVenda: number
  unidade: string
  quantidade: number
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

interface FichaTecnica {
  id: string
  nome: string
  categoria: string
  precoVenda: number
  custoTotal: number
  custoPorPorcao: number
  margem: number
  rendimentoPorcoes: number
  ingredientes: string
  modoPreparo: string
}

export default function EditarFichaTecnicaPage() {
  const router = useRouter()
  const params = useParams()
  const fichaId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [fichas, setFichas] = useState<{ id: string; nome: string; custoTotal: number; precoVenda: number }[]>([])
  
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

  const [despesasFixasPercentual, setDespesasFixasPercentual] = useState(25)
  const [despesasVariaveisPercentual, setDespesasVariaveisPercentual] = useState(10.87)

  useEffect(() => {
    carregarDados()
  }, [])

  async function carregarDados() {
    setLoading(true)
    try {
      await Promise.all([
        carregarFicha(),
        carregarProdutos(),
        carregarFichas(),
        carregarPercentuaisDespesas()
      ])
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    } finally {
      setLoading(false)
    }
  }

  async function carregarFicha() {
    try {
      const response = await fetch(`/api/fichas-tecnicas/${fichaId}`)
      const data = await response.json()
      if (data.success) {
        const ficha = data.data
        setFormData({
          nome: ficha.nome,
          categoria: ficha.categoria,
          precoVenda: ficha.precoVenda,
          rendimentoPorcoes: ficha.rendimentoPorcoes,
          modoPreparo: ficha.modoPreparo || ""
        })
        
        if (ficha.ingredientes) {
          try {
            const parsed = JSON.parse(ficha.ingredientes)
            if (Array.isArray(parsed)) {
              setIngredientes(parsed)
            }
          } catch (e) {
            console.error("Erro ao parsear ingredientes:", e)
          }
        }
      }
    } catch (error) {
      console.error("Erro ao carregar ficha:", error)
    }
  }

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
        setFichas(data.data.filter((f: any) => f.id !== fichaId))
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

    setSaving(true)

    try {
      const response = await fetch(`/api/fichas-tecnicas/${fichaId}`, {
        method: "PUT",
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
        alert("Ficha técnica atualizada com sucesso!")
        router.push("/fichas-tecnicas")
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("Erro ao salvar:", error)
      alert("Erro ao atualizar ficha técnica")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#de4838] border-t-transparent" />
      </div>
    )
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
            <h1 className="text-xl font-semibold text-gray-800">Editar Ficha Técnica</h1>
            <p className="text-sm text-gray-500">Atualize a receita com seus ingredientes e custos</p>
          </div>
        </div>
        <Button 
          type="submit" 
          form="ficha-form"
          disabled={saving}
          className="bg-[#de4838] hover:bg-[#c73d2e] text-white rounded-full px-5"
        >
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Salvando..." : "Salvar Alterações"}
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
                <div className="rounded-xl border border-gray-200 p-4">
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Adicionar Produto</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <select
                        className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#de4838] appearance-none"
                        value={selectedProdutoId}
                        onChange={(e) => setSelectedProdutoId(e.target.value)}
                      >
                        <option value="">Selecione um produto...</option>
                        {produtos.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.nome || p.descricao} - {formatCurrency(p.precoVenda)}/{p.unidade}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                      </div>
                    </div>
                    <Input
                      type="number"
                      step="0.001"
                      placeholder="Qtd"
                      value={quantidade}
                      onChange={(e) => setQuantidade(parseFloat(e.target.value))}
                      className="w-28 rounded-lg border-gray-200 focus:ring-[#de4838]"
                    />
                    <Button type="button" onClick={adicionarIngrediente} className="bg-[#de4838] hover:bg-[#c73d2e] rounded-lg">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Adicionar Produto Acabado */}
                <div className="rounded-xl border border-gray-200 p-4">
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Adicionar Produto Acabado (Ficha Técnica)</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <select
                        className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#de4838] appearance-none"
                        value={selectedFichaId}
                        onChange={(e) => setSelectedFichaId(e.target.value)}
                      >
                        <option value="">Selecione uma ficha técnica...</option>
                        {fichas.map(f => (
                          <option key={f.id} value={f.id}>
                            {f.nome} - Custo: {formatCurrency(f.custoTotal)}/UN
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                      </div>
                    </div>
                    <Input
                      type="number"
                      step="0.001"
                      placeholder="Qtd"
                      value={quantidade}
                      onChange={(e) => setQuantidade(parseFloat(e.target.value))}
                      className="w-28 rounded-lg border-gray-200 focus:ring-[#de4838]"
                    />
                    <Button type="button" onClick={adicionarProdutoAcabado} className="bg-[#de4838] hover:bg-[#c73d2e] rounded-lg">
                      <Plus className="h-4 w-4" />
                    </Button>
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
                              Nenhum ingrediente adicionado
                            </td>
                          </tr>
                        ) : (
                          ingredientes.map(ing => (
                            <tr key={ing.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="px-4 py-2">
                                {ing.nome}
                                {ing.isProdutoAcabado && (
                                  <span className="ml-2 inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                                    Ficha
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-2 text-right font-mono">
                                {ing.quantidade.toFixed(3)} {ing.unidade}
                              </td>
                              <td className="px-4 py-2 text-right font-mono">{formatCurrency(ing.valorUnitario)}</td>
                              <td className="px-4 py-2 text-right font-mono font-medium">{formatCurrency(ing.custo)}</td>
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
                      <tfoot className="border-t border-gray-200 bg-gray-50">
                        <tr className="font-semibold">
                          <td colSpan={3} className="px-4 py-3 text-right text-gray-700">Custo Total:</td>
                          <td className="px-4 py-3 text-right text-[#de4838] text-lg">{formatCurrency(custoTotal)}</td>
                          <td></td>
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
                    <span>{formatCurrency(formData.precoVenda * despesasFixasPercentual / 100)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Despesas Variáveis ({formatPercentage(despesasVariaveisPercentual)}):</span>
                    <span>{formatCurrency(formData.precoVenda * despesasVariaveisPercentual / 100)}</span>
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
                    className="bg-red-500 flex items-center justify-center text-xs text-white"
                    style={{ width: `${Math.min(100, (custoPorPorcao / formData.precoVenda) * 100)}%` }}
                  >
                    Custo {formatPercentage((custoPorPorcao / formData.precoVenda) * 100)}
                  </div>
                  <div 
                    className="bg-blue-500 flex items-center justify-center text-xs text-white"
                    style={{ width: `${despesasFixasPercentual}%` }}
                  >
                    Fixas {formatPercentage(despesasFixasPercentual)}
                  </div>
                  <div 
                    className="bg-amber-500 flex items-center justify-center text-xs text-white"
                    style={{ width: `${despesasVariaveisPercentual}%` }}
                  >
                    Variáveis {formatPercentage(despesasVariaveisPercentual)}
                  </div>
                  <div 
                    className="bg-emerald-500 flex items-center justify-center text-xs text-white"
                    style={{ width: `${Math.max(0, Math.min(100, margem))}%` }}
                  >
                    Lucro {formatPercentage(Math.max(0, margem))}
                  </div>
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
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}