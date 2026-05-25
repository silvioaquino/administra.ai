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

  const indicadores = [
    {
      nome: "Mark-up",
      icone: TrendingUp,
      cor: "primary",
      valor: markUp,
      unidade: "x",
      min: 2.0,
      max: 3.5,
      getStatus: (v: number) => v >= 2.0 && v <= 3.5 ? "Ideal" : "Fora da faixa",
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
      getStatus: (v: number) => v >= 30 && v <= 45 ? "Ideal" : "Fora da faixa",
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
      getStatus: (v: number) => v >= 5 && v <= 15 ? "Ideal" : "Fora da faixa",
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
      getStatus: (v: number) => v >= 35 && v <= 45 ? "Ideal" : "Fora da faixa",
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
      getStatus: (v: number) => v >= 10 && v <= 20 ? "Ideal" : "Fora da faixa",
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {indicadores.map((ind) => {
            const percentual = Math.min(100, Math.max(0, ((ind.valor - ind.min) / (ind.max - ind.min)) * 100))
            const status = ind.getStatus(ind.valor)
            const isIdeal = ind.isIdeal(ind.valor)
            const Icon = ind.icone
            
            return (
              <div key={ind.nome} className="rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${isIdeal ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                      <Icon className={`h-4 w-4 ${isIdeal ? 'text-emerald-600' : 'text-amber-600'}`} />
                    </div>
                    <h6 className="font-semibold text-gray-800">{ind.nome}</h6>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${isIdeal ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    Ideal: {ind.min}{ind.unidade} - {ind.max}{ind.unidade}
                  </span>
                </div>
                <div className="my-3 text-center">
                  <span className="text-3xl font-bold text-gray-800">{ind.valor.toFixed(1)}</span>
                  <span className="text-gray-500 ml-0.5">{ind.unidade}</span>
                </div>
                <Progress value={percentual} className="h-2" />
                <div className="mt-2 flex justify-between text-xs">
                  <span className="text-gray-500">Min: {ind.min}{ind.unidade}</span>
                  <span className={`font-medium ${isIdeal ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {status}
                  </span>
                  <span className="text-gray-500">Max: {ind.max}{ind.unidade}</span>
                </div>
              </div>
            )
          })}

          {/* Resumo da Saúde Financeira */}
          <div className={`rounded-xl ${saude.bg} p-4 shadow-sm`}>
            <h6 className="mb-3 font-semibold text-gray-800 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Resumo da Saúde Financeira
            </h6>
            <div className="text-center">
              <div className="text-5xl">{saude.icon}</div>
              <div className={`mt-2 font-bold ${saude.color}`}>{saude.text}</div>
              <div className="mt-2 text-sm text-gray-500">
                {indicadoresIdeais}/5 indicadores ideais
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}