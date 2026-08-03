// src/app/(dashboard)/dashboard/components/IndicadoresCard.tsx
"use client"

import { Home, TrendingDown, Factory, Activity, AlertTriangle } from "lucide-react"
import type { Alerta } from "@/lib/alertas/tipos"

interface IndicadoresCardProps {
  despesasFixas: Array<{ nome: string; valor: number }>
  despesasVariaveisPct: number
  metaMensalTotal: number
  cmv: number
  pctFixas?: number
  /** Alertas unificados; os que possuem `indicador` marcam o card correspondente. */
  alertas?: Alerta[]
}

export function IndicadoresCard({
  despesasFixas,
  despesasVariaveisPct,
  metaMensalTotal,
  cmv,
  pctFixas: pctFixasProp,
  alertas = []
}: IndicadoresCardProps) {
  const totalFixas = despesasFixas.reduce((s, d) => s + d.valor, 0)
  const pctFixas = pctFixasProp ?? (metaMensalTotal > 0 ? (totalFixas / metaMensalTotal) * 100 : 0)

  const alertaPorIndicador = new Map(
    alertas.filter(a => a.indicador).map(a => [a.indicador as string, a])
  )


  const getStatusType = (valor: number, min: number, max: number): 'ideal' | 'abaixo' | 'acima' => {
    if (valor >= min && valor <= max) return 'ideal'
    if (valor < min) return 'abaixo'
    return 'acima'
  }

  const getStatusColor = (status: 'ideal' | 'abaixo' | 'acima') => {
    switch (status) {
      case 'ideal':
        return {
          bg: 'bg-success/5',
          border: 'border-success/30',
          text: 'text-success',
          progressBg: 'bg-success/10',
          progressFill: 'bg-success/50',
          iconBg: 'bg-success/10',
          iconColor: 'text-success',
          statusText: 'Ideal ✓',
          statusColor: 'text-success'
        }
      case 'abaixo':
        return {
          bg: 'bg-warning/5',
          border: 'border-warning/30',
          text: 'text-warning',
          progressBg: 'bg-warning/10',
          progressFill: 'bg-warning/50',
          iconBg: 'bg-warning/10',
          iconColor: 'text-warning',
          statusText: 'Abaixo da faixa ↓',
          statusColor: 'text-warning'
        }
      case 'acima':
        return {
          bg: 'bg-destructive/10',
          border: 'border-destructive/30',
          text: 'text-destructive',
          progressBg: 'bg-destructive/10',
          progressFill: 'bg-destructive',
          iconBg: 'bg-destructive/10',
          iconColor: 'text-destructive',
          statusText: 'Acima da faixa ↑',
          statusColor: 'text-destructive'
        }
    }
  }

  const indicadores = [
    {
      chave: "fixas",
      nome: "Despesas Fixas",
      icone: Home,
      valor: pctFixas,
      unidade: "%",
      min: 20,
      max: 35,
      tooltip: "Ideal: entre 20% e 35% do faturamento",
      getStatus: (v: number) => getStatusType(v, 20, 35),
    },
    {
      chave: "variaveis",
      nome: "Despesas Variáveis",
      icone: TrendingDown,
      valor: despesasVariaveisPct,
      unidade: "%",
      min: 5,
      max: 20,
      tooltip: "Ideal: entre 5% e 20% do faturamento",
      getStatus: (v: number) => getStatusType(v, 5, 20),
    },
    {
      chave: "cmv",
      nome: "CMV",
      icone: Factory,
      valor: cmv,
      unidade: "%",
      min: 30,
      max: 40,
      tooltip: "Ideal: entre 30% e 40% do faturamento",
      getStatus: (v: number) => getStatusType(v, 30, 40),
    }
  ]


  const indicadoresIdeais = indicadores.filter(i => i.getStatus(i.valor ?? 0) === 'ideal').length

  const getSaudeFinanceira = () => {
    if (indicadoresIdeais >= 3) return { icon: "🟢", text: "Excelente!", color: "text-success", bg: "bg-success/5" }
    if (indicadoresIdeais >= 2) return { icon: "🟡", text: "Boa", color: "text-warning", bg: "bg-warning/5" }
    if (indicadoresIdeais >= 1) return { icon: "🟠", text: "Atenção!", color: "text-warning", bg: "bg-warning/5" }
    return { icon: "🔴", text: "Crítico!", color: "text-destructive", bg: "bg-destructive/5" }
  }

  const saude = getSaudeFinanceira()

  return (
    <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
      <div className="bg-surface-2 p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-white text-sm">Indicadores Financeiros</h3>
        </div>
      </div>
      <div className="p-3">
        <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-2 lg:grid-cols-4">
          {indicadores.map((ind) => {
            const valor = ind.valor ?? 0
            const status = ind.getStatus(valor)
            const colors = getStatusColor(status)
            const Icon = ind.icone
            const alerta = alertaPorIndicador.get(ind.chave)
            const percentual = Math.min(100, Math.max(0, ((valor - ind.min) / (ind.max - ind.min)) * 100))
            const displayValue = ind.valor == null ? "—" : ind.valor.toFixed(1)

            return (
              <div
                key={ind.nome}
                className={`rounded-lg border ${colors.border} ${colors.bg} p-2 shadow-sm hover:shadow-md transition-all cursor-help min-h-[112px]`}
                title={alerta ? `${alerta.titulo} — ${alerta.descricao}` : ind.tooltip}
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className={`p-1 rounded-md ${colors.iconBg}`}>
                      <Icon className={`h-3 w-3 ${colors.iconColor}`} />
                    </div>
                    <h6 className="font-semibold text-white text-[10px] sm:text-xs leading-tight">{ind.nome}</h6>
                  </div>
                  {alerta && (
                    <AlertTriangle
                      className={`h-3 w-3 shrink-0 ${alerta.severidade === "CRITICO" ? "text-destructive" : alerta.severidade === "ATENCAO" ? "text-warning" : "text-primary"}`}
                      aria-label={alerta.titulo}
                    />
                  )}
                </div>
                <div className="my-2 text-center">
                  <span className={`text-xl sm:text-2xl font-bold ${colors.text}`}>{displayValue}</span>
                  <span className="text-muted-foreground ml-0.5 text-[10px] sm:text-xs">{ind.unidade}</span>
                </div>
                
                {/* Custom Progress Bar */}
                <div className={`w-full ${colors.progressBg} rounded-full h-1.5 overflow-hidden`}>
                  <div 
                    className={`${colors.progressFill} h-full rounded-full transition-all duration-300`}
                    style={{ width: `${percentual}%` }}
                  />
                </div>
                
                <div className="mt-1.5 flex justify-between text-xs">
                  <span className="text-muted-foreground text-[10px]">Min: {ind.min}{ind.unidade}</span>
                  <span className={`font-medium text-[10px] ${colors.statusColor}`}>
                    {colors.statusText}
                  </span>
                  <span className="text-muted-foreground text-[10px]">Max: {ind.max}{ind.unidade}</span>
                </div>
              </div>
            )
          })}

          {/* Resumo da Saúde Financeira */}
          <div className={`rounded-lg ${saude.bg} p-2 shadow-sm min-h-[112px]`}>
            <h6 className="mb-2 font-semibold text-white flex items-center gap-1.5 text-xs">
              <Activity className="h-3 w-3" />
              Resumo
            </h6>
            <div className="text-center">
              <div className="text-3xl">{saude.icon}</div>
              <div className={`mt-1 font-bold text-sm ${saude.color}`}>{saude.text}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {indicadoresIdeais}/3 ideais
              </div>
            </div>
          </div>
        </div>

        {/* Legenda */}
        <div className="mt-3 pt-2 border-t border-border flex flex-wrap gap-3 justify-center text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-success/10 border border-success/30"></div>
            <span className="text-muted-foreground">Ideal</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-warning/10 border border-warning/30"></div>
            <span className="text-muted-foreground">Abaixo da faixa</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-destructive/10 border border-destructive/30"></div>
            <span className="text-muted-foreground">Acima da faixa</span>
          </div>
        </div>
      </div>
    </div>
  )
}