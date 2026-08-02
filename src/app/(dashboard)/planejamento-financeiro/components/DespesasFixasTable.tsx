'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils'
import { Settings, Plus, Trash2 } from 'lucide-react'

interface DespesaFixa {
  id?: number
  nome: string
  valor: number
  status?: string
  dataVencimento?: string
  dataPagamento?: string
  contaFinanceira?: string
}

interface Maquininha {
  aluguel: number
  ativo: boolean
}

interface DespesasFixasTableProps {
  dados: DespesaFixa[]
  metaTotal: number
  onSalvar: (despesas: DespesaFixa[], ano: number, mes?: number) => void
  ano: number
  mes?: number
  maquininhas?: Maquininha[]
}

export function DespesasFixasTable({ dados, metaTotal, onSalvar, ano, mes, maquininhas }: DespesasFixasTableProps) {
  const [despesas, setDespesas] = useState<DespesaFixa[]>([])
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (dados && dados.length > 0) {
      setDespesas(dados)
    }
  }, [dados])

  const adicionarLinha = () => {
    setDespesas(prev => [...prev, { nome: '', valor: 0 }])
  }

  const removerLinha = (index: number) => {
    setDespesas(prev => prev.filter((_, i) => i !== index))
  }

  const atualizarDespesa = (index: number, campo: 'nome' | 'valor', valor: string | number) => {
    setDespesas(prev => prev.map((d, i) =>
      i === index ? { ...d, [campo]: valor } : d
    ))
  }

  const salvarDados = async () => {
    setSalvando(true)
    try {
      await onSalvar(despesas, ano, mes)
    } finally {
      setSalvando(false)
    }
  }

  // Calcular aluguel total das maquininhas ativas
  const aluguelTotal = useMemo(() => {
    return (maquininhas || [])
      .filter((m: Maquininha) => m.ativo)
      .reduce((sum: number, m: Maquininha) => sum + (m.aluguel || 0), 0)
  }, [maquininhas])

  const totalDespesas = despesas.reduce((sum, d) => sum + (d.valor || 0), 0) + aluguelTotal
  const pctDespesasFixas = metaTotal > 0 ? Math.min((totalDespesas / metaTotal) * 100, 10000) : 0

  return (
    <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
      <div className="bg-surface-2 p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">💰</span>
            <h3 className="font-semibold text-white">Despesas Fixas</h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={adicionarLinha}
            className="rounded-lg border-border hover:border-primary hover:cursor-pointer transition-all"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Despesa</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Valor (R$)</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">% da Fatia</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody>
            {despesas.map((desp, index) => {
              const valor = desp.valor || 0
              const pctFatia = metaTotal > 0 ? (valor / metaTotal) * 100 : 0

              return (
                <tr key={index} className="border-b border-border hover:bg-surface-2 transition-colors">
                  <td className="px-4 py-3">
                    <Input
                      type="text"
                      value={desp.nome}
                      onChange={e => atualizarDespesa(index, 'nome', e.target.value)}
                      className="text-sm font-medium text-white"
                      placeholder="Nome da despesa"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      type="number"
                      value={valor || ''}
                      onChange={e => atualizarDespesa(index, 'valor', parseFloat(e.target.value) || 0)}
                      className="text-right text-sm font-mono text-white"
                      placeholder="0,00"
                    />
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                    {pctFatia.toFixed(2)}%
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removerLinha(index)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/5 rounded-full"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              )
            })}

            {/* Linha de Aluguel das Maquininhas (somente leitura) */}
            {aluguelTotal > 0 && (
              <tr className="border-b border-border bg-info/5 hover:bg-info/5 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 text-info font-medium">
                    <span className="text-lg">🏪</span>
                    <span>Aluguel Maquininhas</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-mono text-info font-semibold">
                  {formatCurrency(aluguelTotal)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-info">
                  {metaTotal > 0 ? ((aluguelTotal / metaTotal) * 100).toFixed(2) : '0.00'}%
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-xs text-info bg-info/10 px-2 py-1 rounded-full">Automático</span>
                </td>
              </tr>
            )}
          </tbody>
          <tfoot className="border-t border-border bg-surface-2">
            <tr className="font-semibold">
              <td className="px-4 py-3 text-white">TOTAL</td>
              <td className="px-4 py-3 text-right text-white">{formatCurrency(totalDespesas)}</td>
              <td className="px-4 py-3 text-right text-primary font-bold">{pctDespesasFixas.toFixed(2)}%</td>
              <td className="px-4 py-3 text-center"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="p-4 border-t border-border flex justify-end">
        <Button
          onClick={salvarDados}
          disabled={salvando}
          className="bg-primary hover:bg-primary/90 text-white rounded-full px-4 py-2 hover:cursor-pointer transition-all"
        >
          <Settings className="mr-2 h-4 w-4" />
          {salvando ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </div>
  )
}