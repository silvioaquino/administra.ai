// src/app/(dashboard)/dashboard/page.tsx
"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Store, Users, Package, DollarSign, TrendingUp, AlertCircle, Zap, ArrowRight, Calendar, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState({
    totalProdutos: 0,
    totalFichas: 0,
    totalReceitas: 0,
    totalDespesas: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      carregarStats()
    }
  }, [session])

  async function carregarStats() {
    try {
      const [produtosRes, fichasRes, livroRes] = await Promise.all([
        fetch("/api/produtos?limit=1"),
        fetch("/api/fichas-tecnicas?limit=1"),
        fetch("/api/livro-diario/resumo/saldo")
      ])

      const produtosData = await produtosRes.json()
      const fichasData = await fichasRes.json()
      const livroData = await livroRes.json()

      setStats({
        totalProdutos: produtosData.total || 0,
        totalFichas: fichasData.total || 0,
        totalReceitas: livroData.total_entradas || 0,
        totalDespesas: livroData.total_saidas || 0
      })
    } catch (error) {
      console.error("Erro ao carregar stats:", error)
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#de4838] border-t-transparent" />
      </div>
    )
  }

  const isInTrial = session?.user?.isInTrial
  const trialEndsAt = session?.user?.trialEndsAt ? new Date(session.user.trialEndsAt) : null
  const daysLeft = trialEndsAt ? Math.ceil((trialEndsAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0

  const statsCards = [
    {
      title: "Total de Produtos",
      value: stats.totalProdutos,
      icon: Package,
      gradient: "from-[#de4838] to-[#de4838]/80",
      detail: "produtos cadastrados"
    },
    {
      title: "Fichas Técnicas",
      value: stats.totalFichas,
      icon: Users,
      gradient: "from-emerald-600 to-emerald-500",
      detail: "fichas cadastradas"
    },
    {
      title: "Receitas",
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
    }
  ]

  const quickActions = [
    { label: "Lançar Nova Venda", route: "/nfe/lancamento", variant: "default" },
    { label: "Criar Ficha Técnica", route: "/fichas-tecnicas/nova", variant: "outline" },
    { label: "Adicionar Produto", route: "/nfe/produtos/novo", variant: "outline" }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-800">Dashboard</h1>
          <p className="text-sm text-gray-500">
            Bem-vindo, {session?.user?.name || "Usuário"}!
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-gray-100 text-gray-600">
            <Calendar className="h-3 w-3 mr-1" />
            {new Date().toLocaleDateString("pt-BR")}
          </Badge>
        </div>
      </div>

      {/* Trial Alert */}
      {isInTrial && (
        <Alert className={`rounded-xl ${daysLeft <= 3 ? "bg-orange-50 border-orange-200" : "bg-blue-50 border-blue-200"}`}>
          <AlertCircle className={`h-4 w-4 ${daysLeft <= 3 ? "text-orange-600" : "text-blue-600"}`} />
          <AlertDescription className={`text-sm ${daysLeft <= 3 ? "text-orange-700" : "text-blue-700"}`}>
            Você está no período de teste gratuito. {daysLeft} dias restantes.
            {daysLeft <= 3 && " Assine um plano para continuar usando o sistema!"}
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((card, idx) => (
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
      </div>

      {/* Ações Rápidas */}
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
                variant={action.variant as any}
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
              <Badge className={isInTrial ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"}>
                {isInTrial ? "Período de teste" : session?.user?.subscriptionStatus === "active" ? "Ativa" : "Expirada"}
              </Badge>
            </div>
            {isInTrial && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Fim do teste:</span>
                <span className="font-medium text-gray-700">{trialEndsAt?.toLocaleDateString("pt-BR")}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">Versão do sistema:</span>
              <span className="font-medium text-gray-700">2.0.0</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-500">Último acesso:</span>
              <span className="font-medium text-gray-700">{new Date().toLocaleDateString("pt-BR")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dica rápida */}
      <div className="bg-gradient-to-r from-[#de4838]/5 to-transparent rounded-xl p-4 border border-[#de4838]/10">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#de4838]/10">
            <Zap className="h-4 w-4 text-[#de4838]" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Dica rápida</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Utilize as fichas técnicas para calcular o preço ideal dos seus produtos e maximizar seus lucros!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}