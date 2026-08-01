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
    if (ficha.margem >= margemMinima) return { bg: "bg-success/50", text: "Boa" }
    return { bg: "bg-destructive/50", text: "Atenção" }
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
    <div className="group bg-surface rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden relative">
      {/* Badge de margem */}
      <div className={`absolute top-0 right-0 ${margemStatus.bg} text-white px-3 py-1 rounded-bl-xl text-xs font-medium`}>
        {margemStatus.text} • {formatPercentage(ficha.margem)}
      </div>

      {/* Topo com gradiente */}
      <div className="bg-gradient-to-r from-[#de4838]/10 to-transparent h-1" />

      <div className="p-5">
        {/* Header */}
        <div className="mb-4 pr-24">
          <h3 className="font-semibold text-white text-lg leading-tight">{ficha.nome}</h3>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="bg-amber-300 text-muted-foreground border-0 text-xs">
              {ficha.categoria}
            </Badge>
            <Badge variant="outline" className="bg-surface-2 text-muted-foreground border-0 text-xs">
              {ficha.rendimentoPorcoes} porções
            </Badge>
          </div>
        </div>

        {/* Preços */}
        <div className="mb-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Preço de Venda:</span>
            <span className="font-bold text-success">{formatCurrency(ficha.precoVenda)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Custo Total:</span>
            <span className="font-medium text-destructive">{formatCurrency(ficha.custoTotal)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Custo por Porção:</span>
            <span className="text-white">{formatCurrency(ficha.custoPorPorcao)}</span>
          </div>
        </div>

        {/* Barra de margem */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Margem</span>
            <span className="font-medium">{formatPercentage(ficha.margem)}</span>
          </div>
          <Progress value={Math.min(ficha.margem, 100)} className="h-2" />
        </div>

        {/* Atualização */}
        <div className="mb-4 flex items-center gap-1 text-xs text-muted-foreground/70">
          <Calendar className="h-3 w-3" />
          <span>Última atualização: {dataAtualizacao}</span>
        </div>

        {/* Ações */}
        <div className="flex gap-2 pt-2 border-t border-border">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 rounded-lg border-border hover:border-primary hover:bg-primary/5"
            onClick={onEdit}
          >
            <Edit className="mr-2 h-3 w-3" />
            Editar
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 rounded-lg border-border hover:border-red-500 hover:bg-destructive/5 text-muted-foreground hover:text-destructive"
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