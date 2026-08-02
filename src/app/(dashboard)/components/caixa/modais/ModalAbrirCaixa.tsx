// src/components/caixa/modais/ModalAbrirCaixa.tsx
'use client'

import { useState } from 'react'
import { X, DollarSign, FileText, Check, Wallet, AlertCircle } from 'lucide-react'

interface ModalAbrirCaixaProps {
  show: boolean
  onClose: () => void
  onAbrirCaixa: (valorInicial: number, observacao: string) => Promise<void>
}

export default function ModalAbrirCaixa({ show, onClose, onAbrirCaixa }: ModalAbrirCaixaProps) {
  const [valorInicial, setValorInicial] = useState('0')
  const [observacao, setObservacao] = useState('')
  const [loading, setLoading] = useState(false)

  if (!show) return null

  const handleSubmit = async () => {
    const valor = parseFloat(valorInicial)
    if (isNaN(valor) || valor < 0) {
      alert('Por favor, insira um valor inicial válido')
      return
    }

    setLoading(true)
    try {
      await onAbrirCaixa(valor, observacao)
      setValorInicial('0')
      setObservacao('')
      onClose()
    } catch (error) {
      console.error('Erro ao abrir caixa:', error)
      alert('Erro ao abrir caixa')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-surface rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/5 to-transparent p-5 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-sm">
                <Wallet className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-white">Abrir Caixa</h2>
            </div>
            <button 
              onClick={onClose}
              className="rounded-full p-1.5 hover:bg-surface-2 transition-colors"
              disabled={loading}
            >
              <X className="h-4 w-4 text-muted-foreground/70" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Informe o saldo inicial em dinheiro para abrir o caixa
          </p>
        </div>
        
        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Valor Inicial */}
          <div className="space-y-1.5">
            <label htmlFor="valorInicial" className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Valor Inicial em Caixa
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 font-medium">R$</span>
              <input 
                type="number" 
                id="valorInicial"
                step="0.01" 
                min="0"
                value={valorInicial}
                onChange={(e) => setValorInicial(e.target.value)}
                disabled={loading}
                className="w-full pl-9 pr-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-surface text-sm"
                placeholder="0,00"
              />
            </div>
            <p className="text-[10px] text-muted-foreground/70">
              Valor que você tem em mãos no momento da abertura
            </p>
          </div>
          
          {/* Observações */}
          <div className="space-y-1.5">
            <label htmlFor="observacao" className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Observações
            </label>
            <textarea 
              id="observacao"
              rows={3}
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-surface text-sm resize-none"
              placeholder="Observações sobre abertura do caixa..."
            />
          </div>

          {/* Info adicional */}
          <div className="bg-info/5 rounded-xl p-3 border border-info/30">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-info mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-info">Informação importante</p>
                <p className="text-[10px] text-info mt-0.5">
                  O saldo informado será registrado como abertura do caixa e poderá ser consultado posteriormente.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex justify-end gap-3 p-5 pt-0">
          <button 
            type="button" 
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-white font-medium rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="button" 
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Abrindo...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Abrir Caixa
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}