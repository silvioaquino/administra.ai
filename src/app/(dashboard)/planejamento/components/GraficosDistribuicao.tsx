// src/app/(dashboard)/planejamento/components/GraficosDistribuicao.tsx
"use client"

import { useEffect, useRef } from "react"
import { formatPercentage } from "@/lib/utils"
import Chart from "chart.js/auto"
import { PieChart } from "lucide-react"

interface GraficosDistribuicaoProps {
  tipo: "almoco" | "janta"
  pctFixas: number
  despesasVariaveisPct: number
  lucroDesejado: number
  cmv: number | null
}

export function GraficosDistribuicao({
  tipo,
  pctFixas,
  despesasVariaveisPct,
  lucroDesejado,
  cmv,
}: GraficosDistribuicaoProps) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)

  useEffect(() => {
    if (!chartRef.current) return
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    chartInstance.current = new Chart(chartRef.current, {
      type: "doughnut",
      data: {
        labels: ["Despesas Fixas", "Despesas Variáveis", "Lucro", "CMV (Produção)"],
        datasets: [{
          data: [pctFixas, despesasVariaveisPct, lucroDesejado, Math.max(0, cmv ?? 0)],
          backgroundColor: ["#de4838", "#f59e0b", "#10b981", "#3b82f6"],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: "60%",
        plugins: {
          legend: {
            position: "bottom",
            labels: { font: { size: 10 }, boxWidth: 10 }
          }
        },
        layout: {
          padding: 10
        }
      }
    })

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [pctFixas, despesasVariaveisPct, lucroDesejado, cmv])

  const cmvTexto = cmv == null ? "—" : formatPercentage(cmv)

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="bg-gray-100 p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <PieChart className="h-5 w-5 text-[#de4838]" />
          <h3 className="font-semibold text-gray-800">Distribuição % - {tipo === "almoco" ? "Almoço" : "Janta"}</h3>
        </div>
      </div>
      <div className="p-5">
        <div className="relative aspect-square max-w-md mx-auto">
          <canvas ref={chartRef} />
        </div>
        <div className="mt-5 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">📊 Despesas Fixas:</span>
            <span className="font-bold text-[#de4838]">{formatPercentage(pctFixas)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">📈 Despesas Variáveis:</span>
            <span className="font-bold text-amber-600">{formatPercentage(despesasVariaveisPct)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">💰 Lucro:</span>
            <span className="font-bold text-emerald-600">{formatPercentage(lucroDesejado)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">🏭 CMV (Produção):</span>
            <span className="font-bold text-blue-600">{cmvTexto}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
