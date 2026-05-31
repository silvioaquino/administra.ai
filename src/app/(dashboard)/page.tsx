// src/app/(dashboard)/dashboard/page.tsx
"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { 
  Store, Users, Package, DollarSign, TrendingUp, AlertCircle, Zap, 
  ArrowRight, Calendar, Clock, Search, PieChart, Trophy, 
  AlertTriangle, CheckCircle, Info, ArrowUpCircle, ArrowDownCircle,
  Filter, CalendarRange
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [loading, setLoading] = useState(false)
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
  const [periodoTexto, setPeriodoTexto] = useState<string>("Março 2025")
  const [metas, setMetas] = useState({
    faturamento: { atual: 0, meta: 60000, percentual: 0 },
    despesa: { atual: 0, meta: 0, percentual: 0 },
    lucro: { atual: 0, meta: 15, percentual: 0 }
  })
  const [ultimosLancamentos, setUltimosLancamentos] = useState<UltimoLancamento[]>([])
  const [alertas, setAlertas] = useState<Array<{ type: string; message: string }>>([])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    carregarDadosMockados()
  }, [periodo, dataEspecifica])

  function carregarDadosMockados() {
    setLoading(true)
    setChartLoading(true)
    
    setTimeout(() => {
      let receitasMock = 0
      let despesasMock = 0
      let metaFaturamento = 60000
      let diasNoPeriodo = 1
      
      switch(periodo) {
        case "hoje":
          receitasMock = 2450
          despesasMock = 1890
          diasNoPeriodo = 1
          metaFaturamento = 2450
          break
        case "mes":
          receitasMock = 45890
          despesasMock = 32150
          diasNoPeriodo = 30
          metaFaturamento = 60000
          break
        case "ano":
          receitasMock = 548760
          despesasMock = 385200
          diasNoPeriodo = 365
          metaFaturamento = 600000
          break
        case "especifico":
          if (dataEspecifica) {
            receitasMock = 2850
            despesasMock = 2100
            diasNoPeriodo = 1
            metaFaturamento = 2850
          } else {
            receitasMock = 45890
            despesasMock = 32150
            diasNoPeriodo = 30
            metaFaturamento = 60000
          }
          break
      }
      
      const saldoMock = receitasMock - despesasMock
      const margemMock = receitasMock > 0 ? (saldoMock / receitasMock) * 100 : 0

      setStats({
        totalProdutos: 156,
        totalFichas: 48,
        totalReceitas: receitasMock,
        totalDespesas: despesasMock,
        saldo: saldoMock,
        margem: margemMock
      })

      const mockChartData: ChartData[] = []
      const hoje = new Date()
      
      switch(periodo) {
        case "hoje":
          for (let i = 0; i < 24; i++) {
            const valorBase = receitasMock / 24
            const variacao = Math.sin(i * Math.PI / 12) * 50
            mockChartData.push({
              periodo: `${i.toString().padStart(2, '0')}:00`,
              receitas: Math.max(0, valorBase + variacao + (Math.random() * 40 - 20)),
              despesas: Math.max(0, (valorBase * 0.75) + variacao * 0.7 + (Math.random() * 30 - 15)),
              lucro: 0
            })
          }
          break
          
        case "mes":
          const diasNoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate()
          for (let i = 1; i <= diasNoMes; i++) {
            const date = new Date(hoje.getFullYear(), hoje.getMonth(), i)
            const diaSemana = date.getDay()
            const isWeekend = diaSemana === 0 || diaSemana === 6
            const fatorFimSemana = isWeekend ? 1.5 : 1
            const valorBase = receitasMock / diasNoMes
            const receitas = valorBase * fatorFimSemana + (Math.random() * valorBase * 0.3)
            const despesas = receitas * 0.68 + (Math.random() * receitas * 0.15)
            mockChartData.push({
              periodo: i.toString(),
              receitas: receitas,
              despesas: despesas,
              lucro: 0
            })
          }
          break
          
        case "ano":
          const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
          for (let i = 0; i < meses.length; i++) {
            const mesIndex = i
            const fatorSazonal = 1 + Math.sin((mesIndex - 5) * Math.PI / 6) * 0.3
            const receitas = (receitasMock / 12) * fatorSazonal + (Math.random() * (receitasMock / 12) * 0.1)
            const despesas = receitas * 0.68 + (Math.random() * receitas * 0.1)
            mockChartData.push({
              periodo: meses[i],
              receitas: receitas,
              despesas: despesas,
              lucro: 0
            })
          }
          break
          
        case "especifico":
          if (dataEspecifica) {
            for (let i = 0; i < 24; i++) {
              const valorBase = receitasMock / 24
              mockChartData.push({
                periodo: `${i.toString().padStart(2, '0')}:00`,
                receitas: valorBase + (Math.random() * 80 - 40),
                despesas: (valorBase * 0.7) + (Math.random() * 60 - 30),
                lucro: 0
              })
            }
          } else {
            setChartData([])
            setChartLoading(false)
            setLoading(false)
            return
          }
          break
      }
      
      mockChartData.forEach(item => {
        item.lucro = item.receitas - item.despesas
      })
      setChartData(mockChartData)

      const metaDespesaDiaria = 1700
      const metaDespesaPeriodo = metaDespesaDiaria * diasNoPeriodo
      const pctFaturamento = Math.min(100, (receitasMock / metaFaturamento) * 100)
      const pctDespesa = Math.min(100, (despesasMock / metaDespesaPeriodo) * 100)
      const pctLucro = Math.min(100, (margemMock / 15) * 100)

      setMetas({
        faturamento: { atual: receitasMock, meta: metaFaturamento, percentual: pctFaturamento },
        despesa: { atual: despesasMock, meta: metaDespesaPeriodo, percentual: pctDespesa },
        lucro: { atual: margemMock, meta: 15, percentual: pctLucro }
      })

      const lancamentosMock: UltimoLancamento[] = [
        { id: 1, data: new Date().toISOString().split("T")[0], descricao: "Venda - Cliente 001", cliente_fornecedor: "João Silva", entrada: 350, saida: 0 },
        { id: 2, data: new Date(Date.now() - 86400000).toISOString().split("T")[0], descricao: "Compra de Mercadorias", cliente_fornecedor: "Fornecedor XYZ", entrada: 0, saida: 1250 },
        { id: 3, data: new Date(Date.now() - 172800000).toISOString().split("T")[0], descricao: "Venda - Cliente 002", cliente_fornecedor: "Maria Santos", entrada: 890, saida: 0 },
        { id: 4, data: new Date(Date.now() - 259200000).toISOString().split("T")[0], descricao: "Pagamento de Contas", cliente_fornecedor: "Contabilidade", entrada: 0, saida: 450 },
        { id: 5, data: new Date(Date.now() - 345600000).toISOString().split("T")[0], descricao: "Venda - Cliente 003", cliente_fornecedor: "Pedro Oliveira", entrada: 1200, saida: 0 }
      ]
      setUltimosLancamentos(lancamentosMock)

      const alertasMock = []
      if (saldoMock < 0) {
        alertasMock.push({ type: "danger", message: `Situação crítica! Despesas superam receitas em ${formatCurrency(Math.abs(saldoMock))}` })
      } else if (margemMock < 10) {
        alertasMock.push({ type: "warning", message: `Margem de lucro está baixa (${margemMock.toFixed(1)}%). Reveja seus custos!` })
      } else if (margemMock >= 15) {
        alertasMock.push({ type: "success", message: `Margem de lucro excelente! (${margemMock.toFixed(1)}%)` })
      } else {
        alertasMock.push({ type: "info", message: "Tudo dentro do esperado! Continue assim!" })
      }
      setAlertas(alertasMock)

      if (periodo === "hoje") {
        setPeriodoTexto(new Date().toLocaleDateString("pt-BR"))
      } else if (periodo === "mes") {
        setPeriodoTexto(new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" }))
      } else if (periodo === "ano") {
        setPeriodoTexto(new Date().getFullYear().toString())
      } else if (periodo === "especifico" && dataEspecifica) {
        const data = new Date(dataEspecifica)
        setPeriodoTexto(data.toLocaleDateString("pt-BR"))
      } else if (periodo === "especifico" && !dataEspecifica) {
        setPeriodoTexto("Selecione uma data")
      }

      setLoading(false)
      setChartLoading(false)
    }, 300)
  }

  const formatTooltipValue = (value: number | string | undefined): string => {
    if (typeof value === 'number') {
      return formatCurrency(value)
    }
    return formatCurrency(0)
  }

  const getTipoClass = (entrada: number, saida: number) => {
    if (entrada > 0) return "text-emerald-600"
    return "text-red-600"
  }

  const getTipoIcon = (entrada: number, saida: number) => {
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

  const isInTrial = true
  const daysLeft = 15

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

  const indicadoresDataMock = {
    despesasFixas: [
      { nome: "ALUGUEL", valor: 1200 },
      { nome: "ENERGIA", valor: 700 },
      { nome: "ÁGUA", valor: 310 },
      { nome: "TELEFONE", valor: 112 },
      { nome: "INTERNET", valor: 70 },
      { nome: "CONTABILIDADE", valor: 350 }
    ],
    despesasVariaveisPct: 12.5,
    metaMensalTotal: stats.totalReceitas,
    cmv: 38.2
  }

  const totalReceitasChart = chartData.reduce((sum, item) => sum + item.receitas, 0)
  const totalDespesasChart = chartData.reduce((sum, item) => sum + item.despesas, 0)
  const lucroTotal = totalReceitasChart - totalDespesasChart

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-800">Dashboard</h1>
            <p className="text-sm text-gray-500">
              Bem-vindo, {session?.user?.name || "Usuário Teste"}!
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          {statsCards.map((card, idx) => (
            <Card
              key={idx}
              className={`relative overflow-hidden bg-gradient-to-r ${card.gradient} text-white border-0 hover:scale-105 transition-transform duration-200 cursor-pointer`}
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
            <div className="grid gap-4 md:grid-cols-3">
              {/* Meta Faturamento */}
              <div>
                <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl py-3 px-4 text-white">
                  <div className="flex justify-between items-center mb-1">
                    <small className="text-xs">🎯 Meta Faturamento</small>
                    <small className="text-[10px] opacity-80">
                      {formatCurrency(metas.faturamento.atual)} / {formatCurrency(metas.faturamento.meta)}
                    </small>
                  </div>
                  <div className="text-xl font-bold">{metas.faturamento.percentual.toFixed(0)}%</div>
                  <Progress value={metas.faturamento.percentual} className="h-1.5 mt-1 bg-white/30" />
                </div>
              </div>

              {/* Meta Despesa */}
              <div>
                <div className={`rounded-xl py-3 px-4 text-white ${
                  metas.despesa.percentual >= 100 ? "bg-red-500" : metas.despesa.percentual > 80 ? "bg-amber-500" : "bg-emerald-500"
                }`}>
                  <div className="flex justify-between items-center mb-1">
                    <small className="text-xs">💰 Meta Despesa</small>
                    <small className="text-[10px] opacity-80">
                      {formatCurrency(metas.despesa.atual)} / {formatCurrency(metas.despesa.meta)}
                    </small>
                  </div>
                  <div className="text-xl font-bold">{metas.despesa.percentual.toFixed(0)}%</div>
                  <Progress value={metas.despesa.percentual} className="h-1.5 mt-1 bg-white/30" />
                </div>
              </div>

              {/* Meta Lucro */}
              <div>
                <div className={`rounded-xl py-3 px-4 text-white ${
                  metas.lucro.percentual >= 100 ? "bg-emerald-500" : metas.lucro.percentual >= 70 ? "bg-blue-500" : "bg-amber-500"
                }`}>
                  <div className="flex justify-between items-center mb-1">
                    <small className="text-xs">📈 Meta Lucro</small>
                    <small className="text-[10px] opacity-80">
                      {metas.lucro.atual.toFixed(1)}% / {metas.lucro.meta}%
                    </small>
                  </div>
                  <div className="text-xl font-bold">{metas.lucro.percentual.toFixed(0)}%</div>
                  <Progress value={metas.lucro.percentual} className="h-1.5 mt-1 bg-white/30" />
                </div>
              </div>
            </div>
          </CardContent>
        </div>

        {/* Indicadores Financeiros */}
        <div className="mb-6">
          <IndicadoresCard 
            despesasFixas={indicadoresDataMock.despesasFixas}
            despesasVariaveisPct={indicadoresDataMock.despesasVariaveisPct}
            metaMensalTotal={stats.totalReceitas}
            cmv={indicadoresDataMock.cmv}
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
                <div className="mb-5 grid grid-cols-3 gap-4 pb-4 border-b border-gray-100">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Total Receitas</p>
                    <p className="text-xl font-bold text-blue-600">
                      {formatCurrency(totalReceitasChart)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Total Despesas</p>
                    <p className="text-xl font-bold text-red-600">
                      {formatCurrency(totalDespesasChart)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Lucro Líquido</p>
                    <p className={`text-xl font-bold ${lucroTotal >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {formatCurrency(lucroTotal)}
                    </p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="periodo" 
                      tick={{ fontSize: periodo === "ano" ? 11 : periodo === "mes" ? 10 : 11 }}
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
                    <Legend />
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
                        {getTipoIcon(lanc.entrada, lanc.saida)}
                        <div>
                          <p className="font-medium text-gray-800 text-sm">{lanc.descricao}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(lanc.data).toLocaleDateString("pt-BR")} • {lanc.cliente_fornecedor || "-"}
                          </p>
                        </div>
                      </div>
                      <div className={`font-bold text-sm ${getTipoClass(lanc.entrada, lanc.saida)}`}>
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
                {alertas.map((alerta, idx) => (
                  <div key={idx} className={`rounded-xl p-3 ${getAlertBg(alerta.type)} border`}>
                    <div className="flex items-start gap-2">
                      {getAlertIcon(alerta.type)}
                      <p className={`text-sm ${getAlertText(alerta.type)}`}>{alerta.message}</p>
                    </div>
                  </div>
                ))}
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
                <Badge className="bg-blue-100 text-blue-700 rounded-full">
                  Período de teste
                </Badge>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Fim do teste:</span>
                <span className="font-medium text-gray-700">15/04/2025</span>
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