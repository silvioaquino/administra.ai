// src/app/(dashboard)/planejamento/components/TabelaMetasMensais.tsx
"use client"

import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { Target, Settings } from "lucide-react"

interface MetaMensal {
  mes: number
  metaDiariaAlmoco: number
  metaDiariaJanta: number
  diasTrabalhados: number
  lucroDesejado: number
}

interface Acompanhamento {
  mes: number
  faturamentoTotal: number
}

interface TabelaMetasMensaisProps {
  metas: MetaMensal[]
  acompanhamentos: Acompanhamento[]
  onEdit: () => void
}

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

export function TabelaMetasMensais({ metas, acompanhamentos, onEdit }: TabelaMetasMensaisProps) {
  const totais = metas.reduce((acc, meta) => {
    const metaAlmoco = meta.metaDiariaAlmoco * meta.diasTrabalhados
    const metaJanta = meta.metaDiariaJanta * meta.diasTrabalhados
    return {
      almoco: acc.almoco + metaAlmoco,
      janta: acc.janta + metaJanta,
      geral: acc.geral + metaAlmoco + metaJanta
    }
  }, { almoco: 0, janta: 0, geral: 0 })

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="bg-gray-50 p-4 border-b border-gray-100">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-[#de4838]" />
            <h3 className="font-semibold text-gray-800">Metas de Faturamento por Mês</h3>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onEdit}
            className="rounded-lg border-gray-200 hover:border-[#de4838] hover:bg-[#de4838]/5"
          >
            <Settings className="mr-1 h-3 w-3" />
            Editar Metas
          </Button>
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
                <th rowSpan={2} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Meta Mensal</th>
              </tr>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Meta Diária</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Meta Mensal</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Meta Diária</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Meta Mensal</th>
              </tr>
            </thead>
            <tbody>
              {MESES.map((mes, idx) => {
                const meta = metas.find(m => m.mes === idx + 1) || {
                  metaDiariaAlmoco: 0,
                  metaDiariaJanta: 0,
                  diasTrabalhados: 26
                }
                const metaMensalAlmoco = meta.metaDiariaAlmoco * meta.diasTrabalhados
                const metaMensalJanta = meta.metaDiariaJanta * meta.diasTrabalhados
                const metaTotal = metaMensalAlmoco + metaMensalJanta
                
                const acompanhamento = acompanhamentos.find(a => a.mes === idx + 1)
                const realizado = acompanhamento?.faturamentoTotal || 0
                
                let rowClass = ""
                if (realizado >= metaTotal) rowClass = "bg-emerald-50"
                else if (realizado >= metaTotal * 0.8) rowClass = "bg-amber-50"
                else if (realizado > 0) rowClass = "bg-red-50"
                
                return (
                  <tr key={idx} className={`border-b border-gray-100 ${rowClass}`}>
                    <td className="px-4 py-3 font-medium text-gray-800">{mes}</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-600">{formatCurrency(meta.metaDiariaAlmoco)}</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-700">{formatCurrency(metaMensalAlmoco)}</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-600">{formatCurrency(meta.metaDiariaJanta)}</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-700">{formatCurrency(metaMensalJanta)}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-[#de4838]">
                      {formatCurrency(metaTotal)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot className="border-t-2 border-gray-200 bg-gray-50">
              <tr className="font-semibold">
                <td className="px-4 py-3 text-gray-800">TOTAL ANUAL</td>
                <td colSpan={2} className="px-4 py-3 text-center text-gray-800">{formatCurrency(totais.almoco)}</td>
                <td colSpan={2} className="px-4 py-3 text-center text-gray-800">{formatCurrency(totais.janta)}</td>
                <td className="px-4 py-3 text-center text-[#de4838] text-lg">{formatCurrency(totais.geral)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}