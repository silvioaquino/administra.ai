// src/app/(dashboard)/planejamento/components/DespesasFixasTable.tsx
"use client"

import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { Settings } from "lucide-react"

interface DespesaFixa {
  nome: string
  valor: number
}

interface ProvisaoItem {
  nome: string
  valor: number
}

interface DespesasFixasTableProps {
  despesas: DespesaFixa[]
  percentual: number
  title: string
  onEdit: () => void
  salariosTotal?: number
  provisoes?: ProvisaoItem[]
}

export function DespesasFixasTable({ despesas, percentual, title, onEdit, salariosTotal = 0, provisoes = [] }: DespesasFixasTableProps) {
  const totalReal = despesas.reduce((sum, d) => sum + d.valor, 0)
  const provisoesTotal = provisoes.reduce((sum, p) => sum + p.valor, 0)
  const folhaTotal = salariosTotal + provisoesTotal
  const totalComFolha = totalReal + folhaTotal
  const totalRateado = totalComFolha * percentual

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden h-full">
      <div className="bg-gray-50 p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">💰</span>
            <h3 className="font-semibold text-gray-800">{title}</h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="rounded-lg border-gray-200 hover:border-[#de4838] hover:cursor-pointer transition-all"
          >
            <Settings className="mr-1 h-3 w-3" />
            Editar
          </Button>
        </div>
      </div>
      <div className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Despesa</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Real (100%)</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {percentual === 0.73 ? "Almoço (73%)" : "Janta (27%)"}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% da Fatia</th>
              </tr>
            </thead>
            <tbody>
              {despesas.map((desp, idx) => {
                const valorRateado = desp.valor * percentual
                const pctDaFatia = totalRateado > 0 ? (valorRateado / totalRateado) * 100 : 0
                return (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-700">{desp.nome}</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-700">{formatCurrency(desp.valor)}</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-700">{formatCurrency(valorRateado)}</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-500">{pctDaFatia.toFixed(2)}%</td>
                  </tr>
                )
              })}
              {/* Linha de salários */}
              {salariosTotal > 0 && (
                <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-700 font-medium">Salários Funcionários</td>
                  <td className="px-4 py-3 text-right font-mono text-gray-700">{formatCurrency(salariosTotal)}</td>
                  <td className="px-4 py-3 text-right font-mono text-gray-700">{formatCurrency(salariosTotal * percentual)}</td>
                  <td className="px-4 py-3 text-right font-mono text-gray-500">{((salariosTotal / totalComFolha) * 100).toFixed(2)}%</td>
                </tr>
              )}
              {/* Cada provisão em linha separada */}
              {provisoes.map((prov, idx) => {
                const valorRateado = prov.valor * percentual
                const pctDaFatia = totalComFolha > 0 ? (prov.valor / totalComFolha) * 100 : 0
                return (
                  <tr key={`prov-${idx}`} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-700 font-medium pl-6">{prov.nome}</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-700">{formatCurrency(prov.valor)}</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-700">{formatCurrency(valorRateado)}</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-500">{pctDaFatia.toFixed(2)}%</td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot className="border-t border-gray-200 bg-gray-50">
              <tr className="font-semibold">
                <td className="px-4 py-3 text-gray-800">TOTAL</td>
                <td className="px-4 py-3 text-right text-gray-800">{formatCurrency(totalComFolha)}</td>
                <td className="px-4 py-3 text-right text-[#de4838] font-bold">{formatCurrency(totalRateado)}</td>
                <td className="px-4 py-3 text-right text-[#de4838] font-bold">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}