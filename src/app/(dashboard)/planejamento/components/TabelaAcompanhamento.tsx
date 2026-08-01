// src/app/(dashboard)/planejamento/components/TabelaAcompanhamento.tsx
"use client"

import React from "react"
import { Progress } from "@/components/ui/progress"
import { formatCurrency } from "@/lib/utils"
import { BarChart3, TrendingUp, TrendingDown, Sun, Moon } from "lucide-react"

export interface MetaFaturamentoPeriodo {
  cafe?: number
  almoco?: number
  janta?: number
  turnoUnico?: number
}

export interface MetaFaturamentoRow {
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
  faturamentoCafe?: number
  faturamentoTurnoUnico?: number
}

interface TabelaAcompanhamentoProps {
  metas: MetaFaturamentoRow[]
  acompanhamentos: Acompanhamento[]
  periodosSelecionados?: string[]
  abaAtiva?: string
}

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

// Percentuais padrão para cada período
const PERCENTUAIS_PADRAO: Record<string, number> = {
  almoco: 73,
  janta: 27,
  cafe: 0,
  turnoUnico: 100
}

export function TabelaAcompanhamento({ metas, acompanhamentos, periodosSelecionados = ['turnoUnico'], abaAtiva = 'turnoUnico' }: TabelaAcompanhamentoProps) {
  // Função para obter ícone do período
  const getIcon = (periodo: string) => {
    if (periodo === 'almoco') return <Sun className="h-3 w-3" />
    if (periodo === 'janta') return <Moon className="h-3 w-3" />
    return <Sun className="h-3 w-3" />
  }

  // Função para obter label do período
  const getLabel = (periodo: string) => {
    const labels: Record<string, string> = {
      almoco: 'Almoço',
      janta: 'Janta',
      cafe: 'Café',
      turnoUnico: 'Total'
    }
    return labels[periodo] || periodo
  }

  // Calcular totais dinamicamente baseado na aba ativa
  let totalMeta = 0
  let totalReal = 0

  for (let i = 1; i <= 12; i++) {
    const meta = metas.find(m => m.mes === i)
    const acompanhamento = acompanhamentos.find(a => a.mes === i)

    // Valores com fallback para 0
    const periodosMeta = meta?.periodos || { almoco: 0, janta: 0, cafe: 0, turnoUnico: 0 }
    const diasTrab = meta?.diasTrabalhados || 26

    // Calcular baseado no tipo da aba ativa
    const metaPorPeriodo: Record<string, number> = {
      almoco: (periodosMeta.almoco || 0) * diasTrab,
      janta: (periodosMeta.janta || 0) * diasTrab,
      cafe: (periodosMeta.cafe || 0) * diasTrab,
      turnoUnico: (periodosMeta.turnoUnico || 0) * diasTrab
    }

    const realPorPeriodo: Record<string, number> = {
      almoco: acompanhamento?.faturamentoAlmoco || 0,
      janta: acompanhamento?.faturamentoJanta || 0,
      cafe: acompanhamento?.faturamentoCafe || 0,
      turnoUnico: acompanhamento?.faturamentoTurnoUnico || acompanhamento?.faturamentoTotal || 0
    }

    totalMeta += metaPorPeriodo[abaAtiva]
    totalReal += realPorPeriodo[abaAtiva]
  }

  const percentualGeral = totalMeta > 0 ? (totalReal / totalMeta) * 100 : 0

  return (
    <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
      <div className="bg-surface-2 p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-white">Acompanhamento Mensal - Real vs Meta</h3>
          </div>
          {/* Abas dinâmicas para o período */}
          <div className="flex gap-1">
            {periodosSelecionados.map((periodo) => (
              <span
                key={periodo}
                className={`flex items-center gap-1 px-2 py-1 text-xs rounded ${
                  abaAtiva === periodo
                    ? 'bg-primary text-white'
                    : 'bg-surface-2 text-muted-foreground'
                }`}
              >
                {getIcon(periodo)}
                {getLabel(periodo)} ({PERCENTUAIS_PADRAO[periodo] || 100}%)
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 border-b border-border">
            <tr>
              <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Mês</th>
              {periodosSelecionados.map((periodo) => (
                <th key={periodo} colSpan={2} className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider border-x border-border">
                  {getLabel(periodo)}
                </th>
              ))}
              {/* Coluna de espaçamento no final - header (linha 1) */}
              <th rowSpan={2} className="bg-surface-2 w-18"></th>
            </tr>
            <tr className="bg-surface-2">
              {periodosSelecionados.map((periodo) => (
                <React.Fragment key={periodo}>
                  <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Meta</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Real</th>
                </React.Fragment>
              ))}
              {/* Coluna de espaçamento no final - header (linha 2) */}
              <th className="bg-surface-2"></th>
            </tr>
          </thead>
          <tbody>
            {MESES.map((mes, idx) => {
              const mesNum = idx + 1
              const meta = metas.find(m => m.mes === mesNum)
              const acompanhamento = acompanhamentos.find(a => a.mes === mesNum)

              const periodosMeta = meta?.periodos || { almoco: 0, janta: 0, cafe: 0, turnoUnico: 0 }
              const diasTrab = meta?.diasTrabalhados || 26

              const metaPorPeriodo: Record<string, number> = {
                almoco: (periodosMeta.almoco || 0) * diasTrab,
                janta: (periodosMeta.janta || 0) * diasTrab,
                cafe: (periodosMeta.cafe || 0) * diasTrab,
                turnoUnico: (periodosMeta.turnoUnico || 0) * diasTrab
              }

              const realPorPeriodo: Record<string, number> = {
                almoco: acompanhamento?.faturamentoAlmoco || 0,
                janta: acompanhamento?.faturamentoJanta || 0,
                cafe: acompanhamento?.faturamentoCafe || 0,
                turnoUnico: acompanhamento?.faturamentoTurnoUnico || acompanhamento?.faturamentoTotal || 0
              }

              // Calcular total da linha baseado nos períodos selecionados
              const totalLinhaMeta = periodosSelecionados.reduce((sum, p) => sum + (metaPorPeriodo[p] || 0), 0)
              const totalLinhaReal = periodosSelecionados.reduce((sum, p) => sum + (realPorPeriodo[p] || 0), 0)

              let rowClass = ""
              let statusIcon = null
              if (totalLinhaReal >= totalLinhaMeta) {
                rowClass = "bg-success/5"
                statusIcon = <TrendingUp className="h-3 w-3 text-success" />
              } else if (totalLinhaReal >= totalLinhaMeta * 0.8) {
                rowClass = "bg-warning/5"
                statusIcon = <TrendingUp className="h-3 w-3 text-warning" />
              } else if (totalLinhaReal > 0) {
                rowClass = "bg-destructive/5"
                statusIcon = <TrendingDown className="h-3 w-3 text-destructive" />
              }

              return (
                <tr key={idx} className={`border-b border-border ${rowClass}`}>
                  <td className="px-4 py-3 font-medium text-white whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {statusIcon}
                      {mes}
                    </div>
                  </td>
                  {periodosSelecionados.map((periodo) => (
                    <React.Fragment key={periodo}>
                      <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                        {formatCurrency(metaPorPeriodo[periodo] || 0)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-white">
                        {formatCurrency(realPorPeriodo[periodo] || 0)}
                      </td>
                    </React.Fragment>
                  ))}
                  {/* Coluna de espaçamento no final - body - usa a cor da linha */}
                  <td className={`border-b border-border ${rowClass} w-18`}></td>
                </tr>
              )
            })}
          </tbody>
          <tfoot className="border-t-2 border-border bg-surface-2">
            <tr className="font-semibold">
              <td className="px-4 py-3 text-white pr-8">TOTAL ANUAL ({getLabel(abaAtiva)})</td>
              {periodosSelecionados.map((periodo) => {
                const totalMetaPeriodo = metas.reduce((sum, m) => sum + ((m.periodos?.[periodo as keyof typeof m.periodos] || 0) * m.diasTrabalhados), 0)
                const totalRealPeriodo = acompanhamentos.reduce((sum, a) => {
                  if (periodo === 'almoco') return sum + (a.faturamentoAlmoco || 0)
                  if (periodo === 'janta') return sum + (a.faturamentoJanta || 0)
                  if (periodo === 'cafe') return sum + (a.faturamentoCafe || 0)
                  return sum + (a.faturamentoTurnoUnico || a.faturamentoTotal || 0)
                }, 0)
                return (
                  <React.Fragment key={periodo}>
                    <td className="px-4 py-3 text-right text-white">
                      {formatCurrency(totalMetaPeriodo)}
                    </td>
                    <td className="px-4 py-3 text-right text-white">
                      {formatCurrency(totalRealPeriodo)}
                    </td>
                  </React.Fragment>
                )
              })}
              {/* Coluna de espaçamento no final - footer */}
              <td className="bg-surface-2 w-12"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Progresso da Meta do Período Ativo */}
      <div className="p-5 border-t border-border">
        <div className="mb-2 flex justify-between text-sm">
          <span className="text-muted-foreground">🎯 Progresso da Meta Anual ({getLabel(abaAtiva)})</span>
          <span className="font-medium text-white">{percentualGeral.toFixed(0)}%</span>
        </div>
        <Progress value={percentualGeral} className="h-3" />
        <div className="mt-4">
          <div className={`rounded-xl p-3 text-center text-sm ${percentualGeral >= 100 ? 'bg-success/10 text-success' : percentualGeral >= 80 ? 'bg-warning/10 text-warning' : 'bg-destructive/10 text-destructive'}`}>
            {percentualGeral >= 100
              ? "🎉 Meta Anual Alcançada! Parabéns!"
              : percentualGeral >= 80
              ? "📈 Próximo da meta! Continue assim!"
              : "⚠️ Atenção! Faturamento abaixo da meta anual"}
          </div>
        </div>
      </div>
    </div>
  )
}