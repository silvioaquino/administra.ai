// src/app/(dashboard)/dashboard/page.tsx

"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { 
  Store, DollarSign, TrendingUp, AlertCircle, Zap,
  ArrowRight, Calendar, Clock, PieChart, Trophy,
  AlertTriangle, CheckCircle, Info, ArrowUpCircle, ArrowDownCircle,
  Filter, CalendarRange
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts"
import { IndicadoresCard } from "./components/IndicadoresCard"

type PeriodoType = "hoje" | "mes" | "ano" | "especifico"

interface ChartData {
  periodo: string
  receitas: number
  despesas: number
  lucro: number
}

interface UltimoLancamento {
  id: number
  data: string
  descricao: string
  cliente_fornecedor: string
  entrada: number
  saida: number
}

interface FichaTecnica {
  id: string
  nome: string
  margem: number
}

interface IndicadoresFinanceiros {
  despesasFixas: Array<{ nome: string; valor: number }>
  despesasVariaveisPct: number
  metaMensalTotal: number
  cmv: number
}

interface MetaItem {
  atual: number
  meta: number
  percentual: number
}

interface MetaDespesa extends MetaItem {
  diaria: number
}

interface DashboardData {
  stats: {
    totalReceitas: number
    totalDespesas: number
    saldo: number
    margem: number
  }
  chartData: ChartData[]
  metas: {
    faturamento: MetaItem
    despesa: MetaDespesa
    lucro: MetaItem
  }
  ultimosLancamentos: UltimoLancamento[]
  periodoTexto: string
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [stats, setStats] = useState({
    totalProdutos: 0,
    totalFichas: 0,
    totalReceitas: 0,
    totalDespesas: 0,
    saldo: 0,
    margem: 0
  })
  
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [chartLoading, setChartLoading] = useState(false)
  const [periodo, setPeriodo] = useState<PeriodoType>("mes")
  const [dataEspecifica, setDataEspecifica] = useState<string>("")
  const [periodoTexto, setPeriodoTexto] = useState<string>("Carregando período...")
  const [metas, setMetas] = useState<{
    faturamento: MetaItem
    despesa: MetaDespesa
    lucro: MetaItem
  }>({
    faturamento: { atual: 0, meta: 0, percentual: 0 },
    despesa: { atual: 0, meta: 0, diaria: 0, percentual: 0 },
    lucro: { atual: 0, meta: 15, percentual: 0 }
  })
  const [ultimosLancamentos, setUltimosLancamentos] = useState<UltimoLancamento[]>([])
  const [alertas, setAlertas] = useState<Array<{ type: string; message: string }>>([])
  const [indicadores, setIndicadores] = useState<IndicadoresFinanceiros>({
    despesasFixas: [],
    despesasVariaveisPct: 0,
    metaMensalTotal: 0,
    cmv: 0
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  async function carregarDadosDashboard() {
    setChartLoading(true)

    try {
      const params = new URLSearchParams({
        periodo,
        ano: String(new Date().getFullYear()),
        mes: String(new Date().getMonth() + 1)
      })

      if (periodo === "especifico" && dataEspecifica) {
        params.set("data", dataEspecifica)
      }

      const response = await fetch(`/api/dashboard?${params.toString()}`)
      const json = await response.json()

      if (!response.ok || !json.success) {
        throw new Error(json.error || "Erro ao carregar dados do dashboard")
      }

      const data = json.data as DashboardData

      setStats(prev => ({
        ...prev,
        totalReceitas: data.stats.totalReceitas,
        totalDespesas: data.stats.totalDespesas,
        saldo: data.stats.saldo,
        margem: data.stats.margem
      }))
      setChartData(data.chartData)
      setMetas(data.metas)
      setUltimosLancamentos(data.ultimosLancamentos)
      setPeriodoTexto(data.periodoTexto)
      setAlertas(criarAlertasFinanceiros(data.stats.saldo, data.stats.margem))
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error)
      setStats(prev => ({
        ...prev,
        totalReceitas: 0,
        totalDespesas: 0,
        saldo: 0,
        margem: 0
      }))
      setChartData([])
      setMetas({
        faturamento: { atual: 0, meta: 0, percentual: 0 },
        despesa: { atual: 0, meta: 0, diaria: 0, percentual: 0 },
        lucro: { atual: 0, meta: 15, percentual: 0 }
      })
      setUltimosLancamentos([])
      setAlertas([{ type: "danger", message: "Não foi possível carregar os dados do dashboard" }])
    } finally {
      setChartLoading(false)
    }
  }

  async function carregarFichasTecnicas() {
    try {
      const response = await fetch("/api/fichas-tecnicas?limit=100&skip=0")
      const data = await response.json()

      if (data.success) {
        const fichas = data.data as FichaTecnica[]
        const margemBaixa = fichas.filter((f: FichaTecnica) => f.margem < 30)
        setAlertas(prev => mesclarAlertaFichasMargemBaixa(prev, margemBaixa))
      }
    } catch (error) {
      console.error("Erro ao carregar fichas técnicas:", error)
    }
  }

  async function carregarProdutos() {
    try {
      const response = await fetch("/api/produtos?limit=1&skip=0")
      const data = await response.json()

      if (data.success) {
        setStats(prev => ({
          ...prev,
          totalProdutos: data.total ?? 0
        }))
      }
    } catch (error) {
      console.error("Erro ao carregar produtos:", error)
    }
  }

  async function carregarIndicadoresFinanceiros() {
    try {
      const response = await fetch("/api/planejamento/indicadores-resumo")
      const data = await response.json()

      if (data.success) {
        setIndicadores({
          despesasFixas: data.despesasFixas ?? [],
          despesasVariaveisPct: data.despesasVariaveisPct ?? 0,
          metaMensalTotal: data.metaMensalTotal ?? 0,
          cmv: data.cmv ?? 0
        })
      }
    } catch (error) {
      console.error("Erro ao carregar indicadores financeiros:", error)
    }
  }

  function criarAlertasFinanceiros(saldo: number, margem: number) {
    if (saldo < 0) {
      return [{ type: "danger", message: `Situação crítica! Despesas superam receitas em ${formatCurrency(Math.abs(saldo))}` }]
    }

    if (margem < 10) {
      return [{ type: "warning", message: `Margem de lucro está baixa (${margem.toFixed(1)}%). Reveja seus custos!` }]
    }

    if (margem >= 15) {
      return [{ type: "success", message: `Margem de lucro excelente! (${margem.toFixed(1)}%)` }]
    }

    return [{ type: "info", message: "Tudo dentro do esperado! Continue assim!" }]
  }

  function mesclarAlertaFichasMargemBaixa(alertasAtuais: Array<{ type: string; message: string }>, fichas: FichaTecnica[]) {
    if (fichas.length === 0) return alertasAtuais

    const alertasSemFicha = alertasAtuais.filter(a => !a.message.includes("ficha(s) técnica(s) com margem abaixo de 30%"))
    const nomesFichas = fichas.map(f => f.nome).join(", ")
    const alertaMessage = fichas.length === 1
      ? `⚠️ Ficha técnica "${fichas[0].nome}" tem margem de lucro abaixo de 30% (${fichas[0].margem.toFixed(1)}%). Revise os custos ou preço de venda.`
      : `⚠️ ${fichas.length} ficha(s) técnica(s) com margem abaixo de 30%: ${nomesFichas}. Revise os custos ou preços de venda.`

    return [...alertasSemFicha, { type: "warning", message: alertaMessage }]
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      carregarDadosDashboard()
      carregarFichasTecnicas()
      carregarProdutos()
      carregarIndicadoresFinanceiros()
    }, 0)

    return () => window.clearTimeout(timeout)
  }, [periodo, dataEspecifica])

  const formatTooltipValue = (value: number | string | readonly (string | number)[] | undefined): string => {
    if (Array.isArray(value)) {
      return value
        .map((item) => (typeof item === "number" ? formatCurrency(item) : formatCurrency(0)))
        .join(", ")
    }

    if (typeof value === "number") {
      return formatCurrency(value)
    }

    return formatCurrency(0)
  }

  const getTipoClass = (entrada: number) => {
    if (entrada > 0) return "text-emerald-600"
    return "text-red-600"
  }

  const getTipoIcon = (entrada: number) => {
    if (entrada > 0) return <ArrowUpCircle className="h-4 w-4 text-emerald-600" />
    return <ArrowDownCircle className="h-4 w-4 text-red-600" />
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "danger": return <AlertTriangle className="h-4 w-4 text-red-600" />
      case "warning": return <AlertCircle className="h-4 w-4 text-amber-600" />
      case "success": return <CheckCircle className="h-4 w-4 text-emerald-600" />
      default: return <Info className="h-4 w-4 text-blue-600" />
    }
  }

  const getAlertBg = (type: string) => {
    switch (type) {
      case "danger": return "bg-red-50 border-red-200"
      case "warning": return "bg-amber-50 border-amber-200"
      case "success": return "bg-emerald-50 border-emerald-200"
      default: return "bg-blue-50 border-blue-200"
    }
  }

  const getAlertText = (type: string) => {
    switch (type) {
      case "danger": return "text-red-700"
      case "warning": return "text-amber-700"
      case "success": return "text-emerald-700"
      default: return "text-blue-700"
    }
  }

  const getXAxisInterval = () => {
    if (periodo === "ano") return 0
    if (periodo === "mes") return 0
    if (periodo === "hoje") return 2
    return 0
  }

  const getXAxisAngle = () => {
    if (periodo === "ano") return -45
    if (periodo === "mes") return -45
    return 0
  }

  const getXAxisHeight = () => {
    if (periodo === "ano") return 60
    if (periodo === "mes") return 60
    return 30
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#de4838] border-t-transparent" />
      </div>
    )
  }

  const trialEndsAt = session?.user?.trialEndsAt
  const isInTrial = Boolean(session?.user?.isInTrial)
  const daysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000))
    : 0

  const statsCards = [
    {
      title: "Receita Total",
      value: formatCurrency(stats.totalReceitas),
      icon: TrendingUp,
      gradient: "from-blue-600 to-blue-500",
      detail: "total em receitas"
    },
    {
      title: "Despesas",
      value: formatCurrency(stats.totalDespesas),
      icon: DollarSign,
      gradient: "from-red-600 to-red-500",
      detail: "total em despesas"
    },
    {
      title: "Lucro",
      value: formatCurrency(stats.saldo),
      icon: TrendingUp,
      gradient: "from-emerald-600 to-emerald-500",
      detail: "saldo do período"
    },
    {
      title: "Margem de Lucro",
      value: `${stats.margem.toFixed(1)}%`,
      icon: PieChart,
      gradient: "from-orange-500 to-orange-600",
      detail: "margem sobre receitas"
    }
  ]

  const quickActions = [
    { label: "Lançar Nova Venda", route: "/nfe/lancamento", variant: "default" as const },
    { label: "Criar Ficha Técnica", route: "/fichas-tecnicas/nova", variant: "outline" as const },
    { label: "Adicionar Produto", route: "/nfe/produtos/novo", variant: "outline" as const }
  ]

  const periodOptions = [
    { value: "hoje", label: "Hoje" },
    { value: "mes", label: "Mês" },
    { value: "ano", label: "Ano" },
    { value: "especifico", label: "Data Específica" }
  ]


  const totalReceitasChart = chartData.reduce((sum, item) => sum + item.receitas, 0)
  const totalDespesasChart = chartData.reduce((sum, item) => sum + item.despesas, 0)
  const lucroTotal = totalReceitasChart - totalDespesasChart

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="sticky top-0 z-10 ml-1 mb-5 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-800">Dashboard</h1>
            <p className="text-sm text-gray-500">
              Bem-vindo, {session?.user?.name || "Usuário"}!
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-gray-100 text-gray-600 rounded-full">
              <Calendar className="h-3 w-3 mr-1" />
              {new Date().toLocaleDateString("pt-BR")}
            </Badge>
          </div>
        </div>

        {/* Trial Alert */}
        {isInTrial && (
          <Alert className={`mb-6 rounded-xl ${daysLeft <= 3 ? "bg-orange-50 border-orange-200" : "bg-blue-50 border-blue-200"}`}>
            <AlertCircle className={`h-4 w-4 ${daysLeft <= 3 ? "text-orange-600" : "text-blue-600"}`} />
            <AlertDescription className={`text-sm ${daysLeft <= 3 ? "text-orange-700" : "text-blue-700"}`}>
              Você está no período de teste gratuito. {daysLeft} dias restantes.
              {daysLeft <= 3 && " Assine um plano para continuar usando o sistema!"}
            </AlertDescription>
          </Alert>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
          <div className="py-3 px-5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1">
                <Filter className="h-4 w-4 text-[#de4838]" />
                <h3 className="font-semibold text-gray-800 text-sm">Filtros</h3>
              </div>
              
              <div className="flex-1 flex flex-wrap items-center gap-2">
                <div className="relative">
                  <select
                    value={periodo}
                    onChange={(e) => setPeriodo(e.target.value as PeriodoType)}
                    className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#de4838] appearance-none pr-8"
                  >
                    {periodOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                    <svg className="fill-current h-4 w-4" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>

                {periodo === "especifico" && (
                  <input
                    type="date"
                    value={dataEspecifica}
                    onChange={(e) => setDataEspecifica(e.target.value)}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#de4838]"
                  />
                )}

                <div className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700">
                  <CalendarRange className="h-4 w-4 inline mr-1" />
                  {periodoTexto}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          {statsCards.map((card, idx) => (
            <Card
              key={idx}
              className={`relative overflow-hidden bg-gradient-to-r ${card.gradient} text-white border-0 hover:scale-105 transition-transform duration-200 cursor-pointer h-full min-h-[132px] sm:min-h-[150px]`}
            >
              <CardContent className="p-3 sm:p-5">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] sm:text-sm font-medium opacity-90 leading-tight">{card.title}</p>
                  <card.icon className="h-4 w-4 sm:h-5 sm:w-5 opacity-80" />
                </div>
                <div className="mt-2 text-lg sm:text-2xl font-bold leading-tight">
                  {card.value}
                </div>
                <p className="mt-1 text-[10px] sm:text-xs opacity-80">{card.detail}</p>
              </CardContent>
              <div className="absolute -bottom-4 -right-4 opacity-10">
                <card.icon className="h-20 w-20" />
              </div>
            </Card>
          ))}
        </div>

        {/* Metas */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
          <div className="bg-gray-50 py-3 px-5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-[#de4838]" />
              <h3 className="font-semibold text-gray-800">Metas</h3>
            </div>
          </div>
          <CardContent className="py-4 px-5">
            <div className="grid gap-3 md:grid-cols-3">
              {/* Meta Faturamento */}
              <div className="space-y-2 bg-gradient-to-r from-blue-200 to-blue-500 rounded-xl py-3 px-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    <span className="text-xs font-medium text-gray-700">🎯 Meta Faturamento</span>
                  </div>
                  <span className="text-xs font-bold text-gray-700">
                    {formatCurrency(metas.faturamento.atual)} / {formatCurrency(metas.faturamento.meta)}
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-600 to-blue-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, metas.faturamento.percentual))}%` }}
                  />
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Progresso</span>
                  <span className="text-xs font-semibold text-gray-600">
                    {Math.min(100, Math.max(0, metas.faturamento.percentual)).toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Meta Despesa */}
              <div className="space-y-2 bg-gradient-to-r from-yellow-200 to-yellow-500 rounded-xl py-3 px-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-red-500"></div>
                    <span className="text-xs font-medium text-gray-700">💰 Meta Despesa</span>
                  </div>
                  <span className="text-xs font-bold text-gray-700">
                    {formatCurrency(metas.despesa.atual)} / {formatCurrency(metas.despesa.meta)}
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      metas.despesa.percentual >= 100 
                        ? "bg-gradient-to-r from-red-600 to-red-500" 
                        : metas.despesa.percentual > 80 
                          ? "bg-gradient-to-r from-blue-500 to-blue-600" 
                          : "bg-gradient-to-r from-orange-500 to-orange-600"
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, metas.despesa.percentual))}%` }}
                  />
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Utilizado</span>
                  <span className={`text-xs font-semibold ${
                    metas.despesa.percentual >= 100 
                      ? "text-red-600" 
                      : metas.despesa.percentual > 80 
                        ? "text-gray-600" 
                        : "text-gray-700"
                  }`}>
                    {Math.min(100, Math.max(0, metas.despesa.percentual)).toFixed(0)}%
                  </span>
                </div>
                
                <div className="mt-1 flex justify-between text-[10px] text-gray-800">
                  <span>Meta: {formatCurrency(metas.despesa.meta)}</span>
                  <span>Diário: {formatCurrency(metas.despesa.diaria)}</span>
                </div>
              </div>

              {/* Meta Lucro */}
              <div className="space-y-2 bg-gradient-to-r from-emerald-200 to-emerald-500 rounded-xl py-3 px-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                    <span className="text-xs font-medium text-gray-700">📈 Meta Lucro</span>
                  </div>
                  <span className="text-xs font-bold text-gray-700">
                    {metas.lucro.atual.toFixed(1)}% / {metas.lucro.meta}%
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      metas.lucro.percentual >= 100 
                        ? "bg-gradient-to-r from-emerald-600 to-emerald-500" 
                        : metas.lucro.percentual >= 70 
                          ? "bg-gradient-to-r from-blue-500 to-blue-600" 
                          : "bg-gradient-to-r from-amber-500 to-amber-600"
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, metas.lucro.percentual))}%` }}
                  />
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Alcance</span>
                  <span className={`text-xs font-semibold ${
                    metas.lucro.percentual >= 100 
                      ? "text-gray-600" 
                      : metas.lucro.percentual >= 70 
                        ? "text-gray-600" 
                        : "text-gray-600"
                  }`}>
                    {Math.min(100, Math.max(0, metas.lucro.percentual)).toFixed(0)}%
                  </span>
                </div>
                
                <div className="mt-1 flex justify-between text-[10px] text-gray-800">
                  <span>Mínimo ideal: 15%</span>
                  <span>Excelente: &gt;20%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </div>

        {/* Indicadores Financeiros */}
        <div className="mb-6">
          <IndicadoresCard 
            despesasFixas={indicadores.despesasFixas}
            despesasVariaveisPct={indicadores.despesasVariaveisPct}
            metaMensalTotal={indicadores.metaMensalTotal}
            cmv={indicadores.cmv}
          />
        </div>

        {/* Gráfico de Receitas vs Despesas */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
          <div className="bg-gray-50 p-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#de4838]" />
              <h3 className="font-semibold text-gray-800">Evolução Financeira</h3>
              <Badge variant="outline" className="bg-gray-200 text-gray-700 rounded-full">
                {periodo === "hoje" ? "Por Hora" : periodo === "mes" ? "Por Dia" : periodo === "ano" ? "Por Mês" : "Por Hora"}
              </Badge>
            </div>
          </div>
          <CardContent className="p-5">
            {chartLoading ? (
              <div className="flex h-80 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#de4838] border-t-transparent" />
              </div>
            ) : chartData.length > 0 ? (
              <>
                <div className="mb-4 grid grid-cols-3 gap-2 pb-3 border-b border-gray-100">
                  <div className="rounded-lg bg-blue-50 p-2 text-center">
                    <p className="text-[10px] text-gray-500 leading-tight">Total Receitas</p>
                    <p className="mt-1 text-xs sm:text-lg font-bold text-blue-600 leading-tight">
                      {formatCurrency(totalReceitasChart)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-red-50 p-2 text-center">
                    <p className="text-[10px] text-gray-500 leading-tight">Total Despesas</p>
                    <p className="mt-1 text-xs sm:text-lg font-bold text-red-600 leading-tight">
                      {formatCurrency(totalDespesasChart)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-emerald-50 p-2 text-center">
                    <p className="text-[10px] text-gray-500 leading-tight">Lucro Líquido</p>
                    <p className={`mt-1 text-xs sm:text-lg font-bold leading-tight ${lucroTotal >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {formatCurrency(lucroTotal)}
                    </p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={320} >
                  <LineChart data={chartData} margin={{ top: 5, right: 12, left: 4, bottom: 28 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="periodo" 
                      tick={{ fontSize: periodo === "ano" ? 10 : periodo === "mes" ? 9 : 10 }}
                      interval={getXAxisInterval()}
                      angle={getXAxisAngle()}
                      textAnchor={getXAxisAngle() !== 0 ? "end" : "middle"}
                      height={getXAxisHeight()}
                    />
                    <YAxis 
                      tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip 
                      formatter={formatTooltipValue}
                      labelFormatter={(label) => {
                        if (periodo === "ano") return `Mês: ${label}`
                        if (periodo === "mes") return `Dia: ${label}`
                        if (periodo === "hoje") return `Hora: ${label}`
                        return `Período: ${label}`
                      }}
                      contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                    <Line 
                      type="monotone" 
                      dataKey="receitas" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ fill: "#3b82f6", strokeWidth: 2, r: 3 }}
                      activeDot={{ r: 5 }}
                      name="Receitas"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="despesas" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      dot={{ fill: "#ef4444", strokeWidth: 2, r: 3 }}
                      activeDot={{ r: 5 }}
                      name="Despesas"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="lucro" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: "#10b981", strokeWidth: 2, r: 2 }}
                      name="Lucro"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </>
            ) : (
              <div className="flex h-80 items-center justify-center">
                <p className="text-gray-500">
                  {periodo === "especifico" && !dataEspecifica 
                    ? "Selecione uma data específica para visualizar o gráfico" 
                    : "Nenhum dado disponível para o período selecionado"}
                </p>
              </div>
            )}
          </CardContent>
        </div>

        {/* Últimos Lançamentos e Alertas */}
        <div className="grid gap-6 md:grid-cols-2 mb-6">
          {/* Últimos Lançamentos */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gray-50 p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-[#de4838]" />
                <h3 className="font-semibold text-gray-800">Últimos Lançamentos</h3>
              </div>
            </div>
            <CardContent className="p-5">
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {ultimosLancamentos.length > 0 ? (
                  ultimosLancamentos.map((lanc) => (
                    <div key={lanc.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        {getTipoIcon(lanc.entrada)}
                        <div>
                          <p className="font-medium text-gray-800 text-sm">{lanc.descricao}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(lanc.data).toLocaleDateString("pt-BR")} • {lanc.cliente_fornecedor || "-"}
                          </p>
                        </div>
                      </div>
                      <div className={`font-bold text-sm ${getTipoClass(lanc.entrada)}`}>
                        {formatCurrency(lanc.entrada > 0 ? lanc.entrada : lanc.saida)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <p>Nenhum lançamento encontrado</p>
                  </div>
                )}
              </div>
            </CardContent>
          </div>

          {/* Alertas */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gray-50 p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-[#de4838]" />
                <h3 className="font-semibold text-gray-800">Alertas</h3>
              </div>
            </div>
            <CardContent className="p-5">
              <div className="space-y-3">
                {alertas.length > 0 ? (
                  alertas.map((alerta, idx) => (
                    <div key={idx} className={`rounded-xl p-3 ${getAlertBg(alerta.type)} border`}>
                      <div className="flex items-start gap-2">
                        {getAlertIcon(alerta.type)}
                        <p className={`text-sm ${getAlertText(alerta.type)}`}>{alerta.message}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                    <p className="text-sm">Tudo certo! Nenhum alerta no momento.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </div>
        </div>

        {/* Ações Rápidas e Informações do Sistema */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Ações Rápidas Card */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gray-50 p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-[#de4838]" />
                <h3 className="font-semibold text-gray-800">Ações Rápidas</h3>
              </div>
            </div>
            <div className="p-5 space-y-3">
              {quickActions.map((action, idx) => (
                <Button 
                  key={idx}
                  variant={action.variant}
                  className="w-full justify-between rounded-lg"
                  onClick={() => router.push(action.route)}
                >
                  <span>{action.label}</span>
                  <ArrowRight className="h-4 w-4 opacity-70" />
                </Button>
              ))}
            </div>
          </div>

          {/* Informações do Sistema */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gray-50 p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Store className="h-5 w-5 text-[#de4838]" />
                <h3 className="font-semibold text-gray-800">Informações do Sistema</h3>
              </div>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Status da assinatura:</span>
                <Badge className={isInTrial ? "bg-blue-100 text-blue-700 rounded-full" : "bg-emerald-100 text-emerald-700 rounded-full"}>
                  {isInTrial ? "Período de teste" : session?.user?.subscriptionStatus === "active" ? "Ativa" : "Não ativa"}
                </Badge>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Fim do teste:</span>
                <span className="font-medium text-gray-700">{trialEndsAt ? new Date(trialEndsAt).toLocaleDateString("pt-BR") : "-"}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Total de Produtos:</span>
                <span className="font-medium text-gray-700">{stats.totalProdutos}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Fichas Técnicas:</span>
                <span className="font-medium text-gray-700">{stats.totalFichas}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-500">Versão do sistema:</span>
                <span className="font-medium text-gray-700">2.0.0</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dica rápida */}
        <div className="mt-6 bg-gradient-to-r from-[#de4838]/5 to-transparent rounded-xl p-4 border border-[#de4838]/10">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#de4838]/10">
              <Zap className="h-4 w-4 text-[#de4838]" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Dica rápida</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Utilize os filtros de período para analisar seus resultados diários, mensais ou anuais!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}