// src/app/(dashboard)/planejamento/components/DespesasVariaveisTable.tsx
"use client"

import { Button } from "@/components/ui/button"
import { formatCurrency, formatPercentage } from "@/lib/utils"
import { Settings, TrendingUp } from "lucide-react"

interface DespesasVariaveisTableProps {
  percentual: number
  metaMensalTotal: number
  title: string
  onEdit: () => void
}

export function DespesasVariaveisTable({ percentual, metaMensalTotal, title, onEdit }: DespesasVariaveisTableProps) {
  const impactoMensal = metaMensalTotal * (percentual / 100)

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="bg-gray-50 p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">📈</span>
            <h3 className="font-semibold text-gray-800">{title}</h3>
          </div>
          <Button 
            variant="outline"
            size="sm" 
            onClick={onEdit}
            className="rounded-lg border-gray-200 hover:border-[#de4838] hover:cursor-pointer transition-all"
          >
            <Settings className="mr-1 h-3 w-3" />
            Configurar
          </Button>
        </div>
      </div>
      <div className="p-5 space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
          <span className="text-sm text-gray-500">Percentual total:</span>
          <span className="font-bold text-orange-600">{formatPercentage(percentual)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Impacto mensal:</span>
          <span className="font-bold text-[#de4838] text-lg">{formatCurrency(impactoMensal)}</span>
        </div>
        <div className="rounded-lg bg-blue-50 p-3 text-center">
          <p className="text-xs text-blue-600">
            *Baseado em faturamento de {formatCurrency(metaMensalTotal)}/mês
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full rounded-lg border-gray-200 hover:border-[#de4838] hover:bg-[#de4838]/5 hover:cursor-pointer transition-all"
          onClick={onEdit}
        >
          <TrendingUp className="mr-2 h-3 w-3" />
          Editar / Configurar Taxas
        </Button>
      </div>
    </div>
  )
}