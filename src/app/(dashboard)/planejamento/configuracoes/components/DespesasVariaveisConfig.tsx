// src/app/(dashboard)/planejamento/configuracoes/components/DespesasVariaveisConfig.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CreditCard, Percent, Save, Plus, Trash2, Building2 } from "lucide-react"
import { formatCurrency, formatPercentage } from "@/lib/utils"
import { Maquininha } from "@/types/maquininhas"

interface ConfiguracaoMaquininhas {
  maquininhas: Maquininha[]
  distribuicaoVendas: { debito: number; credito: number; voucher: number }
  manutencao: number
  simplesNacional: number
}

interface ResultadosCalculo {
  debitoMedia: number
  creditoMedia: number
  taxaMediaGeral: number
  aluguelTotal: number
  percentualAluguel: number
  totalDespesasVariaveis: number
}

interface DespesasVariaveisConfigProps {
  config: ConfiguracaoMaquininhas
  resultados: ResultadosCalculo
  faturamentoBase: number
  onUpdate: (config: ConfiguracaoMaquininhas) => void
  onUpdateFaturamento: (valor: number) => void
  onSave: () => void
  saving?: boolean
}

export function DespesasVariaveisConfig({ 
  config, 
  resultados, 
  faturamentoBase,
  onUpdate, 
  onUpdateFaturamento,
  onSave, 
  saving 
}: DespesasVariaveisConfigProps) {
  
  const atualizarCampo = (path: string, value: number) => {
    const partes = path.split(".")
    const novoEstado = { ...config }
    let atual: any = novoEstado
    for (let i = 0; i < partes.length - 1; i++) {
      atual = atual[partes[i]]
    }
    atual[partes[partes.length - 1]] = value
    onUpdate(novoEstado)
  }

  const atualizarMaquininha = (id: string, campo: keyof Maquininha, value: number | string | boolean) => {
    const novoEstado = { ...config }
    const index = novoEstado.maquininhas.findIndex(m => m.id === id)
    if (index !== -1) {
      novoEstado.maquininhas[index] = { ...novoEstado.maquininhas[index], [campo]: value }
      onUpdate(novoEstado)
    }
  }

  const adicionarMaquininha = () => {
    const novaMaquininha: Maquininha = {
      id: crypto.randomUUID(),
      nome: `Nova Maquininha ${config.maquininhas.length + 1}`,
      taxaDebito: 0,
      taxaCredito: 0,
      aluguel: 0,
      ativo: true
    }
    onUpdate({
      ...config,
      maquininhas: [...config.maquininhas, novaMaquininha]
    })
  }

  const removerMaquininha = (id: string) => {
    if (config.maquininhas.filter(m => m.ativo).length <= 1) {
      alert("Você precisa manter pelo menos uma maquininha ativa!")
      return
    }
    onUpdate({
      ...config,
      maquininhas: config.maquininhas.map(m => 
        m.id === id ? { ...m, ativo: false } : m
      )
    })
  }

  const excluirMaquininha = (id: string) => {
    if (config.maquininhas.filter(m => m.ativo).length <= 1) {
      alert("Você precisa manter pelo menos uma maquininha ativa!")
      return
    }
    onUpdate({
      ...config,
      maquininhas: config.maquininhas.filter(m => m.id !== id)
    })
  }

  const somaVendas = config.distribuicaoVendas.debito + config.distribuicaoVendas.credito + config.distribuicaoVendas.voucher
  const maquininhasAtivas = config.maquininhas.filter(m => m.ativo)

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Maquininhas */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Maquininhas
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({maquininhasAtivas.length} ativa{maquininhasAtivas.length !== 1 ? 's' : ''})
                </span>
              </CardTitle>
              <Button size="sm" onClick={adicionarMaquininha} className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {config.maquininhas.map((maquina) => (
                <div 
                  key={maquina.id} 
                  className={`border rounded-xl p-4 transition-all ${maquina.ativo ? 'border-border bg-surface' : 'border-border bg-surface-2 opacity-60'}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={maquina.ativo}
                        onChange={(e) => atualizarMaquininha(maquina.id, 'ativo', e.target.checked)}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <Label className="text-sm font-medium text-white">
                        {maquina.ativo ? 'Ativa' : 'Inativa'}
                      </Label>
                    </div>
                    <div className="flex gap-1">
                      {maquina.ativo && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removerMaquininha(maquina.id)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-yellow-600 hover:bg-yellow-50"
                          title="Desativar maquininha"
                        >
                          <span className="text-xs">⏸</span>
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => excluirMaquininha(maquina.id)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                        title="Excluir maquininha"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nome</Label>
                      <Input
                        type="text"
                        value={maquina.nome}
                        onChange={(e) => atualizarMaquininha(maquina.id, 'nome', e.target.value)}
                        className="rounded-lg border-border focus:ring-primary text-sm"
                        placeholder="Nome da operadora"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Taxa Débito %</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={maquina.taxaDebito}
                          onChange={(e) => atualizarMaquininha(maquina.id, 'taxaDebito', Number(e.target.value))}
                          className="rounded-lg border-border focus:ring-primary text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Taxa Crédito %</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={maquina.taxaCredito}
                          onChange={(e) => atualizarMaquininha(maquina.id, 'taxaCredito', Number(e.target.value))}
                          className="rounded-lg border-border focus:ring-primary text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Aluguel (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={maquina.aluguel}
                        onChange={(e) => atualizarMaquininha(maquina.id, 'aluguel', Number(e.target.value))}
                        className="rounded-lg border-border focus:ring-primary text-sm"
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
            <Alert variant="info" className="mt-2">
              <AlertDescription className="text-xs text-muted-foreground">
                As maquininhas ativas terão distribuição igual nos cálculos. Para ajustar a distribuição,
                ative/desative conforme necessário.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Distribuição das Vendas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              Distribuição das Vendas (%)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Débito</Label>
              <Input
                type="number"
                step="1"
                value={config.distribuicaoVendas.debito}
                onChange={(e) => atualizarCampo("distribuicaoVendas.debito", Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Crédito</Label>
              <Input
                type="number"
                step="1"
                value={config.distribuicaoVendas.credito}
                onChange={(e) => atualizarCampo("distribuicaoVendas.credito", Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Voucher</Label>
              <Input
                type="number"
                step="1"
                value={config.distribuicaoVendas.voucher}
                onChange={(e) => atualizarCampo("distribuicaoVendas.voucher", Number(e.target.value))}
              />
            </div>
            <Alert variant={somaVendas === 100 ? "success" : "destructive"}>
              <AlertDescription>
                Total: {somaVendas}% {somaVendas !== 100 && "(Deve ser 100%)"}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Outras Taxas */}
        <Card>
          <CardHeader>
            <CardTitle>Outras Taxas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Manutenção (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={config.manutencao}
                onChange={(e) => atualizarCampo("manutencao", Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Simples Nacional (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={config.simplesNacional}
                onChange={(e) => atualizarCampo("simplesNacional", Number(e.target.value))}
              />
            </div>
            <div className="pt-2 border-t">
              <Label>Faturamento Base (R$)</Label>
              <Input
                type="number"
                step="1000"
                value={faturamentoBase}
                onChange={(e) => onUpdateFaturamento(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Usado para calcular o percentual do aluguel das maquininhas
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Resultados */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-success">📈 RESULTADOS DOS CÁLCULOS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="rounded-lg bg-info/5 p-2 text-center">
                <p className="text-xs text-muted-foreground">Taxa Débito Média</p>
                <p className="text-lg font-bold text-info">{formatPercentage(resultados.debitoMedia)}</p>
              </div>
              <div className="rounded-lg bg-info/5 p-2 text-center">
                <p className="text-xs text-muted-foreground">Taxa Crédito Média</p>
                <p className="text-lg font-bold text-info">{formatPercentage(resultados.creditoMedia)}</p>
              </div>
              <div className="rounded-lg bg-yellow-50 p-2 text-center">
                <p className="text-xs text-muted-foreground">Taxa Média Geral</p>
                <p className="text-lg font-bold text-yellow-600">{formatPercentage(resultados.taxaMediaGeral)}</p>
              </div>
              <div className="rounded-lg bg-surface-2 p-2 text-center">
                <p className="text-xs text-muted-foreground">Aluguel Total</p>
                <p className="text-lg font-bold text-muted-foreground">{formatCurrency(resultados.aluguelTotal)}</p>
              </div>
              <div className="rounded-lg bg-surface-2 p-2 text-center">
                <p className="text-xs text-muted-foreground">Aluguel % (base {formatCurrency(faturamentoBase)})</p>
                <p className="text-lg font-bold text-muted-foreground">{formatPercentage(resultados.percentualAluguel)}</p>
              </div>
              <div className="rounded-lg bg-green-50 p-2 text-center">
                <p className="text-xs text-muted-foreground">🎯 TOTAL DESPESAS VARIÁVEIS</p>
                <p className="text-lg font-bold text-success">{formatPercentage(resultados.totalDespesasVariaveis)}</p>
              </div>
            </div>
            <Alert className="mt-4" variant="info">
              <AlertDescription>
                Utilize este percentual nas Fichas Técnicas para calcular o preço de venda
              </AlertDescription>
            </Alert>
            <Button onClick={onSave} className="mt-4 w-full" disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}