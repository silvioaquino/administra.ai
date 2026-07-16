// src/app/(dashboard)/fichas-tecnicas/components/FichaCard.tsx
"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Edit, Trash2, Calendar } from "lucide-react"
import { formatCurrency, formatPercentage } from "@/lib/utils"

interface FichaTecnica {
  id: string
  nome: string
  categoria: string
  precoVenda: number
  custoTotal: number
  custoPorPorcao: number
  margem: number
  rendimentoPorcoes: number
  modoPreparo: string
  updatedAt: string
}

interface FichaCardProps {
  ficha: FichaTecnica
  margemMinima: number
  onEdit: () => void
  onRefresh: () => void
}

export function FichaCard({ ficha, margemMinima, onEdit, onRefresh }: FichaCardProps) {
  const [deleting, setDeleting] = useState(false)

  // Limite de "Atenção" sincronizado com a margem de lucro desejada no Planejamento.
  // margem < margemMinima => Atenção (vermelho); entre margemMinima e 50 => Boa; >= 50 => Excelente.
  const getMargemClass = () => {
    if (ficha.margem >= 50) return { bg: "bg-lime-400", text: "Excelente" }
    if (ficha.margem >= margemMinima) return { bg: "bg-emerald-500", text: "Boa" }
    return { bg: "bg-red-500", text: "Atenção" }
  }

  const margemStatus = getMargemClass()

  const dataAtualizacao = new Date(ficha.updatedAt).toLocaleDateString("pt-BR")

  async function handleDelete() {
    if (!confirm(`Tem certeza que deseja excluir a ficha "${ficha.nome}"?`)) return
    
    setDeleting(true)
    try {
      const response = await fetch(`/api/fichas-tecnicas/${ficha.id}`, { method: "DELETE" })
      if (response.ok) {
        onRefresh()
      } else {
        alert("Erro ao excluir ficha")
      }
    } catch (error) {
      console.error("Erro:", error)
      alert("Erro ao excluir ficha")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="group bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden relative">
      {/* Badge de margem */}
      <div className={`absolute top-0 right-0 ${margemStatus.bg} text-white px-3 py-1 rounded-bl-xl text-xs font-medium`}>
        {margemStatus.text} • {formatPercentage(ficha.margem)}
      </div>

      {/* Topo com gradiente */}
      <div className="bg-gradient-to-r from-[#de4838]/10 to-transparent h-1" />

      <div className="p-5">
        {/* Header */}
        <div className="mb-4 pr-24">
          <h3 className="font-semibold text-gray-800 text-lg leading-tight">{ficha.nome}</h3>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="bg-amber-300 text-gray-600 border-0 text-xs">
              {ficha.categoria}
            </Badge>
            <Badge variant="outline" className="bg-gray-100 text-gray-600 border-0 text-xs">
              {ficha.rendimentoPorcoes} porções
            </Badge>
          </div>
        </div>

        {/* Preços */}
        <div className="mb-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Preço de Venda:</span>
            <span className="font-bold text-emerald-600">{formatCurrency(ficha.precoVenda)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Custo Total:</span>
            <span className="font-medium text-red-500">{formatCurrency(ficha.custoTotal)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Custo por Porção:</span>
            <span className="text-gray-700">{formatCurrency(ficha.custoPorPorcao)}</span>
          </div>
        </div>

        {/* Barra de margem */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Margem</span>
            <span className="font-medium">{formatPercentage(ficha.margem)}</span>
          </div>
          <Progress value={Math.min(ficha.margem, 100)} className="h-2" />
        </div>

        {/* Atualização */}
        <div className="mb-4 flex items-center gap-1 text-xs text-gray-400">
          <Calendar className="h-3 w-3" />
          <span>Última atualização: {dataAtualizacao}</span>
        </div>

        {/* Ações */}
        <div className="flex gap-2 pt-2 border-t border-gray-100">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 rounded-lg border-gray-200 hover:border-[#de4838] hover:bg-[#de4838]/5"
            onClick={onEdit}
          >
            <Edit className="mr-2 h-3 w-3" />
            Editar
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 rounded-lg border-gray-200 hover:border-red-500 hover:bg-red-50 text-gray-600 hover:text-red-600"
            onClick={handleDelete} 
            disabled={deleting}
          >
            <Trash2 className="mr-2 h-3 w-3" />
            Excluir
          </Button>
        </div>
      </div>
    </div>
  )
}