'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils'
import { Save, Plus, Trash2, Loader2 } from 'lucide-react'

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

// Percentuais padrão para cada período
const PERCENTUAIS_PADRAO: Record<string, number> = {
  almoco: 73,
  janta: 27,
  cafe: 0,
  turnoUnico: 100
}

interface DespesasFixasTableProps {
  dados: DespesaFixa[]
  metaTotal: number
  onSalvar: (despesas: DespesaFixa[], ano: number, mes?: number, percentualPeriodo?: number) => void
  ano: number
  mes?: number
  maquininhas?: Maquininha[]
  periodoAtual?: string
  percentualPeriodoSalvo?: number | null
  totalSalarios?: number
}

export function DespesasFixasTable({
  dados,
  metaTotal,
  onSalvar,
  ano,
  mes,
  maquininhas,
  periodoAtual = 'almoco',
  percentualPeriodoSalvo,
  totalSalarios
}: DespesasFixasTableProps) {
  const [despesas, setDespesas] = useState<DespesaFixa[]>([])
  const [salvando, setSalvando] = useState(false)
  const justSavedRef = useRef(false)

  // Estado para o percentual do período - sempre sincronizado com a prop
  const [percentualPeriodo, setPercentualPeriodo] = useState<number>(PERCENTUAIS_PADRAO[periodoAtual] || 100)

  // Sincronizar dados do banco com estado local
  useEffect(() => {
    if (!justSavedRef.current) {
      setDespesas(Array.isArray(dados) ? dados : [])
    }
    justSavedRef.current = false
  }, [dados])

  // Sincronizar percentual com a prop (quando carrega do banco ou muda de aba)
  useEffect(() => {
    // Usar percentualPeriodoSalvo se disponível, senão usar padrão
    if (percentualPeriodoSalvo !== undefined && percentualPeriodoSalvo !== null) {
      setPercentualPeriodo(percentualPeriodoSalvo)
    } else {
      setPercentualPeriodo(PERCENTUAIS_PADRAO[periodoAtual] ?? 100)
    }
  }, [periodoAtual, percentualPeriodoSalvo])

  const salvarDados = async () => {
    setSalvando(true)
    try {
      await onSalvar(despesas, ano, mes, percentualPeriodo)
      justSavedRef.current = true
    } finally {
      setSalvando(false)
    }
  }

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

  // Calcular aluguel total das maquininhas ativas
  const aluguelTotal = useMemo(() => {
    return (maquininhas || [])
      .filter((m: Maquininha) => m.ativo)
      .reduce((sum: number, m: Maquininha) => sum + (m.aluguel || 0), 0)
  }, [maquininhas])

  const totalDespesas = despesas.reduce((sum, d) => sum + (d.valor || 0), 0) + aluguelTotal + (totalSalarios || 0)
  const pctDespesasFixas = metaTotal > 0 ? Math.min((totalDespesas / metaTotal) * 100, 10000) : 0

  return (
    <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
      <div className="bg-surface-2 p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">💰</span>
            <h3 className="font-semibold text-white">Despesas Fixas</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium text-muted-foreground">Percentual:</span>
              <Input
                type="number"
                value={percentualPeriodo}
                onChange={e => setPercentualPeriodo(parseFloat(e.target.value) || 0)}
                className="w-16 h-7 text-right text-xs font-mono"
                min="0"
                max="100"
                step="1"
              />
              <span className="text-xs font-medium text-muted-foreground">%</span>
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
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Despesa</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Valor (R$)</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Valor Pago (R$)</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">% da Fatia</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody>
            {despesas.map((desp, index) => {
              const valor = desp.valor || 0
              const pctFatia = metaTotal > 0 ? (valor / metaTotal) * 100 : 0
              const valorPago = (valor * percentualPeriodo) / 100

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
                    {formatCurrency(valorPago)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                    {pctFatia.toFixed(2)}%
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removerLinha(index)}
                      disabled={despesas.length <= 1}
                      className="text-destructive hover:text-destructive hover:bg-destructive/5 rounded-full"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              )
            })}

            {/* Linha de Total de Salários (somente leitura) */}
            {totalSalarios !== undefined && totalSalarios > 0 && (
              <tr className="border-b border-border bg-green-50 hover:bg-green-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 text-green-800 font-medium">
                    <span className="text-lg">👥</span>
                    <span>Total Salários</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-mono text-green-800 font-semibold">
                  {formatCurrency(totalSalarios)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-success">
                  {formatCurrency(totalSalarios * percentualPeriodo / 100)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-success">
                  {metaTotal > 0 ? ((totalSalarios / metaTotal) * 100).toFixed(2) : '0.00'}%
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-xs text-green-500 bg-success/10 px-2 py-1 rounded-full">Automático</span>
                </td>
              </tr>
            )}
            {/* Linha de Aluguel das Maquininhas (somente leitura) */}
            {aluguelTotal > 0 && (
              <tr className="border-b border-border bg-info/5 hover:bg-info/5 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 text-blue-800 font-medium">
                    <span className="text-lg">🏪</span>
                    <span>Aluguel Maquininhas</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-mono text-blue-800 font-semibold">
                  {formatCurrency(aluguelTotal)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-info">
                  {formatCurrency(aluguelTotal * percentualPeriodo / 100)}
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
              <td className="px-4 py-3 text-right text-white">{formatCurrency(totalDespesas * percentualPeriodo / 100)}</td>
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
          {salvando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {salvando ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </div>
  )
}