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
    <div className="min-h-screen bg-gray-100">
      {/* Header - mesmo estilo da página Fichas Técnicas */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Abrir e Fechar Caixa Diário</h1>
          <p className="text-sm text-gray-500">Gerencie seu caixa de forma simples e eficiente</p>
        </div>
        <Button 
          onClick={handleAbrirCaixa}
          disabled={loading}
          className="bg-[#de4838] hover:bg-[#c73d2e] text-white rounded-full px-5"
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
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden max-w-md mx-auto">
          <div className="bg-gradient-to-r from-blue-500/10 to-transparent p-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-800">Consultar Caixa</h3>
            </div>
          </div>
          <div className="p-5">
            <div className="mb-4">
              <label htmlFor="dataConsulta" className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">
                Selecione a Data
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input 
                  type="date" 
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#de4838] focus:border-transparent bg-white text-sm"
                  id="dataConsulta"
                  value={dataConsulta}
                  onChange={(e) => setDataConsulta(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            <button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
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
            <p className="text-xs text-gray-400 text-center mt-3">
              Consulte caixas abertos ou fechados em qualquer data
            </p>
          </div>
        </div>

        {/* Status do Sistema 
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden max-w-md mx-auto mt-4">
          <div className="bg-gradient-to-r from-emerald-500/10 to-transparent py-2.5 px-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-600" />
              <h3 className="font-semibold text-gray-800 text-sm">Status do Sistema</h3>
            </div>
          </div>
          <div className="py-3 px-4">
            <div className="flex items-center justify-between gap-2">
              {/ Backend Status /}
              <div className="flex-1 flex items-center justify-between py-1.5 px-2 bg-gray-100 rounded-lg">
                <span className="text-xs font-medium text-gray-600">Backend:</span>
                <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                  statusBackend === 'Online' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
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
              <div className="flex-1 flex items-center justify-between py-1.5 px-2 bg-gray-100 rounded-lg">
                <span className="text-xs font-medium text-gray-600">Banco:</span>
                <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                  statusDatabase === 'Conectado' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
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
                className="flex items-center justify-center gap-1 px-2 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-all duration-200"
                onClick={verificarStatus}
                disabled={loading}
              >
                <RefreshCw className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>*/}

        {/* Dica rápida */}
        <div className="bg-gradient-to-r from-[#de4838]/5 to-transparent rounded-xl p-4 border border-[#de4838]/10 max-w-md mx-auto mt-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#de4838]/10 flex-shrink-0">
              <Sparkles className="h-4 w-4 text-[#de4838]" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Dica rápida</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Mantenha o caixa sempre organizado para um melhor controle financeiro do seu negócio!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}