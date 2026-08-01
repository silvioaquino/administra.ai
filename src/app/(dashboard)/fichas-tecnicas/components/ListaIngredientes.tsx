// src/app/(dashboard)/fichas-tecnicas/components/ListaIngredientes.tsx
"use client"

import { Trash2, Package, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"

interface Ingrediente {
  id: string
  produtoId: number
  nome: string
  quantidade: number
  unidade: string
  valorUnitario: number
  custo: number
  isProdutoAcabado: boolean
}

interface ListaIngredientesProps {
  ingredientes: Ingrediente[]
  onRemove: (id: string) => void
  readOnly?: boolean
}

export function ListaIngredientes({ ingredientes, onRemove, readOnly = false }: ListaIngredientesProps) {
  const custoTotal = ingredientes.reduce((sum, i) => sum + i.custo, 0)

  if (ingredientes.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface-2 p-8 text-center">
        <Package className="h-8 w-8 text-muted-foreground/70 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground/70">Nenhum ingrediente adicionado</p>
        <p className="text-xs text-muted-foreground/70 mt-1">Adicione produtos ou fichas técnicas</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-surface-2 border-b border-border">
          <tr className="border-b border-border">
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Ingrediente</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Quantidade</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Valor Unitário</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Custo</th>
            {!readOnly && <th className="px-4 py-3 text-center w-10"></th>}
          </tr>
        </thead>
        <tbody>
          {ingredientes.map((ing) => (
            <tr key={ing.id} className="border-b border-border hover:bg-surface-2 transition-colors">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {ing.isProdutoAcabado ? (
                    <BookOpen className="h-3 w-3 text-info" />
                  ) : (
                    <Package className="h-3 w-3 text-primary" />
                  )}
                  <span className="text-white">{ing.nome}</span>
                  {ing.isProdutoAcabado && (
                    <span className="inline-flex rounded-full bg-info/10 px-2 py-0.5 text-xs font-medium text-info">
                      Ficha
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                {ing.quantidade.toFixed(3)} {ing.unidade}
              </td>
              <td className="px-4 py-3 text-right font-mono text-muted-foreground">{formatCurrency(ing.valorUnitario)}</td>
              <td className="px-4 py-3 text-right font-mono font-medium text-white">{formatCurrency(ing.custo)}</td>
              {!readOnly && (
                <td className="px-4 py-3 text-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(ing.id)}
                    className="h-8 w-8 p-0 rounded-lg hover:bg-destructive/5"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t-2 border-border bg-surface-2">
          <tr className="font-semibold">
            <td colSpan={3} className="px-4 py-3 text-right text-white">Custo Total:</td>
            <td className="px-4 py-3 text-right text-primary text-lg">{formatCurrency(custoTotal)}</td>
            {!readOnly && <td className="px-4 py-3"></td>}
          </tr>
        </tfoot>
      </table>
    </div>
  )
}