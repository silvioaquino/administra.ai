'use client'

import { HelpCircle } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface ConversionTooltipProps {
  message?: string
  className?: string
}

export function ConversionTooltip({
  message = 'A unidade usada na receita pode ser diferente da unidade de compra. O custo é calculado convertendo tudo para gramas.',
  className,
}: ConversionTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            className={`inline-flex items-center text-muted-foreground hover:text-muted-foreground ${className || ''}`}
            aria-label="Ajuda sobre conversão de unidades"
          />
        }
      >
        <HelpCircle className="h-4 w-4" />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs">
        {message}
      </TooltipContent>
    </Tooltip>
  )
}
