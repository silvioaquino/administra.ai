// src/components/caixa/TelaInicial.tsx
'use client'

import { useState, useEffect } from 'react'
import { 
  DollarSign, 
  Search, 
  Activity, 
  Database, 
  Zap, 
  TrendingUp, 
  BarChart3, 
  RefreshCw,
  Calendar,
  Store,
  Sparkles,
  Wallet,
  ArrowRight,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TelaInicialProps {
  onAbrirCaixa: () => void
  onConsultarCaixa: (data: string) => Promise<void>
  loading?: boolean
}

export default function TelaInicial({ 
  onAbrirCaixa, 
  onConsultarCaixa, 
  loading = false 
}: TelaInicialProps) {
  const [dataConsulta, setDataConsulta] = useState(new Date().toISOString().split('T')[0])
  const [statusBackend, setStatusBackend] = useState('Verificando...')
  const [statusDatabase, setStatusDatabase] = useState('Verificando...')

  const verificarStatus = async () => {
    try {
      const response = await fetch('/api/health')
      const data = await response.json()
      
      setStatusBackend(data.status === 'online' ? 'Online' : 'Offline')
      setStatusDatabase(data.database === 'connected' ? 'Conectado' : 'Desconectado')
    } catch (error) {
      setStatusBackend('Offline')
      setStatusDatabase('Desconectado')
    }
  }

  useEffect(() => {
    verificarStatus()
  }, [])

  const handleConsultarCaixa = async () => {
    if (!dataConsulta) {
      alert('Por favor, selecione uma data válida')
      return
    }
    await onConsultarCaixa(dataConsulta)
  }

  const handleAbrirCaixa = () => {
    onAbrirCaixa()
  }

  return (
    <div className="min-h-screen bg-surface-2">
      {/* Header - mesmo estilo da página Fichas Técnicas */}
      <div className="sticky top-0 z-10 bg-surface border-b border-border px-6 py-4 flex items-center justify-between shadow-sm">
        <div>
          <h1 className="text-xl font-semibold text-white">Abrir e Fechar Caixa Diário</h1>
          <p className="text-sm text-muted-foreground">Gerencie seu caixa de forma simples e eficiente</p>
        </div>
        <Button 
          onClick={handleAbrirCaixa}
          disabled={loading}
          className="bg-primary hover:bg-primary/90 text-white rounded-full px-5"
        >
          {loading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
              Processando...
            </>
          ) : (
            <>
              <Wallet className="mr-2 h-4 w-4" />
              Abrir Caixa
            </>
          )}
        </Button>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-6 max-w-7xl">
        {/* Consultar Caixa */}
        <div className="bg-surface rounded-2xl shadow-sm overflow-hidden max-w-md mx-auto">
          <div className="bg-gradient-to-r from-info/10 to-transparent p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-info" />
              <h3 className="font-semibold text-white">Consultar Caixa</h3>
            </div>
          </div>
          <div className="p-5">
            <div className="mb-4">
              <label htmlFor="dataConsulta" className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Selecione a Data
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
                <input 
                  type="date" 
                  className="w-full pl-9 pr-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-surface text-sm"
                  id="dataConsulta"
                  value={dataConsulta}
                  onChange={(e) => setDataConsulta(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            <button 
              className="w-full bg-info hover:bg-info/90 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
              onClick={handleConsultarCaixa}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Consultando...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Consultar Caixa
                </>
              )}
            </button>
            <p className="text-xs text-muted-foreground/70 text-center mt-3">
              Consulte caixas abertos ou fechados em qualquer data
            </p>
          </div>
        </div>

        {/* Status do Sistema 
        <div className="bg-surface rounded-2xl shadow-sm overflow-hidden max-w-md mx-auto mt-4">
          <div className="bg-gradient-to-r from-success/10 to-transparent py-2.5 px-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-success" />
              <h3 className="font-semibold text-white text-sm">Status do Sistema</h3>
            </div>
          </div>
          <div className="py-3 px-4">
            <div className="flex items-center justify-between gap-2">
              {/ Backend Status /}
              <div className="flex-1 flex items-center justify-between py-1.5 px-2 bg-surface-2 rounded-lg">
                <span className="text-xs font-medium text-muted-foreground">Backend:</span>
                <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                  statusBackend === 'Online' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                }`}>
                  {statusBackend === 'Online' ? (
                    <CheckCircle className="h-2.5 w-2.5" />
                  ) : (
                    <XCircle className="h-2.5 w-2.5" />
                  )}
                  {statusBackend}
                </span>
              </div>

              {/ Database Status /}
              <div className="flex-1 flex items-center justify-between py-1.5 px-2 bg-surface-2 rounded-lg">
                <span className="text-xs font-medium text-muted-foreground">Banco:</span>
                <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                  statusDatabase === 'Conectado' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                }`}>
                  {statusDatabase === 'Conectado' ? (
                    <CheckCircle className="h-2.5 w-2.5" />
                  ) : (
                    <XCircle className="h-2.5 w-2.5" />
                  )}
                  {statusDatabase}
                </span>
              </div>

              {/ Botão Refresh /}
              <button 
                className="flex items-center justify-center gap-1 px-2 py-1.5 bg-surface-2 hover:bg-surface-2 text-white text-xs font-medium rounded-lg transition-all duration-200"
                onClick={verificarStatus}
                disabled={loading}
              >
                <RefreshCw className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>*/}

        {/* Dica rápida */}
        <div className="bg-gradient-to-r from-primary/5 to-transparent rounded-xl p-4 border border-primary/10 max-w-md mx-auto mt-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Dica rápida</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Mantenha o caixa sempre organizado para um melhor controle financeiro do seu negócio!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}