// src/app/(dashboard)/dashboard/components/IndicadoresCard.tsx
"use client"

import { Progress } from "@/components/ui/progress"
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

  const indicadores = [
    {
      nome: "Despesas Fixas",
      icone: Home,
      valor: pctFixas,
      unidade: "%",
      min: 30,
      max: 45,
      getStatus: (v: number) => v >= 30 && v <= 45 ? "Ideal" : "Fora da faixa",
      isIdeal: (v: number) => v >= 30 && v <= 45
    },
    {
      nome: "Despesas Variáveis",
      icone: TrendingDown,
      valor: despesasVariaveisPct,
      unidade: "%",
      min: 5,
      max: 15,
      getStatus: (v: number) => v >= 5 && v <= 15 ? "Ideal" : "Fora da faixa",
      isIdeal: (v: number) => v >= 5 && v <= 15
    },
    {
      nome: "CMV",
      icone: Factory,
      valor: cmv,
      unidade: "%",
      min: 35,
      max: 45,
      getStatus: (v: number) => v >= 35 && v <= 45 ? "Ideal" : "Fora da faixa",
      isIdeal: (v: number) => v >= 35 && v <= 45
    }
  ]

  const indicadoresIdeais = indicadores.filter(i => i.isIdeal(i.valor)).length

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
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {indicadores.map((ind) => {
            const percentual = Math.min(100, Math.max(0, ((ind.valor - ind.min) / (ind.max - ind.min)) * 100))
            const status = ind.getStatus(ind.valor)
            const isIdeal = ind.isIdeal(ind.valor)
            const Icon = ind.icone
            
            return (
              <div key={ind.nome} className="rounded-lg border border-gray-100 p-2.5 shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className={`p-1 rounded-md ${isIdeal ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                      <Icon className={`h-3 w-3 ${isIdeal ? 'text-emerald-600' : 'text-amber-600'}`} />
                    </div>
                    <h6 className="font-semibold text-gray-800 text-xs">{ind.nome}</h6>
                  </div>
                </div>
                <div className="my-2 text-center">
                  <span className="text-2xl font-bold text-gray-800">{ind.valor.toFixed(1)}</span>
                  <span className="text-gray-500 ml-0.5 text-xs">{ind.unidade}</span>
                </div>
                <Progress value={percentual} className="h-1.5" />
                <div className="mt-1.5 flex justify-between text-xs">
                  <span className="text-gray-500 text-[10px]">Min: {ind.min}{ind.unidade}</span>
                  <span className={`font-medium text-[10px] ${isIdeal ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {status}
                  </span>
                  <span className="text-gray-500 text-[10px]">Max: {ind.max}{ind.unidade}</span>
                </div>
              </div>
            )
          })}

          {/* Resumo da Saúde Financeira */}
          <div className={`rounded-lg ${saude.bg} p-2.5 shadow-sm`}>
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
      </div>
    </div>
  )
}