'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatPercentage } from '@/lib/utils'
import { calcularTotalDespesasVariaveis } from '@/lib/calculoDespesasVariaveis'
import { Calculator, TrendingUp, TrendingDown, CreditCard, DollarSign, Users, PieChart } from 'lucide-react'

interface ResultadosTaxasProps {
  maquininhas: {
    taxaDebito: number
    taxaCredito: number
    aluguel: number
    ativo: boolean
  }[]
  distribuicaoVendas: {
    debito: number
    credito: number
    voucher: number
  }
  outrasTaxas: {
    voucher: number
    simplesNacional: number
    manutencao: number
  }
  faturamentoTotal?: number
  folhaSalarialTotalMensal?: number
}

export function ResultadosTaxas({
  maquininhas,
  distribuicaoVendas,
  outrasTaxas,
  faturamentoTotal = 0,
  folhaSalarialTotalMensal = 0
}: ResultadosTaxasProps) {
  // Calcular resultados (cálculo centralizado em @/lib/calculoDespesasVariaveis)
  const calculo = calcularTotalDespesasVariaveis({
    maquininhas,
    distribuicaoVendas,
    outrasTaxas,
    faturamentoBase: faturamentoTotal ?? 0,
    folhaSalarialTotalMensal,
  })

  const {
    taxaDebitoMedia,
    taxaCreditoMedia,
    taxaMediaGeral,
    aluguelTotal,
    percentualFolhaSalarial,
    total: totalDespesasVariaveis,
  } = calculo

  // Apenas para exibição (contagem de maquininhas e detalhamento da fórmula)
  const maquininhasAtivas = maquininhas.filter((m) => m.ativo)
  const taxaVoucher = outrasTaxas.voucher || 7.0

  // Dados para os cards de resultado
  const resultadosCards = [
    {
      title: "Taxa Débito Média",
      value: `${taxaDebitoMedia.toFixed(2)}%`,
      icon: TrendingDown,
      gradient: "from-info to-info",
      detail: "Média das maquininhas ativas"
    },
    {
      title: "Taxa Crédito Média",
      value: `${taxaCreditoMedia.toFixed(2)}%`,
      icon: TrendingUp,
      gradient: "from-primary to-primary",
      detail: "Média das maquininhas ativas"
    },
    {
      title: "Taxa Média Geral",
      value: `${taxaMediaGeral.toFixed(2)}%`,
      icon: Calculator,
      gradient: "from-warning to-warning",
      detail: "Ponderada por distribuição de vendas"
    },
    {
      title: "Total Aluguel",
      value: formatCurrency(aluguelTotal),
      icon: DollarSign,
      gradient: "from-warning to-warning",
      detail: "Maquininhas ativas"
    },
    {
      title: "Folha Salarial",
      value: formatCurrency(folhaSalarialTotalMensal || 0),
      icon: Users,
      gradient: "from-primary to-primary",
      detail: "Total mensal"
    },
    {
      title: "Folha Salarial (%)",
      value: (faturamentoTotal || 0) > 0 && (folhaSalarialTotalMensal || 0) > 0
        ? formatPercentage(percentualFolhaSalarial)
        : '0%',
      icon: PieChart,
      gradient: "from-success to-success",
      detail: "Percentual sobre faturamento"
    }
  ]

  return (
    <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-surface-2 p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-white">Resultados</h3>
          <span className="text-xs text-muted-foreground/70 ml-auto">
            Base: {formatCurrency(faturamentoTotal || 0)} de faturamento
          </span>
        </div>
      </div>

      {/* Cards de Resultados */}
      <div className="p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resultadosCards.map((card, idx) => (
            <div
              key={idx}
              className={`relative overflow-hidden bg-gradient-to-r ${card.gradient} text-white rounded-xl p-4 shadow-sm`}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium opacity-90">{card.title}</p>
                <card.icon className="h-4 w-4 opacity-80" />
              </div>
              <div className="mt-1 text-xl font-bold">
                {card.value}
              </div>
              <p className="mt-0.5 text-[10px] opacity-80">{card.detail}</p>
              <div className="absolute -bottom-2 -right-2 opacity-10">
                <card.icon className="h-12 w-12" />
              </div>
            </div>
          ))}
        </div>

        {/* Total Despesas Variáveis */}
        <div className="mt-6 pt-4 border-t-2 border-border">
          <div className="flex justify-between items-center">
            <span className="text-base font-semibold text-white flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              Total Despesas Variáveis:
            </span>
            <span className="text-3xl font-bold text-primary">
              {formatPercentage(totalDespesasVariaveis)}
            </span>
          </div>
          <div className="mt-2 grid grid-cols-2 md:grid-cols-5 gap-2 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Simples Nacional:</span>
              <span className="font-medium">{formatPercentage(outrasTaxas.simplesNacional)}</span>
            </div>
            <div className="flex justify-between">
              <span>Taxa Média:</span>
              <span className="font-medium">{formatPercentage(taxaMediaGeral)}</span>
            </div>
            <div className="flex justify-between">
              <span>Manutenção:</span>
              <span className="font-medium">{formatPercentage(outrasTaxas.manutencao)}</span>
            </div>
            <div className="flex justify-between">
              <span>Folha:</span>
              <span className="font-medium">{formatPercentage(percentualFolhaSalarial)}</span>
            </div>
          </div>
        </div>

        {/* Informações adicionais */}
        <div className="mt-4 p-3 bg-info/5 rounded-xl border border-info/30">
          <p className="text-xs text-info">
            <strong>ℹ️ Detalhamento:</strong> Taxa Média Geral = (Débito {distribuicaoVendas.debito}% × {taxaDebitoMedia.toFixed(2)}%) + 
            (Crédito {distribuicaoVendas.credito}% × {taxaCreditoMedia.toFixed(2)}%) + 
            (Voucher {distribuicaoVendas.voucher}% × {taxaVoucher.toFixed(2)}%) = {taxaMediaGeral.toFixed(2)}%
          </p>
        </div>

        {/* Status das maquininhas */}
        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-success/50" />
            {maquininhasAtivas.length} maquininhas ativas
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-surface-2" />
            {maquininhas.length - maquininhasAtivas.length} inativas
          </span>
        </div>
      </div>
    </div>
  )
}