// src/app/(dashboard)/planejamento/components/TabelaAcompanhamento.tsx
"use client"

import { Progress } from "@/components/ui/progress"
import { formatCurrency } from "@/lib/utils"
import { BarChart3, TrendingUp, TrendingDown } from "lucide-react"

interface MetaMensal {
  mes: number
  metaDiariaAlmoco: number
  metaDiariaJanta: number
  diasTrabalhados: number
  lucroDesejado: number
}

interface Acompanhamento {
  mes: number
  faturamentoAlmoco: number
  faturamentoJanta: number
  faturamentoTotal: number
}

interface TabelaAcompanhamentoProps {
  metas: MetaMensal[]
  acompanhamentos: Acompanhamento[]
}

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

export function TabelaAcompanhamento({ metas, acompanhamentos }: TabelaAcompanhamentoProps) {
  let totalMetaAlmoco = 0
  let totalMetaJanta = 0
  let totalRealAlmoco = 0
  let totalRealJanta = 0

  for (let i = 1; i <= 12; i++) {
    const meta = metas.find(m => m.mes === i) || { metaDiariaAlmoco: 0, metaDiariaJanta: 0, diasTrabalhados: 26 }
    const acompanhamento = acompanhamentos.find(a => a.mes === i) || { faturamentoAlmoco: 0, faturamentoJanta: 0, faturamentoTotal: 0 }
    
    totalMetaAlmoco += meta.metaDiariaAlmoco * meta.diasTrabalhados
    totalMetaJanta += meta.metaDiariaJanta * meta.diasTrabalhados
    totalRealAlmoco += acompanhamento.faturamentoAlmoco
    totalRealJanta += acompanhamento.faturamentoJanta
  }

  const totalMetaGeral = totalMetaAlmoco + totalMetaJanta
  const totalRealGeral = totalRealAlmoco + totalRealJanta
  const percentualGeral = totalMetaGeral > 0 ? (totalRealGeral / totalMetaGeral) * 100 : 0

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="bg-gray-50 p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-[#de4838]" />
          <h3 className="font-semibold text-gray-800">Acompanhamento Mensal - Real vs Meta</h3>
        </div>
      </div>
      <div className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="border-b border-gray-200">
                <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mês</th>
                <th colSpan={2} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-x border-gray-200">Almoço</th>
                <th colSpan={2} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-x border-gray-200">Janta</th>
                <th colSpan={2} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-x border-gray-200">Total</th>
              </tr>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Meta</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Real</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Meta</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Real</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Meta</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Real</th>
              </tr>
            </thead>
            <tbody>
              {MESES.map((mes, idx) => {
                const mesNum = idx + 1
                const meta = metas.find(m => m.mes === mesNum) || { metaDiariaAlmoco: 0, metaDiariaJanta: 0, diasTrabalhados: 26 }
                const acompanhamento = acompanhamentos.find(a => a.mes === mesNum) || { faturamentoAlmoco: 0, faturamentoJanta: 0, faturamentoTotal: 0 }
                
                const metaAlmoco = meta.metaDiariaAlmoco * meta.diasTrabalhados
                const metaJanta = meta.metaDiariaJanta * meta.diasTrabalhados
                const metaTotal = metaAlmoco + metaJanta
                
                const realAlmoco = acompanhamento.faturamentoAlmoco
                const realJanta = acompanhamento.faturamentoJanta
                const realTotal = acompanhamento.faturamentoTotal
                
                let rowClass = ""
                let statusIcon = null
                if (realTotal >= metaTotal) {
                  rowClass = "bg-emerald-50"
                  statusIcon = <TrendingUp className="h-3 w-3 text-emerald-600" />
                } else if (realTotal >= metaTotal * 0.8) {
                  rowClass = "bg-amber-50"
                  statusIcon = <TrendingUp className="h-3 w-3 text-amber-600" />
                } else if (realTotal > 0) {
                  rowClass = "bg-red-50"
                  statusIcon = <TrendingDown className="h-3 w-3 text-red-600" />
                }
                
                return (
                  <tr key={idx} className={`border-b border-gray-100 ${rowClass}`}>
                    <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {statusIcon}
                        {mes}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-600">{formatCurrency(metaAlmoco)}</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-700">{formatCurrency(realAlmoco)}</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-600">{formatCurrency(metaJanta)}</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-700">{formatCurrency(realJanta)}</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-600">{formatCurrency(metaTotal)}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-gray-800">{formatCurrency(realTotal)}</td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot className="border-t-2 border-gray-200 bg-gray-50">
              <tr className="font-semibold">
                <td className="px-4 py-3 text-gray-800">TOTAL ANUAL</td>
                <td className="px-4 py-3 text-right text-gray-800">{formatCurrency(totalMetaAlmoco)}</td>
                <td className="px-4 py-3 text-right text-gray-800">{formatCurrency(totalRealAlmoco)}</td>
                <td className="px-4 py-3 text-right text-gray-800">{formatCurrency(totalMetaJanta)}</td>
                <td className="px-4 py-3 text-right text-gray-800">{formatCurrency(totalRealJanta)}</td>
                <td className="px-4 py-3 text-right text-gray-800">{formatCurrency(totalMetaGeral)}</td>
                <td className="px-4 py-3 text-right text-[#de4838] text-lg">{formatCurrency(totalRealGeral)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Progresso da Meta Geral */}
        <div className="p-5 border-t border-gray-100">
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-gray-600">🎯 Progresso da Meta Anual</span>
            <span className="font-medium text-gray-700">{percentualGeral.toFixed(0)}%</span>
          </div>
          <Progress value={percentualGeral} className="h-3" />
          <div className="mt-4">
            <div className={`rounded-xl p-3 text-center text-sm ${percentualGeral >= 100 ? 'bg-emerald-100 text-emerald-700' : percentualGeral >= 80 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
              {percentualGeral >= 100 
                ? "🎉 Meta Anual Alcançada! Parabéns!" 
                : percentualGeral >= 80 
                ? "📈 Próximo da meta! Continue assim!"
                : "⚠️ Atenção! Faturamento abaixo da meta anual"}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}