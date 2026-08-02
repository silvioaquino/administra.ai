// src/components/caixa/modais/ModalPreviewImpressao.tsx
'use client'

import ComprovanteTermico from '../impressao/ComprovanteTermico'
import { CaixaAbertura, Venda, Retirada, VendaManual } from '@/types/caixa'

interface ModalPreviewImpressaoProps {
  show: boolean
  onClose: () => void
  tipo: 'fechamento' | 'parcial'
  caixaAtual: CaixaAbertura
  vendas: Venda[]
  retiradas: Retirada[]
  vendasManuais: { [key: string]: VendaManual[] }
}

export default function ModalPreviewImpressao({
  show,
  onClose,
  tipo,
  caixaAtual,
  vendas,
  retiradas,
  vendasManuais
}: ModalPreviewImpressaoProps) {
  
  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Pré-visualização - Impressora Térmica 80mm
          </h2>
          <button 
            type="button" 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="text-center mb-4">
            <small className="text-muted-foreground">
              Visualização do que será impresso na impressora térmica
            </small>
          </div>
          
          <ComprovanteTermico
            tipo={tipo}
            caixaAtual={caixaAtual}
            vendas={vendas}
            retiradas={retiradas}
            vendasManuais={vendasManuais}
            onImprimir={onClose}
          />
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-border">
          <button 
            type="button" 
            className="px-4 py-2 bg-surface-20 hover:bg-muted text-white font-medium rounded-lg transition-colors"
            onClick={onClose}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}