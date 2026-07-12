// src/components/caixa/modais/ModalDetalhesRetirada.tsx
'use client'

import { useState } from 'react'
import { Retirada } from '@/types/caixa'
import { formatarMoeda, formatarData } from '@/lib/utils'

interface ModalDetalhesRetiradaProps {
  show: boolean
  onClose: () => void
  retirada: Retirada | null
  onExcluirRetirada: (retiradaId: string) => Promise<void>
}

export default function ModalDetalhesRetirada({ 
  show, 
  onClose, 
  retirada, 
  onExcluirRetirada 
}: ModalDetalhesRetiradaProps) {
  const [loading, setLoading] = useState(false)

  const handleExcluir = async () => {
    if (!retirada) return

    if (!confirm('Tem certeza que deseja excluir esta retirada? Esta ação não pode ser desfeita.')) {
      return
    }

    setLoading(true)
    try {
      await onExcluirRetirada(retirada.id)
      onClose()
    } catch (error) {
      console.error('Erro ao excluir retirada:', error)
      alert('Erro ao excluir retirada')
    } finally {
      setLoading(false)
    }
  }

  if (!show || !retirada) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Detalhes da Retirada</h2>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            disabled={loading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          <div>
            <strong className="text-foreground">Valor:</strong>
            <div className="text-3xl font-bold text-red-600 mt-1">{formatarMoeda(retirada.valor)}</div>
          </div>
          <div>
            <strong className="text-foreground">Data e Hora:</strong>
            <div className="text-muted-foreground mt-1">{formatarData(new Date(retirada.dataRetirada))}</div>
          </div>
          <div>
            <strong className="text-foreground">Observação:</strong>
            <div className="p-3 bg-gray-100 rounded-lg mt-1 text-muted-foreground">
              {retirada.observacao || 'Sem observação'}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-border">
          <button 
            type="button" 
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-gray-1000 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
          >
            Fechar
          </button>
          <button 
            type="button" 
            onClick={handleExcluir}
            disabled={loading}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
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
                Excluir Retirada
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}