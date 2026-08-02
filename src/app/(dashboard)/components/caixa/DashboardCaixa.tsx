// src/components/caixa/DashboardCaixa.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { CaixaAbertura, Venda, Retirada, VendaManual } from '@/types/caixa'
import { formatarMoeda, formatarTipoPagamento, getIconTipoPagamento } from '@/lib/utils'
import { 
  Wallet, TrendingUp, TrendingDown, Plus, Printer, 
  ChevronRight, X, Eye, Trash2, Save, AlertTriangle,
  Clock, Search
} from 'lucide-react'
import ModalFecharCaixa from './modais/ModalFecharCaixa'
import ModalDetalhesVenda from './modais/ModalDetalhesVenda'
import ModalDetalhesRetirada from './modais/ModalDetalhesRetirada'
import ModalPreviewImpressao from './modais/ModalPreviewImpressao'

interface DashboardCaixaProps {
  caixaAtual: CaixaAbertura
  vendas: Venda[]
  retiradas: Retirada[]
  vendasManuais: { [key: string]: VendaManual[] }
  onFecharCaixa: () => void
  onAbrirDetalhesVenda: (venda: Venda) => void
  onAbrirDetalhesRetirada: (retirada: Retirada) => void
  onPreviewImpressao: (tipo: 'fechamento' | 'parcial') => void
  onAtualizarDados: () => void 
}

export default function DashboardCaixa({ 
  caixaAtual, 
  onFecharCaixa,
  onAbrirDetalhesVenda,
  onAbrirDetalhesRetirada,
  onPreviewImpressao,
  onAtualizarDados
}: DashboardCaixaProps) {
  const [vendasLocal, setVendasLocal] = useState<Venda[]>([])
  const [retiradasLocal, setRetiradasLocal] = useState<Retirada[]>([])
  const [vendasManuaisLocal, setVendasManuaisLocal] = useState<{[key: string]: VendaManual[]}>({
    DINHEIRO: [],
    CARTAO_CREDITO: [],
    CARTAO_DEBITO: [],
    PIX: [],
    VR: [],
    OUTRO: []
  })
  const [valorRetirada, setValorRetirada] = useState('')
  const [obsRetirada, setObsRetirada] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingRetirada, setLoadingRetirada] = useState(false)
  const [valoresManuais, setValoresManuais] = useState<{[key: string]: string}>({})
  const [descricoesManuais, setDescricoesManuais] = useState<{[key: string]: string}>({})

  const [showFecharCaixa, setShowFecharCaixa] = useState(false)
  const [showDetalhesVenda, setShowDetalhesVenda] = useState(false)
  const [showDetalhesRetirada, setShowDetalhesRetirada] = useState(false)
  const [showPreviewImpressao, setShowPreviewImpressao] = useState(false)
  const [vendaSelecionada, setVendaSelecionada] = useState<Venda | null>(null)
  const [retiradaSelecionada, setRetiradaSelecionada] = useState<Retirada | null>(null)
  const [tipoImpressao, setTipoImpressao] = useState<'fechamento' | 'parcial'>('parcial')

  const inputRefs = useRef<{[key: string]: HTMLInputElement | null}>({})
  const listaSistemaRefs = useRef<{[key: string]: HTMLDivElement | null}>({})
  const listaManualRefs = useRef<{[key: string]: HTMLDivElement | null}>({})

  const tiposPagamento = ['DINHEIRO', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'PIX', 'VR', 'OUTRO']

  useEffect(() => {
    if (caixaAtual?.id) {
      carregarDadosCaixa()
    }
  }, [caixaAtual])

  useEffect(() => {
    if (!loading) {
      setTimeout(ajustarAlturasListas, 100)
    }
  }, [loading, vendasLocal, vendasManuaisLocal])

  const ajustarAlturasListas = () => {
    tiposPagamento.forEach(tipo => {
      const listaSistema = listaSistemaRefs.current[tipo]
      const listaManual = listaManualRefs.current[tipo]

      if (listaSistema && listaManual) {
        const alturaSistema = listaSistema.scrollHeight
        const alturaManual = listaManual.scrollHeight
        const alturaMaxima = Math.max(alturaSistema, alturaManual, 120)
        listaSistema.style.height = `${alturaMaxima}px`
        listaManual.style.height = `${alturaMaxima}px`
      }
    })
  }

  const carregarDadosCaixa = async () => {
    if (!caixaAtual?.id) return
    
    setLoading(true)
    try {
      const [vendasRes, retiradasRes, vendasManuaisRes] = await Promise.all([
        fetch(`/api/vendas?caixaId=${caixaAtual.id}`),
        fetch(`/api/retiradas?caixaId=${caixaAtual.id}`),
        fetch(`/api/vendas/manuais?caixaId=${caixaAtual.id}`)
      ])

      const vendasData = await vendasRes.json()
      const retiradasData = await retiradasRes.json()
      const vendasManuaisData = await vendasManuaisRes.json()

      setVendasLocal(vendasData.data || [])
      setRetiradasLocal(retiradasData.data || [])
      
      const manuaisAgrupados: {[key: string]: VendaManual[]} = {}
      tiposPagamento.forEach(tipo => {
        manuaisAgrupados[tipo] = (vendasManuaisData.data || [])
          .filter((v: VendaManual) => v.tipoPagamento === tipo)
      })
      setVendasManuaisLocal(manuaisAgrupados)
    } catch (error) {
      console.error('Erro ao carregar dados do caixa:', error)
    } finally {
      setLoading(false)
    }
  }

  // Cálculos
  const vendasDinheiro = vendasLocal
    .filter(v => v.tipoPagamento === 'DINHEIRO')
    .reduce((total, v) => total + (v.valorTotal || 0), 0)

  const totalDinheiroInicialMaisVendas = vendasDinheiro + (caixaAtual?.valorInicial || 0)
  const todasVendas = vendasLocal.reduce((total, v) => total + (v.valorTotal || 0), 0)
  const totalRetiradas = retiradasLocal.reduce((total, r) => total + (r.valor || 0), 0)
  const saldoAtual = (caixaAtual?.valorInicial || 0) + vendasDinheiro - totalRetiradas

  const totaisPorTipo = tiposPagamento.reduce((acc, tipo) => {
    if (tipo === 'DINHEIRO') {
      acc[tipo] = (caixaAtual?.valorInicial || 0) + vendasLocal
        .filter(v => v.tipoPagamento === tipo)
        .reduce((total, v) => total + (v.valorTotal || 0), 0)
    } else {
      acc[tipo] = vendasLocal
        .filter(v => v.tipoPagamento === tipo)
        .reduce((total, v) => total + (v.valorTotal || 0), 0)
    }
    return acc
  }, {} as {[key: string]: number})

  const totaisManuaisPorTipo = tiposPagamento.reduce((acc, tipo) => {
    acc[tipo] = (vendasManuaisLocal[tipo] || [])
      .reduce((total, v) => total + (v.valor || 0), 0)
    return acc
  }, {} as {[key: string]: number})

  const diferencasPorTipo = tiposPagamento.reduce((acc, tipo) => {
    if (tipo === 'DINHEIRO') {
      const vendasDinheiroSistema = vendasLocal
        .filter(v => v.tipoPagamento === 'DINHEIRO')
        .reduce((total, v) => total + (v.valorTotal || 0), 0)
      acc[tipo] = totaisManuaisPorTipo[tipo] - (vendasDinheiroSistema + (caixaAtual?.valorInicial || 0))
    } else {
      acc[tipo] = totaisManuaisPorTipo[tipo] - totaisPorTipo[tipo]
    }
    return acc
  }, {} as {[key: string]: number})

  const vendasPendentes = vendasLocal.filter(venda => venda.tipoPagamento === 'PENDENTE')
  const totalVendasPendentes = vendasPendentes.reduce((total, v) => total + (v.valorTotal || 0), 0)

  const getCorTipo = (tipo: string): string => {
    const cores: Record<string, string> = {
      DINHEIRO: 'bg-success',
      CARTAO_CREDITO: 'bg-info',
      CARTAO_DEBITO: 'bg-info',
      PIX: 'bg-primary/80',
      VR: 'bg-warning',
      OUTRO: 'bg-muted'
    }
    return cores[tipo] || 'bg-muted'
  }

  const handleRegistrarRetirada = async () => {
    const valor = parseFloat(valorRetirada)
    if (isNaN(valor) || valor <= 0) {
      alert('Por favor, insira um valor válido para retirada')
      return
    }

    setLoadingRetirada(true)
    try {
      const response = await fetch('/api/retiradas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valor: valor,
          observacao: obsRetirada,
          caixa_abertura_id: caixaAtual.id
        })
      })

      if (!response.ok) throw new Error('Erro ao registrar retirada')

      const { data: novaRetirada } = await response.json()
      
      setRetiradasLocal(prev => [novaRetirada, ...prev])
      setValorRetirada('')
      setObsRetirada('')
      
      setTimeout(ajustarAlturasListas, 100)
    } catch (error) {
      console.error('Erro ao registrar retirada:', error)
      alert('Erro ao registrar retirada')
    } finally {
      setLoadingRetirada(false)
    }
  }

  const handleAdicionarVendaManual = async (tipo: string) => {
    const valor = parseFloat(valoresManuais[tipo] || '0')
    const descricao = tipo === 'DINHEIRO' 
      ? (descricoesManuais[tipo] || `Venda manual - ${formatarTipoPagamento(tipo)}`)
      : `Venda manual - ${formatarTipoPagamento(tipo)}`
    
    if (isNaN(valor) || valor <= 0) {
      alert('Por favor, insira um valor válido')
      return
    }

    try {
      const response = await fetch('/api/vendas/manuais', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo_pagamento: tipo,
          valor: valor,
          descricao: descricao,
          caixa_abertura_id: caixaAtual.id
        })
      })

      if (!response.ok) throw new Error('Erro ao adicionar venda manual')

      const { data: novaVendaManual } = await response.json()
      
      setVendasManuaisLocal(prev => ({
        ...prev,
        [tipo]: [...prev[tipo], novaVendaManual]
      }))
      
      setValoresManuais(prev => ({ ...prev, [tipo]: '' }))
      if (tipo === 'DINHEIRO') {
        setDescricoesManuais(prev => ({ ...prev, [tipo]: '' }))
      }
      
      setTimeout(() => {
        inputRefs.current[`${tipo}-valor`]?.focus()
        ajustarAlturasListas()
      }, 100)
    } catch (error) {
      console.error('Erro ao adicionar venda manual:', error)
      alert('Erro ao adicionar venda manual')
    }
  }

  const handleRemoverVendaManual = async (vendaManualId: string, tipo: string) => {
    if (!confirm('Tem certeza que deseja remover esta venda manual?')) return

    try {
      const response = await fetch(`/api/vendas/manuais/${vendaManualId}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Erro ao remover venda manual')
      
      setVendasManuaisLocal(prev => ({
        ...prev,
        [tipo]: prev[tipo].filter(v => v.id !== vendaManualId)
      }))
      
      setTimeout(ajustarAlturasListas, 100)
    } catch (error) {
      console.error('Erro ao remover venda manual:', error)
      alert('Erro ao remover venda manual')
    }
  }

  const handleInputChange = (tipo: string, campo: 'valor' | 'descricao', valor: string) => {
    if (campo === 'valor') {
      setValoresManuais(prev => ({ ...prev, [tipo]: valor }))
    } else {
      setDescricoesManuais(prev => ({ ...prev, [tipo]: valor }))
    }
  }

  const handleKeyPress = (tipo: string, e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdicionarVendaManual(tipo)
    }
  }

  const handleAtualizarVenda = async (vendaId: string, tipoPagamento: string) => {
    try {
      const response = await fetch(`/api/vendas/${vendaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo_pagamento: tipoPagamento })
      })
      if (!response.ok) throw new Error('Erro ao atualizar venda')
      
      await carregarDadosCaixa()
      setTimeout(ajustarAlturasListas, 100)
    } catch (error: any) {
      console.error('Erro ao atualizar venda:', error)
      throw error
    }
  }

  const handleExcluirVenda = async (vendaId: string) => {
    try {
      const response = await fetch(`/api/vendas/${vendaId}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Erro ao excluir venda')
      
      await carregarDadosCaixa()
    } catch (error: any) {
      console.error('Erro ao excluir venda:', error)
      throw error
    }
  }

  const handleExcluirRetirada = async (retiradaId: string) => {
    try {
      const response = await fetch(`/api/retiradas/${retiradaId}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Erro ao excluir retirada')
      
      setRetiradasLocal(prev => prev.filter(r => r.id !== retiradaId))
    } catch (error: any) {
      console.error('Erro ao excluir retirada:', error)
      throw error
    }
  }

  const handleFecharCaixaCompleto = async (caixaId: string, observacoes: string, valorRetiradaFinal?: number) => {
    try {
      if (valorRetiradaFinal && valorRetiradaFinal > 0) {
        await fetch('/api/retiradas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            valor: valorRetiradaFinal,
            observacao: `Retirada final - ${observacoes}`,
            caixa_abertura_id: caixaId
          })
        })
      }

      const response = await fetch('/api/caixa/fechar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caixa_abertura_id: caixaId, observacoes })
      })
      if (!response.ok) throw new Error('Erro ao fechar caixa')
      onFecharCaixa()
    } catch (error) {
      console.error('Erro ao fechar caixa:', error)
      throw error
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground">Carregando dados do caixa...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-gradient-to-r from-success to-success/80 rounded-2xl p-3 sm:p-4 text-white shadow-sm h-full min-h-[92px] sm:min-h-[105px]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-xs opacity-90 leading-tight">Saldo em Dinheiro</p>
              <p className="text-sm sm:text-xl font-bold leading-tight">{formatarMoeda(saldoAtual)}</p>
            </div>
            <Wallet className="h-5 w-5 sm:h-6 sm:w-6 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-info to-info/80 rounded-2xl p-3 sm:p-4 text-white shadow-sm h-full min-h-[92px] sm:min-h-[105px]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-xs opacity-90 leading-tight">Total de Vendas</p>
              <p className="text-sm sm:text-xl font-bold leading-tight">{formatarMoeda(todasVendas)}</p>
            </div>
            <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-warning to-warning rounded-2xl p-3 sm:p-4 text-white shadow-sm h-full min-h-[92px] sm:min-h-[105px]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-xs opacity-90 leading-tight">Total de Retiradas</p>
              <p className="text-sm sm:text-xl font-bold leading-tight">{formatarMoeda(totalRetiradas)}</p>
            </div>
            <TrendingDown className="h-5 w-5 sm:h-6 sm:w-6 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-primary/80 to-primary/70 rounded-2xl p-3 sm:p-4 text-white shadow-sm h-full min-h-[92px] sm:min-h-[105px]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-xs opacity-90 leading-tight">Vendas Pendentes</p>
              <p className="text-sm sm:text-xl font-bold leading-tight">{vendasPendentes.length}</p>
            </div>
            <Clock className="h-5 w-5 sm:h-6 sm:w-6 opacity-80" />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Coluna Esquerda */}
        <div className="space-y-6">
          {/* Informações do Caixa - COMPLETO */}
          <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-surface-2 p-4 border-b border-border">
              <h3 className="font-semibold text-white">Informações do Caixa</h3>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Valor Inicial:</span>
                <span className="font-semibold text-white">{formatarMoeda(caixaAtual?.valorInicial || 0)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Vendas em Dinheiro:</span>
                <span className="font-semibold text-success">{formatarMoeda(vendasDinheiro)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Total Dinheiro (Inicial + Vendas):</span>
                <span className="font-bold text-primary">{formatarMoeda(totalDinheiroInicialMaisVendas)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Total de Vendas:</span>
                <span className="font-semibold text-info">{formatarMoeda(todasVendas)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Total de Retiradas:</span>
                <span className="font-semibold text-warning">{formatarMoeda(totalRetiradas)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">Saldo Atual (Dinheiro):</span>
                <span className={`font-bold text-lg ${saldoAtual >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {formatarMoeda(saldoAtual)}
                </span>
              </div>
            </div>
          </div>

          {/* Nova Retirada */}
          <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-surface-2 p-4 border-b border-border">
              <h3 className="font-semibold text-white">Nova Retirada</h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Valor</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70">R$</span>
                  <input 
                    type="number" step="0.01" min="0.01"
                    value={valorRetirada} onChange={(e) => setValorRetirada(e.target.value)}
                    disabled={loadingRetirada}
                    className="w-full pl-8 pr-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="0,00"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Observação</label>
                <textarea 
                  rows={2} value={obsRetirada} onChange={(e) => setObsRetirada(e.target.value)}
                  disabled={loadingRetirada}
                  className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  placeholder="Motivo da retirada..."
                />
              </div>
              <button 
                onClick={handleRegistrarRetirada} 
                disabled={loadingRetirada}
                className="w-full bg-warning hover:bg-warning text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loadingRetirada ? (
                  <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Registrando...</>
                ) : (
                  <><TrendingDown className="h-4 w-4" /> Registrar Retirada</>
                )}
              </button>
            </div>
          </div>

          {/* Lista de Retiradas */}
          <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-surface-2 p-4 border-b border-border">
              <h3 className="font-semibold text-white">Últimas Retiradas</h3>
            </div>
            <div className="p-4 max-h-64 overflow-y-auto">
              {retiradasLocal.length > 0 ? retiradasLocal.map(retirada => (
                <div 
                  key={retirada.id} 
                  onClick={() => { setRetiradaSelecionada(retirada); setShowDetalhesRetirada(true); }}
                  className="cursor-pointer border-b border-border pb-3 mb-3 last:border-0 hover:bg-surface-2 p-2 rounded-lg transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-destructive">{formatarMoeda(retirada.valor)}</div>
                      <div className="text-xs text-muted-foreground">{retirada.observacao || 'Sem observação'}</div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/70" />
                  </div>
                  <div className="text-xs text-muted-foreground/70 mt-1">
                    {new Date(retirada.dataRetirada).toLocaleString('pt-BR')}
                  </div>
                </div>
              )) : (
                <div className="text-center text-muted-foreground py-6">
                  Nenhuma retirada registrada
                </div>
              )}
            </div>
          </div>

          {/* Vendas Pendentes */}
          <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-warning/50 px-4 py-3">
              <h3 className="font-semibold text-white flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Vendas Pendentes
                </span>
                {vendasPendentes.length > 0 && (
                  <span className="bg-destructive text-white text-xs px-2 py-1 rounded-full">{vendasPendentes.length}</span>
                )}
              </h3>
            </div>
            <div className="p-4">
              {vendasPendentes.length > 0 ? (
                <>
                  <div className="flex justify-between items-center mb-3 p-2 bg-warning/5 rounded-lg">
                    <span className="font-bold text-white">Total Pendente:</span>
                    <span className="font-bold text-warning">{formatarMoeda(totalVendasPendentes)}</span>
                  </div>
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {vendasPendentes.map(venda => (
                      <div 
                        key={venda.id} 
                        onClick={() => { setVendaSelecionada(venda); setShowDetalhesVenda(true); }}
                        className="cursor-pointer p-3 border border-warning/30 rounded-lg bg-warning/5 hover:bg-warning/10 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-bold text-warning">{formatarMoeda(venda.valorTotal)}</span>
                          <span className="text-xs text-muted-foreground">{new Date(venda.dataVenda).toLocaleTimeString('pt-BR')}</span>
                        </div>
                        {venda.nomeCliente && <div className="text-sm"><strong>Cliente:</strong> {venda.nomeCliente}</div>}
                        {venda.tipoPedido && <div className="text-sm"><strong>Tipo:</strong> {venda.tipoPedido}</div>}
                        <div className="mt-2">
                          <span className="text-xs border-warning/30 text-warning px-2 py-1 rounded-full">Aguardando definição</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-center text-xs text-muted-foreground">
                    Clique em uma venda para definir o tipo de pagamento
                  </div>
                </>
              ) : (
                <div className="text-center text-muted-foreground py-6">
                  Nenhuma venda pendente
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Coluna Direita - Relatório de Vendas */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-surface-2 p-4 border-b border-border flex justify-between items-center">
              <h3 className="font-semibold text-white">Relatório de Vendas</h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => onPreviewImpressao('parcial')} 
                  className="px-3 py-1.5 text-sm border border-border text-muted-foreground hover:bg-surface-2 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Printer className="h-3 w-3" />
                  Parcial
                </button>
                <button 
                  onClick={() => setShowFecharCaixa(true)} 
                  className="px-3 py-1.5 text-sm bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors flex items-center gap-1"
                >
                  <Wallet className="h-3 w-3" />
                  Fechar Caixa
                </button>
              </div>
            </div>
            <div className="p-5">
              <div className="grid gap-4 md:grid-cols-2">
                {tiposPagamento.map(tipo => {
                  const vendasTipo = vendasLocal.filter(venda => venda.tipoPagamento === tipo)
                  const vendasManuaisTipo = vendasManuaisLocal[tipo] || []
                  const totalSistema = totaisPorTipo[tipo] || 0
                  const totalManual = totaisManuaisPorTipo[tipo] || 0
                  const diferenca = totalManual - totalSistema
                  const valorManual = valoresManuais[tipo] || ''

                  return (
                    <div key={tipo} className="border border-border rounded-xl overflow-hidden">
                      <div className={`${getCorTipo(tipo)} px-3 py-2 text-white text-center text-sm font-medium`}>
                        {formatarTipoPagamento(tipo)}
                        {tipo === 'DINHEIRO' && <span className="ml-1 text-xs opacity-80">(Inclui inicial)</span>}
                      </div>
                      <div className="p-3 space-y-3">
                        {/* Input para adicionar venda manual */}
                        <div className="space-y-2">
                          {tipo === 'DINHEIRO' ? (
                            <div className="space-y-1">
                              <div className="flex gap-1">
                                <div className="flex-1 relative">
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/70">R$</span>
                                  <input 
                                    ref={(el) => { inputRefs.current[`${tipo}-valor`] = el }}
                                    type="number" step="0.01" placeholder="0,00" 
                                    value={valorManual}
                                    onChange={(e) => handleInputChange(tipo, 'valor', e.target.value)}
                                    onKeyPress={(e) => handleKeyPress(tipo, e)}
                                    className="w-full pl-6 pr-2 py-1.5 text-sm border border-border rounded-lg"
                                  />
                                </div>
                                <button 
                                  onClick={() => handleAdicionarVendaManual(tipo)} 
                                  disabled={!valorManual || parseFloat(valorManual) <= 0}
                                  className="px-2 py-1.5 bg-success text-white rounded-lg text-sm disabled:opacity-50"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                              <div className="relative">
                                <input 
                                  type="text" 
                                  placeholder="Descrição (moedas, troco...)" 
                                  value={descricoesManuais[tipo] || ''}
                                  onChange={(e) => handleInputChange(tipo, 'descricao', e.target.value)}
                                  onKeyPress={(e) => handleKeyPress(tipo, e)}
                                  maxLength={50}
                                  className="w-full px-2 py-1.5 text-sm border border-border rounded-lg"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-1">
                              <div className="flex-1 relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/70">R$</span>
                                <input 
                                  ref={(el) => { inputRefs.current[`${tipo}-valor`] = el }}
                                  type="number" step="0.01" placeholder="0,00" 
                                  value={valorManual}
                                  onChange={(e) => handleInputChange(tipo, 'valor', e.target.value)}
                                  onKeyPress={(e) => handleKeyPress(tipo, e)}
                                  className="w-full pl-6 pr-2 py-1.5 text-sm border border-border rounded-lg"
                                />
                              </div>
                              <button 
                                onClick={() => handleAdicionarVendaManual(tipo)} 
                                disabled={!valorManual || parseFloat(valorManual) <= 0}
                                className="px-2 py-1.5 bg-success text-white rounded-lg text-sm disabled:opacity-50"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Contadores */}
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Sistema <span className="bg-surface-2 text-white px-1 rounded">{vendasTipo.length}</span></span>
                          <span>Manual <span className="bg-success/10 text-success px-1 rounded">{vendasManuaisTipo.length}</span></span>
                        </div>

                        {/* Listas lado a lado */}
                        <div className="grid grid-cols-2 gap-2">
                          <div 
                            ref={(el) => { listaSistemaRefs.current[tipo] = el }} 
                            className="border border-border rounded-lg overflow-y-auto max-h-32"
                          >
                            {vendasTipo.map(venda => (
                              <div 
                                key={venda.id} 
                                onClick={() => { setVendaSelecionada(venda); setShowDetalhesVenda(true); }} 
                                className="cursor-pointer p-1.5 border-b border-border text-sm hover:bg-surface-2"
                              >
                                <div className="flex justify-between">
                                  <span className="font-medium">{formatarMoeda(venda.valorTotal)}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(venda.dataVenda).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                {venda.dadosPedido?.cliente?.nome && (
                                  <div className="text-xs text-muted-foreground truncate">{venda.dadosPedido.cliente.nome}</div>
                                )}
                              </div>
                            ))}
                            {vendasTipo.length === 0 && (
                              <div className="text-center text-xs text-muted-foreground/70 py-4">Nenhuma venda</div>
                            )}
                          </div>
                          <div 
                            ref={(el) => { listaManualRefs.current[tipo] = el }} 
                            className="border border-border rounded-lg overflow-y-auto max-h-32"
                          >
                            {vendasManuaisTipo.map(venda => (
                              <div key={venda.id} className="p-1.5 border-b border-border text-sm flex justify-between items-center">
                                <div>
                                  <span className="font-medium text-success">{formatarMoeda(venda.valor)}</span>
                                  {venda.descricao && venda.descricao !== `Venda manual - ${formatarTipoPagamento(tipo)}` && (
                                    <div className="text-xs text-muted-foreground truncate">{venda.descricao}</div>
                                  )}
                                </div>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleRemoverVendaManual(venda.id, tipo); }} 
                                  className="text-destructive hover:text-destructive"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                            {vendasManuaisTipo.length === 0 && (
                              <div className="text-center text-xs text-muted-foreground/70 py-4">Nenhuma manual</div>
                            )}
                          </div>
                        </div>

                        {/* Totais e diferença */}
                        <div className="grid grid-cols-2 gap-2 text-center text-xs">
                          <div className="p-1.5 bg-surface-2 rounded-lg">
                            <strong>Sistema</strong>
                            <div className="font-medium">{formatarMoeda(totalSistema)}</div>
                            {tipo === 'DINHEIRO' && (
                              <div className="text-xs text-muted-foreground/70">(Inicial: {formatarMoeda(caixaAtual?.valorInicial || 0)})</div>
                            )}
                          </div>
                          <div className="p-1.5 bg-surface-2 rounded-lg">
                            <strong>Manual</strong>
                            <div className="font-medium text-success">{formatarMoeda(totalManual)}</div>
                          </div>
                        </div>

                        <div className={`text-center p-1.5 rounded-lg text-xs font-medium ${diferenca >= 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                          {diferenca >= 0 ? '✓' : '✗'} Diferença: {formatarMoeda(diferenca)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Resumo Geral */}
              <div className="mt-4 p-4 bg-surface-2 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-white mb-2">Resumo de Vendas</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Valor Inicial:</span>
                        <span className="font-medium">{formatarMoeda(caixaAtual?.valorInicial || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Vendas do Sistema:</span>
                        <span className="font-medium">{formatarMoeda(todasVendas)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Vendas Manuais:</span>
                        <span className="font-medium text-success">{formatarMoeda(Object.values(totaisManuaisPorTipo).reduce((a, b) => a + b, 0))}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-border">
                        <span className="font-bold">Total Dinheiro:</span>
                        <span className="font-bold text-primary">{formatarMoeda(totalDinheiroInicialMaisVendas)}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between pt-2 border-t border-border mt-2">
                      <span className="font-bold">Diferença Geral:</span>
                      <span className={`font-bold text-lg ${Object.values(diferencasPorTipo).reduce((a, b) => a + b, 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {formatarMoeda(Object.values(diferencasPorTipo).reduce((a, b) => a + b, 0))}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground/70">
                      * O valor do sistema para DINHEIRO inclui o valor inicial do caixa
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modais */}
      <ModalFecharCaixa 
        show={showFecharCaixa} 
        onClose={() => setShowFecharCaixa(false)} 
        onFecharCaixa={handleFecharCaixaCompleto} 
        caixaAtual={caixaAtual} 
        vendas={vendasLocal} 
        retiradas={retiradasLocal} 
        vendasManuais={vendasManuaisLocal} 
      />
      <ModalDetalhesVenda 
        show={showDetalhesVenda} 
        onClose={() => setShowDetalhesVenda(false)} 
        venda={vendaSelecionada} 
        onAtualizarVenda={handleAtualizarVenda} 
        onExcluirVenda={handleExcluirVenda} 
      />
      <ModalDetalhesRetirada 
        show={showDetalhesRetirada} 
        onClose={() => setShowDetalhesRetirada(false)} 
        retirada={retiradaSelecionada} 
        onExcluirRetirada={handleExcluirRetirada} 
      />
      <ModalPreviewImpressao 
        show={showPreviewImpressao} 
        onClose={() => setShowPreviewImpressao(false)} 
        tipo={tipoImpressao} 
        caixaAtual={caixaAtual} 
        vendas={vendasLocal} 
        retiradas={retiradasLocal} 
        vendasManuais={vendasManuaisLocal} 
      />
    </div>
  )
}