'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Save } from 'lucide-react'

export type PeriodoRefeicao = 'cafe' | 'almoco' | 'janta' | 'turnoUnico'

export interface MetaFaturamentoPeriodo {
  cafe?: number
  almoco?: number
  janta?: number
  turnoUnico?: number
}

export interface MetaFaturamentoRow {
  mes: number
  periodos: MetaFaturamentoPeriodo
  diasTrabalhados: number
  metaTotal: number
}

export interface PeriodoConfig {
  id: PeriodoRefeicao
  label: string
  shortLabel: string
}

export const PERIODOS_CONFIG: PeriodoConfig[] = [
  { id: 'cafe', label: 'Café da Manhã', shortLabel: 'Café' },
  { id: 'almoco', label: 'Almoço', shortLabel: 'Almoço' },
  { id: 'janta', label: 'Janta', shortLabel: 'Janta' },
  { id: 'turnoUnico', label: 'Turno Único', shortLabel: 'Turno Único' },
]

const meses = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
]

interface TabelaMetasMensaisProps {
  metas: MetaFaturamentoRow[]
  anoAtual: number
  onSalvar: (dados: MetaFaturamentoRow[], ano: number) => void
}

function getInitialPeriodos(): MetaFaturamentoPeriodo {
  return { turnoUnico: 0 }
}

function calculateMetaTotal(periodos: MetaFaturamentoPeriodo, diasTrabalhados: number): number {
  const temTurnoUnico = (periodos.turnoUnico ?? 0) > 0
  const temRefeicoes = (periodos.cafe ?? 0) > 0 || (periodos.almoco ?? 0) > 0 || (periodos.janta ?? 0) > 0

  if (temTurnoUnico && !temRefeicoes) {
    return (periodos.turnoUnico || 0) * diasTrabalhados
  }

  const somaRefeicoes = (periodos.cafe || 0) + (periodos.almoco || 0) + (periodos.janta || 0)
  return somaRefeicoes * diasTrabalhados
}

export function TabelaMetasMensais({ metas, anoAtual, onSalvar }: TabelaMetasMensaisProps) {
  const [linhas, setLinhas] = useState<MetaFaturamentoRow[]>([])
  const [ano] = useState(anoAtual)
  const [periodosSelecionados, setPeriodosSelecionados] = useState<PeriodoRefeicao[]>(['turnoUnico'])
  const [salvando, setSalvando] = useState(false)
  const prevPeriodosRef = useRef<PeriodoRefeicao[]>(['turnoUnico'])

  // Efeito para carregar dados iniciais
  useEffect(() => {
    if (metas && metas.length > 0) {
      const linhasAtualizadas = meses.map(m => {
        const encontrado = metas.find(d => d.mes === m.value)
        if (encontrado) {
          return {
            ...encontrado,
            periodos: encontrado.periodos,
            metaTotal: calculateMetaTotal(encontrado.periodos, encontrado.diasTrabalhados)
          }
        }
        return {
          mes: m.value,
          periodos: getInitialPeriodos(),
          diasTrabalhados: 26,
          metaTotal: 0
        }
      })
      setLinhas(linhasAtualizadas)

      // Detectar períodos ativos dos dados salvos
      const primeiroComDados = metas.find(d =>
        (d.periodos.cafe ?? 0) > 0 ||
        (d.periodos.almoco ?? 0) > 0 ||
        (d.periodos.janta ?? 0) > 0 ||
        (d.periodos.turnoUnico ?? 0) > 0
      )
      if (primeiroComDados) {
        const periodos = primeiroComDados.periodos
        const ativos: PeriodoRefeicao[] = []
        if ((periodos.cafe ?? 0) > 0) ativos.push('cafe')
        if ((periodos.almoco ?? 0) > 0) ativos.push('almoco')
        if ((periodos.janta ?? 0) > 0) ativos.push('janta')
        if ((periodos.turnoUnico ?? 0) > 0 && !ativos.length) ativos.push('turnoUnico')
        setPeriodosSelecionados(ativos.length > 0 ? ativos : ['turnoUnico'])
      }
    } else {
      const linhasIniciais = meses.map(m => ({
        mes: m.value,
        periodos: getInitialPeriodos(),
        diasTrabalhados: 26,
        metaTotal: 0
      }))
      setLinhas(linhasIniciais)
    }
  }, [metas])

  // Limpa valores dos períodos deselecionados
  useEffect(() => {
    const periodosRemovidos = prevPeriodosRef.current.filter(p => !periodosSelecionados.includes(p))
    if (periodosRemovidos.length > 0) {
      setLinhas(linhasAtuais => linhasAtuais.map(linha => {
        const novosPeriodos: MetaFaturamentoPeriodo = { ...linha.periodos }
        periodosRemovidos.forEach((p: PeriodoRefeicao) => {
          novosPeriodos[p] = 0
        })
        return {
          ...linha,
          periodos: novosPeriodos,
          metaTotal: calculateMetaTotal(novosPeriodos, linha.diasTrabalhados)
        }
      }))
    }
    prevPeriodosRef.current = periodosSelecionados
  }, [periodosSelecionados])

  const togglePeriodo = (periodo: PeriodoRefeicao) => {
    setPeriodosSelecionados(prev => {
      const isTurnoUnico = periodo === 'turnoUnico'
      const hasTurnoUnico = prev.includes('turnoUnico')

      let novosPeriodos: PeriodoRefeicao[]

      if (isTurnoUnico) {
        if (hasTurnoUnico) {
          // Remover turno único - se não tiver outros, adicionar uma refeição
          novosPeriodos = prev.filter(p => p !== 'turnoUnico')
          if (novosPeriodos.length === 0) {
            novosPeriodos = ['turnoUnico']
          }
        } else {
          novosPeriodos = ['turnoUnico']
        }
      } else {
        // É uma refeição (cafe, almoco, janta)
        if (hasTurnoUnico) {
          // Se tinha turno único, remover e adicionar a refeição
          novosPeriodos = [periodo]
        } else {
          const hasPeriodo = prev.includes(periodo)
          if (hasPeriodo) {
            novosPeriodos = prev.filter(p => p !== periodo)
            if (novosPeriodos.length === 0) {
              novosPeriodos = ['turnoUnico']
            }
          } else {
            novosPeriodos = [...prev, periodo]
          }
        }
      }

      return novosPeriodos
    })
  }

  const atualizarPeriodo = (mes: number, periodo: PeriodoRefeicao, valor: number) => {
    setLinhas(prev => prev.map(l => {
      if (l.mes === mes) {
        const novosPeriodos = { ...l.periodos, [periodo]: valor }
        let periodosFinais = novosPeriodos
        if (periodo === 'turnoUnico' && valor > 0) {
          periodosFinais = { ...novosPeriodos, cafe: 0, almoco: 0, janta: 0 }
          setPeriodosSelecionados(['turnoUnico'])
        } else if (periodo !== 'turnoUnico' && valor > 0 && (l.periodos.turnoUnico ?? 0) > 0) {
          periodosFinais = { ...novosPeriodos, turnoUnico: 0 }
          setPeriodosSelecionados(sel => sel.filter(p => p !== 'turnoUnico'))
        }

        return {
          ...l,
          periodos: periodosFinais,
          metaTotal: calculateMetaTotal(periodosFinais, l.diasTrabalhados)
        }
      }
      return l
    }))
  }

  const atualizarDiasTrabalhados = (mes: number, valor: number) => {
    setLinhas(prev => prev.map(l => {
      if (l.mes === mes) {
        return {
          ...l,
          diasTrabalhados: valor,
          metaTotal: calculateMetaTotal(l.periodos, valor)
        }
      }
      return l
    }))
  }

  const salvarDados = async () => {
    setSalvando(true)
    try {
      await onSalvar(linhas, ano)
    } finally {
      setSalvando(false)
    }
  }

  const periodosAtivos = useMemo((): PeriodoRefeicao[] => {
    if (periodosSelecionados.includes('turnoUnico') && periodosSelecionados.length === 1) {
      return ['turnoUnico']
    }
    return periodosSelecionados.filter((p): p is PeriodoRefeicao => p !== 'turnoUnico')
  }, [periodosSelecionados])

  const renderHeader = () => (
    <thead className="bg-gray-50 border-b border-gray-200">
      <tr>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mês</th>
        {periodosAtivos.map(p => {
          const config = PERIODOS_CONFIG.find(c => c.id === p)!
          return (
            <th key={p} className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
              Faturamento {config.shortLabel} Dia (R$)
            </th>
          )
        })}
        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
          Dias Trabalhados
        </th>
        <th className="px-4 py-3 text-right text-xs font-medium text-gray-505 uppercase tracking-wider">
          Meta Total (R$)
        </th>
      </tr>
    </thead>
  )

  const renderRow = (linha: MetaFaturamentoRow) => (
    <tr key={linha.mes} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3 text-gray-700 font-medium">
        {meses.find(m => m.value === linha.mes)?.label || linha.mes}
      </td>
      {periodosAtivos.map((p: PeriodoRefeicao) => {
        const config = PERIODOS_CONFIG.find(c => c.id === p)!
        const valor = linha.periodos[p] || 0
        return (
          <td key={p} className="px-4 py-3">
            <Input
              type="number"
              value={valor || ''}
              onChange={e => atualizarPeriodo(linha.mes, p, parseFloat(e.target.value) || 0)}
              className="text-right text-sm font-mono w-28 ml-auto"
              placeholder="0,00"
              step="0.01"
              min="0"
            />
          </td>
        )
      })}
      <td className="px-4 py-3">
        <Input
          type="number"
          value={linha.diasTrabalhados || ''}
          onChange={e => atualizarDiasTrabalhados(linha.mes, parseInt(e.target.value) || 0)}
          className="text-right text-sm font-mono w-16 ml-auto"
          min="1"
          max="31"
        />
      </td>
      <td className="px-4 py-3 text-right font-mono text-gray-800">
        {formatCurrency(linha.metaTotal)}
      </td>
    </tr>
  )

  const renderFooter = () => {
    const totalGeral = linhas.reduce((sum, l) => sum + l.metaTotal, 0)
    const totaisPorPeriodo: Record<PeriodoRefeicao, number> = {
      cafe: 0,
      almoco: 0,
      janta: 0,
      turnoUnico: 0
    }

    linhas.forEach(l => {
      Object.keys(totaisPorPeriodo).forEach(p => {
        totaisPorPeriodo[p as PeriodoRefeicao] += l.periodos[p as PeriodoRefeicao] || 0
      })
    })

    return (
      <tfoot className="border-t border-gray-200 bg-gray-100">
        <tr className="font-semibold">
          <td className="px-4 py-3 text-gray-800">TOTAL</td>
          {periodosAtivos.map((p: PeriodoRefeicao) => (
            <td key={p} className="px-4 py-3 text-right font-mono text-gray-600">
              {formatCurrency(totaisPorPeriodo[p] * (linhas[0]?.diasTrabalhados || 26))}
            </td>
          ))}
          <td className="px-4 py-3 text-right"></td>
          <td className="px-4 py-3 text-right text-[#de4838] font-bold">
            {formatCurrency(totalGeral)}
          </td>
        </tr>
      </tfoot>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="bg-gray-100 p-4 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">💰</span>
            <h3 className="font-semibold text-gray-800">Meta de Faturamento</h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-white rounded-lg p-1 border border-gray-200">
              {PERIODOS_CONFIG.map(config => (
                <Button
                  key={config.id}
                  type="button"
                  variant={periodosSelecionados.includes(config.id) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => togglePeriodo(config.id)}
                  className={`
                    rounded-md text-xs font-medium transition-all min-w-0 px-2 py-1
                    ${periodosSelecionados.includes(config.id)
                      ? 'bg-[#de4838] text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 border-gray-200'
                    }
                  `}
                  disabled={config.id === 'turnoUnico' && periodosSelecionados.length > 1 && !periodosSelecionados.includes('turnoUnico')}
                >
                  {config.shortLabel}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            {renderHeader()}
            <tbody>
              {linhas.map(renderRow)}
            </tbody>
            {renderFooter()}
          </table>
        </div>

        <div className="p-4 border-t border-gray-100 flex justify-end">
          <Button
            onClick={salvarDados}
            disabled={salvando}
            className="bg-[#de4838] hover:bg-[#c73d2e] text-white rounded-full px-4 py-2 hover:cursor-pointer transition-all"
          >
            <Save className="mr-2 h-4 w-4" />
            {salvando ? 'Salvando...' : 'Salvar Metas'}
          </Button>
        </div>
      </div>
    </div>
  )
}