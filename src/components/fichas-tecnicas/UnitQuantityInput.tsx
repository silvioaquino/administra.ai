'use client'

import { useState, useEffect } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { ConversionService } from '@/lib/services/conversion.service'
import { UnitType } from '@/types/ficha-tecnica'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info, AlertTriangle } from 'lucide-react'

const UNITS: UnitType[] = ['G', 'KG', 'MG', 'L', 'ML', 'UN']

interface UnitQuantityInputProps {
  value: {
    quantity: number
    unit: UnitType
  }
  onChange: (value: { quantity: number; unit: UnitType }) => void
  product?: {
    id: number
    descricao: string
    unidade: string
    quantidade: number
    valorUnitario: number
    pesoUnitario?: number
    densidade?: number
  }
  disabled?: boolean
  showConversion?: boolean
}

export function UnitQuantityInput({
  value,
  onChange,
  product,
  disabled = false,
  showConversion = true
}: UnitQuantityInputProps) {
  const [quantity, setQuantity] = useState(value.quantity || 0)
  const [unit, setUnit] = useState<UnitType>(value.unit || 'UN')
  const [conversion, setConversion] = useState('')
  const [alert, setAlert] = useState('')

  const debouncedQuantity = useDebounce(quantity, 300)

  // Calcular conversão quando quantidade ou unidade mudar
  useEffect(() => {
    if (!product || !debouncedQuantity || debouncedQuantity <= 0) {
      setConversion('')
      setAlert('')
      return
    }

    try {
      const result = ConversionService.calculateConsumption(
        debouncedQuantity,
        unit,
        {
          purchaseUnit: (product.unidade as UnitType) || 'UN',
          unitPrice: Number(product.valorUnitario) || 0,
          pesoUnitario: product.pesoUnitario ? Number(product.pesoUnitario) : undefined,
          densidade: product.densidade ? Number(product.densidade) : undefined,
        }
      )

      setConversion(
        `${debouncedQuantity} ${unit} = ${result.formatted.grams} ` +
        `(${result.formatted.packages})`
      )

      if (result.isFractional && result.fractionalAlert) {
        setAlert(result.fractionalAlert)
      } else {
        setAlert('')
      }

      // Notificar mudança
      onChange({ quantity: debouncedQuantity, unit })
    } catch (error) {
      setConversion('')
      setAlert(error instanceof Error ? error.message : 'Erro na conversão')
    }
  }, [debouncedQuantity, unit, product, onChange])

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value)
    setQuantity(isNaN(val) ? 0 : val)
  }

  const handleUnitChange = (newUnit: string | null) => {
    if (!newUnit) return
    setUnit(newUnit as UnitType)
  }

  // Validar unidade UN
  const isUnitInvalid = unit === 'UN' && product && !product.pesoUnitario

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            type="number"
            step="0.001"
            min="0"
            value={quantity || ''}
            onChange={handleQuantityChange}
            disabled={disabled}
            placeholder="Quantidade"
            className="w-full"
          />
        </div>
        <div className="w-32">
          <Select
            value={unit}
            onValueChange={handleUnitChange}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Unidade" />
            </SelectTrigger>
            <SelectContent>
              {UNITS.map((u) => (
                <SelectItem key={u} value={u}>
                  {u}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {showConversion && conversion && (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <Info className="h-4 w-4" />
          <span>{conversion}</span>
        </div>
      )}

      {alert && (
        <Alert variant="warning" className="py-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {alert}
          </AlertDescription>
        </Alert>
      )}

      {isUnitInvalid && (
        <Alert variant="destructive" className="py-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Produto em UN precisa ter peso unitário definido
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
