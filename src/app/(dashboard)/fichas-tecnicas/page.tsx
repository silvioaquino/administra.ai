// src/app/(dashboard)/fichas-tecnicas/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search, Filter, Package, TrendingUp, DollarSign, AlertCircle, Zap } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatPercentage } from "@/lib/utils"
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
  const [stats, setStats] = useState({
    total: 0,
    margemMedia: 0,
    custoMedio: 0,
    precoMedio: 0
  })

  useEffect(() => {
    carregarFichas()
  }, [])

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#de4838] border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 ml-6 mr-6 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Fichas Técnicas</h1>
          <p className="text-sm text-gray-500">Gerencie as receitas e custos dos seus pratos</p>
        </div>
        <Button 
          onClick={() => router.push("/fichas-tecnicas/nova")}
          className="bg-[#de4838] hover:bg-[#c73d2e] text-white rounded-full px-5"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova Ficha Técnica
        </Button>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-6 max-w-7xl">
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
        <div className="mt-6 flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar por nome do prato..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-lg border-gray-200 focus:ring-[#de4838]"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={categoriaFiltro === "" ? "default" : "outline"}
              onClick={() => setCategoriaFiltro("")}
              className={categoriaFiltro === "" ? "bg-[#de4838] hover:bg-[#c73d2e]" : "border-gray-200 hover:border-[#de4838]"}
            >
              Todos
            </Button>
            <Button
              variant={categoriaFiltro === "Almoço" ? "default" : "outline"}
              onClick={() => setCategoriaFiltro("Almoço")}
              className={categoriaFiltro === "Almoço" ? "bg-[#de4838] hover:bg-[#c73d2e]" : "border-gray-200 hover:border-[#de4838]"}
            >
              Almoço
            </Button>
            <Button
              variant={categoriaFiltro === "Janta" ? "default" : "outline"}
              onClick={() => setCategoriaFiltro("Janta")}
              className={categoriaFiltro === "Janta" ? "bg-[#de4838] hover:bg-[#c73d2e]" : "border-gray-200 hover:border-[#de4838]"}
            >
              Janta
            </Button>
          </div>
        </div>

        {/* Alertas de Margem Baixa */}
        {fichas.some(f => f.margem < 30) && (
          <Alert className="mt-4 bg-amber-50 border-amber-200 rounded-xl">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-sm text-amber-700">
              Algumas fichas técnicas têm margem de lucro abaixo de 30%. Revise os custos ou preços de venda.
            </AlertDescription>
          </Alert>
        )}

        {/* Lista de Fichas */}
        <div className="mt-6">
          {fichasFiltradas.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="flex h-80 flex-col items-center justify-center text-center p-6">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Package className="h-10 w-10 text-gray-400" />
                </div>
                <p className="text-gray-500 mb-2">Nenhuma ficha técnica encontrada</p>
                <p className="text-sm text-gray-400 mb-4">
                  {search ? "Tente buscar por outro termo" : "Comece criando sua primeira ficha técnica"}
                </p>
                {!search && (
                  <Button 
                    onClick={() => router.push("/fichas-tecnicas/nova")}
                    className="bg-[#de4838] hover:bg-[#c73d2e] text-white rounded-lg"
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
                  onEdit={() => router.push(`/fichas-tecnicas/${ficha.id}/edit`)}
                  onRefresh={carregarFichas}
                />
              ))}
            </div>
          )}
        </div>

        {/* Badge de Atualização Automática */}
        <div className="fixed bottom-6 right-6">
          <div className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs text-emerald-700 shadow-sm">
            <Zap className="inline h-3 w-3 mr-1" />
            Atualização automática de custos ativada
          </div>
        </div>
      </div>
    </div>
  )
}