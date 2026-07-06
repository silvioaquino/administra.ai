'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Plus, Trash2, Save, ArrowLeft, Percent } from 'lucide-react'
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
  const [anoAtual, setAnoAtual] = useState(new Date().getFullYear())
  const [mesAtual, setMesAtual] = useState(new Date().getMonth() + 1)
  const [loading, setLoading] = useState(true)

  // Estados
  const [maquininhas, setMaquininhas] = useState<Maquininha[]>([])
  const [distribuicaoVendas, setDistribuicaoVendas] = useState<DistribuicaoVendas>({ debito: 0, credito: 0, voucher: 0 })
  const [outrasTaxas, setOutrasTaxas] = useState<OutrasTaxas>({ voucher: 0, simplesNacional: 0, manutencao: 0 })
  const [faturamentoTotal, setFaturamentoTotal] = useState(0)
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

  // Carregar dados
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
    } catch (error) {
      console.error('Erro ao carregar:', error)
    } finally {
      setLoading(false)
    }
  }, [anoAtual, mesAtual])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  // Salvar tudo
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

  // Adicionar maquininha
  const adicionarMaquininha = () => {
    setMaquininhas([...maquininhas, {
      nome: `Maquininha ${maquininhas.length + 1}`,
      taxaDebito: 0,
      taxaCredito: 0,
      aluguel: 0,
      ativo: true
    }])
  }

  // Remover maquininha
  const removerMaquininha = (index: number) => {
    setMaquininhas(maquininhas.filter((_, i) => i !== index))
  }

  // Atualizar maquininha
  const atualizarMaquininha = (index: number, campo: keyof Maquininha, valor: any) => {
    setMaquininhas(maquininhas.map((m, i) =>
      i === index ? { ...m, [campo]: valor } : m
    ))
  }

  const totalDistribuicao = distribuicaoVendas.debito + distribuicaoVendas.credito + distribuicaoVendas.voucher

  return (
    <div className="min-h-screen bg-[#e5e7eb]">
      <div className="sticky top-0 z-10 ml-3 mr-3 sm:ml-6 sm:mr-6 bg-white border-b border-gray-200 px-3 py-3 sm:px-6 sm:py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-gray-800">Configuração de Taxas</h1>
            <p className="text-sm text-gray-500">Maquininhas, distribuição e outras taxas</p>
          </div>
        </div>
        <Button
          onClick={salvarDados}
          disabled={salvando || totalDistribuicao !== 100}
          className="bg-[#de4838] hover:bg-[#c73d2e] text-white rounded-full px-4 py-2 disabled:opacity-50"
        >
          <Save className="mr-2 h-4 w-4" />
          {salvando ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>

      <div className="container mx-auto p-6 max-w-4xl">
        {/* Filtro de mês/ano */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4 items-end">
              <div>
                <Label className="text-sm text-gray-600 mb-1">Ano</Label>
                <select
                  value={anoAtual}
                  onChange={e => setAnoAtual(parseInt(e.target.value))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#de4838]"
                >
                  <option value={2024}>2024</option>
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                  <option value={2027}>2027</option>
                  <option value={2028}>2028</option>
                </select>
              </div>
              <div>
                <Label className="text-sm text-gray-600 mb-1">Mês</Label>
                <select
                  value={mesAtual}
                  onChange={e => setMesAtual(parseInt(e.target.value))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#de4838]"
                >
                  {meses.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Maquininhas */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Maquininhas</span>
              <Button
                variant="outline"
                size="sm"
                onClick={adicionarMaquininha}
                className="rounded-lg border-gray-200 hover:border-[#de4838]"
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {maquininhas.map((maq, index) => (
                <Card key={index} className="border border-gray-200">
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-gray-500 mb-1">Nome</Label>
                        <Input
                          type="text"
                          value={maq.nome}
                          onChange={e => atualizarMaquininha(index, 'nome', e.target.value)}
                          className="text-sm font-medium"
                          placeholder="Nome da maquininha"
                        />
                      </div>
                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <Label className="text-xs text-gray-500 mb-1">Taxa Débito (%)</Label>
                          <Input
                            type="number"
                            value={maq.taxaDebito || ''}
                            onChange={e => atualizarMaquininha(index, 'taxaDebito', parseFloat(e.target.value) || 0)}
                            className="text-right font-mono"
                            step="0.01"
                          />
                        </div>
                        <div className="flex-1">
                          <Label className="text-xs text-gray-500 mb-1">Taxa Crédito (%)</Label>
                          <Input
                            type="number"
                            value={maq.taxaCredito || ''}
                            onChange={e => atualizarMaquininha(index, 'taxaCredito', parseFloat(e.target.value) || 0)}
                            className="text-right font-mono"
                            step="0.01"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removerMaquininha(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div>
                        <Label className="text-xs text-gray-500 mb-1">Aluguel (R$)</Label>
                        <Input
                          type="number"
                          value={maq.aluguel || ''}
                          onChange={e => atualizarMaquininha(index, 'aluguel', parseFloat(e.target.value) || 0)}
                          className="text-right font-mono"
                          step="0.01"
                        />
                      </div>
                      <div className="flex items-center justify-between border rounded-lg px-3 py-2">
                        <span className="text-sm text-gray-600">Ativo</span>
                        <Switch
                          checked={maq.ativo}
                          onCheckedChange={() => atualizarMaquininha(index, 'ativo', !maq.ativo)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Distribuição de Vendas */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Distribuição de Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-xs text-gray-500 mb-1">Débito (%)</Label>
                <Input
                  type="number"
                  value={distribuicaoVendas.debito || ''}
                  onChange={e => setDistribuicaoVendas({ ...distribuicaoVendas, debito: parseFloat(e.target.value) || 0 })}
                  className="text-right font-mono text-lg font-bold"
                  step="0.01"
                  min="0"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500 mb-1">Crédito (%)</Label>
                <Input
                  type="number"
                  value={distribuicaoVendas.credito || ''}
                  onChange={e => setDistribuicaoVendas({ ...distribuicaoVendas, credito: parseFloat(e.target.value) || 0 })}
                  className="text-right font-mono text-lg font-bold"
                  step="0.01"
                  min="0"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500 mb-1">Voucher (%)</Label>
                <Input
                  type="number"
                  value={distribuicaoVendas.voucher || ''}
                  onChange={e => setDistribuicaoVendas({ ...distribuicaoVendas, voucher: parseFloat(e.target.value) || 0 })}
                  className="text-right font-mono text-lg font-bold"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-100">
              <span className="text-sm font-medium text-gray-700">Total:</span>
              <span className={`font-bold text-lg ${totalDistribuicao === 100 ? 'text-green-600' : 'text-red-600'}`}>
                {totalDistribuicao.toFixed(2)}%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Outras Taxas */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Outras Taxas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-gray-500 mb-1">Voucher (%)</Label>
                <Input
                  type="number"
                  value={outrasTaxas.voucher || ''}
                  onChange={e => setOutrasTaxas({ ...outrasTaxas, voucher: parseFloat(e.target.value) || 0 })}
                  className="text-right font-mono text-lg font-bold"
                  step="0.01"
                  min="0"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500 mb-1">Simples Nacional (%)</Label>
                <Input
                  type="number"
                  value={outrasTaxas.simplesNacional || ''}
                  onChange={e => setOutrasTaxas({ ...outrasTaxas, simplesNacional: parseFloat(e.target.value) || 0 })}
                  className="text-right font-mono text-lg font-bold"
                  step="0.01"
                  min="0"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-xs text-gray-500 mb-1">Manutenção (%)</Label>
                <Input
                  type="number"
                  value={outrasTaxas.manutencao || ''}
                  onChange={e => setOutrasTaxas({ ...outrasTaxas, manutencao: parseFloat(e.target.value) || 0 })}
                  className="text-right font-mono text-lg font-bold"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resultados das Taxas */}
        <ResultadosTaxas
          maquininhas={maquininhas}
          distribuicaoVendas={distribuicaoVendas}
          outrasTaxas={outrasTaxas}
        />
      </div>
    </div>
  )
}