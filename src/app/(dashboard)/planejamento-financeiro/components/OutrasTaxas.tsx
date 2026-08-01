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
    <div className="bg-surface rounded-2xl shadow-sm p-5">
      <h4 className="font-semibold text-white mb-4">Outras Taxas</h4>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground mb-1">Taxa Voucher (%)</Label>
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
            <Label className="text-xs text-muted-foreground mb-1">Simples Nacional (%)</Label>
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
          <Label className="text-xs text-muted-foreground mb-1">Manutenção (%)</Label>
          <Input
            type="number"
            value={m || ''}
            onChange={e => setM(parseFloat(e.target.value) || 0)}
            className="text-right font-mono text-lg font-bold"
            step="0.01"
            min="0"
          />
        </div>

        <div className="pt-2 border-t border-border">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">Faturamento Total:</span>
            <span className="font-bold text-white">{new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(faturamentoTotal)}</span>
          </div>
        </div>

        <Button
          onClick={salvarDados}
          className="w-full bg-primary hover:bg-primary/90 text-white rounded-lg"
        >
          Salvar Outras Taxas
        </Button>
      </div>
    </div>
  )
}