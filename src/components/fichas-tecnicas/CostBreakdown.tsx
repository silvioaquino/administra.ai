'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle } from 'lucide-react'

interface ItemCost {
  itemId: string
  productName: string
  quantity: number
  unitUsed: string
  packagesUsed: number
  cost: number
  isFractional: boolean
  fractionalAlert?: string
  formatted: {
    grams: string
    packages: string
    cost: string
  }
}

interface CostBreakdownProps {
  items: ItemCost[]
  totalCost: number
  costPerPortion: number
  rendimento: number
}

export function CostBreakdown({ items, totalCost, costPerPortion, rendimento }: CostBreakdownProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalhamento de Custos</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead>Quantidade</TableHead>
              <TableHead>Consumo</TableHead>
              <TableHead>Custo</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.itemId}>
                <TableCell className="font-medium">
                  {item.productName}
                </TableCell>
                <TableCell>
                  {item.quantity} {item.unitUsed}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {item.formatted.packages}
                </TableCell>
                <TableCell className="font-medium">
                  {item.formatted.cost}
                </TableCell>
                <TableCell>
                  {item.isFractional ? (
                    <Badge variant="warning" className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Fracionado
                    </Badge>
                  ) : (
                    <Badge variant="success">Exato</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="mt-6 grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Custo Total</div>
              <div className="text-2xl font-bold">
                R$ {totalCost.toFixed(2)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Custo por Porção</div>
              <div className="text-2xl font-bold">
                R$ {costPerPortion.toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground">
                {rendimento} porções
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Margem</div>
              <div className="text-2xl font-bold text-green-600">
                -%
              </div>
              <div className="text-xs text-muted-foreground">
                Calcule com preço de venda
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  )
}
