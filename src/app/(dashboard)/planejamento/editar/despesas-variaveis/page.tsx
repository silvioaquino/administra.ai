// src/app/(dashboard)/planejamento/editar/despesas-variaveis/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, CreditCard, Percent, Building2, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatCurrency, formatPercentage } from "@/lib/utils"

interface TaxasConfig {
  distribuicaoVendas: { debito: number; credito: number; voucher: number }
  distribuicaoMaquininhas: { infinitepay: number; stone: number; caixa: number }
  taxas: {
    debito: { infinitepay: number; stone: number; caixa: number }
    credito: { infinitepay: number; stone: number; caixa: number }
    voucher: number
  }
  aluguelMaquininhas: { stone1: number; stone2: number }
  manutencao: number
  simplesNacional: number
}

export default function EditarDespesasVariaveisPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [faturamentoBase, setFaturamentoBase] = useState(30000)
  const [config, setConfig] = useState<TaxasConfig>({
    distribuicaoVendas: { debito: 40, credito: 50, voucher: 10 },
    distribuicaoMaquininhas: { infinitepay: 50, stone: 30, caixa: 20 },
    taxas: {
      debito: { infinitepay: 1.37, stone: 2.34, caixa: 4.48 },
      credito: { infinitepay: 3.15, stone: 6.44, caixa: 5.78 },
      voucher: 7.0
    },
    aluguelMaquininhas: { stone1: 59.90, stone2: 19.90 },
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
  }, [])

  async function carregarConfig() {
    try {
      const response = await fetch("/api/planejamento/taxas-cartao")
      const data = await response.json()
      if (data.success && data.config) {
        setConfig(data.config)
      }
      const savedFaturamento = localStorage.getItem("faturamentoBase")
      if (savedFaturamento) {
        setFaturamentoBase(Number(savedFaturamento))
      }
    } catch (error) {
      console.error("Erro ao carregar taxas:", error)
    } finally {
      setLoading(false)
    }
    calcularTaxas()
  }

  function calcularTaxas() {
    let taxaDebitoMedia = 0
    for (const [maquina, percentual] of Object.entries(config.distribuicaoMaquininhas)) {
      taxaDebitoMedia += config.taxas.debito[maquina as keyof typeof config.taxas.debito] * (percentual / 100)
    }

    let taxaCreditoMedia = 0
    for (const [maquina, percentual] of Object.entries(config.distribuicaoMaquininhas)) {
      taxaCreditoMedia += config.taxas.credito[maquina as keyof typeof config.taxas.credito] * (percentual / 100)
    }

    const percDebito = config.distribuicaoVendas.debito / 100
    const percCredito = config.distribuicaoVendas.credito / 100
    const percVoucher = config.distribuicaoVendas.voucher / 100
    const taxaMediaGeral = (taxaDebitoMedia * percDebito) + (taxaCreditoMedia * percCredito) + (config.taxas.voucher * percVoucher)

    const aluguelTotal = config.aluguelMaquininhas.stone1 + config.aluguelMaquininhas.stone2
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
      const response = await fetch("/api/planejamento/taxas-cartao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#de4838] border-t-transparent" />
      </div>
    )
  }

  const somaVendas = config.distribuicaoVendas.debito + config.distribuicaoVendas.credito + config.distribuicaoVendas.voucher
  const somaMaquininhas = config.distribuicaoMaquininhas.infinitepay + config.distribuicaoMaquininhas.stone + config.distribuicaoMaquininhas.caixa

  return (
    <div className="min-h-screen bg-gray-50">
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
        <Button 
          onClick={salvarConfig}
          className="bg-[#de4838] hover:bg-[#c73d2e] text-white rounded-full px-5"
          disabled={saving}
        >
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-6 max-w-7xl">
        <Alert className="mb-6 bg-blue-50 border-blue-200 rounded-xl">
          <AlertDescription className="text-sm text-blue-700">
            As taxas configuradas aqui são usadas para calcular o percentual de despesas variáveis
            que será aplicado nas Fichas Técnicas e no Planejamento Financeiro.
          </AlertDescription>
        </Alert>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Distribuição das Vendas */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gray-50 p-4 border-b border-gray-100">
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

          {/* Distribuição das Maquininhas */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gray-50 p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-[#de4838]" />
                <h3 className="font-semibold text-gray-800">Distribuição entre Maquininhas (%)</h3>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">InfinitePay</Label>
                <Input
                  type="number"
                  step="1"
                  value={config.distribuicaoMaquininhas.infinitepay}
                  onChange={(e) => atualizarCampo("distribuicaoMaquininhas.infinitepay", Number(e.target.value))}
                  className="rounded-lg border-gray-200 focus:ring-[#de4838]"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Stone</Label>
                <Input
                  type="number"
                  step="1"
                  value={config.distribuicaoMaquininhas.stone}
                  onChange={(e) => atualizarCampo("distribuicaoMaquininhas.stone", Number(e.target.value))}
                  className="rounded-lg border-gray-200 focus:ring-[#de4838]"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Caixa</Label>
                <Input
                  type="number"
                  step="1"
                  value={config.distribuicaoMaquininhas.caixa}
                  onChange={(e) => atualizarCampo("distribuicaoMaquininhas.caixa", Number(e.target.value))}
                  className="rounded-lg border-gray-200 focus:ring-[#de4838]"
                />
              </div>
              <Alert className={somaMaquininhas === 100 ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}>
                <AlertDescription className={somaMaquininhas === 100 ? "text-emerald-700" : "text-red-700"}>
                  Total: {somaMaquininhas}% {somaMaquininhas !== 100 && "(Deve ser 100%)"}
                </AlertDescription>
              </Alert>
            </div>
          </div>

          {/* Taxas Débito */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gray-50 p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Taxas Débito (%)</h3>
            </div>
            <div className="p-5 space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">InfinitePay Débito</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={config.taxas.debito.infinitepay}
                  onChange={(e) => atualizarCampo("taxas.debito.infinitepay", Number(e.target.value))}
                  className="rounded-lg border-gray-200 focus:ring-[#de4838]"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Stone Débito</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={config.taxas.debito.stone}
                  onChange={(e) => atualizarCampo("taxas.debito.stone", Number(e.target.value))}
                  className="rounded-lg border-gray-200 focus:ring-[#de4838]"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Caixa Débito</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={config.taxas.debito.caixa}
                  onChange={(e) => atualizarCampo("taxas.debito.caixa", Number(e.target.value))}
                  className="rounded-lg border-gray-200 focus:ring-[#de4838]"
                />
              </div>
            </div>
          </div>

          {/* Taxas Crédito */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gray-50 p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Taxas Crédito (%)</h3>
            </div>
            <div className="p-5 space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">InfinitePay Crédito</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={config.taxas.credito.infinitepay}
                  onChange={(e) => atualizarCampo("taxas.credito.infinitepay", Number(e.target.value))}
                  className="rounded-lg border-gray-200 focus:ring-[#de4838]"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Stone Crédito</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={config.taxas.credito.stone}
                  onChange={(e) => atualizarCampo("taxas.credito.stone", Number(e.target.value))}
                  className="rounded-lg border-gray-200 focus:ring-[#de4838]"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Caixa Crédito</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={config.taxas.credito.caixa}
                  onChange={(e) => atualizarCampo("taxas.credito.caixa", Number(e.target.value))}
                  className="rounded-lg border-gray-200 focus:ring-[#de4838]"
                />
              </div>
            </div>
          </div>

          {/* Outras Taxas */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gray-50 p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Outras Taxas</h3>
            </div>
            <div className="p-5 space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Taxa Voucher (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={config.taxas.voucher}
                  onChange={(e) => atualizarCampo("taxas.voucher", Number(e.target.value))}
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
                  <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Aluguel Stone 1 (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={config.aluguelMaquininhas.stone1}
                    onChange={(e) => atualizarCampo("aluguelMaquininhas.stone1", Number(e.target.value))}
                    className="rounded-lg border-gray-200 focus:ring-[#de4838]"
                  />
                </div>
                <div className="space-y-1 mt-3">
                  <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Aluguel Stone 2 (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={config.aluguelMaquininhas.stone2}
                    onChange={(e) => atualizarCampo("aluguelMaquininhas.stone2", Number(e.target.value))}
                    className="rounded-lg border-gray-200 focus:ring-[#de4838]"
                  />
                </div>
                <div className="space-y-1 mt-3">
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
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gray-50 p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                <h3 className="font-semibold text-emerald-600">RESULTADOS DOS CÁLCULOS</h3>
              </div>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 gap-3">
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
                  <p className="text-lg font-bold text-gray-700">{formatPercentage(resultados.percentualAluguel)}</p>
                </div>
                <div className="rounded-xl bg-emerald-50 p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">🎯 TOTAL DESPESAS VARIÁVEIS</p>
                  <p className="text-xl font-bold text-emerald-600">{formatPercentage(resultados.totalDespesasVariaveis)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}