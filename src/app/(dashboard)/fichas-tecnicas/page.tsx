// src/app/(dashboard)/fichas-tecnicas/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search, Filter, Package, TrendingUp, DollarSign, AlertCircle, Zap, CalendarRange } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatCurrency, formatPercentage } from "@/lib/utils"
import { PageContainer } from "@/components/layout/PageContainer"
import { PageHeader } from "@/components/layout/PageHeader"
import { FichaCard } from "./components/FichaCard"

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
  createdAt: string
  updatedAt: string
}

export default function FichasTecnicasPage() {
  const router = useRouter()
  const [fichas, setFichas] = useState<FichaTecnica[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [categoriaFiltro, setCategoriaFiltro] = useState("")
  // Margem de lucro alvo definida no Planejamento (padrão 15%). Usada como limite de "Atenção" nos cards.
  const [lucroDesejado, setLucroDesejado] = useState(15)
  const [stats, setStats] = useState({
    total: 0,
    margemMedia: 0,
    custoMedio: 0,
    precoMedio: 0
  })

  useEffect(() => {
    carregarFichas()
    carregarLucroDesejado()
  }, [])

  async function carregarLucroDesejado() {
    try {
      const ano = new Date().getFullYear()
      const response = await fetch(`/api/planejamento/lucro-desejado?ano=${ano}`)
      const data = await response.json()
      if (data.success) {
        setLucroDesejado(data.lucroDesejado ?? 15)
      }
    } catch (error) {
      console.error("Erro ao carregar lucro desejado:", error)
    }
  }

  async function carregarFichas() {
    try {
      const response = await fetch("/api/fichas-tecnicas")
      const data = await response.json()
      if (data.success) {
        setFichas(data.data)
        calcularStats(data.data)
      }
    } catch (error) {
      console.error("Erro ao carregar fichas:", error)
    } finally {
      setLoading(false)
    }
  }

  function calcularStats(fichasData: FichaTecnica[]) {
    if (fichasData.length === 0) return
    
    const totalMargem = fichasData.reduce((sum, f) => sum + f.margem, 0)
    const totalCusto = fichasData.reduce((sum, f) => sum + f.custoTotal, 0)
    const totalPreco = fichasData.reduce((sum, f) => sum + f.precoVenda, 0)
    
    setStats({
      total: fichasData.length,
      margemMedia: totalMargem / fichasData.length,
      custoMedio: totalCusto / fichasData.length,
      precoMedio: totalPreco / fichasData.length
    })
  }

  const fichasFiltradas = fichas.filter(f => {
    const matchSearch = f.nome.toLowerCase().includes(search.toLowerCase())
    const matchCategoria = categoriaFiltro ? f.categoria === categoriaFiltro : true
    return matchSearch && matchCategoria
  })

  // Categorias presentes nas fichas (para o filtro refletir categorias personalizadas).
  const categoriasUnicas = Array.from(
    new Set(fichas.map(f => f.categoria).filter((c): c is string => typeof c === "string" && c.trim().length > 0))
  ).sort()

  const cardsStats = [
    {
      title: "Total de Fichas",
      value: stats.total.toString(),
      icon: Package,
      gradient: "from-primary to-primary/80",
      detail: "Fichas cadastradas"
    },
    {
      title: "Margem Média",
      value: formatPercentage(stats.margemMedia),
      icon: TrendingUp,
      gradient: "from-green-600 to-green-500",
      detail: "Lucro médio"
    },
    {
      title: "Custo Médio",
      value: formatCurrency(stats.custoMedio),
      icon: DollarSign,
      gradient: "from-orange-500 to-orange-600",
      detail: "Por ficha"
    },
    {
      title: "Preço Médio",
      value: formatCurrency(stats.precoMedio),
      icon: DollarSign,
      gradient: "from-blue-500 to-blue-600",
      detail: "Preço de venda"
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-2 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <PageContainer>
        <PageHeader
          title="Fichas Técnicas"
          subtitle="Gerencie as receitas e custos dos seus pratos"
          backHref="/precificacao"
        >
          <Button
            onClick={() => router.push("/fichas-tecnicas/nova")}
            className="bg-primary hover:bg-primary/90 text-white rounded-full px-5"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova Ficha Técnica
          </Button>
        </PageHeader>
        {/* Cards de Estatísticas 
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cardsStats.map((card, idx) => (
            <Card
              key={idx}
              className={`relative overflow-hidden bg-gradient-to-r ${card.gradient} text-white border-0`}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium opacity-90">{card.title}</p>
                  <card.icon className="h-5 w-5 opacity-80" />
                </div>
                <div className="mt-2 text-2xl font-bold">
                  {card.value}
                </div>
                <p className="mt-1 text-xs opacity-80">{card.detail}</p>
              </CardContent>
              <div className="absolute -bottom-4 -right-4 opacity-10">
                <card.icon className="h-20 w-20" />
              </div>
            </Card>
          ))}
        </div>*/}

        {/* Filtros */}
        <div className="bg-surface rounded-2xl shadow-sm overflow-hidden mb-6">
          <div className="py-3 px-5">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1">
              <div className="flex items-center gap-1 flex-shrink-0">
                <Filter className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-white text-sm hidden sm:inline">Filtros</h3>
              </div>

              <div className="flex items-center gap-2 flex-grow min-w-0">
                {/* Busca por nome */}
                <div className="relative flex-shrink-0">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
                  <Input
                    placeholder="Buscar por nome do prato..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 pr-3 py-2 text-sm rounded-lg border-border focus:ring-primary focus:border-transparent min-w-[200px]"
                  />
                </div>

                {/* Filtro de categoria */}
                <div className="relative flex-shrink-0">
                  <select
                    value={categoriaFiltro}
                    onChange={(e) => setCategoriaFiltro(e.target.value)}
                    className="rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none pr-8 min-w-[120px]"
                  >
                    <option value="">Todos</option>
                    {categoriasUnicas.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
                    <svg className="fill-current h-4 w-4" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>

                <div className="rounded-lg bg-surface-2 px-3 py-2 text-sm font-medium text-white flex-shrink-0">
                  <CalendarRange className="h-4 w-4 inline mr-1" />
                  {stats.total} ficha{stats.total !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alertas de Margem Baixa */}
        {fichas.some(f => f.margem < lucroDesejado) && (
          <Alert className="mt-4 bg-warning/5 border-amber-200 rounded-xl">
            <AlertCircle className="h-4 w-4 text-warning" />
            <AlertDescription className="text-sm text-warning">
              Algumas fichas técnicas têm margem de lucro abaixo de {formatPercentage(lucroDesejado)} (margem alvo do Planejamento). Revise os custos ou preços de venda.
            </AlertDescription>
          </Alert>
        )}

        {/* Lista de Fichas */}
        <div className="mt-6">
          {fichasFiltradas.length === 0 ? (
            <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
              <div className="flex h-80 flex-col items-center justify-center text-center p-6">
                <div className="w-20 h-20 bg-surface-2 rounded-full flex items-center justify-center mb-4">
                  <Package className="h-10 w-10 text-muted-foreground/70" />
                </div>
                <p className="text-muted-foreground mb-2">Nenhuma ficha técnica encontrada</p>
                <p className="text-sm text-muted-foreground/70 mb-4">
                  {search ? "Tente buscar por outro termo" : "Comece criando sua primeira ficha técnica"}
                </p>
                {!search && (
                  <Button 
                    onClick={() => router.push("/fichas-tecnicas/nova")}
                    className="bg-primary hover:bg-primary/90 text-white rounded-lg"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Criar primeira ficha técnica
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {fichasFiltradas.map((ficha) => (
                <FichaCard
                  key={ficha.id}
                  ficha={ficha}
                  margemMinima={lucroDesejado}
                  onEdit={() => router.push(`/fichas-tecnicas/${ficha.id}/edit`)}
                  onRefresh={carregarFichas}
                />
              ))}
            </div>
          )}
        </div>

        {/* Badge de Atualização Automática */}
        <div className="fixed bottom-6 right-6">
          <div className="rounded-full bg-success/10 px-3 py-1.5 text-xs text-success shadow-sm">
            <Zap className="inline h-3 w-3 mr-1" />
            Atualização automática de custos ativada
          </div>
        </div>
      </PageContainer>
    </div>
  )
}