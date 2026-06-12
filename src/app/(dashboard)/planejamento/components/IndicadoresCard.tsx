// src/app/(dashboard)/planejamento/components/IndicadoresCard.tsx
"use client"

import { Progress } from "@/components/ui/progress"
import { formatPercentage } from "@/lib/utils"
import { TrendingUp, Home, TrendingDown, Factory, DollarSign, Activity } from "lucide-react"

interface IndicadoresCardProps {
  despesasFixas: Array<{ nome: string; valor: number }>
  despesasVariaveisPct: number
  metaMensalTotal: number
  lucroDesejado: number
  markUp: number
  cmv: number
}

export function IndicadoresCard({
  despesasFixas,
  despesasVariaveisPct,
  metaMensalTotal,
  lucroDesejado,
  markUp,
  cmv
}: IndicadoresCardProps) {
  const totalFixas = despesasFixas.reduce((s, d) => s + d.valor, 0)
  const pctFixas = metaMensalTotal > 0 ? (totalFixas / metaMensalTotal) * 100 : 0

  const getStatusType = (valor: number, min: number, max: number): 'ideal' | 'abaixo' | 'acima' => {
    if (valor >= min && valor <= max) return 'ideal'
    if (valor < min) return 'abaixo'
    return 'acima'
  }

  const getStatusColor = (status: 'ideal' | 'abaixo' | 'acima') => {
    switch (status) {
      case 'ideal':
        return {
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
          text: 'text-emerald-700',
          progressBg: 'bg-emerald-100',
          progressFill: 'bg-emerald-500',
          iconBg: 'bg-emerald-100',
          iconColor: 'text-emerald-600',
          statusText: 'Ideal ✓',
          statusColor: 'text-emerald-600'
        }
      case 'abaixo':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          text: 'text-amber-700',
          progressBg: 'bg-amber-100',
          progressFill: 'bg-amber-500',
          iconBg: 'bg-amber-100',
          iconColor: 'text-amber-600',
          statusText: 'Abaixo da faixa ↓',
          statusColor: 'text-amber-600'
        }
      case 'acima':
        return {
          bg: 'bg-rose-50',
          border: 'border-rose-200',
          text: 'text-rose-700',
          progressBg: 'bg-rose-100',
          progressFill: 'bg-rose-500',
          iconBg: 'bg-rose-100',
          iconColor: 'text-rose-600',
          statusText: 'Acima da faixa ↑',
          statusColor: 'text-rose-600'
        }
    }
  }

  const indicadores = [
    {
      nome: "Mark-up",
      icone: TrendingUp,
      cor: "primary",
      valor: markUp,
      unidade: "x",
      min: 2.0,
      max: 3.5,
      tooltip: "Ideal: entre 2.0x e 3.5x",
      getStatus: (v: number) => getStatusType(v, 2.0, 3.5),
      isIdeal: (v: number) => v >= 2.0 && v <= 3.5
    },
    {
      nome: "Despesas Fixas",
      icone: Home,
      cor: "danger",
      valor: pctFixas,
      unidade: "%",
      min: 30,
      max: 45,
      tooltip: "Ideal: entre 30% e 45% do faturamento",
      getStatus: (v: number) => getStatusType(v, 30, 45),
      isIdeal: (v: number) => v >= 30 && v <= 45
    },
    {
      nome: "Despesas Variáveis",
      icone: TrendingDown,
      cor: "warning",
      valor: despesasVariaveisPct,
      unidade: "%",
      min: 5,
      max: 15,
      tooltip: "Ideal: entre 5% e 15% do faturamento",
      getStatus: (v: number) => getStatusType(v, 5, 15),
      isIdeal: (v: number) => v >= 5 && v <= 15
    },
    {
      nome: "CMV (Custo Produção)",
      icone: Factory,
      cor: "info",
      valor: cmv,
      unidade: "%",
      min: 35,
      max: 45,
      tooltip: "Ideal: entre 35% e 45% do faturamento",
      getStatus: (v: number) => getStatusType(v, 35, 45),
      isIdeal: (v: number) => v >= 35 && v <= 45
    },
    {
      nome: "Lucro Desejado",
      icone: DollarSign,
      cor: "success",
      valor: lucroDesejado,
      unidade: "%",
      min: 10,
      max: 20,
      tooltip: "Ideal: entre 10% e 20% de lucro",
      getStatus: (v: number) => getStatusType(v, 10, 20),
      isIdeal: (v: number) => v >= 10 && v <= 20
    }
  ]

  const indicadoresIdeais = indicadores.filter(i => i.isIdeal(i.valor)).length

  const getSaudeFinanceira = () => {
    if (indicadoresIdeais >= 4) return { icon: "🟢", text: "Excelente! Saúde Financeira Ótima", color: "text-emerald-600", bg: "bg-emerald-50" }
    if (indicadoresIdeais >= 3) return { icon: "🟡", text: "Boa, mas com margem para melhoria", color: "text-amber-600", bg: "bg-amber-50" }
    if (indicadoresIdeais >= 2) return { icon: "🟠", text: "Atenção! Necessita ajustes", color: "text-orange-600", bg: "bg-orange-50" }
    return { icon: "🔴", text: "Crítico! Revise seus custos urgentemente", color: "text-red-600", bg: "bg-red-50" }
  }

  const saude = getSaudeFinanceira()

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="bg-gray-50 p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-[#de4838]" />
          <h3 className="font-semibold text-gray-800">Indicadores Ideais vs Atuais</h3>
        </div>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {indicadores.map((ind) => {
            const status = ind.getStatus(ind.valor)
            const colors = getStatusColor(status)
            const Icon = ind.icone
            const isIdeal = status === 'ideal'
            
            // Calcula percentual para a barra de progresso
            let percentual = 0
            if (ind.valor < ind.min) {
              percentual = (ind.valor / ind.min) * 50
            } else if (ind.valor > ind.max) {
              percentual = 50 + ((ind.valor - ind.max) / (ind.max * 2)) * 50
              percentual = Math.min(100, percentual)
            } else {
              percentual = ((ind.valor - ind.min) / (ind.max - ind.min)) * 100
            }
            percentual = Math.min(100, Math.max(0, percentual))
            
            return (
              <div 
                key={ind.nome} 
                className={`rounded-xl border ${colors.border} ${colors.bg} p-3 shadow-sm hover:shadow-md transition-all cursor-help h-full min-h-[160px] sm:min-h-[180px]`}
                title={ind.tooltip}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${colors.iconBg}`}>
                      <Icon className={`h-4 w-4 ${colors.iconColor}`} />
                    </div>
                    <h6 className="font-semibold text-gray-800 text-[11px] sm:text-sm leading-tight">{ind.nome}</h6>
                  </div>
                  <span className={`rounded-full px-1.5 py-0.5 text-[9px] sm:text-xs font-medium ${colors.iconBg} ${colors.text}`}>
                    Ideal: {ind.min}{ind.unidade} - {ind.max}{ind.unidade}
                  </span>
                </div>
                <div className="my-3 text-center">
                  <span className={`text-2xl sm:text-3xl font-bold ${colors.text}`}>{ind.valor.toFixed(1)}</span>
                  <span className="text-gray-500 ml-0.5 text-[10px] sm:text-xs">{ind.unidade}</span>
                </div>
                
                {/* Custom Progress Bar */}
                <div className={`w-full ${colors.progressBg} rounded-full h-2 overflow-hidden`}>
                  <div 
                    className={`${colors.progressFill} h-full rounded-full transition-all duration-300`}
                    style={{ width: `${percentual}%` }}
                  />
                </div>
                
                <div className="mt-2 flex justify-between text-xs">
                  <span className="text-gray-500">Min: {ind.min}{ind.unidade}</span>
                  <span className={`font-medium ${colors.statusColor}`}>
                    {colors.statusText}
                  </span>
                  <span className="text-gray-500">Max: {ind.max}{ind.unidade}</span>
                </div>
              </div>
            )
          })}

          {/* Resumo da Saúde Financeira */}
          <div className={`rounded-xl ${saude.bg} p-3 shadow-sm h-full min-h-[160px] sm:min-h-[180px]`}>
            <h6 className="mb-3 font-semibold text-gray-800 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Resumo da Saúde Financeira
            </h6>
            <div className="text-center">
              <div className="text-5xl">{saude.icon}</div>
              <div className={`mt-2 font-bold ${saude.color} text-[11px] sm:text-sm leading-tight`}>{saude.text}</div>
              <div className="mt-2 text-[10px] sm:text-sm text-gray-500">
                {indicadoresIdeais}/5 indicadores ideais
              </div>
            </div>
          </div>
        </div>

        {/* Legenda */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-3 justify-center text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200"></div>
            <span className="text-gray-600">Ideal</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-amber-100 border border-amber-200"></div>
            <span className="text-gray-600">Abaixo da faixa</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-rose-100 border border-rose-200"></div>
            <span className="text-gray-600">Acima da faixa</span>
          </div>
        </div>
      </div>
    </div>
  )
}