// src/app/(dashboard)/fichas-tecnicas/nova/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Plus, Trash2, Calculator, Package, BookOpen, AlertCircle, ChevronDown, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatCurrency, formatPercentage } from "@/lib/utils"
import { UnitQuantityInput } from "@/components/fichas-tecnicas/UnitQuantityInput"
import { CostBreakdown } from "@/components/fichas-tecnicas/CostBreakdown"
import { ConversionService } from "@/lib/services/conversion.service"
import { UnitType } from "@/types/ficha-tecnica"

interface Produto {
  id: number
  nome: string
  descricao: string
  nomeNormalizado?: string
  precoVenda: number
  preco_venda: number
  unidade: string
  quantidade: number
  valorUnitario: number
  pesoUnitario?: number
  densidade?: number
}

interface Ficha {
  id: string
  nome: string
  categoria?: string
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
  const [unidadeReceita, setUnidadeReceita] = useState<UnitType>('UN')

  const [despesasFixasPercentual, setDespesasFixasPercentual] = useState(0)
  const [despesasVariaveisPercentual, setDespesasVariaveisPercentual] = useState(0)
  const [markup, setMarkup] = useState(0)
  const [metaFaltando, setMetaFaltando] = useState(false)

  const [categorias, setCategorias] = useState<string[]>(["Almoço", "Janta"])
  const [showNovaCategoria, setShowNovaCategoria] = useState(false)
  const [novaCategoria, setNovaCategoria] = useState("")

  // Estados para controle de abas/expansão
  const [sectionsExpanded, setSectionsExpanded] = useState({
    basicInfo: true,
    ingredients: true,
    costBreakdown: false,
    financialAnalysis: true
  })

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
        const produtosFormatados = data.data.map((p: any) => ({
          ...p,
          precoVenda: p.precoVenda || p.preco_venda || 0,
          valorUnitario: Number(p.valor_unitario) || Number(p.valorUnitario) || 0,
          pesoUnitario: p.pesoUnitario != null ? Number(p.pesoUnitario) : undefined,
          densidade: p.densidade != null ? Number(p.densidade) : undefined,
        }))
        const chavesVistas = new Set<string>()
        const produtosUnicos = produtosFormatados.filter((p: Produto) => {
          const chave = (p.nomeNormalizado || p.descricao || String(p.id))
            .trim()
            .toLowerCase()
          if (chavesVistas.has(chave)) return false
          chavesVistas.add(chave)
          return true
        })
        setProdutos(produtosUnicos)
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
        const catsUnicas = Array.from(
          new Set(
            (data.data as Array<{ categoria?: string }>)
              .map((f) => f.categoria)
              .filter((c): c is string => typeof c === "string" && c.trim().length > 0)
          )
        )
        if (catsUnicas.length > 0) {
          setCategorias((prev) => Array.from(new Set([...prev, ...catsUnicas])))
        }
      }
    } catch (error) {
      console.error("Erro ao carregar fichas:", error)
    }
  }

  async function carregarPercentuaisDespesas() {
    try {
      const anoAtual = new Date().getFullYear()
      const response = await fetch(`/api/planejamento/indicadores-resumo?ano=${anoAtual}`)
      const data = await response.json()
      if (data.success) {
        if (data.markUp != null) setMarkup(data.markUp)
        if (data.pctFixas != null) setDespesasFixasPercentual(data.pctFixas)
        if (data.despesasVariaveisPct != null) setDespesasVariaveisPercentual(data.despesasVariaveisPct)
        setMetaFaltando(!!data.metaFaltando)
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

    const valorUnitario = Number(produto.valorUnitario) || 0

    let custo: number
    try {
      const result = ConversionService.calculateConsumption(
        quantidade,
        unidadeReceita,
        {
          purchaseUnit: (produto.unidade as UnitType) || 'UN',
          unitPrice: valorUnitario,
          pesoUnitario: produto.pesoUnitario ? Number(produto.pesoUnitario) : undefined,
          densidade: produto.densidade ? Number(produto.densidade) : undefined,
        }
      )
      custo = result.cost
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erro ao calcular custo do ingrediente")
      return
    }

    const novoIngrediente: Ingrediente = {
      id: Date.now().toString(),
      produtoId: produto.id,
      nome: produto.nomeNormalizado || produto.descricao,
      quantidade,
      unidade: unidadeReceita,
      valorUnitario,
      custo,
      isProdutoAcabado: false
    }

    setIngredientes([...ingredientes, novoIngrediente])
    setSelectedProdutoId("")
    setQuantidade(1)
    setUnidadeReceita('UN')
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

  function confirmarNovaCategoria() {
    const cat = novaCategoria.trim()
    if (!cat) {
      alert("Informe o nome da categoria")
      return
    }
    const jaExiste = categorias.some(c => c.toLowerCase() === cat.toLowerCase())
    if (!jaExiste) {
      setCategorias([...categorias, cat])
    }
    setFormData({ ...formData, categoria: cat })
    setShowNovaCategoria(false)
    setNovaCategoria("")
  }

  const custoTotal = ingredientes.reduce((sum, i) => sum + i.custo, 0)
  const custoPorPorcao = custoTotal / formData.rendimentoPorcoes

  const custoItems = ingredientes
    .map((ing) => {
      if (ing.isProdutoAcabado || !ing.produtoId) {
        return {
          itemId: ing.id,
          productName: ing.nome,
          quantity: ing.quantidade,
          unitUsed: ing.unidade,
          packagesUsed: ing.quantidade,
          cost: ing.custo,
          isFractional: false,
          formatted: { grams: "-", packages: `${ing.quantidade} ${ing.unidade}`, cost: formatCurrency(ing.custo) },
        }
      }
      const prod = produtos.find((p) => p.id === ing.produtoId)
      if (!prod) return null
      try {
        const r = ConversionService.calculateConsumption(
          ing.quantidade,
          (ing.unidade as UnitType) || "UN",
          {
            purchaseUnit: (prod.unidade as UnitType) || "UN",
            unitPrice: Number(prod.valorUnitario) || 0,
            pesoUnitario: prod.pesoUnitario ? Number(prod.pesoUnitario) : undefined,
            densidade: prod.densidade ? Number(prod.densidade) : undefined,
          }
        )
        return {
          itemId: ing.id,
          productName: ing.nome,
          quantity: ing.quantidade,
          unitUsed: ing.unidade,
          packagesUsed: r.packagesUsed,
          cost: r.cost,
          isFractional: r.isFractional,
          formatted: r.formatted,
        }
      } catch {
        return null
      }
    })
    .filter((i): i is NonNullable<typeof i> => i !== null)

  const lucro = formData.precoVenda - custoPorPorcao - (formData.precoVenda * despesasFixasPercentual / 100) - (formData.precoVenda * despesasVariaveisPercentual / 100)
  const margem = formData.precoVenda > 0 ? (lucro / formData.precoVenda) * 100 : 0
  
  const precoSugerido = markup > 0 ? custoPorPorcao * markup : 0

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
      const ingredientesString = JSON.stringify(ingredientes)
      
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
          ingredientes: ingredientesString,
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

  const getCustoUnitario = (produto: Produto | undefined) => {
    if (!produto) return 0
    return produto.valorUnitario || 0
  }

  const produtoSelecionado = produtos.find(p => p.id === parseInt(selectedProdutoId))
  const fichaSelecionada = fichas.find(f => f.id === selectedFichaId)

  // Função para alternar expansão de seção
  const toggleSection = (section: keyof typeof sectionsExpanded) => {
    setSectionsExpanded(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Componente de cabeçalho de seção
  const SectionHeader = ({ 
    title, 
    icon: Icon, 
    section, 
    badge,
    children 
  }: { 
    title: string
    icon: any
    section: keyof typeof sectionsExpanded
    badge?: string
    children?: React.ReactNode
  }) => (
    <div 
      className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={() => toggleSection(section)}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-[#de4838]/10 text-[#de4838]">
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="font-semibold text-gray-800">{title}</h3>
        {badge && (
          <span className="inline-flex items-center rounded-full bg-[#de4838]/10 px-2.5 py-0.5 text-xs font-medium text-[#de4838]">
            {badge}
          </span>
        )}
        {children}
      </div>
      <ChevronDown 
        className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
          sectionsExpanded[section] ? 'rotate-180' : ''
        }`}
      />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#e5e7eb]">
      {/* Header - mais moderno e com sombra */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-200/80 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.back()}
            className="rounded-full hover:bg-gray-100 transition-all duration-200"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              Nova Ficha Técnica
              <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                Receita
              </span>
            </h1>
            <p className="text-sm text-gray-500 hidden sm:block">
              Cadastre uma nova receita com seus ingredientes e custos
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline"
            onClick={() => router.back()}
            className="hidden sm:flex rounded-full border-gray-200 hover:bg-gray-50"
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            form="ficha-form"
            disabled={loading}
            className="bg-[#de4838] hover:bg-[#c73d2e] text-white rounded-full px-6 shadow-lg shadow-[#de4838]/25 transition-all duration-200 hover:shadow-[#de4838]/40"
          >
            <Save className="mr-2 h-4 w-4" />
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                Salvando...
              </span>
            ) : (
              "Salvar Ficha"
            )}
          </Button>
        </div>
      </div>

      {/* Main Content - com grid responsivo */}
      <div className="container mx-auto p-4 md:p-6 max-w-5xl">
        <form id="ficha-form" onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          
          {/* Seção: Informações Básicas */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100/50 overflow-hidden transition-all duration-200 hover:shadow-md">
            <SectionHeader 
              title="Informações Básicas" 
              icon={Package} 
              section="basicInfo"
            />
            {sectionsExpanded.basicInfo && (
              <div className="p-4 md:p-5 pt-0 space-y-4 border-t border-gray-100">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider flex items-center gap-1">
                    Nome do Prato <span className="text-[#de4838]">*</span>
                  </Label>
                  <Input
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Macarrão ao Molho, Frango Grelhado..."
                    className="rounded-xl border-gray-200 focus:ring-2 focus:ring-[#de4838] focus:border-transparent transition-all"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Categoria</Label>
                    <div className="relative">
                      <select
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#de4838] focus:border-transparent appearance-none transition-all"
                        value={showNovaCategoria ? "__nova__" : formData.categoria}
                        onChange={(e) => {
                          if (e.target.value === "__nova__") {
                            setShowNovaCategoria(true)
                            setNovaCategoria("")
                          } else {
                            setShowNovaCategoria(false)
                            setFormData({ ...formData, categoria: e.target.value })
                          }
                        }}
                      >
                        {categorias.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                        <option value="__nova__">+ Adicionar nova categoria</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                    {showNovaCategoria && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Input
                          autoFocus
                          value={novaCategoria}
                          onChange={(e) => setNovaCategoria(e.target.value)}
                          placeholder="Nome da nova categoria"
                          className="flex-1 rounded-xl border-gray-200 focus:ring-2 focus:ring-[#de4838] focus:border-transparent"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              confirmarNovaCategoria()
                            }
                          }}
                        />
                        <Button
                          type="button"
                          onClick={confirmarNovaCategoria}
                          className="bg-[#de4838] hover:bg-[#c73d2e] rounded-xl"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Adicionar
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => { setShowNovaCategoria(false); setNovaCategoria("") }}
                          className="rounded-xl border-gray-200 hover:border-gray-300"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Rendimento (porções)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.rendimentoPorcoes}
                      onChange={(e) => setFormData({ ...formData, rendimentoPorcoes: parseInt(e.target.value) || 1 })}
                      className="rounded-xl border-gray-200 focus:ring-2 focus:ring-[#de4838] focus:border-transparent transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Modo de Preparo</Label>
                  <Textarea
                    value={formData.modoPreparo}
                    onChange={(e) => setFormData({ ...formData, modoPreparo: e.target.value })}
                    rows={3}
                    placeholder="Instruções de preparo..."
                    className="rounded-xl border-gray-200 focus:ring-2 focus:ring-[#de4838] focus:border-transparent transition-all resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Seção: Ingredientes */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100/50 overflow-hidden transition-all duration-200 hover:shadow-md">
            <SectionHeader 
              title="Ingredientes" 
              icon={BookOpen} 
              section="ingredients"
              badge={`${ingredientes.length} itens`}
            />
            {sectionsExpanded.ingredients && (
              <div className="p-4 md:p-5 pt-0 space-y-4 border-t border-gray-100">
                {/* Grid de adição de ingredientes */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Adicionar Produto */}
                  <div className="rounded-xl border border-gray-200 overflow-hidden bg-gray-50/50">
                    <div className="bg-gray-100/80 px-4 py-2.5 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-[#de4838]" />
                        <h4 className="text-sm font-medium text-gray-700">Produto</h4>
                      </div>
                    </div>
                    <div className="p-3 space-y-3">
                      <div className="relative">
                        <select
                          className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#de4838] focus:border-transparent appearance-none transition-all"
                          value={selectedProdutoId}
                          onChange={(e) => {
                            setSelectedProdutoId(e.target.value)
                            const p = produtos.find(prod => prod.id === parseInt(e.target.value))
                            setUnidadeReceita(((p?.unidade || 'UN') as string).toUpperCase() as UnitType)
                          }}
                        >
                          <option value="">Selecione um produto...</option>
                          {produtos.map((prod) => (
                            <option key={prod.id} value={prod.id}>
                              {prod.nomeNormalizado || prod.descricao}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      </div>
                      {produtoSelecionado ? (
                        <>
                          <UnitQuantityInput
                            value={{ quantity: quantidade, unit: unidadeReceita }}
                            onChange={({ quantity, unit }) => { setQuantidade(quantity); setUnidadeReceita(unit) }}
                            product={{
                              id: produtoSelecionado.id,
                              descricao: produtoSelecionado.nomeNormalizado || produtoSelecionado.descricao,
                              unidade: produtoSelecionado.unidade || 'UN',
                              quantidade: produtoSelecionado.quantidade || 1,
                              valorUnitario: produtoSelecionado.valorUnitario || 0,
                              pesoUnitario: produtoSelecionado.pesoUnitario,
                              densidade: produtoSelecionado.densidade,
                            }}
                          />
                          <div className="text-xs text-gray-500 bg-gray-100 rounded-lg p-2 flex items-center justify-between">
                            <span>Custo unitário:</span>
                            <span className="font-medium text-gray-700">{formatCurrency(getCustoUnitario(produtoSelecionado))}</span>
                          </div>
                        </>
                      ) : (
                        <Input
                          type="number"
                          step="0.001"
                          placeholder="Quantidade"
                          value={quantidade}
                          onChange={(e) => setQuantidade(parseFloat(e.target.value) || 0)}
                          className="rounded-lg border-gray-200 focus:ring-2 focus:ring-[#de4838] focus:border-transparent"
                        />
                      )}
                      <Button
                        type="button"
                        onClick={adicionarIngrediente}
                        disabled={!selectedProdutoId}
                        className="w-full bg-[#de4838] hover:bg-[#c73d2e] rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar Produto
                      </Button>
                    </div>
                  </div>

                  {/* Adicionar Produto Acabado */}
                  <div className="rounded-xl border border-gray-200 overflow-hidden bg-gray-50/50">
                    <div className="bg-gray-100/80 px-4 py-2.5 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-[#de4838]" />
                        <h4 className="text-sm font-medium text-gray-700">Ficha Técnica</h4>
                      </div>
                    </div>
                    <div className="p-3 space-y-3">
                      <div className="relative">
                        <select
                          className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#de4838] focus:border-transparent appearance-none transition-all"
                          value={selectedFichaId}
                          onChange={(e) => setSelectedFichaId(e.target.value)}
                        >
                          <option value="">Selecione uma ficha...</option>
                          {fichas.map((ficha) => (
                            <option key={ficha.id} value={ficha.id}>
                              {ficha.nome} - {formatCurrency(ficha.custoTotal || 0)}/UN
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      </div>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          step="0.001"
                          placeholder="Quantidade"
                          value={quantidade}
                          onChange={(e) => setQuantidade(parseFloat(e.target.value) || 0)}
                          className="flex-1 rounded-lg border-gray-200 focus:ring-2 focus:ring-[#de4838] focus:border-transparent"
                        />
                        <Button 
                          type="button" 
                          onClick={adicionarProdutoAcabado} 
                          disabled={!selectedFichaId}
                          className="bg-[#de4838] hover:bg-[#c73d2e] rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {fichaSelecionada && (
                        <div className="text-xs text-gray-500 bg-gray-100 rounded-lg p-2 flex items-center justify-between">
                          <span>Custo unitário:</span>
                          <span className="font-medium text-gray-700">{formatCurrency(fichaSelecionada.custoTotal || 0)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Lista de Ingredientes */}
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium text-gray-700">Lista de Ingredientes</Label>
                    <span className="text-xs text-gray-400">
                      {ingredientes.length} {ingredientes.length === 1 ? 'item' : 'itens'}
                    </span>
                  </div>
                  <div className="border rounded-xl border-gray-200 overflow-hidden shadow-sm">
                    <div className="max-h-64 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100/80 border-b border-gray-200 sticky top-0 z-10">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ingrediente</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qtd</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Valor Unit.</th>
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
                                <p className="text-xs text-gray-400 mt-1">Adicione produtos ou fichas técnicas acima</p>
                              </td>
                            </tr>
                          ) : (
                            ingredientes.map(ing => (
                              <tr key={ing.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                                <td className="px-4 py-2.5">
                                  <div className="flex items-center gap-2">
                                    {ing.isProdutoAcabado ? (
                                      <BookOpen className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                                    ) : (
                                      <Package className="h-3.5 w-3.5 text-[#de4838] flex-shrink-0" />
                                    )}
                                    <span className="text-gray-700 truncate max-w-[120px] sm:max-w-none" title={ing.nome}>
                                      {ing.nome}
                                    </span>
                                    {ing.isProdutoAcabado && (
                                      <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700 flex-shrink-0">
                                        Ficha
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-2.5 text-right font-mono text-gray-600 whitespace-nowrap">
                                  {ing.quantidade.toFixed(3)} {ing.unidade}
                                </td>
                                <td className="px-4 py-2.5 text-right font-mono text-gray-600 hidden sm:table-cell">
                                  {formatCurrency(ing.valorUnitario)}
                                </td>
                                <td className="px-4 py-2.5 text-right font-mono font-medium text-gray-800 whitespace-nowrap">
                                  {formatCurrency(ing.custo)}
                                </td>
                                <td className="px-4 py-2.5 text-center">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removerIngrediente(ing.id)}
                                    className="h-8 w-8 p-0 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                                  >
                                    <Trash2 className="h-4 w-4 text-red-400 hover:text-red-600" />
                                  </Button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                        {ingredientes.length > 0 && (
                          <tfoot className="border-t-2 border-gray-200 bg-gray-100/80 sticky bottom-0">
                            <tr className="font-semibold">
                              <td colSpan={3} className="px-4 py-3 text-right text-gray-700 hidden sm:table-cell">
                                Custo Total:
                              </td>
                              <td colSpan={2} className="px-4 py-3 text-right text-[#de4838] text-lg">
                                {formatCurrency(custoTotal)}
                              </td>
                              <td className="px-4 py-3"></td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Seção: Detalhamento de Custos - apenas se houver ingredientes */}
          {ingredientes.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100/50 overflow-hidden transition-all duration-200 hover:shadow-md">
              <SectionHeader 
                title="Detalhamento de Custos" 
                icon={Calculator} 
                section="costBreakdown"
              />
              {sectionsExpanded.costBreakdown && (
                <div className="p-4 md:p-5 pt-0 border-t border-gray-100">
                  <CostBreakdown
                    items={custoItems}
                    totalCost={custoTotal}
                    costPerPortion={custoPorPorcao}
                    rendimento={formData.rendimentoPorcoes}
                  />
                </div>
              )}
            </div>
          )}

          {/* Seção: Análise Financeira */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100/50 overflow-hidden transition-all duration-200 hover:shadow-md">
            <SectionHeader 
              title="Análise Financeira" 
              icon={Calculator} 
              section="financialAnalysis"
            />
            {sectionsExpanded.financialAnalysis && (
              <div className="p-4 md:p-5 pt-0 border-t border-gray-100">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider flex items-center gap-1">
                        Preço de Venda Praticado <span className="text-[#de4838]">*</span>
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">R$</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.precoVenda}
                          onChange={(e) => setFormData({ ...formData, precoVenda: parseFloat(e.target.value) || 0 })}
                          className="pl-8 rounded-xl border-gray-200 focus:ring-2 focus:ring-[#de4838] focus:border-transparent transition-all"
                          required
                        />
                      </div>
                    </div>
                    <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 border border-blue-200/50">
                      <p className="text-sm font-medium text-blue-700 mb-1 flex items-center gap-2">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                        Preço Sugerido
                      </p>
                      {metaFaltando ? (
                        <p className="text-sm text-blue-600 mt-1">
                          Defina a meta do mês atual no Planejamento para calcular o mark-up sugerido.
                        </p>
                      ) : markup > 0 ? (
                        <>
                          <p className="text-2xl font-bold text-blue-600">{formatCurrency(precoSugerido)}</p>
                          <p className="text-xs text-blue-600/80 mt-1">
                            Custo × Mark-up de {markup.toFixed(2)}x (da página Planejamento)
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-blue-600 mt-1">
                          Carregando mark-up do Planejamento...
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2.5 bg-gray-50 rounded-xl p-4 border border-gray-100">
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
                  <div className="flex h-8 rounded-lg overflow-hidden shadow-inner">
                    <div 
                      className="bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center text-xs text-white font-medium transition-all duration-500"
                      style={{ width: `${Math.min(100, (custoPorPorcao / formData.precoVenda) * 100)}%` }}
                    >
                      {((custoPorPorcao / formData.precoVenda) * 100) > 8 ? `Custo ${formatPercentage((custoPorPorcao / formData.precoVenda) * 100)}` : ''}
                    </div>
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-xs text-white font-medium transition-all duration-500"
                      style={{ width: `${despesasFixasPercentual}%` }}
                    >
                      {despesasFixasPercentual > 8 ? `Fixas ${formatPercentage(despesasFixasPercentual)}` : ''}
                    </div>
                    <div 
                      className="bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-center text-xs text-white font-medium transition-all duration-500"
                      style={{ width: `${despesasVariaveisPercentual}%` }}
                    >
                      {despesasVariaveisPercentual > 8 ? `Variáveis ${formatPercentage(despesasVariaveisPercentual)}` : ''}
                    </div>
                    <div 
                      className="bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-center text-xs text-white font-medium transition-all duration-500"
                      style={{ width: `${Math.max(0, Math.min(100, margem))}%` }}
                    >
                      {Math.max(0, margem) > 8 ? `Lucro ${formatPercentage(Math.max(0, margem))}` : ''}
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1.5 px-1">
                    <span>Custo</span>
                    <span>Despesas Fixas</span>
                    <span>Despesas Variáveis</span>
                    <span>Lucro</span>
                  </div>
                </div>

                {/* Alertas */}
                {formData.precoVenda > 0 && margem < 30 && margem > 0 && (
                  <Alert className="mt-4 bg-amber-50 border-amber-200/80 rounded-xl">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-sm text-amber-700">
                      Margem de lucro está baixa ({formatPercentage(margem)}). 
                      Considere aumentar o preço de venda ou reduzir custos.
                    </AlertDescription>
                  </Alert>
                )}

                {formData.precoVenda > 0 && margem >= 50 && (
                  <Alert className="mt-4 bg-emerald-50 border-emerald-200/80 rounded-xl">
                    <AlertCircle className="h-4 w-4 text-emerald-600" />
                    <AlertDescription className="text-sm text-emerald-700">
                      Excelente! Margem de lucro de {formatPercentage(margem)}. Continue assim!
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>

          {/* Botão de ação flutuante para mobile */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-gray-200 md:hidden z-10">
            <Button 
              type="submit" 
              form="ficha-form"
              disabled={loading}
              className="w-full bg-[#de4838] hover:bg-[#c73d2e] text-white rounded-xl shadow-lg shadow-[#de4838]/30"
            >
              <Save className="mr-2 h-4 w-4" />
              {loading ? "Salvando..." : "Salvar Ficha Técnica"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}