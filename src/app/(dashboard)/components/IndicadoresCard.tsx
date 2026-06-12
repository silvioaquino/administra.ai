// src/app/(dashboard)/dashboard/components/IndicadoresCard.tsx
"use client"

import { Home, TrendingDown, Factory, Activity } from "lucide-react"

interface IndicadoresCardProps {
  despesasFixas: Array<{ nome: string; valor: number }>
  despesasVariaveisPct: number
  metaMensalTotal: number
  cmv: number
}

export function IndicadoresCard({
  despesasFixas,
  despesasVariaveisPct,
  metaMensalTotal,
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
      nome: "Despesas Fixas",
      icone: Home,
      valor: pctFixas,
      unidade: "%",
      min: 30,
      max: 45,
      tooltip: "Ideal: entre 30% e 45% do faturamento",
      getStatus: (v: number) => getStatusType(v, 30, 45),
    },
    {
      nome: "Despesas Variáveis",
      icone: TrendingDown,
      valor: despesasVariaveisPct,
      unidade: "%",
      min: 5,
      max: 15,
      tooltip: "Ideal: entre 5% e 15% do faturamento",
      getStatus: (v: number) => getStatusType(v, 5, 15),
    },
    {
      nome: "CMV",
      icone: Factory,
      valor: cmv,
      unidade: "%",
      min: 35,
      max: 45,
      tooltip: "Ideal: entre 35% e 45% do faturamento",
      getStatus: (v: number) => getStatusType(v, 35, 45),
    }
  ]

  const indicadoresIdeais = indicadores.filter(i => i.getStatus(i.valor) === 'ideal').length

  const getSaudeFinanceira = () => {
    if (indicadoresIdeais >= 3) return { icon: "🟢", text: "Excelente!", color: "text-emerald-600", bg: "bg-emerald-50" }
    if (indicadoresIdeais >= 2) return { icon: "🟡", text: "Boa", color: "text-amber-600", bg: "bg-amber-50" }
    if (indicadoresIdeais >= 1) return { icon: "🟠", text: "Atenção!", color: "text-orange-600", bg: "bg-orange-50" }
    return { icon: "🔴", text: "Crítico!", color: "text-red-600", bg: "bg-red-50" }
  }

  const saude = getSaudeFinanceira()

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="bg-gray-50 p-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-[#de4838]" />
          <h3 className="font-semibold text-gray-800 text-sm">Indicadores Financeiros</h3>
        </div>
      </div>
      <div className="p-3">
        <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-2 lg:grid-cols-4">
          {indicadores.map((ind) => {
            const status = ind.getStatus(ind.valor)
            const colors = getStatusColor(status)
            const Icon = ind.icone
            const percentual = Math.min(100, Math.max(0, ((ind.valor - ind.min) / (ind.max - ind.min)) * 100))
            
            return (
              <div 
                key={ind.nome} 
                className={`rounded-lg border ${colors.border} ${colors.bg} p-2 shadow-sm hover:shadow-md transition-all cursor-help min-h-[112px]`}
                title={ind.tooltip}
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className={`p-1 rounded-md ${colors.iconBg}`}>
                      <Icon className={`h-3 w-3 ${colors.iconColor}`} />
                    </div>
                    <h6 className="font-semibold text-gray-800 text-[10px] sm:text-xs leading-tight">{ind.nome}</h6>
                  </div>
                </div>
                <div className="my-2 text-center">
                  <span className={`text-xl sm:text-2xl font-bold ${colors.text}`}>{ind.valor.toFixed(1)}</span>
                  <span className="text-gray-500 ml-0.5 text-[10px] sm:text-xs">{ind.unidade}</span>
                </div>
                
                {/* Custom Progress Bar */}
                <div className={`w-full ${colors.progressBg} rounded-full h-1.5 overflow-hidden`}>
                  <div 
                    className={`${colors.progressFill} h-full rounded-full transition-all duration-300`}
                    style={{ width: `${percentual}%` }}
                  />
                </div>
                
                <div className="mt-1.5 flex justify-between text-xs">
                  <span className="text-gray-500 text-[10px]">Min: {ind.min}{ind.unidade}</span>
                  <span className={`font-medium text-[10px] ${colors.statusColor}`}>
                    {colors.statusText}
                  </span>
                  <span className="text-gray-500 text-[10px]">Max: {ind.max}{ind.unidade}</span>
                </div>
              </div>
            )
          })}

          {/* Resumo da Saúde Financeira */}
          <div className={`rounded-lg ${saude.bg} p-2 shadow-sm min-h-[112px]`}>
            <h6 className="mb-2 font-semibold text-gray-800 flex items-center gap-1.5 text-xs">
              <Activity className="h-3 w-3" />
              Resumo
            </h6>
            <div className="text-center">
              <div className="text-3xl">{saude.icon}</div>
              <div className={`mt-1 font-bold text-sm ${saude.color}`}>{saude.text}</div>
              <div className="mt-1 text-xs text-gray-500">
                {indicadoresIdeais}/3 ideais
              </div>
            </div>
          </div>
        </div>

        {/* Legenda */}
        <div className="mt-3 pt-2 border-t border-gray-100 flex flex-wrap gap-3 justify-center text-xs">
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