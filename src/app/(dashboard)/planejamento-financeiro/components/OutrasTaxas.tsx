'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface OutrasTaxasProps {
  voucher: number
  simplesNacional: number
  manutencao: number
  faturamentoTotal: number
  onSalvar: (dados: { voucher: number; simplesNacional: number; manutencao: number }) => void
}

export function OutrasTaxas({
  voucher,
  simplesNacional,
  manutencao,
  faturamentoTotal,
  onSalvar
}: OutrasTaxasProps) {
  const [v, setV] = useState(voucher || 0)
  const [sn, setSn] = useState(simplesNacional || 0)
  const [m, setM] = useState(manutencao || 0)

  useEffect(() => {
    setV(voucher || 0)
    setSn(simplesNacional || 0)
    setM(manutencao || 0)
  }, [voucher, simplesNacional, manutencao])

  const salvarDados = () => {
    onSalvar({ voucher: v, simplesNacional: sn, manutencao: m })
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <h4 className="font-semibold text-gray-800 mb-4">Outras Taxas</h4>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-gray-500 mb-1">Taxa Voucher (%)</Label>
            <Input
              type="number"
              value={v || ''}
              onChange={e => setV(parseFloat(e.target.value) || 0)}
              className="text-right font-mono text-lg font-bold"
              step="0.01"
              min="0"
              placeholder="7.0"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500 mb-1">Simples Nacional (%)</Label>
            <Input
              type="number"
              value={sn || ''}
              onChange={e => setSn(parseFloat(e.target.value) || 0)}
              className="text-right font-mono text-lg font-bold"
              step="0.01"
              min="0"
            />
          </div>
        </div>

        <div>
          <Label className="text-xs text-gray-500 mb-1">Manutenção (%)</Label>
          <Input
            type="number"
            value={m || ''}
            onChange={e => setM(parseFloat(e.target.value) || 0)}
            className="text-right font-mono text-lg font-bold"
            step="0.01"
            min="0"
          />
        </div>

        <div className="pt-2 border-t border-gray-100">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-500">Faturamento Total:</span>
            <span className="font-bold text-gray-700">{new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(faturamentoTotal)}</span>
          </div>
        </div>

        <Button
          onClick={salvarDados}
          className="w-full bg-[#de4838] hover:bg-[#c73d2e] text-white rounded-lg"
        >
          Salvar Outras Taxas
        </Button>
      </div>
    </div>
  )
}