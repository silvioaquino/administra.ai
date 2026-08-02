'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Save, RefreshCw, HelpCircle, DollarSign, TrendingUp, Percent, Calendar } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatPercentage } from '@/lib/utils'
import { toast } from 'sonner'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'

// Components
import { MetaFaturamentoTable } from './components/MetaFaturamentoTable'
import { DespesasFixasTable } from './components/DespesasFixasTable'
import { DespesasVariaveisCard } from './components/DespesasVariaveisCard'
import type { MetaFaturamentoRow } from './components/MetaFaturamentoTable'

// Types
interface DespesaFixa {
  id?: number
  nome: string
  valor: number
  status?: string
  dataVencimento?: string
  dataPagamento?: string
  contaFinanceira?: string
}

interface Maquininha {
  id?: string
  nome: string
  taxaDebito: number
  taxaCredito: number
  aluguel: number
  ativo: boolean
}

interface DistribuicaoVendas {
  debito: number
  credito: number
  voucher: number
}

interface OutrasTaxas {
  voucher: number
  simplesNacional: number
  manutencao: number
}

interface DespesasVariaveisResultados {
  debitoMedia: number
  creditoMedia: number
  taxaMediaGeral: number
  aluguelTotal: number
  totalDespesasVariaveis: number
}

export default function PlanejamentoFinanceiroPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [anoAtual, setAnoAtual] = useState(new Date().getFullYear())
  const [mesAtual, setMesAtual] = useState(new Date().getMonth() + 1)

  // Estados principais
  const [metaFaturamento, setMetaFaturamento] = useState<MetaFaturamentoRow[]>([])
  const [despesasFixas, setDespesasFixas] = useState<DespesaFixa[]>([])
  const [despesasVariaveis, setDespesasVariaveis] = useState<{
    percentualTotal: number
    config: {
      maquininhas: Maquininha[]
      distribuicaoVendas: DistribuicaoVendas
      manutencao: number
      simplesNacional: number
      taxaVoucher: number
    }
    resultados: DespesasVariaveisResultados
  } | null>(null)

  const meses = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' },
  ]

  // Carregar dados da API
  const carregarDados = useCallback(async () => {
    setLoading(true)
    try {
      // Carregar meta de faturamento
      const faturamentoRes = await fetch(`/api/planejamento-financeiro/faturamento?ano=${anoAtual}`)
      const faturamentoData = await faturamentoRes.json()
      if (faturamentoData.success) {
        // Converter formato antigo (metaDiaria) para novo (periodos)
        const dadosConvertidos = (faturamentoData.dados || []).map((item: any) => ({
          mes: item.mes,
          periodos: { turnoUnico: item.metaDiaria || 0 },
          diasTrabalhados: item.diasTrabalhados || 26,
          metaTotal: (item.metaDiaria || 0) * (item.diasTrabalhados || 26)
        }))
        setMetaFaturamento(dadosConvertidos)
      }

      // Carregar despesas fixas
      const despesasRes = await fetch(`/api/planejamento-financeiro/despesas-fixas?ano=${anoAtual}&mes=${mesAtual}`)
      const despesasData = await despesasRes.json()
      if (despesasData.success) {
        setDespesasFixas(despesasData.dados || [])
      }

      // Carregar despesas variáveis
      const variaveisRes = await fetch(`/api/planejamento-financeiro/despesas-variaveis?ano=${anoAtual}&mes=${mesAtual}`)
      const variaveisData = await variaveisRes.json()
      if (variaveisData.success) {
        setDespesasVariaveis(variaveisData.dados)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [anoAtual, mesAtual])

  // Sincronizar dados do livro diário
  const sincronizarDados = async () => {
    try {
      const response = await fetch('/api/planejamento-financeiro/sync-from-lancamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ano: anoAtual, mes: mesAtual })
      })
      const data = await response.json()
      if (data.success) {
        toast.success('Dados sincronizados com sucesso!')
        carregarDados()
      } else {
        toast.error('Erro ao sincronizar dados')
      }
    } catch (error) {
      toast.error('Erro ao sincronizar dados')
    }
  }

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  // Salvar meta de faturamento
  const salvarMetaFaturamento = async (dados: MetaFaturamentoRow[], ano: number) => {
    try {
      // Converter novo formato (periodos) para antigo (metaDiaria) para compatibilidade com API
      const dadosParaApi = dados.map(item => {
        // Se tem turnoUnico, usa ele como metaDiaria
        // Se tem refeições, soma todas para metaDiaria
        const periodos = item.periodos || {}
        const temTurnoUnico = (periodos.turnoUnico ?? 0) > 0
        const temRefeicoes = (periodos.cafe ?? 0) > 0 || (periodos.almoco ?? 0) > 0 || (periodos.janta ?? 0) > 0

        let metaDiaria = 0
        if (temTurnoUnico && !temRefeicoes) {
          metaDiaria = periodos.turnoUnico || 0
        } else {
          metaDiaria = (periodos.cafe || 0) + (periodos.almoco || 0) + (periodos.janta || 0)
        }

        return {
          mes: item.mes,
          metaDiaria,
          diasTrabalhados: item.diasTrabalhados || 26,
          metaTotal: item.metaTotal
        }
      })

      const response = await fetch('/api/planejamento-financeiro/faturamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ano, meses: dadosParaApi })
      })
      const data = await response.json()
      if (data.success) {
        toast.success('Meta de faturamento salva com sucesso!')
      } else {
        toast.error('Erro ao salvar meta de faturamento')
      }
    } catch (error) {
      toast.error('Erro ao salvar dados')
    }
  }

  // Salvar despesas fixas
  const salvarDespesasFixas = async (dados: DespesaFixa[], ano: number, mes?: number) => {
    try {
      const response = await fetch('/api/planejamento-financeiro/despesas-fixas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ano, mes, despesas: dados })
      })
      const data = await response.json()
      if (data.success) {
        toast.success('Despesas fixas salvas com sucesso!')
      } else {
        toast.error('Erro ao salvar despesas fixas')
      }
    } catch (error) {
      toast.error('Erro ao salvar dados')
    }
  }

  // Salvar despesas variáveis
  const salvarDespesasVariaveis = async (dados: any) => {
    try {
      const response = await fetch('/api/planejamento-financeiro/despesas-variaveis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ano: anoAtual,
          mes: mesAtual,
          ...dados
        })
      })
      const data = await response.json()
      if (data.success) {
        toast.success('Despesas variáveis salvas com sucesso!')
        carregarDados()
      } else {
        toast.error('Erro ao salvar despesas variáveis')
      }
    } catch (error) {
      toast.error('Erro ao salvar dados')
    }
  }

  // Salvar tudo
  const salvarTudo = async () => {
    try {
      await Promise.all([
        salvarMetaFaturamento(metaFaturamento, anoAtual),
        salvarDespesasFixas(despesasFixas, anoAtual, mesAtual),
        salvarDespesasVariaveis({
          percentualTotal: despesasVariaveis?.percentualTotal || 0,
          config: despesasVariaveis?.config || {},
          resultados: despesasVariaveis?.resultados || {}
        })
      ])
      toast.success('Todos os dados salvos com sucesso!')
    } catch (error) {
      toast.error('Erro ao salvar dados')
    }
  }

  // Calcular totais
  // Pega apenas o primeiro registro do mês atual (evita duplicatas)
  const mesAtualData = metaFaturamento.find(m => m.mes === mesAtual)
  const faturamentoTotalMes = mesAtualData?.metaTotal || 0

  // Calcular percentual total automaticamente baseado nas configurações
  const calcularPercentualTotal = () => {
    if (!despesasVariaveis?.config || !faturamentoTotalMes) return 0

    const config = despesasVariaveis.config
    const maquininhas = config.maquininhas || []
    const distribuicao = config.distribuicaoVendas || { debito: 0, credito: 0, voucher: 0 }

    // Calcular taxa média geral
    const maquininhasAtivas = maquininhas.filter(m => m.ativo)
    const taxaDebitoMedia = maquininhasAtivas.length > 0
      ? maquininhasAtivas.reduce((sum, m) => sum + (m.taxaDebito || 0), 0) / maquininhasAtivas.length
      : 0

    const taxaCreditoMedia = maquininhasAtivas.length > 0
      ? maquininhasAtivas.reduce((sum, m) => sum + (m.taxaCredito || 0), 0) / maquininhasAtivas.length
      : 0

    const percDebito = distribuicao.debito / 100
    const percCredito = distribuicao.credito / 100
    const percVoucher = distribuicao.voucher / 100
    const taxaVoucher = config.taxaVoucher || 7.0

    const taxaMediaGeral = (taxaDebitoMedia * percDebito) + (taxaCreditoMedia * percCredito) + (taxaVoucher * percVoucher)

    // Total de despesas variáveis (sem Aluguel % baseado no Faturamento)
    return (config.simplesNacional || 0) + taxaMediaGeral + (config.manutencao || 0)
  }

  const percentualTotalCalculado = calcularPercentualTotal()
  // Usar valor calculado se não houver valor salvo ou se for 0
  const percentualTotal = (despesasVariaveis?.percentualTotal && despesasVariaveis?.percentualTotal > 0)
    ? despesasVariaveis.percentualTotal
    : percentualTotalCalculado
  const impactoMensal = faturamentoTotalMes * (percentualTotal / 100)

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <PageContainer>
        <PageHeader
          title="Planejamento Financeiro"
          subtitle="Gestão de metas, despesas e taxas"
        >
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <div className="relative">
            <select
              className="rounded-full border border-border bg-surface px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none pr-8 cursor-pointer hover:border-destructive transition-colors"
              value={anoAtual}
              onChange={(e) => setAnoAtual(parseInt(e.target.value))}
            >
              <option value={2024}>2024</option>
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
              <option value={2028}>2028</option>
            </select>
          </div>
          <Button
            variant="outline"
            onClick={carregarDados}
            className="rounded-full border-border hover:border-primary hover:cursor-pointer transition-all whitespace-nowrap text-xs sm:text-sm"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
          <Button
            variant="outline"
            onClick={sincronizarDados}
            className="rounded-full border-border hover:border-success hover:cursor-pointer transition-all whitespace-nowrap text-xs sm:text-sm"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Sincronizar
          </Button>
          <Button
            onClick={salvarTudo}
            className="bg-primary hover:bg-primary/90 text-white rounded-full px-4 py-2 hover:cursor-pointer hover:border-destructive hover:border-2 transition-all whitespace-nowrap text-xs sm:text-sm"
          >
            <Save className="mr-2 h-4 w-4" />
            Salvar Tudo
          </Button>
        </div>
        </PageHeader>
        {/* Cards Resumo */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card className="relative overflow-hidden bg-gradient-to-r from-success to-success/80 text-white hover:cursor-pointer hover:scale-105 transition-transform duration-200">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium opacity-90 leading-tight">Faturamento Mensal</p>
                <DollarSign className="h-4 w-4 opacity-80" />
              </div>
              <div className="mt-1 text-lg font-bold leading-tight">
                {formatCurrency(faturamentoTotalMes)}
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-r from-success to-success text-white hover:cursor-pointer hover:scale-105 transition-transform duration-200">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium opacity-90 leading-tight">Impacto Variáveis</p>
                <TrendingUp className="h-4 w-4 opacity-80" />
              </div>
              <div className="mt-1 text-lg font-bold leading-tight">
                {formatCurrency(impactoMensal)}
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-r from-warning to-warning/80 text-white hover:cursor-pointer hover:scale-105 transition-transform duration-200">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium opacity-90 leading-tight">% Despesas Variáveis</p>
                <Percent className="h-4 w-4 opacity-80" />
              </div>
              <div className="mt-1 text-lg font-bold leading-tight">
                {formatPercentage(percentualTotal)}
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-r from-primary/80 to-primary/70 text-white hover:cursor-pointer hover:scale-105 transition-transform duration-200">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium opacity-90 leading-tight">Mês Atual</p>
                <Calendar className="h-4 w-4 opacity-80" />
              </div>
              <div className="mt-1 text-lg font-bold leading-tight">
                {meses.find(m => m.value === mesAtual)?.label || mesAtual}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Meta de Faturamento */}
        <div className="mb-6">
          <MetaFaturamentoTable
            dados={metaFaturamento}
            anoAtual={anoAtual}
            onSalvar={salvarMetaFaturamento}
          />
        </div>

        {/* Despesas Fixas - Linha principal */}
        <div className="mb-6">
          <DespesasFixasTable
            dados={despesasFixas}
            metaTotal={faturamentoTotalMes}
            onSalvar={salvarDespesasFixas}
            ano={anoAtual}
            mes={mesAtual}
            maquininhas={despesasVariaveis?.config?.maquininhas || []}
          />
        </div>

        {/* Despesas Variáveis - Linha principal */}
        <div className="mb-6">
          <DespesasVariaveisCard
            percentualTotal={percentualTotal}
            impactoMensal={impactoMensal}
            metaMensalTotal={faturamentoTotalMes}
            onEditar={() => router.push('/planejamento/editar/despesas-variaveis')}
          />
        </div>

      </PageContainer>

      {/* Botão Ajuda */}
      <button
        onClick={() => router.push('/planejamento/configuracoes?tab=ajuda')}
        className="fixed bottom-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-all hover:scale-110 hover:bg-primary/90 hover:cursor-pointer hover:border-2 hover:border-destructive"
      >
        <HelpCircle className="h-6 w-6" />
      </button>
    </div>
  )
}