'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Save, Loader2 } from 'lucide-react'

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
  periodosExternos?: PeriodoRefeicao[]
  onPeriodosChange?: (periodos: PeriodoRefeicao[]) => void
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

export function TabelaMetasMensais({ metas, anoAtual, onSalvar, periodosExternos }: TabelaMetasMensaisProps) {
  const [linhas, setLinhas] = useState<MetaFaturamentoRow[]>([])
  const [ano] = useState(anoAtual)
  const [periodosSelecionados, setPeriodosSelecionados] = useState<PeriodoRefeicao[]>(['turnoUnico'])
  const [salvando, setSalvando] = useState(false)
  const prevPeriodosRef = useRef<PeriodoRefeicao[] | null>(null)

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
    // Sincroniza períodos externos com estado interno
    if (periodosExternos) {
      setPeriodosSelecionados(periodosExternos)
    }
  }, [periodosExternos])

  // Limpa valores quando períodos são deselecionados
  useEffect(() => {
    // Ignora a primeira carga (prevPeriodosRef.current é null)
    if (prevPeriodosRef.current === null) {
      prevPeriodosRef.current = [...periodosSelecionados]
      return
    }

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
    prevPeriodosRef.current = [...periodosSelecionados]
  }, [periodosSelecionados])

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
    <thead className="bg-surface-2 border-b border-border">
      <tr>
        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Mês</th>
        {periodosAtivos.map(p => {
          const config = PERIODOS_CONFIG.find(c => c.id === p)!
          return (
            <th key={p} className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider w-32">
              Faturamento {config.shortLabel} Dia (R$)
            </th>
          )
        })}
        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider w-24">
          Dias Trabalhados
        </th>
        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Meta Total (R$)
        </th>
      </tr>
    </thead>
  )

  const renderRow = (linha: MetaFaturamentoRow) => (
    <tr key={linha.mes} className="border-b border-border hover:bg-surface-2 transition-colors">
      <td className="px-4 py-3 text-white font-medium">
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
      <td className="px-4 py-3 text-right font-mono text-white">
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
      <tfoot className="border-t border-border bg-surface-2">
        <tr className="font-semibold">
          <td className="px-4 py-3 text-white">TOTAL</td>
          {periodosAtivos.map((p: PeriodoRefeicao) => (
            <td key={p} className="px-4 py-3 text-right font-mono text-muted-foreground">
              {formatCurrency(totaisPorPeriodo[p] * (linhas[0]?.diasTrabalhados || 26))}
            </td>
          ))}
          <td className="px-4 py-3 text-right"></td>
          <td className="px-4 py-3 text-right text-primary font-bold">
            {formatCurrency(totalGeral)}
          </td>
        </tr>
      </tfoot>
    )
  }

  return (
    <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
      <div className="bg-surface-2 p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-lg">💰</span>
          <h3 className="font-semibold text-white">Meta de Faturamento</h3>
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

        <div className="p-4 border-t border-border flex justify-end">
          <Button
            onClick={salvarDados}
            disabled={salvando}
            className="bg-primary hover:bg-primary/90 text-white rounded-full px-4 py-2 hover:cursor-pointer transition-all"
          >
            {salvando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {salvando ? 'Salvando...' : 'Salvar Metas'}
          </Button>
        </div>
      </div>
    </div>
  )
}