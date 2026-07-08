'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils'
import { Settings, Plus, Trash2, Loader2 } from 'lucide-react'

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
  onSalvar: (despesas: DespesaFixa[], ano: number, mes?: number) => void
  ano: number
  mes?: number
  maquininhas?: Maquininha[]
  periodoAtual?: string
}

export function DespesasFixasTable({ dados, metaTotal, onSalvar, ano, mes, maquininhas, periodoAtual = 'almoco' }: DespesasFixasTableProps) {
  const [despesas, setDespesas] = useState<DespesaFixa[]>([])
  const [salvando, setSalvando] = useState(false)
  const justSavedRef = useRef(false)

  // Estado para o percentual do período - usa o padrão ou valor customizado
  const [percentualPeriodo, setPercentualPeriodo] = useState(() => {
    // Se não houver período especifico, usa 100% (turno único)
    return PERCENTUAIS_PADRAO[periodoAtual] || 100
  })

  // Sincronizar dados do banco com estado local (apenas após salvar ou quando houver dados)
  useEffect(() => {
    // Atualiza o estado sempre que 'dados' mudar do banco, mas ignora no ciclo imediato após salvar
    // para não sobrescrever as alterações locais antes que a API responda
    if (!justSavedRef.current) {
      setDespesas(Array.isArray(dados) ? dados : [])
    }
    justSavedRef.current = false
  }, [dados])

  // Atualizar percentual quando o período mudar
  useEffect(() => {
    const novoPercentual = PERCENTUAIS_PADRAO[periodoAtual] || 100
    setPercentualPeriodo(novoPercentual)
  }, [periodoAtual])

  const salvarDados = async () => {
    setSalvando(true)
    try {
      await onSalvar(despesas, ano, mes)
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

  const totalDespesas = despesas.reduce((sum, d) => sum + (d.valor || 0), 0) + aluguelTotal
  const pctDespesasFixas = metaTotal > 0 ? Math.min((totalDespesas / metaTotal) * 100, 10000) : 0

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="bg-gray-100 p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">💰</span>
            <h3 className="font-semibold text-gray-800">Despesas Fixas</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium text-gray-600">Percentual:</span>
              <Input
                type="number"
                value={percentualPeriodo}
                onChange={e => setPercentualPeriodo(parseFloat(e.target.value) || 0)}
                className="w-16 h-7 text-right text-xs font-mono"
                min="0"
                max="100"
                step="1"
              />
              <span className="text-xs font-medium text-gray-600">%</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={adicionarLinha}
              className="rounded-lg border-gray-200 hover:border-[#de4838] hover:cursor-pointer transition-all"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Despesa</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor (R$)</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Pago (R$)</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% da Fatia</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody>
            {despesas.map((desp, index) => {
              const valor = desp.valor || 0
              const pctFatia = metaTotal > 0 ? (valor / metaTotal) * 100 : 0
              const valorPago = (valor * percentualPeriodo) / 100

              return (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Input
                      type="text"
                      value={desp.nome}
                      onChange={e => atualizarDespesa(index, 'nome', e.target.value)}
                      className="text-sm font-medium text-gray-700"
                      placeholder="Nome da despesa"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      type="number"
                      value={valor || ''}
                      onChange={e => atualizarDespesa(index, 'valor', parseFloat(e.target.value) || 0)}
                      className="text-right text-sm font-mono text-gray-700"
                      placeholder="0,00"
                    />
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-gray-500">
                    {formatCurrency(valorPago)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-gray-500">
                    {pctFatia.toFixed(2)}%
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removerLinha(index)}
                      disabled={despesas.length <= 1}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              )
            })}

            {/* Linha de Aluguel das Maquininhas (somente leitura) */}
            {aluguelTotal > 0 && (
              <tr className="border-b border-gray-100 bg-blue-50 hover:bg-blue-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 text-blue-800 font-medium">
                    <span className="text-lg">🏪</span>
                    <span>Aluguel Maquininhas</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-mono text-blue-800 font-semibold">
                  {formatCurrency(aluguelTotal)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-blue-600">
                  {formatCurrency(aluguelTotal * percentualPeriodo / 100)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-blue-600">
                  {metaTotal > 0 ? ((aluguelTotal / metaTotal) * 100).toFixed(2) : '0.00'}%
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-xs text-blue-500 bg-blue-100 px-2 py-1 rounded-full">Automático</span>
                </td>
              </tr>
            )}
          </tbody>
          <tfoot className="border-t border-gray-200 bg-gray-100">
            <tr className="font-semibold">
              <td className="px-4 py-3 text-gray-800">TOTAL</td>
              <td className="px-4 py-3 text-right text-gray-800">{formatCurrency(totalDespesas)}</td>
              <td className="px-4 py-3 text-right text-gray-800">{formatCurrency(totalDespesas * percentualPeriodo / 100)}</td>
              <td className="px-4 py-3 text-right text-[#de4838] font-bold">{pctDespesasFixas.toFixed(2)}%</td>
              <td className="px-4 py-3 text-center"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="p-4 border-t border-gray-100 flex justify-end">
        <Button
          onClick={salvarDados}
          disabled={salvando}
          className="bg-[#de4838] hover:bg-[#c73d2e] text-white rounded-full px-4 py-2 hover:cursor-pointer transition-all"
        >
          {salvando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Settings className="mr-2 h-4 w-4" />}
          {salvando ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </div>
  )
}