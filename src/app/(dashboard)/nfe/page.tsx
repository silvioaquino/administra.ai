// src/app/(dashboard)/nfe/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  ShoppingCart, 
  Truck, 
  Plus, 
  FileText,
  DollarSign,
  Calendar,
  Package,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Receipt,
  QrCode,
  Upload,
  Zap,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Target
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { formatCurrency, formatDate } from "@/lib/utils"
import { PageContainer } from "@/components/layout/PageContainer"
import { PageHeader } from "@/components/layout/PageHeader"

interface Lancamento {
  id: number
  data: string
  tipo: string
  descricao: string
  valor: number
  forma_pagamento: string
}

export default function NfePage() {
  const router = useRouter()
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])
  const [loading, setLoading] = useState(true)
  const [hideValues, setHideValues] = useState(false)

  useEffect(() => {
    carregarLancamentosDia()
  }, [])

  async function carregarLancamentosDia() {
    try {
      const hoje = new Date().toISOString().split("T")[0]
      const response = await fetch(`/api/livro-diario?data_inicio=${hoje}&data_fim=${hoje}&limit=10`)
      const data = await response.json()
      if (data.success) {
        setLancamentos(data.data)
      }
    } catch (error) {
      console.error("Erro ao carregar lançamentos:", error)
    } finally {
      setLoading(false)
    }
  }

  const totalVendasHoje = lancamentos
    .filter(l => l.tipo === "VENDA")
    .reduce((sum, l) => sum + l.valor, 0)
  
  const totalComprasHoje = lancamentos
    .filter(l => l.tipo === "COMPRA")
    .reduce((sum, l) => sum + l.valor, 0)

  const saldoDia = totalVendasHoje - totalComprasHoje
  const margemDia = totalVendasHoje > 0 ? (saldoDia / totalVendasHoje) * 100 : 0

  // Stats cards com gradientes modernos (mesmo estilo do dashboard)
  const statsCards = [
    {
      title: "Faturamento Hoje",
      value: formatCurrency(totalVendasHoje),
      icon: TrendingUp,
      gradient: "from-success to-success",
      change: "+2.5% vs ontem",
    },
    {
      title: "Compras Hoje",
      value: formatCurrency(totalComprasHoje),
      icon: TrendingDown,
      gradient: "from-destructive to-destructive",
      change: "+1.2% vs ontem",
    },
    {
      title: "Saldo do Dia",
      value: formatCurrency(saldoDia),
      icon: DollarSign,
      gradient: "from-info to-info",
      change: `Margem: ${margemDia.toFixed(1)}%`,
    },
    {
      title: "Transações",
      value: lancamentos.length.toString(),
      icon: Receipt,
      gradient: "from-warning to-warning",
      change: "Lançamentos realizados",
    },
  ]

  const quickActions = [
    { icon: DollarSign, label: "Lançamento Manual", desc: "Registrar venda ou compra", route: "/nfe/lancamento", color: "from-info to-info" },
    { icon: QrCode, label: "NFC-e Compra", desc: "Processar via URL", route: "/nfe/compra", color: "from-primary to-primary" },
    { icon: Upload, label: "NF-e XML", desc: "Upload do arquivo", route: "/nfe/xml", color: "from-success to-success" },
    { icon: Package, label: "Produtos", desc: "Gerenciar catálogo", route: "/nfe/produtos", color: "from-warning to-warning" },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <PageContainer>
        <PageHeader
          title="Notas Fiscais"
          subtitle="Registro de vendas, compras e processamento de NFC-e"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => setHideValues(!hideValues)}
            className="gap-2 rounded-full border-border hover:bg-surface-2"
          >
            {hideValues ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {hideValues ? "Mostrar valores" : "Ocultar valores"}
          </Button>
        </PageHeader>
        {/* Stats Cards com gradientes modernos - mantido igual 
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((card, idx) => (
            <Card
              key={idx}
              className={`relative overflow-hidden bg-gradient-to-r ${card.gradient} text-white h-full min-h-[132px] sm:min-h-[150px]`}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium opacity-90">{card.title}</p>
                  <card.icon className="h-5 w-5 opacity-80" />
                </div>
                <div className="mt-2 text-2xl font-bold">
                  {hideValues && card.title !== "Transações" ? "••••••" : card.value}
                </div>
                <p className="mt-1 text-xs opacity-80">{card.change}</p>
              </CardContent>
              {/* Ícone decorativo de fundo /}
              <div className="absolute -bottom-4 -right-4 opacity-10">
                <card.icon className="h-20 w-20" />
              </div>
            </Card>
          ))}
        </div>*/}

        {/* Ações Rápidas */}
        <div className="mt-8 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Ações Rápidas</h2>
            <Zap className="h-4 w-4 text-white" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action, index) => (
              <div 
                key={index}
                className="group bg-surface rounded-2xl shadow-sm cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-1 overflow-hidden h-full min-h-[160px] sm:min-h-[180px]"
                onClick={() => router.push(action.route)}
              >
                <div className={`absolute top-0 right-0 h-24 w-24 -translate-y-8 translate-x-8 rounded-full bg-gradient-to-br ${action.color} opacity-10 group-hover:opacity-20 transition-opacity`} />
                <div className="p-3 sm:p-5">
                  <div className={`mb-3 sm:mb-4 inline-flex rounded-xl bg-gradient-to-br ${action.color} p-2.5 sm:p-3 text-white shadow-lg`}>
                    <action.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <h3 className="text-[11px] sm:text-sm font-semibold text-white mb-1 leading-tight">{action.label}</h3>
                  <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">{action.desc}</p>
                  <div className="mt-3 sm:mt-4 flex items-center text-[10px] sm:text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    Acessar
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cards organizados um abaixo do outro */}
        <div className="mt-8 space-y-6">
          {/* Últimos Lançamentos */}
          <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-surface-2 p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-success" />
                <h3 className="font-semibold text-white">Últimos Lançamentos</h3>
                <Badge variant="secondary" className="ml-2 bg-surface-2 text-white">
                  Hoje
                </Badge>
              </div>
            </div>
            <div>
              {loading ? (
                <div className="flex h-64 items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : lancamentos.length === 0 ? (
                <div className="flex h-80 flex-col items-center justify-center text-center p-6">
                  <div className="w-16 h-16 bg-surface-2 rounded-full flex items-center justify-center mb-4">
                    <FileText className="h-8 w-8 text-muted-foreground/70" />
                  </div>
                  <p className="text-muted-foreground mb-2">Nenhum lançamento hoje</p>
                  <p className="text-sm text-muted-foreground/70">Comece registrando sua primeira transação</p>
                  <Button 
                    onClick={() => router.push("/nfe/lancamento")}
                    className="mt-4 bg-primary hover:bg-primary/90 text-white rounded-lg"
                  >
                    Registrar primeiro lançamento
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {lancamentos.map((lanc, index) => (
                    <div key={lanc.id} className="group flex items-center justify-between p-4 hover:bg-surface-2 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`rounded-full p-2 ${
                          lanc.tipo === "VENDA" 
                            ? "bg-success/10 text-success" 
                            : "bg-destructive/10 text-destructive"
                        }`}>
                          {lanc.tipo === "VENDA" ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-white">{lanc.descricao}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{lanc.forma_pagamento}</span>
                            <span>•</span>
                            <span>{formatDate(lanc.data)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`font-semibold ${
                          lanc.tipo === "VENDA" ? "text-success" : "text-destructive"
                        }`}>
                          {lanc.tipo === "VENDA" ? "+" : "-"} {hideValues ? "••••••" : formatCurrency(lanc.valor)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Gestão de Produtos */}
          {/*<div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-surface-2 p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-warning" />
                <h3 className="font-semibold text-white">Gestão de Produtos</h3>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Button 
                  className="w-full justify-start bg-primary hover:bg-primary/90 text-white rounded-lg"
                  onClick={() => router.push("/nfe/produtos/novo")}
                >
                  <Plus className="mr-2 h-4 w-4 group-hover:rotate-90 transition-transform" />
                  Cadastrar Novo Produto
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start border-border hover:bg-surface-2 rounded-lg"
                  onClick={() => router.push("/nfe/produtos")}
                >
                  <Package className="mr-2 h-4 w-4" />
                  Ver Todos os Produtos
                </Button>
              </div>
              <Separator className="bg-surface-2" />
              <div className="rounded-lg bg-info/5 p-4">
                <div className="flex items-start gap-2 text-sm text-info">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Dica: Mantenha seu catálogo de produtos atualizado para facilitar o lançamento de notas fiscais</span>
                </div>
              </div>
            </div>
          </div>*/}

          {/* Estatísticas do Dia */}
          <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-surface-2 p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-info" />
                <h3 className="font-semibold text-white">Estatísticas do Dia</h3>
              </div>
            </div>
            <div className="p-5 space-y-6">
              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-muted-foreground">Ticket médio de vendas</span>
                  <span className="font-medium text-white">
                    {hideValues ? "••••••" : formatCurrency(totalVendasHoje / (lancamentos.filter(l => l.tipo === "VENDA").length || 1))}
                  </span>
                </div>
                <Progress value={margemDia} className="h-2" />
                <p className="mt-1 text-xs text-muted-foreground">
                  {margemDia.toFixed(0)}% da margem ideal
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-success/5 p-4">
                  <p className="text-xs text-muted-foreground mb-1">Maior venda</p>
                  <p className="text-xl font-bold text-success">
                    {hideValues 
                      ? "••••••" 
                      : formatCurrency(Math.max(...lancamentos.filter(l => l.tipo === "VENDA").map(l => l.valor), 0))
                    }
                  </p>
                </div>
                <div className="rounded-lg bg-primary/10 p-4">
                  <p className="text-xs text-muted-foreground mb-1">Total de transações</p>
                  <p className="text-xl font-bold text-primary/80">
                    {lancamentos.length}
                  </p>
                </div>
              </div>

              <div className="rounded-lg bg-info/5 p-4">
                <p className="text-xs text-muted-foreground mb-2">Resumo do dia</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vendas</span>
                    <span className="font-medium text-success">
                      {lancamentos.filter(l => l.tipo === "VENDA").length} transações
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Compras</span>
                    <span className="font-medium text-destructive">
                      {lancamentos.filter(l => l.tipo === "COMPRA").length} transações
                    </span>
                  </div>
                </div>
              </div>

              {margemDia < 10 && margemDia > 0 && (
                <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-warning" />
                    <p className="text-sm text-warning">
                      Margem do dia está baixa ({margemDia.toFixed(1)}%)
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  )
}