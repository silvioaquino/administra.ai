// src/app/(dashboard)/page.tsx - Dashboard com visual cardapio.ai
"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target,
  ShoppingBag,
  Users,
  Receipt,
  Eye,
  EyeOff,
  ArrowUpRight
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [hideValues, setHideValues] = useState(false)
  const [dashboardData, setDashboardData] = useState<any>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    try {
      const response = await fetch("/api/dashboard")
      const data = await response.json()
      if (data.success) setDashboardData(data.data)
    } catch (error) {
      console.error("Erro:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const totalReceitas = dashboardData?.totalReceitas || 0
  const totalDespesas = dashboardData?.totalDespesas || 0
  const lucro = totalReceitas - totalDespesas
  const margem = totalReceitas > 0 ? (lucro / totalReceitas) * 100 : 0

  // Stats cards data
  const statsCards = [
    {
      title: "Faturamento",
      value: formatCurrency(totalReceitas),
      icon: TrendingUp,
      gradient: "from-green-500 to-green-600",
      change: "+2.5%",
    },
    {
      title: "Despesas",
      value: formatCurrency(totalDespesas),
      icon: TrendingDown,
      gradient: "from-red-500 to-red-600",
      change: "+1.2%",
    },
    {
      title: "Lucro",
      value: formatCurrency(lucro),
      icon: DollarSign,
      gradient: "from-blue-500 to-blue-600",
      change: `Margem: ${margem.toFixed(1)}%`,
    },
    {
      title: "Meta do Mês",
      value: formatCurrency(60000),
      icon: Target,
      gradient: "from-orange-500 to-orange-600",
      change: "Meta de faturamento",
    },
  ]

  const infoCards = [
    { title: "Total de pedidos", value: "0", icon: ShoppingBag, trend: "+12%" },
    { title: "Clientes totais", value: "0", icon: Users, trend: "+8%" },
    { title: "Ticket médio", value: "R$ 0,00", icon: Receipt, trend: "+5%" },
  ]

  return (
    <div className="space-y-6">
      {/* Header com botão de ocultar valores */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bom dia!</h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe o desempenho do seu negócio
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setHideValues(!hideValues)}
          className="gap-2"
        >
          {hideValues ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {hideValues ? "Mostrar valores" : "Ocultar valores"}
        </Button>
      </div>

      {/* Stats Cards com gradientes modernos */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((card, idx) => (
          <Card
            key={idx}
            className={`relative overflow-hidden bg-gradient-to-r ${card.gradient} text-white`}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium opacity-90">{card.title}</p>
                <card.icon className="h-5 w-5 opacity-80" />
              </div>
              <div className="mt-2 text-2xl font-bold">
                {hideValues ? "••••••" : card.value}
              </div>
              <p className="mt-1 text-xs opacity-80">{card.change}</p>
            </CardContent>
            {/* Ícone decorativo de fundo */}
            <div className="absolute -bottom-4 -right-4 opacity-10">
              <card.icon className="h-20 w-20" />
            </div>
          </Card>
        ))}
      </div>

      {/* Cards de informações adicionais */}
      <div className="grid gap-4 sm:grid-cols-3">
        {infoCards.map((card, idx) => (
          <Card key={idx} className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <card.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="mt-2 text-2xl font-bold">
                {card.title === "Ticket médio" && hideValues ? "••••••" : card.value}
              </div>
              <div className="mt-1 flex items-center gap-1 text-xs text-green-600">
                <ArrowUpRight className="h-3 w-3" />
                <span>{card.trend}</span>
                <span className="text-muted-foreground">vs mês passado</span>
              </div>
            </CardContent>
            <div className="absolute -bottom-4 -right-4 opacity-5">
              <card.icon className="h-20 w-20" />
            </div>
          </Card>
        ))}
      </div>

      {/* Gráfico de faturamento mensal */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Faturamento mensal</h3>
            <select className="rounded-lg border px-3 py-1 text-sm">
              <option>Últimos 30 dias</option>
              <option>Últimos 90 dias</option>
              <option>Este ano</option>
            </select>
          </div>
          <div className="h-64 rounded-lg bg-gray-50 p-4">
            {/* Placeholder do gráfico */}
            <div className="flex h-full items-end justify-between gap-2">
              {[65, 45, 78, 52, 90, 71, 83, 55, 68, 42, 75, 60].map((height, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-lg bg-primary/20 transition-all hover:bg-primary/40"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-xs text-muted-foreground">{i + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seção de Pedidos em andamento */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Pedidos em andamento</h3>
            <Button variant="link" size="sm" className="text-primary">
              Acessar painel →
            </Button>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
                <ShoppingBag className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">pedidos ativos</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Ver todos
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Produtos mais vendidos */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Produtos mais vendidos</h3>
            <Button variant="link" size="sm" className="text-primary">
              Ver relatório completo →
            </Button>
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((_, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-medium">
                    {idx + 1}
                  </div>
                  <span className="text-sm">Produto exemplo {idx + 1}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">0 vendas</span>
                  <span className="text-sm font-medium">R$ 0,00</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alertas */}
      {lucro < 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
              <TrendingDown className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <p className="font-medium text-red-800">Atenção!</p>
              <p className="text-sm text-red-700">
                Suas despesas estão superando as receitas. Revise seus custos!
              </p>
            </div>
          </div>
        </div>
      )}

      {margem < 10 && margem > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100">
              <Target className="h-4 w-4 text-yellow-600" />
            </div>
            <div>
              <p className="font-medium text-yellow-800">Margem Baixa</p>
              <p className="text-sm text-yellow-700">
                Sua margem de lucro está em {margem.toFixed(1)}%. Considere rever seus preços.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}