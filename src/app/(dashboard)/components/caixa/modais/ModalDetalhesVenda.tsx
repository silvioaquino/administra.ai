// src/components/caixa/modais/ModalDetalhesVenda.tsx
'use client'

import { useState } from 'react'
import { Venda } from '@/types/caixa'
import { formatarMoeda, formatarTipoPagamento, getBadgeColorTipoPagamento } from '@/lib/utils'

interface ModalDetalhesVendaProps {
  show: boolean
  onClose: () => void
  venda: Venda | null
  onAtualizarVenda: (vendaId: string, tipoPagamento: string) => Promise<void>
  onExcluirVenda: (vendaId: string) => Promise<void>
}

export default function ModalDetalhesVenda({
  show,
  onClose,
  venda,
  onAtualizarVenda,
  onExcluirVenda
}: ModalDetalhesVendaProps) {
  const [loading, setLoading] = useState(false)
  const [loadingExclusao, setLoadingExclusao] = useState(false)
  const [tipoPagamentoSelecionado, setTipoPagamentoSelecionado] = useState(venda?.tipoPagamento || 'PENDENTE')

  if (!show || !venda) return null

  const tiposPagamento = ['DINHEIRO', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'PIX', 'VR', 'OUTRO', 'PENDENTE']

  const handleSalvarAlteracao = async () => {
    if (!venda) return
    
    if (tipoPagamentoSelecionado === venda.tipoPagamento) {
      onClose()
      return
    }

    setLoading(true)
    try {
      await onAtualizarVenda(venda.id, tipoPagamentoSelecionado)
      onClose()
    } catch (error: any) {
      console.error('Erro ao atualizar venda:', error)
      alert(`Erro ao atualizar tipo de pagamento: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleExcluirVenda = async () => {
    if (!venda) return

    const confirmacao = confirm(
      `Tem certeza que deseja EXCLUIR esta venda?\n\n` +
      `Cliente: ${venda.nomeCliente || 'Não informado'}\n` +
      `Valor: ${formatarMoeda(venda.valorTotal)}\n` +
      `Data: ${new Date(venda.dataVenda).toLocaleString('pt-BR')}\n\n` +
      `Esta ação não pode ser desfeita!`
    )

    if (!confirmacao) return

    setLoadingExclusao(true)
    try {
      await onExcluirVenda(venda.id)
      onClose()
    } catch (error: any) {
      console.error('Erro ao excluir venda:', error)
      alert(`Erro ao excluir venda: ${error.message}`)
    } finally {
      setLoadingExclusao(false)
    }
  }

  const getBadgeClasses = (tipo: string): string => {
    const classes: Record<string, string> = {
      'PENDENTE': 'bg-yellow-100 text-yellow-800',
      'DINHEIRO': 'bg-success/10 text-green-800',
      'CARTAO_CREDITO': 'bg-info/10 text-blue-800',
      'CARTAO_DEBITO': 'bg-cyan-100 text-cyan-800',
      'PIX': 'bg-primary/10 text-purple-800',
      'VR': 'bg-warning/10 text-orange-800',
      'OUTRO': 'bg-surface-2 text-white'
    }
    return classes[tipo] || 'bg-surface-2 text-white'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            Detalhes da Venda
            {venda.tipoPagamento === 'PENDENTE' && (
              <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                PENDENTE
              </span>
            )}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Informações da Venda */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h6 className="font-semibold text-foreground mb-3">Informações da Venda</h6>
              <p className="text-sm mb-2"><strong>ID:</strong> <span className="text-muted-foreground text-xs">{venda.id}</span></p>
              <p className="text-sm mb-2"><strong>Data:</strong> {new Date(venda.dataVenda).toLocaleString('pt-BR')}</p>
              <p className="text-sm mb-2"><strong>Valor Total:</strong> <span className="font-bold">{formatarMoeda(venda.valorTotal)}</span></p>
              <p className="text-sm"><strong>Tipo de Pagamento:</strong>
                <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${getBadgeClasses(venda.tipoPagamento)}`}>
                  {formatarTipoPagamento(venda.tipoPagamento)}
                </span>
              </p>
            </div>
            <div>
              <h6 className="font-semibold text-foreground mb-3">Informações do Cliente</h6>
              {venda.nomeCliente && <p className="text-sm mb-2"><strong>Nome:</strong> {venda.nomeCliente}</p>}
              {venda.telefoneCliente && <p className="text-sm mb-2"><strong>Telefone:</strong> {venda.telefoneCliente}</p>}
              {venda.tipoPedido && <p className="text-sm mb-2"><strong>Tipo de Pedido:</strong> {venda.tipoPedido}</p>}
              {venda.endereco && <p className="text-sm"><strong>Endereço:</strong> {venda.endereco}</p>}
            </div>
          </div>

          {/* Alterar Tipo de Pagamento */}
          <div className="border border-border rounded-lg">
            <div className="bg-surface-2 px-4 py-2 border-b border-border">
              <h6 className="font-semibold text-foreground">Alterar Tipo de Pagamento</h6>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <select 
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-background"
                    value={tipoPagamentoSelecionado}
                    onChange={(e) => setTipoPagamentoSelecionado(e.target.value)}
                    disabled={loading}
                  >
                    {tiposPagamento.map(tipo => (
                      <option key={tipo} value={tipo}>{formatarTipoPagamento(tipo)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <button 
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    onClick={handleSalvarAlteracao}
                    disabled={loading || tipoPagamentoSelecionado === venda.tipoPagamento}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Salvar
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Produtos */}
          {venda.dadosPedido?.produtos && (
            <div className="border border-border rounded-lg">
              <div className="bg-surface-2 px-4 py-2 border-b border-border">
                <h6 className="font-semibold text-foreground">Produtos</h6>
              </div>
              <div className="p-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-surface-2">
                      <tr>
                        <th className="text-left p-2">Produto</th>
                        <th className="text-center p-2">Qtd</th>
                        <th className="text-right p-2">Valor Unit.</th>
                        <th className="text-right p-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {venda.dadosPedido.produtos.map((produto: any, index: number) => (
                        <tr key={index} className="border-b border-border">
                          <td className="p-2">
                            {produto.nome}
                            {produto.adicionais && produto.adicionais.length > 0 && (
                              <div className="text-xs text-muted-foreground mt-1">
                                <strong>Adicionais:</strong>{' '}
                                {produto.adicionais.map((adicional: any, idx: number) => (
                                  <span key={idx}>
                                    {adicional.nome}
                                    {adicional.quantidade > 1 && ` (${adicional.quantidade}x)`}
                                    {adicional.valor > 0 && ` - ${formatarMoeda(adicional.valor)}`}
                                    {idx < produto.adicionais.length - 1 ? ', ' : ''}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="text-center p-2">{produto.quantidade}</td>
                          <td className="text-right p-2">{formatarMoeda(produto.valor)}</td>
                          <td className="text-right p-2 font-medium">{formatarMoeda(produto.quantidade * produto.valor)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Exclusão */}
          <div className="border border-red-300 rounded-lg bg-destructive/5">
            <div className="bg-destructive px-4 py-2 rounded-t-lg">
              <h6 className="font-semibold text-white flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Área de Exclusão
              </h6>
            </div>
            <div className="p-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-sm text-yellow-800">
                <strong>Atenção!</strong> Esta ação não pode ser desfeita. 
                Use apenas para excluir pedidos duplicados ou com erro.
              </div>
              <button 
                className="w-full bg-destructive hover:bg-destructive/90 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                onClick={handleExcluirVenda}
                disabled={loadingExclusao}
              >
                {loadingExclusao ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Excluindo...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Excluir Esta Venda
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Dados Completos */}
          <div className="border border-border rounded-lg">
            <div className="bg-surface-2 px-4 py-2 border-b border-border">
              <h6 className="font-semibold text-foreground">Dados Completos do Pedido</h6>
            </div>
            <div className="p-4">
              <pre className="bg-surface-2 p-3 rounded-lg text-xs overflow-auto max-h-48">
                {JSON.stringify(venda.dadosPedido, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 bg-surface-20 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}