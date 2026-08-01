// src/components/caixa/modais/ModalFecharCaixa.tsx
'use client'

import { useState, useEffect } from 'react'
import { CaixaAbertura, Venda, Retirada, VendaManual } from '@/types/caixa'
import { formatarMoeda, formatarTipoPagamento } from '@/lib/utils'

interface ModalFecharCaixaProps {
  show: boolean
  onClose: () => void
  onFecharCaixa: (caixaId: string, observacoes: string, valorRetiradaFinal?: number) => Promise<void>
  caixaAtual: CaixaAbertura
  vendas: Venda[]
  retiradas: Retirada[]
  vendasManuais: { [key: string]: VendaManual[] }
  onSucesso?: () => void
}

export default function ModalFecharCaixa({ 
  show, 
  onClose, 
  onFecharCaixa, 
  caixaAtual, 
  vendas, 
  retiradas,
  vendasManuais,
  onSucesso
}: ModalFecharCaixaProps) {
  const [valorRetiradaFinal, setValorRetiradaFinal] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Cálculos
  const valorAbertura = caixaAtual?.valorInicial || 0
  const vendasDinheiro = vendas
    .filter(v => v.tipoPagamento === 'DINHEIRO')
    .reduce((total, v) => total + (v.valorTotal || 0), 0)
  const todasVendas = vendas.reduce((total, v) => total + (v.valorTotal || 0), 0)
  const totalRetiradas = retiradas.reduce((total, r) => total + (r.valor || 0), 0)
  const saldoFinal = valorAbertura + vendasDinheiro - totalRetiradas

  const tiposPagamento = ['DINHEIRO', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'PIX', 'VR', 'OUTRO']

  const totaisPorTipo = tiposPagamento.reduce((acc, tipo) => {
    const vendasSistema = vendas
      .filter(v => v.tipoPagamento === tipo)
      .reduce((total, v) => total + (v.valorTotal || 0), 0)
    
    const vendasManuaisTipo = (vendasManuais && vendasManuais[tipo] ? vendasManuais[tipo] : [])
      .reduce((total: number, v: VendaManual) => total + (v.valor || 0), 0)
    
    acc[tipo] = vendasSistema + vendasManuaisTipo
    return acc
  }, {} as {[key: string]: number})

  const totalGeralVendas = vendas.reduce((total, v) => total + (v.valorTotal || 0), 0)

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const valorRetirada = valorRetiradaFinal ? parseFloat(valorRetiradaFinal) : 0
      await onFecharCaixa(caixaAtual.id, observacoes, valorRetirada)
      await imprimirComprovanteTermico()
      
      setValorRetiradaFinal('')
      setObservacoes('')
      onClose()
      
      setTimeout(() => {
        if (onSucesso) {
          onSucesso()
        } else if (isClient) {
          window.location.href = '/'
        }
      }, 1000)
    } catch (error) {
      console.error('Erro ao fechar caixa:', error)
      alert('Erro ao fechar caixa')
    } finally {
      setLoading(false)
    }
  }

  const imprimirComprovanteTermico = async () => {
    return new Promise<void>((resolve) => {
      const conteudo = gerarConteudoImpressaoTermica()
      const janelaImpressao = window.open('', '_blank')
      if (!janelaImpressao) {
        resolve()
        return
      }
      
      janelaImpressao.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Comprovante de Fechamento</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              font-size: 13px;
              line-height: 1.2;
              margin: 0;
              padding: 5px;
              width: 80mm;
              background: white;
              color: black;
            }
            .text-center { text-align: center; }
            .text-left { text-align: left; }
            .text-right { text-align: right; }
            .fw-bold { font-weight: bold; }
            .linha-divisoria { border-top: 1px dashed black; margin: 4px 0; }
            table { width: 100%; border-collapse: collapse; }
            td { padding: 3px 2px; border: none; }
            .small { font-size: 10px; }
            @media print {
              body { margin: 0; padding: 5px; width: 80mm; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>${conteudo}</body>
        </html>
      `)
      
      janelaImpressao.document.close()
      janelaImpressao.focus()
      
      setTimeout(() => {
        janelaImpressao.print()
        setTimeout(() => {
          janelaImpressao.close()
          resolve()
        }, 500)
      }, 500)
    })
  }

  const gerarConteudoImpressaoTermica = () => {
    const dataAtual = new Date().toLocaleString('pt-BR')
    const valorRetirada = valorRetiradaFinal ? parseFloat(valorRetiradaFinal) : 0

    return `
      <div>
        <div class="text-center">
          <div class="fw-bold">RESTAURANTE EMPORIO DO SABOR</div>
          <div>CNPJ: 12.345.678/0001-90</div>
        </div>
        <div class="text-center">
          <div class="fw-bold">FECHAMENTO DE CAIXA</div>
          <div>RELATÓRIO FINAL</div>
          <div>Data: ${dataAtual}</div>
        </div>
        <div class="linha-divisoria"></div>
        <table>
          <tr><td class="text-left">Valor de Abertura:</td><td class="text-right">${formatarMoeda(valorAbertura)}</td></tr>
          <tr><td class="text-left">Vendas em Dinheiro:</td><td class="text-right">${formatarMoeda(vendasDinheiro)}</td></tr>
          <tr><td class="text-left">Total de Vendas:</td><td class="text-right">${formatarMoeda(totalGeralVendas)}</td></tr>
          <tr><td class="text-left">Total de Retiradas:</td><td class="text-right">${formatarMoeda(totalRetiradas)}</td></tr>
          ${valorRetirada > 0 ? `<tr><td class="text-left">Retirada Final:</td><td class="text-right">${formatarMoeda(valorRetirada)}</td></tr>` : ''}
        </table>
        <div class="linha-divisoria"></div>
        <div class="fw-bold text-center">VENDAS POR FORMA PAGTO</div>
        <table>
          ${tiposPagamento.map(tipo => {
            const totalTipo = totaisPorTipo[tipo] || 0
            return totalTipo > 0 ? `<tr><td class="text-left">${formatarTipoPagamento(tipo)}:</td><td class="text-right">${formatarMoeda(totalTipo)}</td></tr>` : ''
          }).join('')}
        </table>
        <div class="linha-divisoria"></div>
        <div class="fw-bold text-center">DETALHES DAS RETIRADAS</div>
        ${retiradas && retiradas.length > 0 ? retiradas.map(retirada => `
          <table><tr>
            <td class="text-right" style="width: 40%;">${formatarMoeda(retirada.valor)}</td>
            <td class="text-left" style="width: 60%;"><small>${(retirada.observacao || 'Sem observação').substring(0, 40)}</small></td>
          </tr></table>
        `).join('') : '<div class="text-center">Nenhuma retirada</div>'}
        <div class="linha-divisoria"></div>
        <table>
          <tr><td class="text-left fw-bold">Saldo em Dinheiro:</td><td class="text-right fw-bold">${formatarMoeda(saldoFinal - valorRetirada)}</td></tr>
          <tr><td class="text-left fw-bold">Faturamento Final:</td><td class="text-right fw-bold">${formatarMoeda(totalGeralVendas - totalRetiradas - valorRetirada)}</td></tr>
        </table>
        <div class="linha-divisoria"></div>
        <div class="text-center">
          <div>*** CAIXA FECHADO ***</div>
          <div>Restaurante Emporio do Sabor</div>
        </div>
      </div>
    `
  }

  if (!show) return null

  return (
    <>
      {/* Modal Principal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
        <div className="bg-surface rounded-lg shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto animate-slide-in">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Fechar Caixa
            </h2>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors" disabled={loading}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Formulário */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="valorRetiradaFechamento" className="block text-sm font-medium text-foreground mb-1">
                    Valor de Retirada Final (Opcional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                    <input 
                      type="number"
                      id="valorRetiradaFechamento"
                      step="0.01"
                      min="0"
                      value={valorRetiradaFinal}
                      onChange={(e) => setValorRetiradaFinal(e.target.value)}
                      disabled={loading}
                      className="w-full pl-10 pr-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                      placeholder="0,00"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="obsRetiradaFechamento" className="block text-sm font-medium text-foreground mb-1">
                    Observação do Fechamento
                  </label>
                  <textarea
                    id="obsRetiradaFechamento"
                    rows={3}
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background resize-none"
                    placeholder="Observações sobre o fechamento..."
                  />
                </div>
              </div>

              {/* Resumo */}
              <div className="border border-border rounded-lg">
                <div className="bg-primary px-4 py-2 rounded-t-lg">
                  <h6 className="font-semibold text-primary-foreground">Resumo do Fechamento</h6>
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex justify-between"><span className="text-muted-foreground">Valor de Abertura:</span><strong>{formatarMoeda(valorAbertura)}</strong></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Vendas em Dinheiro:</span><strong>{formatarMoeda(vendasDinheiro)}</strong></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Total Faturado:</span><strong>{formatarMoeda(totalGeralVendas)}</strong></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Total de Retiradas:</span><strong className="text-destructive">{formatarMoeda(totalRetiradas)}</strong></div>
                  <div className="flex justify-between pt-2 border-t border-border">
                    <span className="font-bold">Saldo Final:</span>
                    <span className={`font-bold ${saldoFinal < 0 ? 'text-destructive' : 'text-success'}`}>{formatarMoeda(saldoFinal)}</span>
                  </div>
                  {valorRetiradaFinal && parseFloat(valorRetiradaFinal) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Retirada Final:</span>
                      <strong className="text-yellow-600">{formatarMoeda(parseFloat(valorRetiradaFinal))}</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Vendas por Tipo */}
            <div className="mt-6">
              <h6 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Vendas por Tipo de Pagamento
              </h6>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {tiposPagamento.map(tipo => {
                  const totalTipo = totaisPorTipo[tipo] || 0
                  if (totalTipo === 0) return null
                  return (
                    <div key={tipo} className="flex justify-between items-center p-2 bg-surface-2 rounded-lg">
                      <span className="text-muted-foreground">{formatarTipoPagamento(tipo)}:</span>
                      <strong>{formatarMoeda(totalTipo)}</strong>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-4 border-t border-border">
            <button onClick={onClose} disabled={loading} className="px-4 py-2 bg-surface-20 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors">
              Cancelar
            </button>
            <button onClick={() => setShowPreview(true)} disabled={loading} className="px-4 py-2 border border-primary text-primary hover:bg-primary/10 font-medium rounded-lg transition-colors flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Pré-visualizar
            </button>
            <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 bg-destructive hover:bg-destructive/90 text-white font-medium rounded-lg transition-colors flex items-center gap-2">
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Fechando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Fechar Caixa & Imprimir
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Pré-visualização */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
          <div className="bg-surface rounded-lg shadow-xl w-full max-w-lg mx-4 animate-slide-in">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Pré-visualização do Comprovante
              </h2>
              <button onClick={() => setShowPreview(false)} className="text-muted-foreground hover:text-foreground">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-sm text-yellow-800">
                Esta é uma pré-visualização do comprovante que será impresso na impressora térmica.
              </div>
              <div 
                className="border p-3 bg-surface mx-auto"
                style={{ fontFamily: 'Courier New, monospace', fontSize: '12px', lineHeight: '1.2', maxWidth: '80mm' }}
                dangerouslySetInnerHTML={{ __html: gerarConteudoImpressaoTermica() }}
              />
              <div className="mt-4 p-3 bg-info/5 rounded-lg text-sm text-blue-800">
                <strong>Largura:</strong> 80mm (impressora térmica) | <strong>Fonte:</strong> Courier New
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-border">
              <button onClick={() => setShowPreview(false)} className="px-4 py-2 bg-surface-20 hover:bg-gray-600 text-white rounded-lg">Fechar</button>
              <button onClick={async () => { await imprimirComprovanteTermico(); setShowPreview(false); }} className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Imprimir Agora
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}