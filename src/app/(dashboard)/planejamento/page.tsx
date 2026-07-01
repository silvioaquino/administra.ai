// src/app/(dashboard)/planejamento/page.tsx (versão simplificada)
"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { 
  Target, TrendingUp, DollarSign, Users,
  BarChart3, Settings, Percent, Calculator, Save, RefreshCw,
  Sun, Moon, HelpCircle
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [activeTab, setActiveTab] = useState("almoco")
  const [salariosTotal, setSalariosTotal] = useState(0)
  const [provisoesDetalhadas, setProvisoesDetalhadas] = useState<Array<{nome: string, valor: number}>>([])
  
  // Estado para os indicadores (vem da API)
  const [indicadores, setIndicadores] = useState({
    metaMensalTotal: 0,
    lucroDesejado: 15,
    markUp: 0,
    cmvMaximo: 0,
    pctFixas: 0,
    pctVariaveis: 0,
    totalDespesasVariaveis: 0,
    despesasFixas: [] as DespesaFixa[]
  })

  const handleTotalsChange = (salarios: number, provisoes: Array<{nome: string, valor: number}>) => {
    setSalariosTotal(salarios)
    setProvisoesDetalhadas(provisoes)
  }

  const carregarDados = useCallback(async () => {
    setLoading(true)
    try {
      // 1. Carregar indicadores da API (inclui despesas fixas, variáveis, metas, etc)
      const indicadoresResponse = await fetch(`/api/planejamento/indicadores-resumo?ano=${anoAtual}`)
      const indicadoresData = await indicadoresResponse.json()
      
      if (indicadoresData.success) {
        console.log("📊 Dados dos indicadores:", indicadoresData)

        setIndicadores({
          metaMensalTotal: indicadoresData.metaMensalTotal || 0,
          lucroDesejado: indicadoresData.lucroDesejado || 15,
          markUp: indicadoresData.markUp || 0,
          cmvMaximo: indicadoresData.cmv || 0,
          pctFixas: indicadoresData.pctFixas || 0,
          pctVariaveis: indicadoresData.despesasVariaveisPct || 0,
          totalDespesasVariaveis: indicadoresData.totalDespesasVariaveis || 0,
          despesasFixas: indicadoresData.despesasFixas || []
        })

        setDespesasFixas(indicadoresData.despesasFixas || [])
      }

      // 2. Carregar metas mensais
      const metasResponse = await fetch(`/api/planejamento/metas?ano=${anoAtual}`)
      const metasData = await metasResponse.json()
      if (metasData.success) {
        setMetasMensais(metasData.metas || [])
      }

      // 3. Carregar acompanhamento
      const acompResponse = await fetch(`/api/planejamento/acompanhamento?ano=${anoAtual}`)
      const acompData = await acompResponse.json()
      if (acompData.success) {
        setAcompanhamentos(acompData.dados || [])
      }

      // 4. Carregar funcionários
      const funcResponse = await fetch(`/api/planejamento/funcionarios?ano=${anoAtual}`)
      const funcData = await funcResponse.json()
      if (funcData.success && funcData.dados) {
        setFuncionarios(funcData.dados)
        const totalSalarios = funcData.dados.reduce((sum: number, f: Funcionario) => sum + (f.salario || 0), 0)
        setSalariosTotal(totalSalarios)
      }

    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    } finally {
      setLoading(false)
    }
  }, [anoAtual])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

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

  const navegarPara = (rota: string) => {
    router.push(rota)
  }

  const cardsResumo = [
    {
      title: "Faturamento Mensal",
      value: formatCurrency(indicadores.metaMensalTotal),
      icon: DollarSign,
      gradient: "from-emerald-500 to-emerald-600",
      detail: `Almoço: 73% | Janta: 27%`,
    },
    {
      title: "Lucro Desejado",
      value: formatPercentage(indicadores.lucroDesejado),
      icon: TrendingUp,
      gradient: "from-green-600 to-green-500",
      detail: "Margem alvo",
    },
    {
      title: "Mark-Up",
      value: indicadores.markUp.toFixed(2),
      icon: Calculator,
      gradient: "from-orange-500 to-orange-600",
      detail: "Fator multiplicador",
    },
    {
      title: "CMV Máximo",
      value: formatPercentage(indicadores.cmvMaximo),
      icon: Percent,
      gradient: "from-purple-500 to-purple-600",
      detail: "Custo com Produção",
    },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-[#e5e7eb] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#de4838] border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#e5e7eb]">
      {/* Header */}
      <div className="sticky top-0 z-10 ml-3 mr-3 sm:ml-6 sm:mr-6 bg-white border-b border-gray-200 px-3 py-3 sm:px-6 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Planejamento Financeiro</h1>
          <p className="text-sm text-gray-500">
            Base: Almoço (73%) | Janta (27%)
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <div className="relative">
            <select
              className="rounded-full border border-gray-200 bg-white px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#de4838] appearance-none pr-8 cursor-pointer hover:border-red-500 transition-colors"
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
            className="rounded-full border-gray-200 hover:bg-gray-100 hover:border-red-500 hover:cursor-pointer transition-all whitespace-nowrap text-xs sm:text-sm"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Sincronizar
          </Button>
          <Button 
            onClick={salvarTodasConfiguracoes}
            className="bg-[#de4838] hover:bg-[#c73d2e] text-white rounded-full px-4 py-2 hover:cursor-pointer hover:border-red-500 hover:border-2 transition-all whitespace-nowrap text-xs sm:text-sm"
          >
            <Save className="mr-2 h-4 w-4" />
            Salvar Tudo
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Cards Resumo */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {cardsResumo.map((card, idx) => (
            <Card
              key={idx}
              className={`relative overflow-hidden bg-gradient-to-r ${card.gradient} text-white hover:cursor-pointer hover:scale-105 transition-transform duration-200 h-full min-h-[64px] sm:min-h-[73px]`}
            >
              <CardContent className="p-2 sm:p-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] sm:text-xs font-medium opacity-90 leading-tight">{card.title}</p>
                  <card.icon className="h-3 w-3 sm:h-4 sm:w-4 opacity-80" />
                </div>
                <div className="mt-1 text-xs sm:text-lg font-bold leading-tight">
                  {card.value}
                </div>
                <p className="mt-0.5 text-[9px] sm:text-[10px] opacity-80">{card.detail}</p>
              </CardContent>
              <div className="absolute -bottom-2 -right-2 opacity-10">
                <card.icon className="h-8 w-8" />
              </div>
            </Card>
          ))}
        </div>

        {/* Indicadores Ideais vs Atuais */}
        <div className="mt-8">
          <IndicadoresCard
            despesasFixas={indicadores.despesasFixas}
            despesasVariaveisPct={indicadores.pctVariaveis}
            metaMensalTotal={indicadores.metaMensalTotal}
            lucroDesejado={indicadores.lucroDesejado}
            markUp={indicadores.markUp}
            cmv={indicadores.cmvMaximo}
            pctFixas={indicadores.pctFixas}
          />
        </div>

        {/* Tabs Almoço e Janta */}
        <div className="mt-5">
          <div className="flex gap-1 mb-4">
            <button
              onClick={() => setActiveTab("almoco")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all w-24 justify-center hover:cursor-pointer hover:border-2 hover:border-red-500 text-[13px] ${
                activeTab === "almoco"
                  ? "bg-white shadow-sm text-gray-800 border-2 border-red-500"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Sun className="h-3 w-3" />
              ALMOÇO (73%)
            </button>
            <button
              onClick={() => setActiveTab("janta")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all w-24 justify-center hover:cursor-pointer hover:border-2 hover:border-red-500 text-[13px] ${
                activeTab === "janta"
                  ? "bg-white shadow-sm text-gray-800 border-2 border-red-500"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Moon className="h-3 w-3" />
              JANTA (27%)
            </button>
          </div>

          {/* Conteúdo do Almoço */}
          {activeTab === "almoco" && (
            <div className="grid gap-6 lg:grid-cols-2">
              <DespesasFixasTable
                despesas={indicadores.despesasFixas}
                percentual={0.73}
                title="Despesas Fixas - Almoço (73%)"
                onEdit={() => navegarPara("/planejamento/editar/despesas-fixas")}
                salariosTotal={salariosTotal}
                provisoes={provisoesDetalhadas}
              />
              <div className="space-y-6">
                <DespesasVariaveisTable 
                  percentual={indicadores.pctVariaveis}
                  metaMensalTotal={indicadores.metaMensalTotal}
                  title="Despesas Variáveis"
                  onEdit={() => navegarPara("/planejamento/editar/despesas-variaveis")}
                />
                <GraficosDistribuicao 
                  tipo="almoco"
                  despesasFixasPct={indicadores.pctFixas}
                  despesasVariaveisPct={indicadores.pctVariaveis}
                  lucroDesejado={indicadores.lucroDesejado}
                  cmv={indicadores.cmvMaximo}
                />
              </div>
            </div>
          )}

          {/* Conteúdo da Janta */}
          {activeTab === "janta" && (
            <div className="grid gap-6 lg:grid-cols-2">
              <DespesasFixasTable
                despesas={indicadores.despesasFixas}
                percentual={0.27}
                title="Despesas Fixas - Janta (27%)"
                onEdit={() => navegarPara("/planejamento/editar/despesas-fixas")}
                salariosTotal={salariosTotal}
                provisoes={provisoesDetalhadas}
              />
              <div className="space-y-6">
                <DespesasVariaveisTable 
                  percentual={indicadores.pctVariaveis}
                  metaMensalTotal={indicadores.metaMensalTotal}
                  title="Despesas Variáveis"
                  onEdit={() => navegarPara("/planejamento/editar/despesas-variaveis")}
                />
                <GraficosDistribuicao 
                  tipo="janta"
                  despesasFixasPct={indicadores.pctFixas}
                  despesasVariaveisPct={indicadores.pctVariaveis}
                  lucroDesejado={indicadores.lucroDesejado}
                  cmv={indicadores.cmvMaximo}
                />
              </div>
            </div>
          )}
        </div>

        {/* Tabela de Metas Mensais */}
        <div className="mt-8">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
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
            <div className="p-0">
              <FolhaSalarialTable
                funcionarios={funcionarios}
                onEdit={() => navegarPara("/planejamento/editar/funcionarios")}
                onConfigProvisoes={() => navegarPara("/planejamento/editar/provisoes")}
                onTotalsChange={handleTotalsChange}
              />
            </div>
          </div>
        </div>

        {/* Comparativo Real x Meta */}
        <div className="mt-8">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
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
            despesasFixasTotal={indicadores.despesasFixas.reduce((s, d) => s + d.valor, 0)}
            despesasVariaveisPct={indicadores.pctVariaveis}
            metaMensalTotal={indicadores.metaMensalTotal}
            lucroDesejado={indicadores.lucroDesejado}
            markUp={indicadores.markUp}
            cmv={indicadores.cmvMaximo}
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