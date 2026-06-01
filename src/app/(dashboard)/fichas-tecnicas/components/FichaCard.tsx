// src/app/(dashboard)/fichas-tecnicas/components/FichaCard.tsx
"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Edit, Trash2, TrendingUp, TrendingDown, AlertCircle, Calendar, DollarSign, Package } from "lucide-react"
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
  ingredientes: string | any[] | object // CORREÇÃO: Aceitar diferentes tipos
  modoPreparo: string
  updatedAt: string
}

interface FichaCardProps {
  ficha: FichaTecnica
  onEdit: () => void
  onRefresh: () => void
}

export function FichaCard({ ficha, onEdit, onRefresh }: FichaCardProps) {
  const [deleting, setDeleting] = useState(false)

  const getMargemClass = () => {
    if (ficha.margem >= 50) return { bg: "bg-emerald-500", text: "Excelente" }
    if (ficha.margem >= 30) return { bg: "bg-amber-500", text: "Boa" }
    return { bg: "bg-red-500", text: "Atenção" }
  }

  const margemStatus = getMargemClass()

  // Função segura para obter o preview dos ingredientes
  const getIngredientesPreview = () => {
    if (!ficha.ingredientes) return ""
    
    // Se for string, tenta fazer parse
    if (typeof ficha.ingredientes === 'string') {
      try {
        const ingredientes = JSON.parse(ficha.ingredientes)
        if (Array.isArray(ingredientes) && ingredientes.length > 0) {
          const preview = ingredientes.slice(0, 2).map((i: any) => i.nome).join(", ")
          if (ingredientes.length > 2) return `${preview} +${ingredientes.length - 2}`
          return preview
        }
        return ficha.ingredientes.substring(0, 60)
      } catch (e) {
        return ficha.ingredientes.substring(0, 60)
      }
    }
    
    // Se for array
    if (Array.isArray(ficha.ingredientes)) {
      if (ficha.ingredientes.length === 0) return ""
      const preview = ficha.ingredientes.slice(0, 2).map((i: any) => i.nome).join(", ")
      if (ficha.ingredientes.length > 2) return `${preview} +${ficha.ingredientes.length - 2}`
      return preview
    }
    
    // Se for objeto
    if (typeof ficha.ingredientes === 'object') {
      try {
        const str = JSON.stringify(ficha.ingredientes)
        return str.substring(0, 60)
      } catch {
        return ""
      }
    }
    
    return ""
  }

  const ingredientesPreview = getIngredientesPreview()

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
          <h3 className="font-semibold text-gray-800 text-lg leading-tight line-clamp-1">{ficha.nome}</h3>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="bg-gray-100 text-gray-600 border-0 text-xs">
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

        {/* Ingredientes preview */}
        {ingredientesPreview && (
          <div className="mb-4 text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
            <span className="font-medium text-gray-600">Ingredientes:</span> {ingredientesPreview}
          </div>
        )}

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