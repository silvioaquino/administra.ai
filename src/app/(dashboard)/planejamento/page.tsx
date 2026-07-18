"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  TrendingUp, DollarSign,
  Percent, Calculator, RefreshCw, Loader2,
  Sun, Moon, HelpCircle
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatPercentage } from "@/lib/utils"
import { toast } from 'sonner'
import { calcularIndicadores, type MaquininhaIndicador } from "@/lib/planejamento/calcularIndicadores"

// Components
import { IndicadoresCard } from "./components/IndicadoresCard"
import { TabelaMetasMensais, PeriodoRefeicao, PERIODOS_CONFIG } from "./components/TabelaMetasMensais"
import { TabelaAcompanhamento } from "./components/TabelaAcompanhamento"
import { FolhaSalarialTable } from "./components/FolhaSalarialTable"
import { DespesasFixasTable } from "./components/DespesasFixasTable"
import { DespesasVariaveisTable } from "./components/DespesasVariaveisTable"
import { GraficosDistribuicao } from "./components/GraficosDistribuicao"
import { MarkUpCalculator } from "./components/MarkUpCalculator"

// Percentuais padrão para cada período
const PERCENTUAIS_PADRAO: Record<string, number> = {
  almoco: 73,
  janta: 27,
  cafe: 0,
  turnoUnico: 100
}

// Tipos
interface MetaFaturamentoPeriodo {
  cafe?: number
  almoco?: number
  janta?: number
  turnoUnico?: number
}

interface MetaFaturamentoRow {
  mes: number
  periodos: MetaFaturamentoPeriodo
  diasTrabalhados: number
  metaTotal: number
}

interface Acompanhamento {
  mes: number
  faturamentoAlmoco: number
  faturamentoJanta: number
  faturamentoTotal: number
}

interface DespesaFixa {
  id?: number
  nome: string
  valor: number
  status?: string
  dataVencimento?: string
  dataPagamento?: string
  contaFinanceira?: string
}

interface DespesasVariaveisData {
  percentualTotal: number
  faturamentoBase: number
  impactoMensal: number
  config: {
    maquininhas: Array<{ id?: string; nome?: string; taxaDebito: number; taxaCredito: number; aluguel: number; ativo: boolean }>
    distribuicaoVendas: { debito: number; credito: number; voucher: number }
    taxaVoucher: number
    simplesNacional: number
    manutencao: number
  }
}

interface Funcionario {
  nome: string
  salario: number
}

export default function PlanejamentoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [anoAtual, setAnoAtual] = useState(new Date().getFullYear())
  const [metasMensais, setMetasMensais] = useState<MetaFaturamentoRow[]>([])
  const [acompanhamentos, setAcompanhamentos] = useState<Acompanhamento[]>([])
  const [despesasFixas, setDespesasFixas] = useState<DespesaFixa[]>([])
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [activeTab, setActiveTab] = useState<PeriodoRefeicao>("almoco")
  const [salariosTotal, setSalariosTotal] = useState(0)
  const [provisoesDetalhadas, setProvisoesDetalhadas] = useState<Array<{nome: string, valor: number}>>([])

  // Estado para despesas variáveis (nova API)
  const [despesasVariaveisData, setDespesasVariaveisData] = useState<DespesasVariaveisData | null>(null)

  // Estado para os percentuais de cada período (salvo no banco)
  const [percentuaisPeriodos, setPercentuaisPeriodos] = useState<Record<PeriodoRefeicao, number>>({
    cafe: 0,
    almoco: 73,
    janta: 27,
    turnoUnico: 100
  })

  // Carregar percentuais quando mudar o ano
  useEffect(() => {
    // O carregarDados será chamado automaticamente pelo useEffect abaixo
  }, [anoAtual])

  // Lucro desejado (carregado uma vez; muda apenas ao salvar)
  const [lucroDesejado, setLucroDesejado] = useState(15)

  // Estado para controlar períodos de metas no header
  const [periodosSelecionados, setPeriodosSelecionados] = useState<PeriodoRefeicao[]>([])

  const handleTotalsChange = (salarios: number, provisoes: Array<{nome: string, valor: number}>) => {
    setSalariosTotal(salarios)
    setProvisoesDetalhadas(provisoes)
  }

  // Estado para armazenar os totais da folha salarial
  const [folhaSalarialTotais, setFolhaSalarialTotais] = useState({
    totalSalarios: 0,
    totalDecimo: 0,
    totalFerias: 0,
    totalFgts: 0,
    totalInss: 0,
    totalInssPatronal: 0,
    totalMensal: 0,
    folhaEncargosPercentual: 0
  })

  const handleSaveFolhaTotais = async (totals: {
    totalSalarios: number
    totalDecimo: number
    totalFerias: number
    totalFgts: number
    totalInss: number
    totalInssPatronal: number
    totalMensal: number
    folhaEncargosPercentual: number
  }) => {
    setFolhaSalarialTotais(totals)
    // Salvar no backend automaticamente
    try {
      await fetch("/api/planejamento/folha-salarial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ano: anoAtual,
          ...totals
        })
      })
      // Os indicadores são recalculados no cliente via useMemo; nada a fazer aqui.
    } catch (error) {
      console.error("Erro ao salvar totais da folha:", error)
    }
  }

  const carregarDados = useCallback(async () => {
    setLoading(true)
    try {
      // 0. Carregar períodos selecionados (nova API)
      const periodosResponse = await fetch(`/api/planejamento/periodos-selecionados?ano=${anoAtual}`)
      const periodosData = await periodosResponse.json()
      if (periodosData.success && periodosData.periodos?.length > 0) {
        setPeriodosSelecionados(periodosData.periodos)
      } else {
        setPeriodosSelecionados(['turnoUnico'])
      }

      // 1. Indicadores são buscados por um useEffect dedicado (abaixo),
      // sincronizado com os cards Indicadores, CMV Máximo e Distribuição %.

      // 2. Carregar metas mensais (nova API planejamento-financeiro)
      const metasResponse = await fetch(`/api/planejamento-financeiro/faturamento?ano=${anoAtual}`)
      const metasData = await metasResponse.json()
      if (metasData.success) {
        // Converter formato novo para o formato do componente
        const dadosConvertidos = (metasData.dados || []).map((item: any) => ({
          mes: item.mes,
          periodos: item.periodos || { turnoUnico: item.metaDiaria || 0 },
          diasTrabalhados: item.diasTrabalhados || 26,
          metaTotal: item.metaTotal || (item.metaDiaria || 0) * (item.diasTrabalhados || 26)
        }))
        setMetasMensais(dadosConvertidos)
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

      // 4.5 Carregar totais da folha salarial (salvos mês a mês); usa o mês atual.
      const folhaResponse = await fetch(`/api/planejamento/folha-salarial?ano=${anoAtual}`)
      const folhaData = await folhaResponse.json()
      if (folhaData.success && folhaData.dados) {
        const mesAtualFolha = new Date().getMonth() + 1
        const f =
          folhaData.dados[mesAtualFolha] ||
          Object.values(folhaData.dados)[0] ||
          null
        if (f) {
          setFolhaSalarialTotais({
            totalSalarios: f.totalSalarios || 0,
            totalDecimo: f.totalDecimo || 0,
            totalFerias: f.totalFerias || 0,
            totalFgts: f.totalFgts || 0,
            totalInss: f.totalInss || 0,
            totalInssPatronal: f.totalInssPatronal || 0,
            totalMensal: f.totalMensal || 0,
            folhaEncargosPercentual: f.folhaEncargosPercentual || 0
          })
        }
      }

      // 5. Carregar despesas variáveis (nova API planejamento-financeiro)
      const mesAtual = new Date().getMonth() + 1
      const variaveisResponse = await fetch(`/api/planejamento-financeiro/despesas-variaveis?ano=${anoAtual}&mes=${mesAtual}`)
      const variaveisData = await variaveisResponse.json()
      if (variaveisData.success && variaveisData.dados) {
        setDespesasVariaveisData(variaveisData.dados)
      }

      // 6. Carregar percentuais dos períodos (salvo no banco)
      const percentualResponse = await fetch(`/api/planejamento/percentuais-periodos?ano=${anoAtual}`)
      const percentualData = await percentualResponse.json()
      if (percentualData.success && percentualData.percentuais) {
        setPercentuaisPeriodos({
          cafe: percentualData.percentuais.cafe ?? 0,
          almoco: percentualData.percentuais.almoco ?? 73,
          janta: percentualData.percentuais.janta ?? 27,
          turnoUnico: percentualData.percentuais.turnoUnico ?? 100
        })
      }

      // 7. Carregar lucro desejado (GET leve, 1 query) — fonte dos indicadores
      const lucroResponse = await fetch(`/api/planejamento/lucro-desejado?ano=${anoAtual}`)
      const lucroData = await lucroResponse.json()
      if (lucroData.success) {
        setLucroDesejado(lucroData.lucroDesejado ?? 15)
      }

      // 8. Carregar despesas fixas (GET leve) da mesma tabela do card — fonte dos indicadores
      const dfResponse = await fetch(`/api/planejamento-financeiro/despesas-fixas?ano=${anoAtual}`)
      const dfData = await dfResponse.json()
      if (dfData.success) {
        setDespesasFixas(dfData.dados || [])
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

  // Sincronizar activeTab com os períodos selecionados
  useEffect(() => {
    // Se o período ativo não está mais entre os selecionados, mudar para o primeiro selecionado
    if (!periodosSelecionados.includes(activeTab as PeriodoRefeicao)) {
      if (periodosSelecionados.length > 0) {
        setActiveTab(periodosSelecionados[0])
      }
    }
    // Se não há aba ativa e há períodos selecionados, definir o primeiro
    if (periodosSelecionados.length > 0 && !activeTab) {
      setActiveTab(periodosSelecionados[0])
    }
  }, [periodosSelecionados, activeTab])

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

  // Atualização otimista do lucro desejado (resposta imediata na UI);
  // o useMemo de indicadores recalcula sozinho a partir deste estado.
  function handleLucroChange(value: number) {
    setLucroDesejado(value)
  }

  // Persiste o lucro desejado. O recálculo dos indicadores acontece no cliente.
  async function handleLucroSave(value: number) {
    try {
      await fetch("/api/planejamento/lucro-desejado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ano: anoAtual, lucroDesejado: value })
      })
    } catch (error) {
      console.error("Erro ao salvar lucro desejado:", error)
      toast.error("Erro ao salvar o lucro desejado")
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
        }),
        // Salvar totais da folha salarial
        fetch("/api/planejamento/folha-salarial", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ano: anoAtual,
            ...folhaSalarialTotais
          })
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

  // Encargos da folha salarial (usado no card Despesas Variáveis)
  const encargosFolha =
    folhaSalarialTotais.totalDecimo + folhaSalarialTotais.totalFerias +
    folhaSalarialTotais.totalFgts + folhaSalarialTotais.totalInss +
    folhaSalarialTotais.totalInssPatronal

  // Indicadores calculados no cliente a partir dos dados já carregados.
  // Elimina as chamadas repetidas ao endpoint pesado /indicadores-resumo:
  // os valores só mudam quando algum input (metas, folha, despesas fixas,
  // despesas variáveis ou lucro) é alterado e salvo.
  const mesAtualIndicadores = new Date().getMonth() + 1
  const metaMensalTotal = metasMensais.find((m) => m.mes === mesAtualIndicadores)?.metaTotal || 0

  const indicadores = useMemo(() => {
    const dv = despesasVariaveisData
    const maquininhas = (dv?.config?.maquininhas || []) as MaquininhaIndicador[]
    const distribuicaoVendas = dv?.config?.distribuicaoVendas || { debito: 40, credito: 50, voucher: 10 }
    const outrasTaxas = {
      voucher: dv?.config?.taxaVoucher ?? 7.0,
      simplesNacional: dv?.config?.simplesNacional ?? 0,
      manutencao: dv?.config?.manutencao ?? 0,
    }
    const faturamentoBase = dv?.faturamentoBase ?? metaMensalTotal

    const resultado = calcularIndicadores({
      metaMensalTotal,
      lucroDesejado,
      despesasFixas: despesasFixas.map((d) => ({ nome: d.nome, valor: Number(d.valor) })),
      totalSalarios: folhaSalarialTotais.totalSalarios,
      encargosFolha,
      maquininhas,
      distribuicaoVendas,
      outrasTaxas,
      faturamentoBase,
    })

    return {
      metaMensalTotal: resultado.metaMensalTotal,
      lucroDesejado: resultado.lucroDesejado,
      markUp: resultado.markUp ?? 0,
      cmvMaximo: resultado.cmv ?? 0,
      pctFixas: resultado.pctFixas,
      pctVariaveis: resultado.despesasVariaveisPct,
      despesasVariaveisBase: resultado.despesasVariaveisBase,
      totalDespesasVariaveis: resultado.totalDespesasVariaveis,
      despesasFixas: resultado.despesasFixas,
      folhaEncargosPercentual: resultado.folhaEncargosPercentual,
      metaFaltando: resultado.metaFaltando,
    }
  }, [despesasVariaveisData, metasMensais, lucroDesejado, despesasFixas, folhaSalarialTotais, encargosFolha, metaMensalTotal])

  const togglePeriodo = (periodo: PeriodoRefeicao) => {
    setPeriodosSelecionados(prev => {
      const isTurnoUnico = periodo === 'turnoUnico'
      const hasTurnoUnico = prev.includes('turnoUnico')

      let novosPeriodos: PeriodoRefeicao[]

      if (isTurnoUnico) {
        if (hasTurnoUnico) {
          novosPeriodos = prev.filter(p => p !== 'turnoUnico')
          if (novosPeriodos.length === 0) novosPeriodos = ['turnoUnico']
        } else {
          novosPeriodos = ['turnoUnico']
        }
      } else {
        // É uma refeição (cafe, almoco, janta)
        if (hasTurnoUnico) {
          novosPeriodos = [periodo]
        } else {
          const hasPeriodo = prev.includes(periodo)
          if (hasPeriodo) {
            novosPeriodos = prev.filter(p => p !== periodo)
            if (novosPeriodos.length === 0) novosPeriodos = ['turnoUnico']
          } else {
            novosPeriodos = [...prev, periodo]
          }
        }
      }

      return novosPeriodos
    })
  }

  // Salvar períodos no banco após mudar
  const prevPeriodosRef = useRef<string[]>([])
  const isFirstLoadRef = useRef(true)

  useEffect(() => {
    // Ignora a primeira carga (quando dados são carregados do banco)
    if (isFirstLoadRef.current) {
      isFirstLoadRef.current = false
      prevPeriodosRef.current = periodosSelecionados.map(p => String(p))
      return
    }

    // Só salva se os períodos realmente mudaram
    const currentPeriodos = periodosSelecionados.map(p => String(p)).sort().join(',')
    const prevPeriodos = prevPeriodosRef.current.join(',')

    if (currentPeriodos !== prevPeriodos && periodosSelecionados.length > 0) {
      fetch("/api/planejamento/periodos-selecionados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ano: anoAtual,
          periodos: periodosSelecionados
        })
      }).catch(err => console.error('Erro ao salvar períodos:', err))

      prevPeriodosRef.current = periodosSelecionados.map(p => String(p))
    }
  }, [periodosSelecionados, anoAtual])

  const cardsResumo = [
    {
      title: "Faturamento Mensal",
      value: loading ? formatCurrency(0) : formatCurrency(indicadores.metaMensalTotal),
      icon: DollarSign,
      gradient: "from-emerald-500 to-emerald-600",
    },
    {
      title: "Lucro Desejado",
      value: loading ? formatPercentage(0) : formatPercentage(indicadores.lucroDesejado),
      icon: TrendingUp,
      gradient: "from-green-600 to-green-500",
      detail: "Margem alvo",
    },
    {
      title: "Mark-Up",
      value: loading || indicadores.metaFaltando ? "—" : indicadores.markUp.toFixed(2),
      icon: Calculator,
      gradient: "from-orange-500 to-orange-600",
      detail: "Fator multiplicador",
    },
    {
      title: "CMV Máximo",
      value: loading || indicadores.metaFaltando ? "—" : formatPercentage(indicadores.cmvMaximo),
      icon: Percent,
      gradient: "from-purple-500 to-purple-600",
      detail: "Custo com Produção",
    },
  ]

  return (
    <div className="min-h-screen bg-[#e5e7eb]">
      {/* Header com botões de períodos */}
      <div className="sticky top-0 z-10 ml-3 mr-3 sm:ml-6 sm:mr-6 bg-white border-b border-gray-200 px-3 py-3 sm:px-6 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Planejamento Financeiro</h1>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          {/* Botões de seleção de períodos - NOVO HEADER */}
          <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1 border border-gray-200">
            <span className="text-xs font-medium text-gray-600 px-2">Períodos:</span>
            {PERIODOS_CONFIG.map(config => (
              <Button
                key={config.id}
                type="button"
                variant={periodosSelecionados.includes(config.id) ? 'default' : 'outline'}
                size="sm"
                onClick={() => togglePeriodo(config.id)}
                className={`
                  rounded-md text-xs font-medium transition-all min-w-0 px-2 py-1 h-7
                  ${periodosSelecionados.includes(config.id)
                    ? 'bg-[#de4838] text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 border-gray-200'
                  }
                `}
              >
                {config.shortLabel}
              </Button>
            ))}
          </div>
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
            despesasFixas={loading ? [] : indicadores.despesasFixas}
            despesasVariaveisPct={loading ? 0 : indicadores.pctVariaveis}
            metaMensalTotal={loading ? 0 : indicadores.metaMensalTotal}
            lucroDesejado={loading ? 0 : indicadores.lucroDesejado}
            markUp={loading ? 0 : indicadores.markUp}
            cmv={loading ? 0 : indicadores.cmvMaximo}
            pctFixas={loading ? 0 : indicadores.pctFixas}
            metaFaltando={loading ? false : indicadores.metaFaltando}
          />
        </div>

        {/* Tabs dinâmicas baseadas nos períodos selecionados */}
        <div className="mt-5">
          <div className="flex gap-1 mb-4 flex-wrap">
            {periodosSelecionados.map((periodo) => {
              const config = PERIODOS_CONFIG.find(c => c.id === periodo)
              const Icon = periodo === 'almoco' ? Sun : periodo === 'janta' ? Moon : Sun

              return (
                <button
                  key={periodo}
                  onClick={() => setActiveTab(periodo)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all w-24 justify-center hover:cursor-pointer hover:border-2 hover:border-red-500 text-[13px] ${
                    activeTab === periodo
                      ? "bg-white shadow-sm text-gray-800 border-2 border-red-500"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {config?.shortLabel.toUpperCase()}
                </button>
              )
            })}
          </div>

          {/* Conteúdo dinâmico baseado no período ativo */}
          {periodosSelecionados.includes(activeTab) && (
            <div className="grid gap-6 lg:grid-cols-[58%_40%]">
              <DespesasFixasTable
                dados={indicadores.despesasFixas}
                metaTotal={indicadores.metaMensalTotal * (PERCENTUAIS_PADRAO[activeTab] || 100) / 100}
                periodoAtual={activeTab}
                percentualPeriodoSalvo={percentuaisPeriodos[activeTab]}
                maquininhas={despesasVariaveisData?.config?.maquininhas || []}
                totalSalarios={salariosTotal}
                onSalvar={async (despesas, ano, _mes, percentualPeriodo) => {
                  try {
                    // 1. Salvar despesas fixas
                    const response = await fetch("/api/planejamento-financeiro/despesas-fixas", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ ano, despesas })
                    })

                    // 2. Salvar percentual do período atual
                    if (percentualPeriodo !== undefined) {
                      const novosPercentuais = {
                        ...percentuaisPeriodos,
                        [activeTab]: percentualPeriodo
                      }
                      setPercentuaisPeriodos(novosPercentuais)

                      await fetch("/api/planejamento/percentuais-periodos", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          ano,
                          percentuais: novosPercentuais
                        })
                      })
                    }

                    const data = await response.json()
                    if (data.success) {
                      toast.success('Despesas fixas salvas com sucesso!')
                      carregarDados()
                    } else {
                      toast.error('Erro ao salvar despesas fixas')
                    }
                    return data.success
                  } catch (error) {
                    toast.error('Erro ao salvar dados')
                    return false
                  }
                }}
                ano={anoAtual}
                mes={undefined}
              />
              <div className="space-y-6">
                <DespesasVariaveisTable
                  percentual={indicadores.despesasVariaveisBase ?? indicadores.pctVariaveis}
                  metaMensalTotal={despesasVariaveisData?.faturamentoBase || indicadores.metaMensalTotal}
                  title="Despesas Variáveis"
                  onEdit={() => navegarPara("/planejamento/editar/despesas-variaveis")}
                  totalMensalFolha={encargosFolha}
                />
                <GraficosDistribuicao
                  tipo={((activeTab === 'turnoUnico' || activeTab === 'cafe') ? 'almoco' : activeTab) as 'almoco' | 'janta'}
                  pctFixas={loading ? 0 : indicadores.pctFixas}
                  despesasVariaveisPct={loading ? 0 : indicadores.pctVariaveis}
                  lucroDesejado={loading ? 0 : indicadores.lucroDesejado}
                  cmv={loading || indicadores.metaFaltando ? null : indicadores.cmvMaximo}
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
                anoAtual={anoAtual}
                onSalvar={async (dados, ano) => {
                  try {
                    const response = await fetch("/api/planejamento-financeiro/faturamento", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ ano, meses: dados })
                    })
                    const data = await response.json()
                    if (data.success) {
                      toast.success('Metas de faturamento salvas com sucesso!')
                      carregarDados()
                    } else {
                      toast.error('Erro ao salvar metas de faturamento')
                    }
                  } catch (error) {
                    toast.error('Erro ao salvar dados')
                  }
                }}
                periodosExternos={periodosSelecionados}
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
                onSaveTotals={handleSaveFolhaTotais}
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
                periodosSelecionados={periodosSelecionados}
                abaAtiva={activeTab}
              />
            </div>
          </div>
        </div>

        {/* Mark-Up & Custos */}
        <div className="mt-8">
          <MarkUpCalculator
            despesasVariaveisPct={indicadores.pctVariaveis}
            lucroDesejado={indicadores.lucroDesejado}
            markUp={indicadores.markUp}
            cmv={indicadores.cmvMaximo}
            pctFixas={indicadores.pctFixas}
            metaFaltando={indicadores.metaFaltando}
            onLucroChange={handleLucroChange}
            onLucroSave={handleLucroSave}
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