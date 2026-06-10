// src/components/caixa/modais/ModalConsultaCaixa.tsx
'use client'

import { CaixaFechamento } from '@/types/caixa'
import { formatarMoeda, formatarTipoPagamento } from '@/lib/utils'

interface ModalConsultaCaixaProps {
  show: boolean
  onClose: () => void
  dadosCaixa: CaixaFechamento | null
}

export default function ModalConsultaCaixa({ show, onClose, dadosCaixa }: ModalConsultaCaixaProps) {
  if (!show) return null

  const formatarData = (dataInput: Date | string | undefined | null) => {
    if (!dataInput) return 'Não informado'
    try {
      const data = dataInput instanceof Date ? dataInput : new Date(dataInput)
      if (isNaN(data.getTime())) return 'Data inválida'
      return data.toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })
    } catch {
      return 'Data inválida'
    }
  }

  const getValor = () => {
    if (!dadosCaixa) return {}
    return {
      valorAbertura: dadosCaixa.valorAbertura || dadosCaixa.valor_abertura || 0,
      totalVendas: dadosCaixa.totalVendas || dadosCaixa.total_vendas || 0,
      saldoFinal: dadosCaixa.saldoFinal || dadosCaixa.saldo_final || 0,
      totalRetiradas: dadosCaixa.total_retiradas || 0,
      vendasDinheiro: dadosCaixa.vendas_dinheiro || 0,
      dataAbertura: dadosCaixa.dataAbertura || dadosCaixa.data_abertura,
      dataFechamento: dadosCaixa.dataFechamento || dadosCaixa.data_fechamento,
      observacao: dadosCaixa.observacao || dadosCaixa.observacoes || 'Nenhuma',
      status: dadosCaixa.status || 'DESCONHECIDO'
    }
  }

  const valores = getValor()
  const tiposPagamento = ['DINHEIRO', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'PIX', 'VR', 'OUTRO']
  const faturamentoLiquido = (valores.totalVendas || 0) - (valores.totalRetiradas || 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl mx-4 max-h-[90vh] overflow-y-auto animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-blue-600">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Consulta de Caixa - Detalhado
          </h2>
          <button onClick={onClose} className="text-white hover:text-gray-200 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {dadosCaixa ? (
            <>
              {/* Informações do Caixa */}
              <div className="border border-border rounded-lg mb-6">
                <div className="bg-gray-100 px-4 py-2 border-b border-border">
                  <h6 className="font-semibold text-foreground flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Informações do Caixa
                  </h6>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm"><strong className="text-foreground">Data Abertura:</strong> <span className="text-muted-foreground">{formatarData(valores.dataAbertura)}</span></p>
                      <p className="text-sm mt-2"><strong className="text-foreground">Data Fechamento:</strong> <span className="text-muted-foreground">{valores.dataFechamento ? formatarData(valores.dataFechamento) : 'Não fechado'}</span></p>
                      <p className="text-sm mt-2"><strong className="text-foreground">Valor Inicial:</strong> <span className="text-muted-foreground">{formatarMoeda(valores.valorAbertura || 0)}</span></p>
                    </div>
                    <div>
                      <p className="text-sm"><strong className="text-foreground">Status:</strong>
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                          valores.status === 'FECHADO' ? 'bg-green-100 text-green-800' :
                          valores.status === 'ABERTO' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                        }`}>{valores.status}</span>
                      </p>
                      <p className="text-sm mt-2"><strong className="text-foreground">Observação:</strong> <span className="text-muted-foreground">{valores.observacao}</span></p>
                      <p className="text-sm mt-2"><strong className="text-foreground">ID do Caixa:</strong> <span className="text-muted-foreground text-xs">{dadosCaixa.id}</span></p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Resumo Financeiro */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="border border-green-200 rounded-lg p-3 text-center bg-green-50">
                  <h6 className="text-xs text-green-700 font-medium">Valor Abertura</h6>
                  <h4 className="text-lg font-bold text-green-700">{formatarMoeda(valores.valorAbertura || 0)}</h4>
                </div>
                <div className="border border-blue-200 rounded-lg p-3 text-center bg-blue-50">
                  <h6 className="text-xs text-blue-700 font-medium">Vendas Dinheiro</h6>
                  <h4 className="text-lg font-bold text-blue-700">{formatarMoeda(valores.vendasDinheiro || 0)}</h4>
                </div>
                <div className="border border-cyan-200 rounded-lg p-3 text-center bg-cyan-50">
                  <h6 className="text-xs text-cyan-700 font-medium">Total Vendas</h6>
                  <h4 className="text-lg font-bold text-cyan-700">{formatarMoeda(valores.totalVendas || 0)}</h4>
                </div>
                <div className="border border-amber-200 rounded-lg p-3 text-center bg-amber-50">
                  <h6 className="text-xs text-amber-700 font-medium">Saldo Final</h6>
                  <h4 className={`text-lg font-bold ${(valores.saldoFinal || 0) < 0 ? 'text-red-600' : 'text-amber-700'}`}>
                    {formatarMoeda(valores.saldoFinal || 0)}
                  </h4>
                </div>
              </div>

              {/* Fechamento Oficial */}
              {dadosCaixa.fechamento && (
                <div className="border border-green-200 rounded-lg mb-6 bg-green-50">
                  <div className="bg-green-600 px-4 py-2 rounded-t-lg">
                    <h6 className="font-semibold text-white flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Resumo Oficial do Fechamento
                    </h6>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div><p className="text-sm"><strong>Data Fechamento:</strong> {formatarData(dadosCaixa.fechamento.data_fechamento)}</p></div>
                      <div><p className="text-sm"><strong>Valor Abertura:</strong> {formatarMoeda(dadosCaixa.fechamento.valor_abertura || 0)}</p></div>
                      <div><p className="text-sm"><strong>Total Vendas:</strong> {formatarMoeda(dadosCaixa.fechamento.total_vendas || 0)}</p></div>
                      <div><p className="text-sm"><strong>Total Retiradas:</strong> {formatarMoeda(dadosCaixa.fechamento.retiradas || 0)}</p></div>
                      <div><p className="text-sm"><strong>Saldo Final:</strong> {formatarMoeda(dadosCaixa.fechamento.saldo_final || 0)}</p></div>
                      <div className="col-span-1"><p className="text-sm"><strong>Observações:</strong> {dadosCaixa.fechamento.observacoes || 'Nenhuma'}</p></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Vendas por Forma Pagamento */}
              {dadosCaixa.vendas_por_forma_pagamento && (
                <div className="border border-border rounded-lg mb-6">
                  <div className="bg-gray-100 px-4 py-2 border-b border-border">
                    <h6 className="font-semibold text-foreground flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      Vendas por Forma de Pagamento
                    </h6>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {tiposPagamento.map(tipo => {
                        const totalTipo = dadosCaixa.vendas_por_forma_pagamento?.[tipo] || 0
                        if (totalTipo === 0) return null
                        return (
                          <div key={tipo} className="flex justify-between items-center p-2 border border-border rounded-lg">
                            <span className="text-muted-foreground">{formatarTipoPagamento(tipo)}:</span>
                            <strong className="text-green-600">{formatarMoeda(totalTipo)}</strong>
                          </div>
                        )
                      })}
                    </div>
                    <div className="mt-4 p-3 bg-gray-100 rounded-lg flex justify-between items-center">
                      <strong className="text-foreground">TOTAL GERAL DE VENDAS:</strong>
                      <strong className="text-foreground text-lg">{formatarMoeda(valores.totalVendas || 0)}</strong>
                    </div>
                    {(dadosCaixa.total_vendas_sistema !== undefined || dadosCaixa.total_vendas_manuais !== undefined) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                        <small className="text-muted-foreground">Vendas Sistema: {formatarMoeda(dadosCaixa.total_vendas_sistema || 0)} ({dadosCaixa.quantidade_vendas || 0} vendas)</small>
                        <small className="text-muted-foreground">Vendas Manuais: {formatarMoeda(dadosCaixa.total_vendas_manuais || 0)} ({dadosCaixa.quantidade_vendas_manuais || 0} vendas)</small>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Retiradas Realizadas */}
              <div className="border border-border rounded-lg mb-6">
                <div className="bg-gray-100 px-4 py-2 border-b border-border">
                  <h6 className="font-semibold text-foreground flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm0 0v-4" />
                    </svg>
                    Retiradas Realizadas
                  </h6>
                </div>
                <div className="p-4">
                  {Array.isArray(dadosCaixa?.retiradas) && dadosCaixa.retiradas.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left p-2">Data/Hora</th>
                            <th className="text-left p-2">Valor</th>
                            <th className="text-left p-2">Observação</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dadosCaixa.retiradas.map((retirada, index) => (
                            <tr key={index} className="border-b border-border">
                              <td className="p-2">{formatarData(retirada.data)}</td>
                              <td className="p-2 text-red-600 font-medium">{formatarMoeda(retirada.valor)}</td>
                              <td className="p-2 text-muted-foreground">{retirada.observacao || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-yellow-50">
                            <td className="p-2 font-bold">TOTAL DE RETIRADAS:</td>
                            <td colSpan={2} className="p-2 text-red-600 font-bold">{formatarMoeda(valores.totalRetiradas || 0)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      Não foram realizadas retiradas neste caixa.
                    </div>
                  )}
                </div>
              </div>

              {/* Resumo Financeiro Final */}
              <div className="border border-primary/30 rounded-lg bg-primary/5">
                <div className="bg-primary px-4 py-2 rounded-t-lg">
                  <h6 className="font-semibold text-primary-foreground flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    Resumo Financeiro Final
                  </h6>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between py-1"><span>Valor de Abertura:</span><strong>{formatarMoeda(valores.valorAbertura || 0)}</strong></div>
                      <div className="flex justify-between py-1"><span>Total de Vendas:</span><strong className="text-green-600">{formatarMoeda(valores.totalVendas || 0)}</strong></div>
                      <div className="flex justify-between py-1"><span>Total de Retiradas:</span><strong className="text-red-600">{formatarMoeda(valores.totalRetiradas || 0)}</strong></div>
                    </div>
                    <div>
                      <div className="flex justify-between py-1"><span>Vendas em Dinheiro:</span><strong>{formatarMoeda(valores.vendasDinheiro || 0)}</strong></div>
                      <div className="flex justify-between py-1"><span>Saldo em Dinheiro:</span><strong className={(valores.saldoFinal || 0) < 0 ? 'text-red-600' : 'text-green-600'}>{formatarMoeda(valores.saldoFinal || 0)}</strong></div>
                      <div className="flex justify-between py-1"><span>Faturamento Líquido:</span><strong className="text-primary">{formatarMoeda(faturamentoLiquido)}</strong></div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <svg className="w-16 h-16 text-yellow-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h5 className="text-lg font-semibold text-foreground mb-2">Nenhum dado encontrado</h5>
              <p className="text-muted-foreground">
                Não foram encontrados dados de caixa para a data selecionada.
                <br /><small>Verifique se o caixa foi aberto na data especificada.</small>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors">
            Fechar
          </button>
          {dadosCaixa && (
            <button onClick={() => window.print()} className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-colors flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Imprimir Relatório
            </button>
          )}
        </div>
      </div>
    </div>
  )
}