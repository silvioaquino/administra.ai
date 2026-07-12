// src/app/(dashboard)/planejamento/components/GraficosDistribuicao.tsx
"use client"

import { useEffect, useRef, useState } from "react"
import { formatPercentage } from "@/lib/utils"
import Chart from "chart.js/auto"
import { PieChart, Loader2, AlertCircle } from "lucide-react"

interface GraficosDistribuicaoProps {
  tipo: "almoco" | "janta"
  ano: number
  refreshKey: number
}

interface IndicadoresResumo {
  pctFixas: number
  despesasVariaveisPct: number
  lucroDesejado: number
  cmv: number | null
}

export function GraficosDistribuicao({ tipo, ano, refreshKey }: GraficosDistribuicaoProps) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(false)
  const [dados, setDados] = useState<IndicadoresResumo | null>(null)

  useEffect(() => {
    let cancelado = false

    async function carregar() {
      setLoading(true)
      setErro(false)
      try {
        const response = await fetch(`/api/planejamento/indicadores-resumo?ano=${ano}`)
        const data = await response.json()
        if (cancelado) return

        // Sem fallback: só exibe se a API retornar sucesso com os campos esperados.
        if (!data?.success || data.pctFixas == null) {
          setErro(true)
          setDados(null)
          return
        }

        setDados({
          pctFixas: data.pctFixas,
          despesasVariaveisPct: data.despesasVariaveisPct,
          lucroDesejado: data.lucroDesejado,
          cmv: data.cmv
        })
      } catch {
        if (!cancelado) {
          setErro(true)
          setDados(null)
        }
      } finally {
        if (!cancelado) setLoading(false)
      }
    }

    carregar()
    return () => {
      cancelado = true
    }
  }, [ano, refreshKey])

  useEffect(() => {
    if (!dados || !chartRef.current) return
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    chartInstance.current = new Chart(chartRef.current, {
      type: "doughnut",
      data: {
        labels: ["Despesas Fixas", "Despesas Variáveis", "Lucro", "CMV (Produção)"],
        datasets: [{
          data: [dados.pctFixas, dados.despesasVariaveisPct, dados.lucroDesejado, Math.max(0, dados.cmv ?? 0)],
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
  }, [dados])

  const cmvTexto = dados?.cmv == null ? "—" : formatPercentage(dados.cmv)

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="bg-gray-100 p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <PieChart className="h-5 w-5 text-[#de4838]" />
          <h3 className="font-semibold text-gray-800">Distribuição % - {tipo === "almoco" ? "Almoço" : "Janta"}</h3>
        </div>
      </div>
      <div className="p-5">
        {loading && (
          <div className="flex items-center justify-center gap-2 py-10 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Carregando indicadores…</span>
          </div>
        )}

        {erro && !loading && (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-gray-500">
            <AlertCircle className="h-6 w-6 text-red-500" />
            <span className="text-sm">Não foi possível carregar os indicadores.</span>
          </div>
        )}

        {dados && !loading && !erro && (
          <>
            <div className="relative aspect-square max-w-md mx-auto">
              <canvas ref={chartRef} />
            </div>
            <div className="mt-5 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">📊 Despesas Fixas:</span>
                <span className="font-bold text-[#de4838]">{formatPercentage(dados.pctFixas)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">📈 Despesas Variáveis:</span>
                <span className="font-bold text-amber-600">{formatPercentage(dados.despesasVariaveisPct)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">💰 Lucro:</span>
                <span className="font-bold text-emerald-600">{formatPercentage(dados.lucroDesejado)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">🏭 CMV (Produção):</span>
                <span className="font-bold text-blue-600">{cmvTexto}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
