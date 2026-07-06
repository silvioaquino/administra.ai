'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatPercentage } from '@/lib/utils'

interface ResultadosTaxasProps {
  maquininhas: {
    taxaDebito: number
    taxaCredito: number
    aluguel: number
    ativo: boolean
  }[]
  distribuicaoVendas: {
    debito: number
    credito: number
    voucher: number
  }
  outrasTaxas: {
    voucher: number
    simplesNacional: number
    manutencao: number
  }
}

export function ResultadosTaxas({
  maquininhas,
  distribuicaoVendas,
  outrasTaxas
}: ResultadosTaxasProps) {
  // Calcular resultados
  const maquininhasAtivas = maquininhas.filter(m => m.ativo)

  // Taxa Débito Média
  const taxaDebitoMedia = maquininhasAtivas.length > 0
    ? maquininhasAtivas.reduce((sum, m) => sum + m.taxaDebito, 0) / maquininhasAtivas.length
    : 0

  // Taxa Crédito Média
  const taxaCreditoMedia = maquininhasAtivas.length > 0
    ? maquininhasAtivas.reduce((sum, m) => sum + m.taxaCredito, 0) / maquininhasAtivas.length
    : 0

  // Taxa Média Geral
  const percDebito = distribuicaoVendas.debito / 100
  const percCredito = distribuicaoVendas.credito / 100
  const percVoucher = distribuicaoVendas.voucher / 100
  const taxaVoucher = outrasTaxas.voucher || 7.0

  const taxaMediaGeral = (taxaDebitoMedia * percDebito) + (taxaCreditoMedia * percCredito) + (taxaVoucher * percVoucher)

  // Total Aluguel
  const aluguelTotal = maquininhasAtivas.reduce((sum, m) => sum + (m.aluguel || 0), 0)

  // Total Despesas Variáveis (sem Aluguel % baseado no Faturamento)
  const totalDespesasVariaveis = outrasTaxas.simplesNacional + taxaMediaGeral + outrasTaxas.manutencao

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <h4 className="font-semibold text-gray-800 mb-4">Resultados</h4>

      <div className="grid grid-cols-2 gap-4">
        <Card className="border border-gray-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Taxa Débito Média</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-800">{taxaDebitoMedia.toFixed(2)}%</p>
          </CardContent>
        </Card>

        <Card className="border border-gray-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Taxa Crédito Média</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-800">{taxaCreditoMedia.toFixed(2)}%</p>
          </CardContent>
        </Card>

        <Card className="border border-gray-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Taxa Média Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">{taxaMediaGeral.toFixed(2)}%</p>
          </CardContent>
        </Card>

        <Card className="border border-gray-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Aluguel (R$)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-800">{formatCurrency(aluguelTotal)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-gray-800">Total Despesas Variáveis:</span>
          <span className="text-2xl font-bold text-[#de4838]">{formatPercentage(totalDespesasVariaveis)}</span>
        </div>
      </div>
    </div>
  )
}