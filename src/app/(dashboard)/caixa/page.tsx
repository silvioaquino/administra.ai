// src/app/(dashboard)/caixa/page.tsx
'use client'

import { useState, useEffect } from 'react'
import TelaInicial from '../components/caixa/TelaInicial'
import DashboardCaixa from '../components/caixa/DashboardCaixa'
import ModalAbrirCaixa from '../components/caixa/modais/ModalAbrirCaixa'
import ModalFecharCaixa from '../components/caixa/modais/ModalFecharCaixa'
import ModalDetalhesVenda from '../components/caixa/modais/ModalDetalhesVenda'
import ModalDetalhesRetirada from '../components/caixa/modais/ModalDetalhesRetirada'
import ModalPreviewImpressao from '../components/caixa/modais/ModalPreviewImpressao'
import ModalConsultaCaixa from '../components/caixa/modais/ModalConsultaCaixa'
import { CaixaAbertura, Venda, Retirada, VendaManual, CaixaFechamento } from '../../../types/caixa'

export default function CaixaPage() {
  // Estados principais
  const [caixaAberto, setCaixaAberto] = useState(false)
  const [caixaAtual, setCaixaAtual] = useState<CaixaAbertura | null>(null)
  const [vendas, setVendas] = useState<Venda[]>([])
  const [retiradas, setRetiradas] = useState<Retirada[]>([])
  const [vendasManuais, setVendasManuais] = useState<{[key: string]: VendaManual[]}>({
    DINHEIRO: [],
    CARTAO_CREDITO: [],
    CARTAO_DEBITO: [],
    PIX: [],
    VR: [],
    OUTRO: []
  })

  // Estados dos modais
  const [showAbrirCaixa, setShowAbrirCaixa] = useState(false)
  const [showFecharCaixa, setShowFecharCaixa] = useState(false)
  const [showDetalhesVenda, setShowDetalhesVenda] = useState(false)
  const [showDetalhesRetirada, setShowDetalhesRetirada] = useState(false)
  const [showPreviewImpressao, setShowPreviewImpressao] = useState(false)
  const [showConsultaCaixa, setShowConsultaCaixa] = useState(false)
  
  // Estados para dados dos modais
  const [vendaSelecionada, setVendaSelecionada] = useState<Venda | null>(null)
  const [retiradaSelecionada, setRetiradaSelecionada] = useState<Retirada | null>(null)
  const [tipoImpressao, setTipoImpressao] = useState<'fechamento' | 'parcial'>('parcial')
  const [dadosConsulta, setDadosConsulta] = useState<CaixaFechamento | null>(null)
  const [loadingConsulta, setLoadingConsulta] = useState(false)

  // Verificar estado do caixa
  const verificarEstadoCaixa = async () => {
    try {
      const response = await fetch('/api/caixa')
      const data = await response.json()
      
      setCaixaAberto(data.caixaAberto)
      setCaixaAtual(data.caixaAtual)

      if (data.caixaAberto && data.caixaAtual) {
        await carregarDadosCaixa(data.caixaAtual.id)
      }
    } catch (error) {
      console.error('Erro ao verificar estado do caixa:', error)
    }
  }

  // Carregar dados do caixa
  const carregarDadosCaixa = async (caixaId: string) => {
    try {
      const [vendasRes, retiradasRes, vendasManuaisRes] = await Promise.all([
        fetch(`/api/vendas?caixaId=${caixaId}`),
        fetch(`/api/retiradas?caixaId=${caixaId}`),
        fetch(`/api/vendas/manuais?caixaId=${caixaId}`)
      ])

      const vendasData = await vendasRes.json()
      const retiradasData = await retiradasRes.json()
      const vendasManuaisData = await vendasManuaisRes.json()

      setVendas(vendasData.data || [])
      setRetiradas(retiradasData.data || [])
      
      const tipos = ['DINHEIRO', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'PIX', 'VR', 'OUTRO']
      const manuaisAgrupados: {[key: string]: VendaManual[]} = {}
      tipos.forEach(tipo => {
        manuaisAgrupados[tipo] = (vendasManuaisData.data || [])
          .filter((v: VendaManual) => v.tipoPagamento === tipo)
      })
      setVendasManuais(manuaisAgrupados)
    } catch (error) {
      console.error('Erro ao carregar dados do caixa:', error)
    }
  }

  useEffect(() => {
    verificarEstadoCaixa()
  }, [])

  // Handlers
  const handleAbrirCaixa = () => setShowAbrirCaixa(true)
  const handleFecharCaixa = () => setShowFecharCaixa(true)
  
  const handleAbrirDetalhesVenda = (venda: Venda) => {
    setVendaSelecionada(venda)
    setShowDetalhesVenda(true)
  }
  
  const handleAbrirDetalhesRetirada = (retirada: Retirada) => {
    setRetiradaSelecionada(retirada)
    setShowDetalhesRetirada(true)
  }
  
  const handlePreviewImpressao = (tipo: 'fechamento' | 'parcial') => {
    setTipoImpressao(tipo)
    setShowPreviewImpressao(true)
  }

  const handleConsultarCaixa = async (data: string) => {
    setLoadingConsulta(true)
    try {
      const response = await fetch(`/api/caixa/consulta?data=${data}`)
      const result = await response.json()

      if (!response.ok) throw new Error(result.error || 'Erro na consulta')

      if (result.success) {
        setDadosConsulta(result.data)
        setShowConsultaCaixa(true)
      } else {
        alert(result.error || 'Nenhum caixa encontrado para esta data')
      }
    } catch (error) {
      console.error('Erro ao consultar caixa:', error)
      alert(error instanceof Error ? error.message : 'Erro ao consultar caixa')
    } finally {
      setLoadingConsulta(false)
    }
  }

  const handleConfirmarAbrirCaixa = async (valorInicial: number, observacao: string) => {
    try {
      const response = await fetch('/api/caixa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valor_inicial: valorInicial, observacao })
      })

      if (!response.ok) throw new Error('Erro ao abrir caixa')
      
      await verificarEstadoCaixa()
      setShowAbrirCaixa(false)
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao abrir caixa')
      throw error
    }
  }

  const handleConfirmarFecharCaixa = async (caixaId: string, observacoes: string, valorRetiradaFinal?: number) => {
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
      
      await verificarEstadoCaixa()
      setShowFecharCaixa(false)
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao fechar caixa')
      throw error
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
      
      if (caixaAtual) {
        await carregarDadosCaixa(caixaAtual.id)
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao atualizar venda')
      throw error
    }
  }

  const handleExcluirVenda = async (vendaId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta venda?')) return
    
    try {
      const response = await fetch(`/api/vendas/${vendaId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Erro ao excluir venda')
      
      if (caixaAtual) {
        await carregarDadosCaixa(caixaAtual.id)
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao excluir venda')
      throw error
    }
  }

  const handleExcluirRetirada = async (retiradaId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta retirada?')) return
    
    try {
      const response = await fetch(`/api/retiradas/${retiradaId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Erro ao excluir retirada')
      
      if (caixaAtual) {
        await carregarDadosCaixa(caixaAtual.id)
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao excluir retirada')
      throw error
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4">
        {caixaAberto && caixaAtual ? (
          <DashboardCaixa 
            caixaAtual={caixaAtual}
            vendas={vendas}
            retiradas={retiradas}
            vendasManuais={vendasManuais}
            onFecharCaixa={handleFecharCaixa}
            onAbrirDetalhesVenda={handleAbrirDetalhesVenda}
            onAbrirDetalhesRetirada={handleAbrirDetalhesRetirada}
            onPreviewImpressao={handlePreviewImpressao}
            onAtualizarDados={() => caixaAtual && carregarDadosCaixa(caixaAtual.id)}
          />
        ) : (
          <TelaInicial 
            onAbrirCaixa={handleAbrirCaixa}
            onConsultarCaixa={handleConsultarCaixa}
            loading={loadingConsulta}
          />
        )}

        {/* Modais */}
        <ModalAbrirCaixa
          show={showAbrirCaixa}
          onClose={() => setShowAbrirCaixa(false)}
          onAbrirCaixa={handleConfirmarAbrirCaixa}
        />

        <ModalFecharCaixa
          show={showFecharCaixa}
          onClose={() => setShowFecharCaixa(false)}
          onFecharCaixa={handleConfirmarFecharCaixa}
          caixaAtual={caixaAtual!}
          vendas={vendas}
          retiradas={retiradas}
          vendasManuais={vendasManuais}
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
          caixaAtual={caixaAtual!}
          vendas={vendas}
          retiradas={retiradas}
          vendasManuais={vendasManuais}
        />

        <ModalConsultaCaixa
          show={showConsultaCaixa}
          onClose={() => setShowConsultaCaixa(false)}
          dadosCaixa={dadosConsulta}
        />
      </div>
    </div>
  )
}