'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Plus, Trash2, PauseCircle, PlayCircle } from 'lucide-react'

interface Maquininha {
  id?: string
  nome: string
  taxaDebito: number
  taxaCredito: number
  aluguel: number
  ativo: boolean
  ordem?: number
}

interface MaquininhasConfigProps {
  maquininhas: Maquininha[]
  onSalvar: (maquininhas: Maquininha[]) => void
}

export function MaquininhasConfig({ maquininhas, onSalvar }: MaquininhasConfigProps) {
  const [lista, setLista] = useState<Maquininha[]>([])

  useEffect(() => {
    if (maquininhas && maquininhas.length > 0) {
      setLista(maquininhas.map(m => ({ ...m })))
    } else {
      setLista([{ nome: '', taxaDebito: 0, taxaCredito: 0, aluguel: 0, ativo: true }])
    }
  }, [maquininhas])

  const adicionarMaquininha = () => {
    const novaMaquininha = {
      nome: `Maquininha ${lista.length + 1}`,
      taxaDebito: 0,
      taxaCredito: 0,
      aluguel: 0,
      ativo: true
    }
    setLista([...lista, novaMaquininha])
  }

  const removerMaquininha = (index: number) => {
    setLista(lista.filter((_, i) => i !== index))
  }

  const atualizarMaquininha = (index: number, campo: keyof Maquininha, valor: any) => {
    setLista(lista.map((m, i) =>
      i === index ? { ...m, [campo]: valor } : m
    ))
  }

  const toggleAtivo = (index: number) => {
    setLista(lista.map((m, i) =>
      i === index ? { ...m, ativo: !m.ativo } : m
    ))
  }

  const salvarDados = () => {
    onSalvar(lista.filter(m => m.nome.trim() !== ''))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-800">Maquininhas</h4>
        <Button
          variant="outline"
          size="sm"
          onClick={adicionarMaquininha}
          className="rounded-lg border-gray-200 hover:border-[#de4838] hover:cursor-pointer transition-all"
        >
          <Plus className="h-4 w-4 mr-1" />
          Adicionar
        </Button>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {lista.map((maq, index) => (
          <Card key={index} className="border border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <Input
                  type="text"
                  value={maq.nome}
                  onChange={e => atualizarMaquininha(index, 'nome', e.target.value)}
                  className="text-sm font-medium flex-1"
                  placeholder="Nome da maquininha"
                />
                <div className="flex items-center gap-2 ml-2">
                  <Switch
                    checked={maq.ativo}
                    onCheckedChange={() => toggleAtivo(index)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removerMaquininha(index)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-500">Taxa Débito (%)</Label>
                  <Input
                    type="number"
                    value={maq.taxaDebito || ''}
                    onChange={e => atualizarMaquininha(index, 'taxaDebito', parseFloat(e.target.value) || 0)}
                    className="text-right font-mono"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Taxa Crédito (%)</Label>
                  <Input
                    type="number"
                    value={maq.taxaCredito || ''}
                    onChange={e => atualizarMaquininha(index, 'taxaCredito', parseFloat(e.target.value) || 0)}
                    className="text-right font-mono"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-gray-500">Aluguel (R$)</Label>
                  <Input
                    type="number"
                    value={maq.aluguel || ''}
                    onChange={e => atualizarMaquininha(index, 'aluguel', parseFloat(e.target.value) || 0)}
                    className="text-right font-mono"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button
        onClick={salvarDados}
        className="bg-[#de4838] hover:bg-[#c73d2e] text-white rounded-full px-4 py-2 mt-4"
      >
        Salvar Maquininhas
      </Button>
    </div>
  )
}