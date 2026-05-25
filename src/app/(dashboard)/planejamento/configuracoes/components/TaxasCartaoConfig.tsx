// src/app/(dashboard)/planejamento/configuracoes/components/TaxasCartaoConfig.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CreditCard, Percent, Save } from "lucide-react"
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

interface ResultadosCalculo {
  debitoMedia: number
  creditoMedia: number
  taxaMediaGeral: number
  aluguelTotal: number
  percentualAluguel: number
  totalDespesasVariaveis: number
}

interface TaxasCartaoConfigProps {
  config: TaxasConfig
  resultados: ResultadosCalculo
  onUpdate: (config: TaxasConfig) => void
  onSave: () => void
  saving?: boolean
}

export function TaxasCartaoConfig({ config, resultados, onUpdate, onSave, saving }: TaxasCartaoConfigProps) {
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

  const somaVendas = config.distribuicaoVendas.debito + config.distribuicaoVendas.credito + config.distribuicaoVendas.voucher
  const somaMaquininhas = config.distribuicaoMaquininhas.infinitepay + config.distribuicaoMaquininhas.stone + config.distribuicaoMaquininhas.caixa

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
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

        {/* Distribuição das Maquininhas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Distribuição entre Maquininhas (%)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>InfinitePay</Label>
              <Input
                type="number"
                step="1"
                value={config.distribuicaoMaquininhas.infinitepay}
                onChange={(e) => atualizarCampo("distribuicaoMaquininhas.infinitepay", Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Stone</Label>
              <Input
                type="number"
                step="1"
                value={config.distribuicaoMaquininhas.stone}
                onChange={(e) => atualizarCampo("distribuicaoMaquininhas.stone", Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Caixa</Label>
              <Input
                type="number"
                step="1"
                value={config.distribuicaoMaquininhas.caixa}
                onChange={(e) => atualizarCampo("distribuicaoMaquininhas.caixa", Number(e.target.value))}
              />
            </div>
            <Alert variant={somaMaquininhas === 100 ? "success" : "destructive"}>
              <AlertDescription>
                Total: {somaMaquininhas}% {somaMaquininhas !== 100 && "(Deve ser 100%)"}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Taxas Débito */}
        <Card>
          <CardHeader>
            <CardTitle>Taxas Débito (%)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>InfinitePay Débito</Label>
              <Input
                type="number"
                step="0.01"
                value={config.taxas.debito.infinitepay}
                onChange={(e) => atualizarCampo("taxas.debito.infinitepay", Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Stone Débito</Label>
              <Input
                type="number"
                step="0.01"
                value={config.taxas.debito.stone}
                onChange={(e) => atualizarCampo("taxas.debito.stone", Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Caixa Débito</Label>
              <Input
                type="number"
                step="0.01"
                value={config.taxas.debito.caixa}
                onChange={(e) => atualizarCampo("taxas.debito.caixa", Number(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Taxas Crédito */}
        <Card>
          <CardHeader>
            <CardTitle>Taxas Crédito (%)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>InfinitePay Crédito</Label>
              <Input
                type="number"
                step="0.01"
                value={config.taxas.credito.infinitepay}
                onChange={(e) => atualizarCampo("taxas.credito.infinitepay", Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Stone Crédito</Label>
              <Input
                type="number"
                step="0.01"
                value={config.taxas.credito.stone}
                onChange={(e) => atualizarCampo("taxas.credito.stone", Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Caixa Crédito</Label>
              <Input
                type="number"
                step="0.01"
                value={config.taxas.credito.caixa}
                onChange={(e) => atualizarCampo("taxas.credito.caixa", Number(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Outras Taxas e Aluguel */}
        <Card>
          <CardHeader>
            <CardTitle>Outras Taxas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Taxa Voucher (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={config.taxas.voucher}
                onChange={(e) => atualizarCampo("taxas.voucher", Number(e.target.value))}
              />
            </div>
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
              <Label>Aluguel Stone 1 (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={config.aluguelMaquininhas.stone1}
                onChange={(e) => atualizarCampo("aluguelMaquininhas.stone1", Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Aluguel Stone 2 (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={config.aluguelMaquininhas.stone2}
                onChange={(e) => atualizarCampo("aluguelMaquininhas.stone2", Number(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Resultados */}
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">📈 RESULTADOS DOS CÁLCULOS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-blue-50 p-2 text-center">
                <p className="text-xs text-muted-foreground">Taxa Débito Média</p>
                <p className="text-lg font-bold text-blue-600">{formatPercentage(resultados.debitoMedia)}</p>
              </div>
              <div className="rounded-lg bg-blue-50 p-2 text-center">
                <p className="text-xs text-muted-foreground">Taxa Crédito Média</p>
                <p className="text-lg font-bold text-blue-600">{formatPercentage(resultados.creditoMedia)}</p>
              </div>
              <div className="rounded-lg bg-yellow-50 p-2 text-center">
                <p className="text-xs text-muted-foreground">Taxa Média Geral</p>
                <p className="text-lg font-bold text-yellow-600">{formatPercentage(resultados.taxaMediaGeral)}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-2 text-center">
                <p className="text-xs text-muted-foreground">Aluguel Total</p>
                <p className="text-lg font-bold text-gray-600">{formatCurrency(resultados.aluguelTotal)}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-2 text-center">
                <p className="text-xs text-muted-foreground">Aluguel % (base R$30k)</p>
                <p className="text-lg font-bold text-gray-600">{formatPercentage(resultados.percentualAluguel)}</p>
              </div>
              <div className="rounded-lg bg-green-50 p-2 text-center">
                <p className="text-xs text-muted-foreground">🎯 TOTAL DESPESAS VARIÁVEIS</p>
                <p className="text-lg font-bold text-green-600">{formatPercentage(resultados.totalDespesasVariaveis)}</p>
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