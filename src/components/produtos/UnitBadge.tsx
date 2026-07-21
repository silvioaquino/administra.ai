'use client'

import { Badge } from '@/components/ui/badge'

interface UnitBadgeProps {
  unit: string
  quantity?: number
}

export function UnitBadge({ unit, quantity }: UnitBadgeProps) {
  const label = quantity ? `${quantity}${unit}` : unit
  return <Badge variant="outline">{label}</Badge>
}
