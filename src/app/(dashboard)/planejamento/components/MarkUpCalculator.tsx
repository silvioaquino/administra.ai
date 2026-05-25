// src/app/(dashboard)/planejamento/components/MarkUpCalculator.tsx
"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { formatCurrency, formatPercentage } from "@/lib/utils"
import { Calculator, TrendingUp, DollarSign, Factory } from "lucide-react"

interface MarkUpCalculatorProps {
  despesasFixasTotal: number
  despesasVariaveisPct: number
  metaMensalTotal: number
  lucroDesejado: number
  markUp: number
  cmv: number
}

export function MarkUpCalculator({
  despesasFixasTotal,
  despesasVariaveisPct,
  metaMensalTotal,
  lucroDesejado: lucroDesejadoInicial,
  markUp: markUpInicial,
  cmv: cmvInicial
}: MarkUpCalculatorProps) {
  const [lucroDesejado, setLucroDesejado] = useState(lucroDesejadoInicial)
  
  const pctFixas = metaMensalTotal > 0 ? (despesasFixasTotal / metaMensalTotal) * 100 : 0
  const cmvCalculado = 100 - (pctFixas + despesasVariaveisPct + lucroDesejado)
  const markUpCalculado = cmvCalculado > 0 ? 100 / cmvCalculado : 0

  function aplicarMarkUp() {
    alert(`Mark-Up de ${markUpCalculado.toFixed(4)} aplicado!\n\nPreço de Venda = Custo do Produto × Mark-Up`)
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Mark-Up e Precificação */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-gray-50 p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-[#de4838]" />
            <h3 className="font-semibold text-gray-800">Mark-Up e Precificação</h3>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Lucro Desejado (%)</label>
            <Input
              type="number"
              step="0.5"
              value={lucroDesejado}
              onChange={(e) => setLucroDesejado(parseFloat(e.target.value))}
              className="mt-1 rounded-lg border-gray-300 focus:ring-[#de4838]"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Mark-Up Calculado</label>
            <div className="mt-1 flex gap-2">
              <Input 
                value={markUpCalculado.toFixed(4)} 
                readOnly 
                className="bg-gray-50 rounded-lg border-gray-200 font-mono"
              />
              <Button 
                onClick={aplicarMarkUp}
                className="bg-[#de4838] hover:bg-[#c73d2e] rounded-lg"
              >
                Aplicar
              </Button>
            </div>
          </div>
          <div className="rounded-lg bg-blue-50 p-3">
            <p className="text-xs text-blue-600">
              Fórmula: Mark-Up = 1 / (100% - (%DespFixas + %DespVariaveis + %Lucro))
            </p>
          </div>
        </div>
      </div>

      {/* Custo Máximo com Produção */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-gray-50 p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Factory className="h-5 w-5 text-[#de4838]" />
            <h3 className="font-semibold text-gray-800">Custo Máximo com Produção (CMV)</h3>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-blue-50 p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">CMV Máximo</p>
              <p className="text-xl font-bold text-blue-600">{formatPercentage(Math.max(0, cmvCalculado))}</p>
              <p className="text-xs text-gray-400 mt-1">= 100% - (Fixas% + Variáveis% + Lucro%)</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">CMV Atual</p>
              <p className="text-xl font-bold text-amber-600">{formatPercentage(cmvInicial)}</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600">CMV</span>
                <span className="font-medium text-blue-600">{formatPercentage(Math.max(0, cmvCalculado))}</span>
              </div>
              <Progress value={Math.max(0, cmvCalculado)} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600">Fixas</span>
                <span className="font-medium text-[#de4838]">{formatPercentage(pctFixas)}</span>
              </div>
              <Progress value={pctFixas} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600">Variáveis</span>
                <span className="font-medium text-amber-600">{formatPercentage(despesasVariaveisPct)}</span>
              </div>
              <Progress value={despesasVariaveisPct} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600">Lucro</span>
                <span className="font-medium text-emerald-600">{formatPercentage(lucroDesejado)}</span>
              </div>
              <Progress value={lucroDesejado} className="h-2" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}