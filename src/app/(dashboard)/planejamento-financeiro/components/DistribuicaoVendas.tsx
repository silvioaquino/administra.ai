'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info } from 'lucide-react'

interface DistribuicaoVendasProps {
  debito: number
  credito: number
  voucher: number
  onSalvar: (dados: { debito: number; credito: number; voucher: number }) => void
}

export function DistribuicaoVendas({ debito, credito, voucher, onSalvar }: DistribuicaoVendasProps) {
  const [d, setD] = useState(debito || 0)
  const [c, setC] = useState(credito || 0)
  const [v, setV] = useState(voucher || 0)

  useEffect(() => {
    setD(debito || 0)
    setC(credito || 0)
    setV(voucher || 0)
  }, [debito, credito, voucher])

  const total = d + c + v

  const handleSave = () => {
    if (total !== 100) {
      alert('A distribuição deve somar 100%')
      return
    }
    onSalvar({ debito: d, credito: c, voucher: v })
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <h4 className="font-semibold text-gray-800 mb-4">Distribuição de Vendas</h4>

      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label className="text-xs text-gray-500 mb-1">Débito (%)</Label>
            <Input
              type="number"
              value={d || ''}
              onChange={e => setD(parseFloat(e.target.value) || 0)}
              className="text-right font-mono text-lg font-bold"
              step="0.01"
              min="0"
              max="100"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500 mb-1">Crédito (%)</Label>
            <Input
              type="number"
              value={c || ''}
              onChange={e => setC(parseFloat(e.target.value) || 0)}
              className="text-right font-mono text-lg font-bold"
              step="0.01"
              min="0"
              max="100"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500 mb-1">Voucher (%)</Label>
            <Input
              type="number"
              value={v || ''}
              onChange={e => setV(parseFloat(e.target.value) || 0)}
              className="text-right font-mono text-lg font-bold"
              step="0.01"
              min="0"
              max="100"
            />
          </div>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
          <span className="text-sm font-medium text-gray-700">Total:</span>
          <span className={`font-bold text-lg ${total === 100 ? 'text-green-600' : 'text-red-600'}`}>
            {total.toFixed(2)}%
          </span>
        </div>

        {total !== 100 && (
          <Alert className="border-red-200 bg-red-50">
            <Info className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              A distribuição deve somar exatamente 100%
            </AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleSave}
          disabled={total !== 100}
          className="w-full bg-[#de4838] hover:bg-[#c73d2e] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Salvar Distribuição
        </Button>
      </div>
    </div>
  )
}