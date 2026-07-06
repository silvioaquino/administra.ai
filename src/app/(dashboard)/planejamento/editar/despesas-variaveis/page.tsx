// src/app/(dashboard)/planejamento/editar/despesas-variaveis/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Percent, Building2, TrendingUp, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatCurrency, formatPercentage } from "@/lib/utils"

interface Maquininha {
  id: string
  nome: string
  taxaDebito: number
  taxaCredito: number
  aluguel: number
  ativo: boolean
}

interface ConfiguracaoMaquininhas {
  maquininhas: Maquininha[]
  distribuicaoVendas: {
    debito: number
    credito: number
    voucher: number
  }
  taxaVoucher: number
  manutencao: number
  simplesNacional: number
}

export default function EditarDespesasVariaveisPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [faturamentoBase, setFaturamentoBase] = useState(0)
  const [anoReferencia, setAnoReferencia] = useState(new Date().getFullYear())
  const [config, setConfig] = useState<ConfiguracaoMaquininhas>({
    maquininhas: [
      { id: "1", nome: "InfinitePay", taxaDebito: 1.37, taxaCredito: 3.15, aluguel: 0, ativo: true },
      { id: "2", nome: "Stone", taxaDebito: 2.34, taxaCredito: 6.44, aluguel: 79.80, ativo: true },
      { id: "3", nome: "Caixa", taxaDebito: 4.48, taxaCredito: 5.78, aluguel: 0, ativo: true },
    ],
    distribuicaoVendas: { debito: 40, credito: 50, voucher: 10 },
    manutencao: 1.0,
    simplesNacional: 8.0
  })
  const [resultados, setResultados] = useState({
    debitoMedia: 0,
    creditoMedia: 0,
    taxaMediaGeral: 0,
    aluguelTotal: 0,
    percentualAluguel: 0,
    totalDespesasVariaveis: 0
  })

  useEffect(() => {
    carregarConfig()
  }, [anoReferencia])

  // Recalcular quando faturamentoBase mudar
  useEffect(() => {
    if (faturamentoBase > 0) {
      calcularTaxas()
    }
  }, [faturamentoBase])

  async function carregarConfig() {
    setLoading(true)
    try {
      // Buscar configuração de despesas variáveis
      const response = await fetch(`/api/planejamento/despesas-variaveis?ano=${anoReferencia}`)
      const data = await response.json()
      if (data.success && data.dados) {
        setConfig(data.dados)
      }

      // Buscar indicadores resumo para obter a meta mensal total
      const indicadoresResponse = await fetch(`/api/planejamento/indicadores-resumo?ano=${anoReferencia}`)
      const indicadoresData = await indicadoresResponse.json()

      if (indicadoresData.success && indicadoresData.metaMensalTotal > 0) {
        const metaMensalTotal = indicadoresData.metaMensalTotal
        setFaturamentoBase(metaMensalTotal)
        localStorage.setItem("faturamentoBase", metaMensalTotal.toString())
      }

    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    } finally {
      setLoading(false)
    }
  }

  function calcularTaxas() {
    const maquininhasAtivas = config.maquininhas.filter(m => m.ativo)
    
    // Verificar se há maquininhas ativas e faturamento válido
    if (maquininhasAtivas.length === 0 || faturamentoBase <= 0) {
      setResultados({
        debitoMedia: 0,
        creditoMedia: 0,
        taxaMediaGeral: 0,
        aluguelTotal: 0,
        percentualAluguel: 0,
        totalDespesasVariaveis: 0
      })
      return
    }

    const distribuicaoMaquininhas = 100 / maquininhasAtivas.length

    let taxaDebitoMedia = 0
    let taxaCreditoMedia = 0
    let aluguelTotal = 0

    for (const maquina of maquininhasAtivas) {
      const peso = distribuicaoMaquininhas / 100
      taxaDebitoMedia += maquina.taxaDebito * peso
      taxaCreditoMedia += maquina.taxaCredito * peso
      aluguelTotal += maquina.aluguel
    }

    const percDebito = config.distribuicaoVendas.debito / 100
    const percCredito = config.distribuicaoVendas.credito / 100
    const percVoucher = config.distribuicaoVendas.voucher / 100

    const taxaVoucher = config.taxaVoucher || 7.0
    
    const taxaMediaGeral = (taxaDebitoMedia * percDebito) + (taxaCreditoMedia * percCredito) + (taxaVoucher * percVoucher)
    const percentualAluguel = (aluguelTotal / faturamentoBase) * 100
    const totalDespesasVariaveis = config.simplesNacional + taxaMediaGeral + config.manutencao + percentualAluguel
    
    setResultados({
      debitoMedia: taxaDebitoMedia,
      creditoMedia: taxaCreditoMedia,
      taxaMediaGeral: taxaMediaGeral,
      aluguelTotal: aluguelTotal,
      percentualAluguel: percentualAluguel,
      totalDespesasVariaveis: totalDespesasVariaveis
    })
  }

  async function salvarConfig() {
    setSaving(true)
    try {
      const response = await fetch("/api/planejamento/despesas-variaveis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dados: config,
          ano: anoReferencia,
          faturamentoBase: faturamentoBase
        })
      })
      const data = await response.json()
      if (data.success) {
        localStorage.setItem("faturamentoBase", faturamentoBase.toString())
        alert("Configurações salvas com sucesso!")
        router.push("/planejamento")
      } else {
        alert(data.message || "Erro ao salvar")
      }
    } catch (error) {
      console.error("Erro ao salvar:", error)
      alert("Erro ao salvar configurações")
    } finally {
      setSaving(false)
    }
  }

  function atualizarCampo(path: string, value: number) {
    const partes = path.split(".")
    const novoEstado = { ...config }
    let atual: any = novoEstado
    for (let i = 0; i < partes.length - 1; i++) {
      atual = atual[partes[i]]
    }
    atual[partes[partes.length - 1]] = value
    setConfig(novoEstado)
    setTimeout(calcularTaxas, 100)
  }

  function atualizarMaquininha(id: string, campo: keyof Maquininha, value: number | string | boolean) {
    const novoEstado = { ...config }
    const index = novoEstado.maquininhas.findIndex(m => m.id === id)
    if (index !== -1) {
      novoEstado.maquininhas[index] = { ...novoEstado.maquininhas[index], [campo]: value }
      setConfig(novoEstado)
      setTimeout(calcularTaxas, 100)
    }
  }

  function adicionarMaquininha() {
    const novaMaquininha: Maquininha = {
      id: crypto.randomUUID(),
      nome: `Nova Maquininha ${config.maquininhas.length + 1}`,
      taxaDebito: 0,
      taxaCredito: 0,
      aluguel: 0,
      ativo: true
    }
    setConfig({
      ...config,
      maquininhas: [...config.maquininhas, novaMaquininha]
    })
    setTimeout(calcularTaxas, 100)
  }

  function removerMaquininha(id: string) {
    if (config.maquininhas.filter(m => m.ativo).length <= 1) {
      alert("Você precisa manter pelo menos uma maquininha ativa!")
      return
    }
    setConfig({
      ...config,
      maquininhas: config.maquininhas.map(m => 
        m.id === id ? { ...m, ativo: false } : m
      )
    })
    setTimeout(calcularTaxas, 100)
  }

  function excluirMaquininha(id: string) {
    if (config.maquininhas.filter(m => m.ativo).length <= 1) {
      alert("Você precisa manter pelo menos uma maquininha ativa!")
      return
    }
    setConfig({
      ...config,
      maquininhas: config.maquininhas.filter(m => m.id !== id)
    })
    setTimeout(calcularTaxas, 100)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#de4838] border-t-transparent" />
      </div>
    )
  }

  const maquininhasAtivas = config.maquininhas.filter(m => m.ativo)
  const somaVendas = config.distribuicaoVendas.debito + config.distribuicaoVendas.credito + config.distribuicaoVendas.voucher

  return (
    <div className="min-h-screen bg-[#e5e7eb]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.back()}
            className="rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-gray-800">Despesas Variáveis</h1>
            <p className="text-sm text-gray-500">Configure taxas de cartão e outras despesas variáveis</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <select
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#de4838] appearance-none pr-8"
              value={anoReferencia}
              onChange={(e) => setAnoReferencia(Number(e.target.value))}
            >
              <option value={2024}>2024</option>
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
              <svg className="fill-current h-4 w-4" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
          <Button 
            onClick={salvarConfig}
            className="bg-[#de4838] hover:bg-[#c73d2e] text-white rounded-full px-5"
            disabled={saving}
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-6 max-w-7xl">
        <Alert className="mb-6 bg-blue-50 border-blue-200 rounded-xl">
          <AlertDescription className="text-sm text-blue-700">
            Configure as maquininhas que sua empresa utiliza. Você pode adicionar, editar ou remover operadoras conforme necessário.
            Apenas maquininhas ativas serão consideradas nos cálculos.
          </AlertDescription>
        </Alert>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Maquininhas */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden lg:col-span-2">
            <div className="bg-gray-100 p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-[#de4838]" />
                <h3 className="font-semibold text-gray-800">Maquininhas</h3>
                <span className="text-sm text-gray-500 ml-2">
                  ({maquininhasAtivas.length} ativa{maquininhasAtivas.length !== 1 ? 's' : ''})
                </span>
              </div>
              <Button 
                size="sm"
                onClick={adicionarMaquininha}
                className="bg-[#de4838] hover:bg-[#c73d2e] text-white rounded-lg"
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {config.maquininhas.map((maquina) => (
                  <div 
                    key={maquina.id} 
                    className={`border rounded-xl p-4 transition-all ${maquina.ativo ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-100 opacity-60'}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={maquina.ativo}
                          onChange={(e) => atualizarMaquininha(maquina.id, 'ativo', e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-[#de4838] focus:ring-[#de4838]"
                        />
                        <Label className="text-sm font-medium text-gray-700">
                          {maquina.ativo ? 'Ativa' : 'Inativa'}
                        </Label>
                      </div>
                      <div className="flex gap-1">
                        {maquina.ativo && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removerMaquininha(maquina.id)}
                            className="h-8 w-8 p-0 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50"
                            title="Desativar maquininha"
                          >
                            <span className="text-xs">⏸</span>
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => excluirMaquininha(maquina.id)}
                          className="h-8 w-8 p-0 text-gray-500 hover:text-red-600 hover:bg-red-50"
                          title="Excluir maquininha"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Nome</Label>
                        <Input
                          type="text"
                          value={maquina.nome}
                          onChange={(e) => atualizarMaquininha(maquina.id, 'nome', e.target.value)}
                          className="rounded-lg border-gray-200 focus:ring-[#de4838] text-sm"
                          placeholder="Nome da operadora"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Taxa Débito %</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={maquina.taxaDebito}
                            onChange={(e) => atualizarMaquininha(maquina.id, 'taxaDebito', Number(e.target.value))}
                            className="rounded-lg border-gray-200 focus:ring-[#de4838] text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Taxa Crédito %</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={maquina.taxaCredito}
                            onChange={(e) => atualizarMaquininha(maquina.id, 'taxaCredito', Number(e.target.value))}
                            className="rounded-lg border-gray-200 focus:ring-[#de4838] text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Aluguel (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={maquina.aluguel}
                          onChange={(e) => atualizarMaquininha(maquina.id, 'aluguel', Number(e.target.value))}
                          className="rounded-lg border-gray-200 focus:ring-[#de4838] text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {maquininhasAtivas.length === 0 && (
                <Alert variant="destructive">
                  <AlertDescription>
                    Nenhuma maquininha ativa. Ative pelo menos uma para realizar os cálculos.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          {/* Distribuição das Vendas */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gray-100 p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Percent className="h-5 w-5 text-[#de4838]" />
                <h3 className="font-semibold text-gray-800">Distribuição das Vendas (%)</h3>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Débito</Label>
                <Input
                  type="number"
                  step="1"
                  value={config.distribuicaoVendas.debito}
                  onChange={(e) => atualizarCampo("distribuicaoVendas.debito", Number(e.target.value))}
                  className="rounded-lg border-gray-200 focus:ring-[#de4838]"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Crédito</Label>
                <Input
                  type="number"
                  step="1"
                  value={config.distribuicaoVendas.credito}
                  onChange={(e) => atualizarCampo("distribuicaoVendas.credito", Number(e.target.value))}
                  className="rounded-lg border-gray-200 focus:ring-[#de4838]"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Voucher</Label>
                <Input
                  type="number"
                  step="1"
                  value={config.distribuicaoVendas.voucher}
                  onChange={(e) => atualizarCampo("distribuicaoVendas.voucher", Number(e.target.value))}
                  className="rounded-lg border-gray-200 focus:ring-[#de4838]"
                />
              </div>
              <Alert className={somaVendas === 100 ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}>
                <AlertDescription className={somaVendas === 100 ? "text-emerald-700" : "text-red-700"}>
                  Total: {somaVendas}% {somaVendas !== 100 && "(Deve ser 100%)"}
                </AlertDescription>
              </Alert>
            </div>
          </div>

          {/* Outras Taxas */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gray-100 p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Outras Taxas</h3>
            </div>
            <div className="p-5 space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Voucher (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={7.0}
                  onChange={(e) => {/* Configurar voucher */}}
                  className="rounded-lg border-gray-200 focus:ring-[#de4838]"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Manutenção (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={config.manutencao}
                  onChange={(e) => atualizarCampo("manutencao", Number(e.target.value))}
                  className="rounded-lg border-gray-200 focus:ring-[#de4838]"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Simples Nacional (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={config.simplesNacional}
                  onChange={(e) => atualizarCampo("simplesNacional", Number(e.target.value))}
                  className="rounded-lg border-gray-200 focus:ring-[#de4838]"
                />
              </div>
              <div className="pt-3 border-t border-gray-200">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Faturamento Base (R$)</Label>
                  <Input
                    type="number"
                    step="1000"
                    value={faturamentoBase}
                    onChange={(e) => setFaturamentoBase(Number(e.target.value))}
                    className="rounded-lg border-gray-200 focus:ring-[#de4838]"
                  />
                  <p className="text-xs text-gray-400 mt-1">Usado para calcular o percentual do aluguel das maquininhas</p>
                </div>
              </div>
            </div>
          </div>

          {/* Resultados */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden lg:col-span-2">
            <div className="bg-gray-100 p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                <h3 className="font-semibold text-emerald-600">RESULTADOS DOS CÁLCULOS</h3>
              </div>
            </div>
            <div className="p-5">
              {faturamentoBase === 0 && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-center">
                  <p className="text-sm text-yellow-700">
                    ⚠️ Aguardando dados de faturamento. O cálculo será atualizado automaticamente.
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="rounded-xl bg-blue-50 p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">Taxa Débito Média</p>
                  <p className="text-lg font-bold text-blue-600">{formatPercentage(resultados.debitoMedia)}</p>
                </div>
                <div className="rounded-xl bg-blue-50 p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">Taxa Crédito Média</p>
                  <p className="text-lg font-bold text-blue-600">{formatPercentage(resultados.creditoMedia)}</p>
                </div>
                <div className="rounded-xl bg-amber-50 p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">Taxa Média Geral</p>
                  <p className="text-lg font-bold text-amber-600">{formatPercentage(resultados.taxaMediaGeral)}</p>
                </div>
                <div className="rounded-xl bg-gray-100 p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">Aluguel Total</p>
                  <p className="text-lg font-bold text-gray-700">{formatCurrency(resultados.aluguelTotal)}</p>
                </div>
                <div className="rounded-xl bg-gray-100 p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">Aluguel % (base {formatCurrency(faturamentoBase)})</p>
                  <p className="text-lg font-bold text-gray-700">
                    {faturamentoBase > 0 ? formatPercentage(resultados.percentualAluguel) : '0%'}
                  </p>
                </div>
                <div className="rounded-xl bg-emerald-50 p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">🎯 TOTAL DESPESAS VARIÁVEIS</p>
                  <p className="text-xl font-bold text-emerald-600">
                    {faturamentoBase > 0 ? formatPercentage(resultados.totalDespesasVariaveis) : '0%'}
                  </p>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-500 text-center">
                * Distribuição igual entre {maquininhasAtivas.length} maquininha{maquininhasAtivas.length !== 1 ? 's' : ''} ativa{maquininhasAtivas.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}