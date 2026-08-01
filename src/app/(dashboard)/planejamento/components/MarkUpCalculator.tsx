// src/app/(dashboard)/planejamento/components/MarkUpCalculator.tsx
"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { formatCurrency, formatPercentage } from "@/lib/utils"
import { Calculator, TrendingUp, DollarSign, Factory } from "lucide-react"

interface MarkUpCalculatorProps {
  despesasVariaveisPct: number
  lucroDesejado: number
  markUp: number
  cmv: number
  pctFixas?: number
  metaFaltando?: boolean
  onLucroChange?: (value: number) => void
  onLucroSave?: (value: number) => void
}

export function MarkUpCalculator({
  despesasVariaveisPct,
  lucroDesejado,
  markUp,
  cmv,
  pctFixas: pctFixasProp,
  metaFaltando = false,
  onLucroChange,
  onLucroSave,
}: MarkUpCalculatorProps) {
  // Valores vêm diretamente da API (fonte única de verdade), espelhando o Dashboard.
  const pctFixas = pctFixasProp ?? 0
  const cmvExibido = metaFaltando ? 0 : Math.max(0, cmv)
  const markUpExibido = metaFaltando ? 0 : markUp

  function aplicarMarkUp() {
    alert(`Mark-Up de ${markUpExibido.toFixed(4)} aplicado!\n\nPreço de Venda = Custo do Produto × Mark-Up`)
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Mark-Up e Precificação */}
      <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-surface-2 p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-white">Mark-Up e Precificação</h3>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-sm font-medium text-white">Lucro Desejado (%)</label>
            <Input
              type="number"
              step="0.5"
              value={lucroDesejado}
              onChange={(e) => onLucroChange?.(Number(e.target.value) || 0)}
              onBlur={(e) => onLucroSave?.(Number(e.target.value) || 0)}
              className="mt-1 rounded-lg border-border bg-surface focus:ring-primary"
            />
          </div>
          {metaFaltando && (
            <div className="rounded-lg bg-warning/5 p-3 text-xs text-warning">
              Defina a meta do mês atual (aba Metas Mensais) para visualizar Mark-Up e CMV.
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-white">Mark-Up Calculado</label>
            <div className="mt-1 flex gap-2">
              <Input
                value={markUpExibido.toFixed(4)}
                readOnly
                className="bg-surface-2 rounded-lg border-border font-mono"
              />
              <Button
                onClick={aplicarMarkUp}
                className="bg-primary hover:bg-primary/90 rounded-lg"
              >
                Aplicar
              </Button>
            </div>
          </div>
          <div className="rounded-lg bg-info/5 p-3">
            <p className="text-xs text-info">
              Fórmula: Mark-Up = 1 / (100% - (%DespFixas + %DespVariaveis + %Lucro))
            </p>
          </div>
        </div>
      </div>

      {/* Custo Máximo com Produção */}
      <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-surface-2 p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Factory className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-white">Custo Máximo com Produção (CMV)</h3>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-info/5 p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">CMV Calculado</p>
              <p className="text-xl font-bold text-info">{formatPercentage(cmvExibido)}</p>
              <p className="text-xs text-muted-foreground/70 mt-1">= 100% - (Fixas% + Variáveis% + Lucro%)</p>
            </div>
            <div className="rounded-xl bg-warning/5 p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">CMV Máximo</p>
              <p className="text-xl font-bold text-warning">{formatPercentage(40)}</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Margem Ideal entre 30% e 40%</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">CMV</span>
                <span className="font-medium text-info">{formatPercentage(cmvExibido)}</span>
              </div>
              <Progress value={cmvExibido} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Fixas</span>
                <span className="font-medium text-primary">{formatPercentage(pctFixas)}</span>
              </div>
              <Progress value={pctFixas} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Variáveis</span>
                <span className="font-medium text-warning">{formatPercentage(despesasVariaveisPct)}</span>
              </div>
              <Progress value={despesasVariaveisPct} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Lucro</span>
                <span className="font-medium text-success">{formatPercentage(lucroDesejado)}</span>
              </div>
              <Progress value={lucroDesejado} className="h-2" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
