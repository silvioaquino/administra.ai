'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Plus, Trash2, Save, ArrowLeft, CreditCard, Percent, TrendingUp, Wallet, Calculator } from 'lucide-react'
import { toast } from 'sonner'
import { ResultadosTaxas } from '@/app/(dashboard)/planejamento-financeiro/components/ResultadosTaxas'

interface Maquininha {
  id?: string
  nome: string
  taxaDebito: number
  taxaCredito: number
  aluguel: number
  ativo: boolean
}

interface DistribuicaoVendas {
  debito: number
  credito: number
  voucher: number
}

interface OutrasTaxas {
  voucher: number
  simplesNacional: number
  manutencao: number
}

export default function TaxasConfigPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [anoAtual, setAnoAtual] = useState(new Date().getFullYear())
  const [mesAtual, setMesAtual] = useState(new Date().getMonth() + 1)

  const [maquininhas, setMaquininhas] = useState<Maquininha[]>([])
  const [distribuicaoVendas, setDistribuicaoVendas] = useState<DistribuicaoVendas>({ debito: 0, credito: 0, voucher: 0 })
  const [outrasTaxas, setOutrasTaxas] = useState<OutrasTaxas>({ voucher: 0, simplesNacional: 0, manutencao: 0 })
  const [faturamentoTotal, setFaturamentoTotal] = useState(0)
  const [folhaSalarialTotalMensal, setFolhaSalarialTotalMensal] = useState(0)
  const [salvando, setSalvando] = useState(false)

  const meses = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' },
  ]

  const carregarDados = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/planejamento-financeiro/despesas-variaveis?ano=${anoAtual}&mes=${mesAtual}`)
      const data = await res.json()
      if (data.success && data.dados) {
        setMaquininhas(data.dados.config?.maquininhas || [])
        setDistribuicaoVendas(data.dados.config?.distribuicaoVendas || { debito: 0, credito: 0, voucher: 0 })
        setOutrasTaxas({
          voucher: data.dados.config?.taxaVoucher || 0,
          simplesNacional: data.dados.config?.simplesNacional || 0,
          manutencao: data.dados.config?.manutencao || 0
        })
        setFaturamentoTotal(data.dados.faturamentoBase || 0)
      }

      const folhaRes = await fetch(`/api/planejamento/folha-salarial?ano=${anoAtual}`)
      const folhaData = await folhaRes.json()
      if (folhaData.success && folhaData.dados) {
        setFolhaSalarialTotalMensal(folhaData.dados.totalMensal || 0)
      }
    } catch (error) {
      console.error('Erro ao carregar:', error)
    } finally {
      setLoading(false)
    }
  }, [anoAtual, mesAtual])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  const salvarDados = async () => {
    setSalvando(true)
    try {
      const response = await fetch('/api/planejamento-financeiro/despesas-variaveis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ano: anoAtual,
          mes: mesAtual,
          percentualTotal: 0,
          faturamentoBase: faturamentoTotal,
          config: {
            maquininhas,
            distribuicaoVendas,
            taxaVoucher: outrasTaxas.voucher,
            simplesNacional: outrasTaxas.simplesNacional,
            manutencao: outrasTaxas.manutencao
          },
          resultados: {}
        })
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Configurações salvas com sucesso!')
        router.back()
      } else {
        toast.error('Erro ao salvar')
      }
    } catch (error) {
      toast.error('Erro ao salvar dados')
    } finally {
      setSalvando(false)
    }
  }

  const adicionarMaquininha = () => {
    setMaquininhas([...maquininhas, {
      nome: `Maquininha ${maquininhas.length + 1}`,
      taxaDebito: 0,
      taxaCredito: 0,
      aluguel: 0,
      ativo: true
    }])
  }

  const removerMaquininha = (index: number) => {
    setMaquininhas(maquininhas.filter((_, i) => i !== index))
  }

  const atualizarMaquininha = (index: number, campo: keyof Maquininha, valor: any) => {
    setMaquininhas(maquininhas.map((m, i) =>
      i === index ? { ...m, [campo]: valor } : m
    ))
  }

  const totalDistribuicao = distribuicaoVendas.debito + distribuicaoVendas.credito + distribuicaoVendas.voucher

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#de4838] border-t-transparent" />
      </div>
    )
  }

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
            <h1 className="text-xl font-semibold text-gray-800">Configuração de Taxas</h1>
            <p className="text-sm text-gray-500">Maquininhas, distribuição e outras taxas</p>
          </div>
        </div>
        <Button
          onClick={salvarDados}
          disabled={salvando || totalDistribuicao !== 100}
          className="bg-[#de4838] hover:bg-[#c73d2e] text-white rounded-full px-5"
        >
          <Save className="mr-2 h-4 w-4" />
          {salvando ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Filtro de mês/ano */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
          <div className="bg-gray-50 p-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-[#de4838]" />
              <h3 className="font-semibold text-gray-800">Período de Referência</h3>
            </div>
          </div>
          <div className="p-5">
            <div className="flex gap-4 items-end">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Ano</Label>
                <div className="relative">
                  <select
                    value={anoAtual}
                    onChange={e => setAnoAtual(parseInt(e.target.value))}
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#de4838] appearance-none pr-8"
                  >
                    <option value={2024}>2024</option>
                    <option value={2025}>2025</option>
                    <option value={2026}>2026</option>
                    <option value={2027}>2027</option>
                    <option value={2028}>2028</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Mês</Label>
                <div className="relative">
                  <select
                    value={mesAtual}
                    onChange={e => setMesAtual(parseInt(e.target.value))}
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#de4838] appearance-none pr-8"
                  >
                    {meses.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Maquininhas */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
          <div className="bg-gray-50 p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-[#de4838]" />
                <h3 className="font-semibold text-gray-800">Maquininhas</h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={adicionarMaquininha}
                className="rounded-lg border-gray-200 hover:border-[#de4838] hover:bg-[#de4838]/5"
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </div>
          </div>
          <div className="p-5">
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {maquininhas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p>Nenhuma maquininha cadastrada</p>
                  <p className="text-sm text-gray-400 mt-1">Clique em "Adicionar" para começar</p>
                </div>
              ) : (
                maquininhas.map((maq, index) => (
                  <div key={index} className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Nome</Label>
                          <Input
                            type="text"
                            value={maq.nome}
                            onChange={e => atualizarMaquininha(index, 'nome', e.target.value)}
                            className="rounded-lg border-gray-200 focus:ring-[#de4838]"
                            placeholder="Nome da maquininha"
                          />
                        </div>
                        <div className="flex items-end gap-2">
                          <div className="flex-1 space-y-1">
                            <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Taxa Débito (%)</Label>
                            <Input
                              type="number"
                              value={maq.taxaDebito || ''}
                              onChange={e => atualizarMaquininha(index, 'taxaDebito', parseFloat(e.target.value) || 0)}
                              className="text-right font-mono rounded-lg border-gray-200 focus:ring-[#de4838]"
                              step="0.01"
                            />
                          </div>
                          <div className="flex-1 space-y-1">
                            <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Taxa Crédito (%)</Label>
                            <Input
                              type="number"
                              value={maq.taxaCredito || ''}
                              onChange={e => atualizarMaquininha(index, 'taxaCredito', parseFloat(e.target.value) || 0)}
                              className="text-right font-mono rounded-lg border-gray-200 focus:ring-[#de4838]"
                              step="0.01"
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removerMaquininha(index)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg h-9 w-9 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="space-y-1">
                          <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Aluguel (R$)</Label>
                          <Input
                            type="number"
                            value={maq.aluguel || ''}
                            onChange={e => atualizarMaquininha(index, 'aluguel', parseFloat(e.target.value) || 0)}
                            className="text-right font-mono rounded-lg border-gray-200 focus:ring-[#de4838]"
                            step="0.01"
                          />
                        </div>
                        <div className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-2">
                          <span className="text-sm text-gray-600">Ativo</span>
                          <Switch
                            checked={maq.ativo}
                            onCheckedChange={() => atualizarMaquininha(index, 'ativo', !maq.ativo)}
                            size="xs"
                            className="data-checked:bg-emerald-500 data-checked:border-emerald-500 border-gray-300 dark:border-gray-600"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Distribuição de Vendas */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
          <div className="bg-gray-50 p-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Percent className="h-5 w-5 text-[#de4838]" />
              <h3 className="font-semibold text-gray-800">Distribuição de Vendas</h3>
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Débito (%)</Label>
                <Input
                  type="number"
                  value={distribuicaoVendas.debito || ''}
                  onChange={e => setDistribuicaoVendas({ ...distribuicaoVendas, debito: parseFloat(e.target.value) || 0 })}
                  className="text-right font-mono text-lg font-bold rounded-lg border-gray-200 focus:ring-[#de4838]"
                  step="0.01"
                  min="0"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Crédito (%)</Label>
                <Input
                  type="number"
                  value={distribuicaoVendas.credito || ''}
                  onChange={e => setDistribuicaoVendas({ ...distribuicaoVendas, credito: parseFloat(e.target.value) || 0 })}
                  className="text-right font-mono text-lg font-bold rounded-lg border-gray-200 focus:ring-[#de4838]"
                  step="0.01"
                  min="0"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Voucher (%)</Label>
                <Input
                  type="number"
                  value={distribuicaoVendas.voucher || ''}
                  onChange={e => setDistribuicaoVendas({ ...distribuicaoVendas, voucher: parseFloat(e.target.value) || 0 })}
                  className="text-right font-mono text-lg font-bold rounded-lg border-gray-200 focus:ring-[#de4838]"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-200">
              <span className="text-sm font-medium text-gray-700">Total:</span>
              <span className={`font-bold text-lg ${totalDistribuicao === 100 ? 'text-emerald-600' : 'text-red-600'}`}>
                {totalDistribuicao.toFixed(2)}%
                {totalDistribuicao !== 100 && (
                  <span className="text-xs font-normal text-red-500 ml-2">(Deve ser 100%)</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Outras Taxas */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
          <div className="bg-gray-50 p-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#de4838]" />
              <h3 className="font-semibold text-gray-800">Outras Taxas</h3>
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Voucher (%)</Label>
                <Input
                  type="number"
                  value={outrasTaxas.voucher || ''}
                  onChange={e => setOutrasTaxas({ ...outrasTaxas, voucher: parseFloat(e.target.value) || 0 })}
                  className="text-right font-mono text-lg font-bold rounded-lg border-gray-200 focus:ring-[#de4838]"
                  step="0.01"
                  min="0"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Simples Nacional (%)</Label>
                <Input
                  type="number"
                  value={outrasTaxas.simplesNacional || ''}
                  onChange={e => setOutrasTaxas({ ...outrasTaxas, simplesNacional: parseFloat(e.target.value) || 0 })}
                  className="text-right font-mono text-lg font-bold rounded-lg border-gray-200 focus:ring-[#de4838]"
                  step="0.01"
                  min="0"
                />
              </div>
              <div className="md:col-span-2 space-y-1">
                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Manutenção (%)</Label>
                <Input
                  type="number"
                  value={outrasTaxas.manutencao || ''}
                  onChange={e => setOutrasTaxas({ ...outrasTaxas, manutencao: parseFloat(e.target.value) || 0 })}
                  className="text-right font-mono text-lg font-bold rounded-lg border-gray-200 focus:ring-[#de4838]"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Resultados das Taxas */}
        <div className="mt-6">
          <ResultadosTaxas
            maquininhas={maquininhas}
            distribuicaoVendas={distribuicaoVendas}
            outrasTaxas={outrasTaxas}
            faturamentoTotal={faturamentoTotal}
            folhaSalarialTotalMensal={folhaSalarialTotalMensal}
          />
        </div>
      </div>
    </div>
  )
}