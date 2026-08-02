// src/app/(dashboard)/dashboard/page.tsx

"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { 
  Store, DollarSign, TrendingUp, AlertCircle, Zap,
  ArrowRight, Calendar, Clock, PieChart, Trophy,
  AlertTriangle, CheckCircle, Info, ArrowUpCircle, ArrowDownCircle,
  Filter, CalendarRange, FileSpreadsheet, FileText
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
import { ProdutividadeChart } from "@/components/produtividade-chart"
import { DrilldownModal, type DrilldownFilter } from "./components/DrilldownModal"
import { exportDashboardExcel, exportDashboardPdf } from "@/lib/export/dashboard-export"

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
  pctFixas: number
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
  const [ano, setAno] = useState<number>(new Date().getFullYear())
  const [mes, setMes] = useState<number>(new Date().getMonth() + 1)
  const [dataInicio, setDataInicio] = useState<string>("")
  const [dataFim, setDataFim] = useState<string>("")
  const [periodoTexto, setPeriodoTexto] = useState<string>("Carregando período...")
  const [drilldown, setDrilldown] = useState<DrilldownFilter | null>(null)
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
    cmv: 0,
    pctFixas: 0
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
        ano: String(ano),
        mes: String(mes)
      })

      if (periodo === "especifico") {
        if (dataInicio) params.set("dataInicio", dataInicio)
        if (dataFim) params.set("dataFim", dataFim)
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
      const anoAtual = new Date().getFullYear()
      const response = await fetch(`/api/planejamento/indicadores-resumo?ano=${anoAtual}`)
      const data = await response.json()

      if (data.success) {
        setIndicadores({
          despesasFixas: data.despesasFixas ?? [],
          despesasVariaveisPct: data.despesasVariaveisPct ?? 0,
          metaMensalTotal: data.metaMensalTotal ?? 0,
          cmv: data.cmv ?? 0,
          pctFixas: data.pctFixas ?? 0
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
  }, [periodo, ano, mes, dataInicio, dataFim])

  // Intervalo efetivo do filtro atual, usado no drill-down.
  function intervaloAtual(): { inicio: string; fim: string } {
    const iso = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    const hoje = new Date()

    if (periodo === "hoje") return { inicio: iso(hoje), fim: iso(hoje) }
    if (periodo === "ano") return { inicio: `${ano}-01-01`, fim: `${ano}-12-31` }
    if (periodo === "especifico" && dataInicio) {
      return { inicio: dataInicio, fim: dataFim || dataInicio }
    }
    return { inicio: iso(new Date(ano, mes - 1, 1)), fim: iso(new Date(ano, mes, 0)) }
  }

  function abrirDrilldown(tipo: DrilldownFilter["tipo"], titulo: string) {
    const range = intervaloAtual()
    setDrilldown({ titulo: `${titulo} · ${periodoTexto}`, ...range, tipo })
  }

  function abrirDrilldownDia(labelPeriodo: string) {
    const partes = labelPeriodo.split("/")
    if (partes.length !== 3) return
    const [dia, mesLabel, anoLabel] = partes.map(Number)
    const iso = `${anoLabel}-${String(mesLabel).padStart(2, "0")}-${String(dia).padStart(2, "0")}`
    setDrilldown({ titulo: `Lançamentos de ${labelPeriodo}`, inicio: iso, fim: iso, tipo: "todos" })
  }

  function montarPayloadExport() {
    return {
      periodoTexto,
      empresa: session?.user?.name || undefined,
      stats: {
        totalReceitas: stats.totalReceitas,
        totalDespesas: stats.totalDespesas,
        saldo: stats.saldo,
        margem: stats.margem
      },
      chartData,
      lancamentos: ultimosLancamentos.map(l => ({
        data: l.data,
        descricao: l.descricao,
        clienteFornecedor: l.cliente_fornecedor,
        entrada: l.entrada,
        saida: l.saida
      }))
    }
  }


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
    if (entrada > 0) return "text-success"
    return "text-destructive"
  }

  const getTipoIcon = (entrada: number) => {
    if (entrada > 0) return <ArrowUpCircle className="h-4 w-4 text-success" />
    return <ArrowDownCircle className="h-4 w-4 text-destructive" />
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "danger": return <AlertTriangle className="h-4 w-4 text-destructive" />
      case "warning": return <AlertCircle className="h-4 w-4 text-warning" />
      case "success": return <CheckCircle className="h-4 w-4 text-success" />
      default: return <Info className="h-4 w-4 text-primary" />
    }
  }

  const getAlertBg = (type: string) => {
    switch (type) {
      case "danger": return "bg-destructive/10 border-destructive/30"
      case "warning": return "bg-warning/5 border-warning/30"
      case "success": return "bg-success/10 border-success/30"
      default: return "bg-primary/10 border-info/30"
    }
  }

  const getAlertText = (type: string) => {
    switch (type) {
      case "danger": return "text-destructive"
      case "warning": return "text-warning"
      case "success": return "text-success"
      default: return "text-info"
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
      <div className="min-h-screen bg-surface-2 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const trialEndsAt = session?.user?.trialEndsAt
  const isInTrial = Boolean(session?.user?.isInTrial)
  const daysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000))
    : 0

  const statsCards: Array<{
    title: string
    value: string
    icon: typeof TrendingUp
    detail: string
    drill?: { tipo: DrilldownFilter["tipo"]; titulo: string }
  }> = [
    {
      title: "Receita Total",
      value: formatCurrency(stats.totalReceitas),
      icon: TrendingUp,
      detail: "total em receitas",
      drill: { tipo: "receitas", titulo: "Receitas" }
    },
    {
      title: "Despesas",
      value: formatCurrency(stats.totalDespesas),
      icon: DollarSign,
      detail: "total em despesas",
      drill: { tipo: "despesas", titulo: "Despesas" }
    },
    {
      title: "Lucro",
      value: formatCurrency(stats.saldo),
      icon: TrendingUp,
      detail: "saldo do período",
      drill: { tipo: "todos", titulo: "Resultado" }
    },
    {
      title: "Margem de Lucro",
      value: `${stats.margem.toFixed(1)}%`,
      icon: PieChart,
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

  const mesesOptions = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ]

  const anoAtual = new Date().getFullYear()
  const anosOptions = [anoAtual - 2, anoAtual - 1, anoAtual, anoAtual + 1]


  const totalReceitasChart = chartData.reduce((sum, item) => sum + item.receitas, 0)
  const totalDespesasChart = chartData.reduce((sum, item) => sum + item.despesas, 0)
  const lucroTotal = totalReceitasChart - totalDespesasChart

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-8 max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Bem-vindo, {session?.user?.name || "Usuário"}!
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-surface-2 text-muted-foreground/70 rounded-full hidden sm:inline-flex">
              <Calendar className="h-3 w-3 mr-1" />
              {new Date().toLocaleDateString("pt-BR")}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportDashboardExcel(montarPayloadExport())}
              className="rounded-xl"
            >
              <FileSpreadsheet className="h-4 w-4 mr-1.5" />
              Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportDashboardPdf(montarPayloadExport())}
              className="rounded-xl"
            >
              <FileText className="h-4 w-4 mr-1.5" />
              PDF
            </Button>
          </div>
        </div>

        {/* Trial Alerta */}
        {isInTrial && (
          <Alert className={`mb-6 rounded-xl ${daysLeft <= 3 ? "bg-warning/5 border-warning/30" : "bg-primary/10 border-info/30"}`}>
            <AlertCircle className={`h-4 w-4 ${daysLeft <= 3 ? "text-warning" : "text-primary"}`} />
            <AlertDescription className={`text-sm ${daysLeft <= 3 ? "text-warning" : "text-info"}`}>
              Você está no período de teste gratuito. {daysLeft} dias restantes.
              {daysLeft <= 3 && " Assine um plano para continuar usando o sistema!"}
            </AlertDescription>
          </Alert>
        )}

        {/* Filtros */}
        <div className="surface-card overflow-hidden">
          <div className="py-3 px-5">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1">
              <div className="flex items-center gap-1 flex-shrink-0">
                <Filter className="h-4 w-4 text-primary" />
                <h3 className="panel-title text-base text-sm hidden sm:inline">Filtros</h3>
              </div>

              <div className="flex items-center gap-2 flex-grow min-w-0">
                <div className="relative flex-shrink-0">
                  <select
                    value={periodo}
                    onChange={(e) => setPeriodo(e.target.value as PeriodoType)}
                    className="rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none pr-8 min-w-[120px]"
                  >
                    {periodOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
                    <svg className="fill-current h-4 w-4" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>

                {periodo === "especifico" && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <input
                      type="date"
                      value={dataInicio}
                      onChange={(e) => setDataInicio(e.target.value)}
                      className="rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-w-[120px]"
                      placeholder="Início"
                    />
                    <span className="text-muted-foreground flex-shrink-0">até</span>
                    <input
                      type="date"
                      value={dataFim}
                      onChange={(e) => setDataFim(e.target.value)}
                      className="rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-w-[120px]"
                      placeholder="Fim"
                    />
                  </div>
                )}

                {periodo === "mes" && (
                  <select
                    value={mes}
                    onChange={(e) => setMes(Number(e.target.value))}
                    className="rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary flex-shrink-0"
                  >
                    {mesesOptions.map((nome, index) => (
                      <option key={nome} value={index + 1}>{nome}</option>
                    ))}
                  </select>
                )}

                {(periodo === "mes" || periodo === "ano") && (
                  <select
                    value={ano}
                    onChange={(e) => setAno(Number(e.target.value))}
                    className="rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary flex-shrink-0"
                  >
                    {anosOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                )}

                <div className="rounded-lg bg-surface-2 px-3 py-2 text-sm font-medium text-muted-foreground/70 flex-shrink-0">
                  <CalendarRange className="h-4 w-4 inline mr-1" />
                  {periodoTexto}
                </div>

                <button
                  onClick={() => abrirDrilldown("todos", "Todos os lançamentos")}
                  className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-surface hover:text-white flex-shrink-0"
                >
                  Ver lançamentos
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((card, idx) => (
            <Card
              key={idx}
              onClick={card.drill ? () => abrirDrilldown(card.drill!.tipo, card.drill!.titulo) : undefined}
              className={`relative overflow-hidden surface-card card-hover text-white h-full min-h-[110px] ${
                card.drill ? "cursor-pointer" : ""
              }`}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground leading-tight">{card.title}</p>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10"><card.icon className="h-4 w-4 text-primary" /></span>
                </div>
                <div className="mt-2 text-lg sm:text-2xl font-bold leading-tight panel-title">
                  {card.value}
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {card.drill ? "Clique para detalhar" : card.detail}
                </p>
              </CardContent>
              
            </Card>
          ))}
        </div>

        {/* Metas */}
        <div className="surface-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              <h3 className="panel-title text-base">Metas</h3>
            </div>
          </div>
          <CardContent className="py-4 px-5">
            <div className="grid gap-3 md:grid-cols-3">
              {/* Meta Faturamento */}
              <div className="space-y-2 bg-gradient-to-r from-primary/20 to-primary/5 border border-border rounded-xl py-3 px-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary/100"></div>
                    <span className="text-xs font-medium text-muted-foreground/70">🎯 Meta Faturamento</span>
                  </div>
                  <span className="text-xs font-bold text-muted-foreground/70">
                    {formatCurrency(metas.faturamento.atual)} / {formatCurrency(metas.faturamento.meta)}
                  </span>
                </div>
                
                <div className="w-full bg-surface-2 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-info to-info h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, metas.faturamento.percentual))}%` }}
                  />
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Progresso</span>
                  <span className="text-xs font-semibold text-muted-foreground/70">
                    {Math.min(100, Math.max(0, metas.faturamento.percentual)).toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Meta Despesa */}
              <div className="space-y-2 bg-gradient-to-r from-warning/20 to-warning/5 border border-border rounded-xl py-3 px-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-destructive/100"></div>
                    <span className="text-xs font-medium text-muted-foreground/70">💰 Meta Despesa</span>
                  </div>
                  <span className="text-xs font-bold text-muted-foreground/70">
                    {formatCurrency(metas.despesa.atual)} / {formatCurrency(metas.despesa.meta)}
                  </span>
                </div>
                
                <div className="w-full bg-surface-2 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      metas.despesa.percentual >= 100 
                        ? "bg-gradient-to-r from-destructive to-destructive" 
                        : metas.despesa.percentual > 80 
                          ? "bg-gradient-to-r from-info to-info/80" 
                          : "bg-gradient-to-r from-warning to-warning/80"
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, metas.despesa.percentual))}%` }}
                  />
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Utilizado</span>
                  <span className={`text-xs font-semibold ${
                    metas.despesa.percentual >= 100 
                      ? "text-destructive" 
                      : metas.despesa.percentual > 80 
                        ? "text-muted-foreground/70" 
                        : "text-muted-foreground/70"
                  }`}>
                    {Math.min(100, Math.max(0, metas.despesa.percentual)).toFixed(0)}%
                  </span>
                </div>
                
                <div className="mt-1 flex justify-between text-[10px] text-white">
                  <span>Meta: {formatCurrency(metas.despesa.meta)}</span>
                  <span>Diário: {formatCurrency(metas.despesa.diaria)}</span>
                </div>
              </div>

              {/* Meta Lucro */}
              <div className="space-y-2 bg-gradient-to-r from-success/20 to-success/5 border border-border rounded-xl py-3 px-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-success/100"></div>
                    <span className="text-xs font-medium text-muted-foreground/70">📈 Meta Lucro</span>
                  </div>
                  <span className="text-xs font-bold text-muted-foreground/70">
                    {metas.lucro.atual.toFixed(1)}% / {metas.lucro.meta}%
                  </span>
                </div>
                
                <div className="w-full bg-surface-2 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      metas.lucro.percentual >= 100 
                        ? "bg-gradient-to-r from-success to-success" 
                        : metas.lucro.percentual >= 70 
                          ? "bg-gradient-to-r from-info to-info/80" 
                          : "bg-gradient-to-r from-warning to-warning"
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, metas.lucro.percentual))}%` }}
                  />
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground/70">Alcance</span>
                  <span className={`text-xs font-semibold ${
                    metas.lucro.percentual >= 100 
                      ? "text-muted-foreground/70" 
                      : metas.lucro.percentual >= 70 
                        ? "text-muted-foreground/70" 
                        : "text-muted-foreground/70"
                  }`}>
                    {Math.min(100, Math.max(0, metas.lucro.percentual)).toFixed(0)}%
                  </span>
                </div>
                
                <div className="mt-1 flex justify-between text-[10px] text-white">
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
            pctFixas={indicadores.pctFixas}
          />
        </div>

        {/* Gráfico de Receitas vs Despesas */}
        <div className="surface-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h3 className="panel-title text-base">Evolução Financeira</h3>
              <Badge variant="outline" className="bg-surface-2 text-muted-foreground/70 rounded-full">
                {periodo === "hoje" ? "Por Hora" : periodo === "mes" ? "Por Dia" : periodo === "ano" ? "Por Mês" : "Por Hora"}
              </Badge>
            </div>
          </div>
          <CardContent className="p-5">
            {chartLoading ? (
              <div className="flex h-80 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : chartData.length > 0 ? (
              <>
                <div className="mb-4 grid grid-cols-3 gap-2 pb-3 border-b border-border">
                  <div className="rounded-lg bg-primary/10 p-2 text-center">
                    <p className="text-[10px] text-muted-foreground leading-tight">Total Receitas</p>
                    <p className="mt-1 text-xs sm:text-lg font-bold text-primary leading-tight">
                      {formatCurrency(totalReceitasChart)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-destructive/10 p-2 text-center">
                    <p className="text-[10px] text-muted-foreground leading-tight">Total Despesas</p>
                    <p className="mt-1 text-xs sm:text-lg font-bold text-destructive leading-tight">
                      {formatCurrency(totalDespesasChart)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-success/10 p-2 text-center">
                    <p className="text-[10px] text-muted-foreground leading-tight">Lucro Líquido</p>
                    <p className={`mt-1 text-xs sm:text-lg font-bold leading-tight ${lucroTotal >= 0 ? "text-success" : "text-destructive"}`}>
                      {formatCurrency(lucroTotal)}
                    </p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={320} >
                  <LineChart
                    data={chartData}
                    margin={{ top: 5, right: 12, left: 4, bottom: 28 }}
                    onClick={(state: { activeLabel?: string | number }) => {
                      if (state?.activeLabel) abrirDrilldownDia(String(state.activeLabel))
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e1e5a" />
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
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                    />
                    <Tooltip 
                      formatter={formatTooltipValue}
                      labelFormatter={(label) => {
                        if (periodo === "ano") return `Mês: ${label}`
                        if (periodo === "mes") return `Dia: ${label}`
                        if (periodo === "hoje") return `Hora: ${label}`
                        return `Período: ${label}`
                      }}
                      contentStyle={{ borderRadius: "12px", border: "1px solid #1e1e5a", background: "#141432", color: "#e2e8f0" }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                    <Line 
                      type="monotone" 
                      dataKey="receitas" 
                      stroke="#4f46e5" 
                      strokeWidth={2}
                      dot={{ fill: "#4f46e5", strokeWidth: 2, r: 3 }}
                      activeDot={{ r: 5 }}
                      name="Receitas"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="despesas" 
                      stroke="#f43f5e" 
                      strokeWidth={2}
                      dot={{ fill: "#f43f5e", strokeWidth: 2, r: 3 }}
                      activeDot={{ r: 5 }}
                      name="Despesas"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="lucro" 
                      stroke="#34d399" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: "#34d399", strokeWidth: 2, r: 2 }}
                      name="Lucro"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </>
            ) : (
              <div className="flex h-80 items-center justify-center">
                <p className="text-muted-foreground">
                  {periodo === "especifico" && (!dataInicio || !dataFim)
                    ? "Selecione o período (data inicial e final) para visualizar o gráfico"
                    : "Nenhum dado disponível para o período selecionado"}
                </p>
              </div>
            )}
          </CardContent>
        </div>

        {/* Produtividade por funcionário 
        <div className="surface-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              <h3 className="panel-title text-base">Produtividade</h3>
            </div>
          </div>
          <CardContent className="p-5">
            <ProdutividadeChart />
          </CardContent>
        </div>*/}

        {/* Últimos Lançamentos e Alertas */}
        <div className="grid gap-8 md:grid-cols-2">
          {/* Últimos Lançamentos */}
          <div className="surface-card overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <h3 className="panel-title text-base">Últimos Lançamentos</h3>
              </div>
            </div>
            <CardContent className="p-5">
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {ultimosLancamentos.length > 0 ? (
                  ultimosLancamentos.map((lanc) => (
                    <div key={lanc.id} className="flex items-center justify-between p-3 rounded-xl border border-border hover:border-primary transition-colors">
                      <div className="flex items-center gap-3">
                        {getTipoIcon(lanc.entrada)}
                        <div>
                          <p className="font-medium text-white text-sm">{lanc.descricao}</p>
                          <p className="text-xs text-muted-foreground">
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
                  <div className="text-center text-muted-foreground py-8">
                    <p>Nenhum lançamento encontrado</p>
                  </div>
                )}
              </div>
            </CardContent>
          </div>

          {/* Alertas */}
          <div className="surface-card overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
                <h3 className="panel-title text-base">Alertas</h3>
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
                  <div className="text-center text-muted-foreground py-8">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-success" />
                    <p className="text-sm">Tudo certo! Nenhum alerta no momento.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </div>
        </div>
        {/* Informações do Sistema - Largura total */}
        <div className="surface-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              <h3 className="panel-title text-base">Informações do Sistema</h3>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Coluna Esquerda */}
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Status da assinatura:</span>
                  <Badge className={isInTrial ? "bg-primary/15 text-primary rounded-full" : "bg-success/15 text-success rounded-full"}>
                    {isInTrial ? "Período de teste" : session?.user?.subscriptionStatus === "active" ? "Ativa" : "Não ativa"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Fim do teste:</span>
                  <span className="font-medium text-muted-foreground/70">{trialEndsAt ? new Date(trialEndsAt).toLocaleDateString("pt-BR") : "-"}</span>
                </div>
              </div>
              {/* Coluna Direita */}
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Total de Produtos:</span>
                  <span className="font-medium text-muted-foreground/70">{stats.totalProdutos}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Fichas Técnicas:</span>
                  <span className="font-medium text-muted-foreground/70">{stats.totalFichas}</span>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-sm text-muted-foreground">Versão do sistema:</span>
              <span className="font-medium text-muted-foreground/70">2.0.0</span>
            </div>
          </div>
        </div>

        {/* Dica rápida */}

        <div className="mt-6 bg-gradient-to-r from-primary/10 to-transparent rounded-2xl p-4 border border-primary/20">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground/70">Dica rápida</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Utilize os filtros de período para analisar seus resultados diários, mensais ou anuais!
              </p>
            </div>
          </div>
        </div>
      </div>

      <DrilldownModal filter={drilldown} onClose={() => setDrilldown(null)} />
    </div>
  )
}
