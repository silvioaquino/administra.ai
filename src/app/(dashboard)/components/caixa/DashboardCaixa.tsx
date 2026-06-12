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
      DINHEIRO: 'bg-emerald-600',
      CARTAO_CREDITO: 'bg-blue-600',
      CARTAO_DEBITO: 'bg-cyan-600',
      PIX: 'bg-purple-600',
      VR: 'bg-orange-600',
      OUTRO: 'bg-gray-600'
    }
    return cores[tipo] || 'bg-gray-600'
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
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#de4838] border-t-transparent mx-auto" />
          <p className="mt-4 text-sm text-gray-500">Carregando dados do caixa...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-4 text-white shadow-sm h-full min-h-[132px] sm:min-h-[150px]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs opacity-90">Saldo em Dinheiro</p>
              <p className="text-2xl font-bold">{formatarMoeda(saldoAtual)}</p>
            </div>
            <Wallet className="h-8 w-8 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-4 text-white shadow-sm h-full min-h-[132px] sm:min-h-[150px]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs opacity-90">Total de Vendas</p>
              <p className="text-2xl font-bold">{formatarMoeda(todasVendas)}</p>
            </div>
            <TrendingUp className="h-8 w-8 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-4 text-white shadow-sm h-full min-h-[132px] sm:min-h-[150px]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs opacity-90">Total de Retiradas</p>
              <p className="text-2xl font-bold">{formatarMoeda(totalRetiradas)}</p>
            </div>
            <TrendingDown className="h-8 w-8 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-4 text-white shadow-sm h-full min-h-[132px] sm:min-h-[150px]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs opacity-90">Vendas Pendentes</p>
              <p className="text-2xl font-bold">{vendasPendentes.length}</p>
            </div>
            <Clock className="h-8 w-8 opacity-80" />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Coluna Esquerda */}
        <div className="space-y-6">
          {/* Informações do Caixa - COMPLETO */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gray-50 p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Informações do Caixa</h3>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Valor Inicial:</span>
                <span className="font-semibold text-gray-800">{formatarMoeda(caixaAtual?.valorInicial || 0)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Vendas em Dinheiro:</span>
                <span className="font-semibold text-emerald-600">{formatarMoeda(vendasDinheiro)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Total Dinheiro (Inicial + Vendas):</span>
                <span className="font-bold text-[#de4838]">{formatarMoeda(totalDinheiroInicialMaisVendas)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Total de Vendas:</span>
                <span className="font-semibold text-blue-600">{formatarMoeda(todasVendas)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Total de Retiradas:</span>
                <span className="font-semibold text-amber-600">{formatarMoeda(totalRetiradas)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-500">Saldo Atual (Dinheiro):</span>
                <span className={`font-bold text-lg ${saldoAtual >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatarMoeda(saldoAtual)}
                </span>
              </div>
            </div>
          </div>

          {/* Nova Retirada */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gray-50 p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Nova Retirada</h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Valor</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">R$</span>
                  <input 
                    type="number" step="0.01" min="0.01"
                    value={valorRetirada} onChange={(e) => setValorRetirada(e.target.value)}
                    disabled={loadingRetirada}
                    className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#de4838]"
                    placeholder="0,00"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Observação</label>
                <textarea 
                  rows={2} value={obsRetirada} onChange={(e) => setObsRetirada(e.target.value)}
                  disabled={loadingRetirada}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#de4838] resize-none"
                  placeholder="Motivo da retirada..."
                />
              </div>
              <button 
                onClick={handleRegistrarRetirada} 
                disabled={loadingRetirada}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
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
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gray-50 p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Últimas Retiradas</h3>
            </div>
            <div className="p-4 max-h-64 overflow-y-auto">
              {retiradasLocal.length > 0 ? retiradasLocal.map(retirada => (
                <div 
                  key={retirada.id} 
                  onClick={() => { setRetiradaSelecionada(retirada); setShowDetalhesRetirada(true); }}
                  className="cursor-pointer border-b border-gray-100 pb-3 mb-3 last:border-0 hover:bg-gray-50 p-2 rounded-lg transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-red-600">{formatarMoeda(retirada.valor)}</div>
                      <div className="text-xs text-gray-500">{retirada.observacao || 'Sem observação'}</div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(retirada.dataRetirada).toLocaleString('pt-BR')}
                  </div>
                </div>
              )) : (
                <div className="text-center text-gray-500 py-6">
                  Nenhuma retirada registrada
                </div>
              )}
            </div>
          </div>

          {/* Vendas Pendentes */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-amber-500 px-4 py-3">
              <h3 className="font-semibold text-white flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Vendas Pendentes
                </span>
                {vendasPendentes.length > 0 && (
                  <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">{vendasPendentes.length}</span>
                )}
              </h3>
            </div>
            <div className="p-4">
              {vendasPendentes.length > 0 ? (
                <>
                  <div className="flex justify-between items-center mb-3 p-2 bg-amber-50 rounded-lg">
                    <span className="font-bold text-gray-700">Total Pendente:</span>
                    <span className="font-bold text-amber-700">{formatarMoeda(totalVendasPendentes)}</span>
                  </div>
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {vendasPendentes.map(venda => (
                      <div 
                        key={venda.id} 
                        onClick={() => { setVendaSelecionada(venda); setShowDetalhesVenda(true); }}
                        className="cursor-pointer p-3 border border-amber-200 rounded-lg bg-amber-50 hover:bg-amber-100 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-bold text-amber-700">{formatarMoeda(venda.valorTotal)}</span>
                          <span className="text-xs text-gray-500">{new Date(venda.dataVenda).toLocaleTimeString('pt-BR')}</span>
                        </div>
                        {venda.nomeCliente && <div className="text-sm"><strong>Cliente:</strong> {venda.nomeCliente}</div>}
                        {venda.tipoPedido && <div className="text-sm"><strong>Tipo:</strong> {venda.tipoPedido}</div>}
                        <div className="mt-2">
                          <span className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded-full">Aguardando definição</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-center text-xs text-gray-500">
                    Clique em uma venda para definir o tipo de pagamento
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-500 py-6">
                  Nenhuma venda pendente
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Coluna Direita - Relatório de Vendas */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-semibold text-gray-800">Relatório de Vendas</h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => onPreviewImpressao('parcial')} 
                  className="px-3 py-1.5 text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Printer className="h-3 w-3" />
                  Parcial
                </button>
                <button 
                  onClick={() => setShowFecharCaixa(true)} 
                  className="px-3 py-1.5 text-sm bg-[#de4838] hover:bg-[#c73d2e] text-white rounded-lg transition-colors flex items-center gap-1"
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
                    <div key={tipo} className="border border-gray-200 rounded-xl overflow-hidden">
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
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">R$</span>
                                  <input 
                                    ref={(el) => { inputRefs.current[`${tipo}-valor`] = el }}
                                    type="number" step="0.01" placeholder="0,00" 
                                    value={valorManual}
                                    onChange={(e) => handleInputChange(tipo, 'valor', e.target.value)}
                                    onKeyPress={(e) => handleKeyPress(tipo, e)}
                                    className="w-full pl-6 pr-2 py-1.5 text-sm border border-gray-200 rounded-lg"
                                  />
                                </div>
                                <button 
                                  onClick={() => handleAdicionarVendaManual(tipo)} 
                                  disabled={!valorManual || parseFloat(valorManual) <= 0}
                                  className="px-2 py-1.5 bg-emerald-600 text-white rounded-lg text-sm disabled:opacity-50"
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
                                  className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-1">
                              <div className="flex-1 relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">R$</span>
                                <input 
                                  ref={(el) => { inputRefs.current[`${tipo}-valor`] = el }}
                                  type="number" step="0.01" placeholder="0,00" 
                                  value={valorManual}
                                  onChange={(e) => handleInputChange(tipo, 'valor', e.target.value)}
                                  onKeyPress={(e) => handleKeyPress(tipo, e)}
                                  className="w-full pl-6 pr-2 py-1.5 text-sm border border-gray-200 rounded-lg"
                                />
                              </div>
                              <button 
                                onClick={() => handleAdicionarVendaManual(tipo)} 
                                disabled={!valorManual || parseFloat(valorManual) <= 0}
                                className="px-2 py-1.5 bg-emerald-600 text-white rounded-lg text-sm disabled:opacity-50"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Contadores */}
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Sistema <span className="bg-gray-200 text-gray-700 px-1 rounded">{vendasTipo.length}</span></span>
                          <span>Manual <span className="bg-emerald-100 text-emerald-700 px-1 rounded">{vendasManuaisTipo.length}</span></span>
                        </div>

                        {/* Listas lado a lado */}
                        <div className="grid grid-cols-2 gap-2">
                          <div 
                            ref={(el) => { listaSistemaRefs.current[tipo] = el }} 
                            className="border border-gray-200 rounded-lg overflow-y-auto max-h-32"
                          >
                            {vendasTipo.map(venda => (
                              <div 
                                key={venda.id} 
                                onClick={() => { setVendaSelecionada(venda); setShowDetalhesVenda(true); }} 
                                className="cursor-pointer p-1.5 border-b border-gray-100 text-sm hover:bg-gray-50"
                              >
                                <div className="flex justify-between">
                                  <span className="font-medium">{formatarMoeda(venda.valorTotal)}</span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(venda.dataVenda).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                {venda.dadosPedido?.cliente?.nome && (
                                  <div className="text-xs text-gray-500 truncate">{venda.dadosPedido.cliente.nome}</div>
                                )}
                              </div>
                            ))}
                            {vendasTipo.length === 0 && (
                              <div className="text-center text-xs text-gray-400 py-4">Nenhuma venda</div>
                            )}
                          </div>
                          <div 
                            ref={(el) => { listaManualRefs.current[tipo] = el }} 
                            className="border border-gray-200 rounded-lg overflow-y-auto max-h-32"
                          >
                            {vendasManuaisTipo.map(venda => (
                              <div key={venda.id} className="p-1.5 border-b border-gray-100 text-sm flex justify-between items-center">
                                <div>
                                  <span className="font-medium text-emerald-600">{formatarMoeda(venda.valor)}</span>
                                  {venda.descricao && venda.descricao !== `Venda manual - ${formatarTipoPagamento(tipo)}` && (
                                    <div className="text-xs text-gray-500 truncate">{venda.descricao}</div>
                                  )}
                                </div>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleRemoverVendaManual(venda.id, tipo); }} 
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                            {vendasManuaisTipo.length === 0 && (
                              <div className="text-center text-xs text-gray-400 py-4">Nenhuma manual</div>
                            )}
                          </div>
                        </div>

                        {/* Totais e diferença */}
                        <div className="grid grid-cols-2 gap-2 text-center text-xs">
                          <div className="p-1.5 bg-gray-100 rounded-lg">
                            <strong>Sistema</strong>
                            <div className="font-medium">{formatarMoeda(totalSistema)}</div>
                            {tipo === 'DINHEIRO' && (
                              <div className="text-xs text-gray-400">(Inicial: {formatarMoeda(caixaAtual?.valorInicial || 0)})</div>
                            )}
                          </div>
                          <div className="p-1.5 bg-gray-100 rounded-lg">
                            <strong>Manual</strong>
                            <div className="font-medium text-emerald-600">{formatarMoeda(totalManual)}</div>
                          </div>
                        </div>

                        <div className={`text-center p-1.5 rounded-lg text-xs font-medium ${diferenca >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {diferenca >= 0 ? '✓' : '✗'} Diferença: {formatarMoeda(diferenca)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Resumo Geral */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Resumo de Vendas</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Valor Inicial:</span>
                        <span className="font-medium">{formatarMoeda(caixaAtual?.valorInicial || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Vendas do Sistema:</span>
                        <span className="font-medium">{formatarMoeda(todasVendas)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Vendas Manuais:</span>
                        <span className="font-medium text-emerald-600">{formatarMoeda(Object.values(totaisManuaisPorTipo).reduce((a, b) => a + b, 0))}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-gray-200">
                        <span className="font-bold">Total Dinheiro:</span>
                        <span className="font-bold text-[#de4838]">{formatarMoeda(totalDinheiroInicialMaisVendas)}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
                      <span className="font-bold">Diferença Geral:</span>
                      <span className={`font-bold text-lg ${Object.values(diferencasPorTipo).reduce((a, b) => a + b, 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatarMoeda(Object.values(diferencasPorTipo).reduce((a, b) => a + b, 0))}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-gray-400">
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