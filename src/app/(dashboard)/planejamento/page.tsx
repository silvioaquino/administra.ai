// src/app/(dashboard)/planejamento/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  Target, TrendingUp, DollarSign, Users, CreditCard,
  BarChart3, Settings, Percent, Calculator, Save, RefreshCw,
  Sun, Moon, HelpCircle, Zap
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatPercentage } from "@/lib/utils"

// Components
import { IndicadoresCard } from "./components/IndicadoresCard"
import { TabelaMetasMensais } from "./components/TabelaMetasMensais"
import { TabelaAcompanhamento } from "./components/TabelaAcompanhamento"
import { FolhaSalarialTable } from "./components/FolhaSalarialTable"
import { DespesasFixasTable } from "./components/DespesasFixasTable"
import { DespesasVariaveisTable } from "./components/DespesasVariaveisTable"
import { GraficosDistribuicao } from "./components/GraficosDistribuicao"
import { MarkUpCalculator } from "./components/MarkUpCalculator"

// Tipos
interface MetaMensal {
  mes: number
  metaDiariaAlmoco: number
  metaDiariaJanta: number
  diasTrabalhados: number
  lucroDesejado: number
}

interface Acompanhamento {
  mes: number
  faturamentoAlmoco: number
  faturamentoJanta: number
  faturamentoTotal: number
}

interface DespesaFixa {
  nome: string
  valor: number
}

interface Funcionario {
  nome: string
  salario: number
}

export default function PlanejamentoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [anoAtual, setAnoAtual] = useState(new Date().getFullYear())
  const [metasMensais, setMetasMensais] = useState<MetaMensal[]>([])
  const [acompanhamentos, setAcompanhamentos] = useState<Acompanhamento[]>([])
  const [despesasFixas, setDespesasFixas] = useState<DespesaFixa[]>([])
  const [despesasVariaveisPct, setDespesasVariaveisPct] = useState(0)
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [activeTab, setActiveTab] = useState("almoco")
  const [resumo, setResumo] = useState({
    metaMensalTotal: 0,
    metaAlmoco: 73,
    metaJanta: 27,
    lucroDesejado: 15,
    markUp: 0,
    cmvMaximo: 0
  })

  useEffect(() => {
    carregarDados()
  }, [anoAtual])

  async function carregarDados() {
    setLoading(true)
    try {
      // 1. Carregar metas mensais
      const metasResponse = await fetch(`/api/planejamento/metas?ano=${anoAtual}`)
      const metasData = await metasResponse.json()
      if (metasData.success) {
        setMetasMensais(metasData.metas || [])
      }

      // 2. Carregar acompanhamento real
      const acompResponse = await fetch(`/api/planejamento/acompanhamento?ano=${anoAtual}`)
      const acompData = await acompResponse.json()
      if (acompData.success) {
        setAcompanhamentos(acompData.dados || [])
      }

      // 3. Carregar despesas fixas
      const fixasResponse = await fetch(`/api/planejamento/despesas-fixas?ano=${anoAtual}`)
      const fixasData = await fixasResponse.json()
      if (fixasData.success && fixasData.dados) {
        setDespesasFixas(fixasData.dados)
      }

      // 4. Carregar funcionários
      const funcResponse = await fetch(`/api/planejamento/funcionarios?ano=${anoAtual}`)
      const funcData = await funcResponse.json()
      if (funcData.success && funcData.dados) {
        setFuncionarios(funcData.dados)
      }

      // 5. Carregar despesas variáveis e calcular total
      const variaveisResponse = await fetch(`/api/planejamento/despesas-variaveis?ano=${anoAtual}`)
      const variaveisData = await variaveisResponse.json()
      if (variaveisData.success && variaveisData.dados) {
        const total = variaveisData.dados.reduce((sum: number, item: any) => sum + (item.percentual || 0), 0)
        setDespesasVariaveisPct(total)
      }

      // 6. Calcular resumo do mês atual
      const mesAtual = new Date().getMonth() + 1
      const metaAtual = metasMensais.find(m => m.mes === mesAtual) || {
        metaDiariaAlmoco: 0,
        metaDiariaJanta: 0,
        diasTrabalhados: 26,
        lucroDesejado: 15
      }
      
      const metaMensalAlmoco = metaAtual.metaDiariaAlmoco * metaAtual.diasTrabalhados
      const metaMensalJanta = metaAtual.metaDiariaJanta * metaAtual.diasTrabalhados
      const metaTotal = metaMensalAlmoco + metaMensalJanta
      
      // Calcular Mark-Up e CMV
      const totalFixas = despesasFixas.reduce((sum, d) => sum + d.valor, 0)
      const pctFixas = metaTotal > 0 ? (totalFixas / metaTotal) * 100 : 0
      const cmvCalculado = 100 - (pctFixas + despesasVariaveisPct + metaAtual.lucroDesejado)
      const markUpCalculado = cmvCalculado > 0 ? 100 / cmvCalculado : 0

      setResumo({
        metaMensalTotal: metaTotal,
        metaAlmoco: 73,
        metaJanta: 27,
        lucroDesejado: metaAtual.lucroDesejado,
        markUp: markUpCalculado,
        cmvMaximo: cmvCalculado
      })

    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    } finally {
      setLoading(false)
    }
  }

  async function sincronizarDadosReais() {
    try {
      const response = await fetch(`/api/planejamento/acompanhamento/sync-from-lancamentos?ano=${anoAtual}`)
      const data = await response.json()
      if (data.success) {
        alert("✅ Dados reais sincronizados com sucesso!")
        carregarDados()
      }
    } catch (error) {
      console.error("Erro ao sincronizar:", error)
      alert("❌ Erro ao sincronizar dados")
    }
  }

  async function salvarTodasConfiguracoes() {
    try {
      await Promise.all([
        fetch("/api/planejamento/despesas-fixas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dados: despesasFixas, ano: anoAtual })
        }),
        fetch("/api/planejamento/funcionarios", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dados: funcionarios, ano: anoAtual })
        })
      ])
      alert("✅ Todas as configurações foram salvas com sucesso!")
      carregarDados()
    } catch (error) {
      console.error("Erro ao salvar:", error)
      alert("❌ Erro ao salvar configurações")
    }
  }

  // Funções de navegação
  const navegarPara = (rota: string) => {
    console.log(`Navegando para: ${rota}`)
    router.push(rota)
  }

  const cardsResumo = [
    {
      title: "Faturamento Mensal",
      value: formatCurrency(resumo.metaMensalTotal),
      icon: DollarSign,
      gradient: "from-emerald-500 to-emerald-600",
      detail: `Almoço: ${resumo.metaAlmoco}% | Janta: ${resumo.metaJanta}%`,
    },
    {
      title: "Lucro Desejado",
      value: formatPercentage(resumo.lucroDesejado),
      icon: TrendingUp,
      gradient: "from-green-600 to-green-500",
      detail: "Margem alvo",
    },
    {
      title: "Mark-Up",
      value: resumo.markUp.toFixed(2),
      icon: Calculator,
      gradient: "from-orange-500 to-orange-600",
      detail: "Fator multiplicador",
    },
    {
      title: "CMV Máximo",
      value: formatPercentage(resumo.cmvMaximo),
      icon: Percent,
      gradient: "from-purple-500 to-purple-600",
      detail: "Custo com Produção",
    },
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
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Planejamento Financeiro</h1>
          <p className="text-sm text-gray-500">
            Base: Almoço (73%) | Janta (27%)
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <select
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#de4838] appearance-none pr-8 cursor-pointer hover:border-red-500 transition-colors"
              value={anoAtual}
              onChange={(e) => setAnoAtual(parseInt(e.target.value))}
            >
              <option value={2024}>2024</option>
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={sincronizarDadosReais}
            className="rounded-full border-gray-200 hover:bg-gray-100 hover:border-red-500 hover:cursor-pointer transition-all"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Sincronizar
          </Button>
          <Button 
            onClick={salvarTodasConfiguracoes}
            className="bg-[#de4838] hover:bg-[#c73d2e] text-white rounded-full px-5 hover:cursor-pointer hover:border-red-500 hover:border-2 transition-all"
          >
            <Save className="mr-2 h-4 w-4" />
            Salvar Tudo
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Cards Resumo */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cardsResumo.map((card, idx) => (
            <Card
              key={idx}
              className={`relative overflow-hidden bg-gradient-to-r ${card.gradient} text-white hover:cursor-pointer hover:scale-105 transition-transform duration-200`}
            >
              <CardContent className="p-6">
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

        {/* Indicadores Ideais vs Atuais */}
        <div className="mt-8">
          <IndicadoresCard 
            despesasFixas={despesasFixas}
            despesasVariaveisPct={despesasVariaveisPct}
            metaMensalTotal={resumo.metaMensalTotal}
            lucroDesejado={resumo.lucroDesejado}
            markUp={resumo.markUp}
            cmv={resumo.cmvMaximo}
          />
        </div>

        {/* Tabs Almoço e Janta */}
        <div className="mt-8">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab("almoco")}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-all w-32 justify-center hover:cursor-pointer hover:border-2 hover:border-red-500 ${
                activeTab === "almoco" 
                  ? "bg-white shadow-sm text-gray-800 border-2 border-red-500" 
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Sun className="h-4 w-4" />
              ALMOÇO (73%)
            </button>
            <button
              onClick={() => setActiveTab("janta")}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-all w-32 justify-center hover:cursor-pointer hover:border-2 hover:border-red-500 ${
                activeTab === "janta" 
                  ? "bg-white shadow-sm text-gray-800 border-2 border-red-500" 
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Moon className="h-4 w-4" />
              JANTA (27%)
            </button>
          </div>

          {/* Conteúdo do Almoço */}
          {activeTab === "almoco" && (
            <div className="grid gap-6 lg:grid-cols-2">
              <DespesasFixasTable 
                despesas={despesasFixas}
                percentual={0.73}
                title="Despesas Fixas - Almoço (73%)"
                onEdit={() => navegarPara("/planejamento/editar/despesas-fixas")}
              />
              <div className="space-y-6">
                <DespesasVariaveisTable 
                  percentual={despesasVariaveisPct}
                  metaMensalTotal={resumo.metaMensalTotal}
                  title="Despesas Variáveis"
                  onEdit={() => navegarPara("/planejamento/editar/despesas-variaveis")}
                />
                <GraficosDistribuicao 
                  tipo="almoco"
                  despesasFixasPct={(despesasFixas.reduce((s, d) => s + d.valor, 0) / resumo.metaMensalTotal) * 100}
                  despesasVariaveisPct={despesasVariaveisPct}
                  lucroDesejado={resumo.lucroDesejado}
                  cmv={resumo.cmvMaximo}
                />
              </div>
            </div>
          )}

          {/* Conteúdo da Janta */}
          {activeTab === "janta" && (
            <div className="grid gap-6 lg:grid-cols-2">
              <DespesasFixasTable 
                despesas={despesasFixas}
                percentual={0.27}
                title="Despesas Fixas - Janta (27%)"
                onEdit={() => navegarPara("/planejamento/editar/despesas-fixas")}
              />
              <div className="space-y-6">
                <DespesasVariaveisTable 
                  percentual={despesasVariaveisPct}
                  metaMensalTotal={resumo.metaMensalTotal}
                  title="Despesas Variáveis"
                  onEdit={() => navegarPara("/planejamento/editar/despesas-variaveis")}
                />
                <GraficosDistribuicao 
                  tipo="janta"
                  despesasFixasPct={(despesasFixas.reduce((s, d) => s + d.valor, 0) / resumo.metaMensalTotal) * 100}
                  despesasVariaveisPct={despesasVariaveisPct}
                  lucroDesejado={resumo.lucroDesejado}
                  cmv={resumo.cmvMaximo}
                />
              </div>
            </div>
          )}
        </div>

        {/* Tabela de Metas Mensais */}
        <div className="mt-8">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gray-50 p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-[#de4838]" />
                  <h3 className="font-semibold text-gray-800">Metas Mensais</h3>
                  <Badge variant="secondary" className="bg-gray-200 text-gray-700">
                    {anoAtual}
                  </Badge>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navegarPara("/planejamento/editar/metas-mensais")}
                  className="rounded-lg border-gray-200 hover:cursor-pointer hover:border-red-500 hover:border-2 transition-all"
                >
                  <Settings className="mr-2 h-3 w-3" />
                  Configurar
                </Button>
              </div>
            </div>
            <div className="p-0">
              <TabelaMetasMensais 
                metas={metasMensais}
                acompanhamentos={acompanhamentos}
                onEdit={() => navegarPara("/planejamento/editar/metas-mensais")}
              />
            </div>
          </div>
        </div>

        {/* Folha Salarial & Provisões */}
        <div className="mt-8">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gray-50 p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#de4838]" />
                  <h3 className="font-semibold text-gray-800">Folha Salarial</h3>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navegarPara("/planejamento/editar/funcionarios")}
                    className="rounded-lg border-gray-200 hover:cursor-pointer hover:border-red-500 hover:border-2 transition-all"
                  >
                    <Users className="mr-2 h-3 w-3" />
                    Funcionários
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navegarPara("/planejamento/editar/provisoes")}
                    className="rounded-lg border-gray-200 hover:cursor-pointer hover:border-red-500 hover:border-2 transition-all"
                  >
                    <Calculator className="mr-2 h-3 w-3" />
                    Provisões
                  </Button>
                </div>
              </div>
            </div>
            <div className="p-0">
              <FolhaSalarialTable 
                funcionarios={funcionarios}
                onEdit={() => navegarPara("/planejamento/editar/funcionarios")}
                onConfigProvisoes={() => navegarPara("/planejamento/editar/provisoes")}
              />
            </div>
          </div>
        </div>

        {/* Comparativo Real x Meta */}
        <div className="mt-8">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gray-50 p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[#de4838]" />
                <h3 className="font-semibold text-gray-800">Comparativo Real x Meta</h3>
              </div>
            </div>
            <div className="p-0">
              <TabelaAcompanhamento 
                metas={metasMensais}
                acompanhamentos={acompanhamentos}
              />
            </div>
          </div>
        </div>

        {/* Mark-Up & Custos */}
        <div className="mt-8">
          <MarkUpCalculator 
            despesasFixasTotal={despesasFixas.reduce((s, d) => s + d.valor, 0)}
            despesasVariaveisPct={despesasVariaveisPct}
            metaMensalTotal={resumo.metaMensalTotal}
            lucroDesejado={resumo.lucroDesejado}
            markUp={resumo.markUp}
            cmv={resumo.cmvMaximo}
          />
        </div>
      </div>

      {/* Botão Ajuda */}
      <button
        onClick={() => navegarPara("/planejamento/configuracoes?tab=ajuda")}
        className="fixed bottom-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-[#de4838] text-white shadow-lg transition-all hover:scale-110 hover:bg-[#c73d2e] hover:cursor-pointer hover:border-2 hover:border-red-500"
      >
        <HelpCircle className="h-6 w-6" />
      </button>
    </div>
  )
}