// src/app/(dashboard)/fichas-tecnicas/components/AnaliseFinanceira.tsx
"use client"

import { AlertCircle, TrendingUp, TrendingDown, DollarSign } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { formatCurrency, formatPercentage } from "@/lib/utils"

interface AnaliseFinanceiraProps {
  precoVenda: number
  custoTotal: number
  custoPorPorcao: number
  rendimentoPorcoes: number
  despesasFixasPercentual: number
  despesasVariaveisPercentual: number
  onPrecoChange?: (value: number) => void
  readOnly?: boolean
}

export function AnaliseFinanceira({
  precoVenda,
  custoTotal,
  custoPorPorcao,
  rendimentoPorcoes,
  despesasFixasPercentual,
  despesasVariaveisPercentual,
  onPrecoChange,
  readOnly = false
}: AnaliseFinanceiraProps) {
  const despesasFixasValor = (precoVenda * despesasFixasPercentual) / 100
  const despesasVariaveisValor = (precoVenda * despesasVariaveisPercentual) / 100
  const lucro = precoVenda - custoPorPorcao - despesasFixasValor - despesasVariaveisValor
  const margem = precoVenda > 0 ? (lucro / precoVenda) * 100 : 0

  const precoSugerido = custoPorPorcao / (1 - (despesasFixasPercentual + despesasVariaveisPercentual + 20) / 100)

  const percentualCusto = precoVenda > 0 ? (custoPorPorcao / precoVenda) * 100 : 0
  const percentualFixas = despesasFixasPercentual
  const percentualVariaveis = despesasVariaveisPercentual
  const percentualLucro = Math.max(0, margem)

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Preço de Venda Praticado (R$)</label>
            {readOnly ? (
              <div className="mt-1 text-2xl font-bold text-[#de4838]">{formatCurrency(precoVenda)}</div>
            ) : (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">R$</span>
                <input
                  type="number"
                  step="0.01"
                  value={precoVenda}
                  onChange={(e) => onPrecoChange?.(parseFloat(e.target.value))}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 pl-8 text-sm focus:outline-none focus:ring-2 focus:ring-[#de4838]"
                  required
                />
              </div>
            )}
          </div>
          <div className="rounded-xl bg-blue-50 p-4">
            <p className="text-sm font-medium text-blue-700 mb-1">Preço Sugerido</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(precoSugerido)}</p>
            <p className="text-xs text-blue-600 mt-1">
              Baseado em custo + 20% de lucro + {despesasFixasPercentual + despesasVariaveisPercentual}% de despesas
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Custo Total da Ficha:</span>
            <span className="font-medium text-gray-700">{formatCurrency(custoTotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Rendimento:</span>
            <span className="font-medium text-gray-700">{rendimentoPorcoes} porções</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Custo por Porção:</span>
            <span className="font-medium text-gray-700">{formatCurrency(custoPorPorcao)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Despesas Fixas ({formatPercentage(despesasFixasPercentual)}):</span>
            <span className="text-gray-700">{formatCurrency(despesasFixasValor)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Despesas Variáveis ({formatPercentage(despesasVariaveisPercentual)}):</span>
            <span className="text-gray-700">{formatCurrency(despesasVariaveisValor)}</span>
          </div>
          <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
            <span className="font-semibold text-gray-700">Lucro:</span>
            <span className={`font-bold ${lucro >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatCurrency(lucro)} ({formatPercentage(margem)})
            </span>
          </div>
        </div>
      </div>

      {/* Barra de Composição */}
      <div className="space-y-2">
        <div className="flex h-8 rounded-lg overflow-hidden">
          <div 
            className="bg-red-500 flex items-center justify-center text-xs text-white font-medium"
            style={{ width: `${Math.min(100, percentualCusto)}%` }}
          >
            {percentualCusto > 8 ? `Custo ${formatPercentage(percentualCusto)}` : ''}
          </div>
          <div 
            className="bg-blue-500 flex items-center justify-center text-xs text-white font-medium"
            style={{ width: `${percentualFixas}%` }}
          >
            {percentualFixas > 8 ? `Fixas ${formatPercentage(percentualFixas)}` : ''}
          </div>
          <div 
            className="bg-amber-500 flex items-center justify-center text-xs text-white font-medium"
            style={{ width: `${percentualVariaveis}%` }}
          >
            {percentualVariaveis > 8 ? `Variáveis ${formatPercentage(percentualVariaveis)}` : ''}
          </div>
          <div 
            className="bg-emerald-500 flex items-center justify-center text-xs text-white font-medium"
            style={{ width: `${percentualLucro}%` }}
          >
            {percentualLucro > 8 ? `Lucro ${formatPercentage(percentualLucro)}` : ''}
          </div>
        </div>

        <div className="flex justify-between text-xs text-gray-400">
          <span>Custo</span>
          <span>Despesas Fixas</span>
          <span>Despesas Variáveis</span>
          <span>Lucro</span>
        </div>
      </div>

      {margem < 30 && margem > 0 && (
        <Alert className="bg-amber-50 border-amber-200 rounded-xl">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-sm text-amber-700">
            Margem de lucro está baixa ({formatPercentage(margem)}). 
            Considere aumentar o preço de venda ou reduzir custos.
          </AlertDescription>
        </Alert>
      )}

      {margem >= 50 && (
        <Alert className="bg-emerald-50 border-emerald-200 rounded-xl">
          <AlertCircle className="h-4 w-4 text-emerald-600" />
          <AlertDescription className="text-sm text-emerald-700">
            Excelente! Margem de lucro de {formatPercentage(margem)}. Continue assim!
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}