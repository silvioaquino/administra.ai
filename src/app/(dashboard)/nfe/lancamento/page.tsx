// src/app/(dashboard)/nfe/lancamento/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, DollarSign, Package, Building2, CreditCard, AlertCircle, Plus, Image as ImageIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatCurrency } from "@/lib/utils"

interface Produto {
  id: number
  descricao: string
  preco_venda: number
  quantidade: number
  unidade: string
}

export default function LancamentoManualPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [formData, setFormData] = useState({
    tipoLancamento: "VENDA",
    produtoId: "",
    quantidade: 1,
    valorUnitario: 0,
    clienteFornecedor: "",
    formaPagamento: "DINHEIRO",
    contaDestino: "Dinheiro Físico",
    contaDespesa: "3.2.1 Compras de Mercadorias",
    data: new Date().toISOString().split("T")[0]
  })

  useEffect(() => {
    carregarProdutos()
  }, [])

  async function carregarProdutos() {
    try {
      const response = await fetch("/api/produtos?limit=500")
      const data = await response.json()
      if (data.success) {
        setProdutos(data.data)
      }
    } catch (error) {
      console.error("Erro ao carregar produtos:", error)
    }
  }

  const produtoSelecionado = produtos.find(p => p.id === Number(formData.produtoId))
  const valorTotal = formData.quantidade * (produtoSelecionado?.preco_venda || formData.valorUnitario)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!formData.produtoId) {
      alert("Selecione um produto")
      return
    }

    if (!produtoSelecionado) {
      alert("Produto não encontrado")
      return
    }

    setLoading(true)

    try {
      // Registrar no livro diário
      const response = await fetch("/api/livro-diario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: formData.data,
          conta: formData.tipoLancamento === "VENDA" 
            ? getContaVenda(formData.formaPagamento) 
            : formData.contaDespesa,
          descricao: `${formData.tipoLancamento === "VENDA" ? "Venda" : "Compra"}: ${produtoSelecionado.descricao} - ${formData.quantidade} ${produtoSelecionado.unidade}`,
          cliente_fornecedor: formData.clienteFornecedor || (formData.tipoLancamento === "VENDA" ? "Consumidor" : "Fornecedor"),
          entrada: formData.tipoLancamento === "VENDA" ? valorTotal : 0,
          saida: formData.tipoLancamento === "COMPRA" ? valorTotal : 0,
          tipo: formData.tipoLancamento,
          forma_pagamento: formData.formaPagamento
        })
      })

      if (!response.ok) throw new Error("Erro ao registrar")

      // Atualizar estoque
      const novoEstoque = formData.tipoLancamento === "VENDA"
        ? Math.max(0, produtoSelecionado.quantidade - formData.quantidade)
        : produtoSelecionado.quantidade + formData.quantidade

      await fetch(`/api/produtos/${produtoSelecionado.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ...produtoSelecionado, 
          quantidade: novoEstoque 
        })
      })

      const mensagem = formData.tipoLancamento === "VENDA"
        ? `✅ Venda registrada! Entrada: ${formatCurrency(valorTotal)}`
        : `✅ Compra registrada! Saída: ${formatCurrency(valorTotal)}`

      alert(mensagem)
      
      // Resetar formulário
      setFormData({
        ...formData,
        produtoId: "",
        quantidade: 1,
        clienteFornecedor: ""
      })
      
    } catch (error) {
      console.error("Erro:", error)
      alert("Erro ao realizar lançamento")
    } finally {
      setLoading(false)
    }
  }

  function getContaVenda(formaPagamento: string): string {
    const contas: Record<string, string> = {
      "DINHEIRO": "3.1.1 Receita com Cash",
      "CARTAO_CREDITO": "3.1.2 Receita com Cartão de Crédito",
      "CARTAO_DEBITO": "3.1.2 Receita com Cartão de Débito",
      "PIX": "3.1.4 Receita com PIX",
      "IFOOD": "3.1.3 Receita Ifood"
    }
    return contas[formaPagamento] || "3.1.1 Receita com Vendas"
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - inspired by .topbar-cdp */}
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
            <h1 className="text-xl font-semibold text-gray-800">Lançamento Manual</h1>
            <p className="text-sm text-gray-500">Registre vendas e compras manualmente</p>
          </div>
        </div>
        <Button 
          type="submit" 
          form="lancamento-form"
          disabled={loading || !formData.produtoId}
          className="bg-[#de4838] hover:bg-[#c73d2e] text-white px-6 rounded-full shadow-sm"
        >
          <Save className="mr-2 h-4 w-4" />
          {loading ? "Processando..." : (formData.tipoLancamento === "VENDA" ? "Lançar Venda" : "Lançar Compra")}
        </Button>
      </div>

      {/* Main Content - Two columns */}
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column - Form Fields - SEM BORDA */}
          <div className="space-y-6">
            <form id="lancamento-form" onSubmit={handleSubmit} className="space-y-6">
              {/* Form sections without card border */}
              <div className="space-y-6">
                
                {/* Tipo and Date Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Tipo</Label>
                    <div className="relative">
                      <select
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#de4838] focus:border-transparent appearance-none"
                        value={formData.tipoLancamento}
                        onChange={(e) => setFormData({ ...formData, tipoLancamento: e.target.value })}
                      >
                        <option value="VENDA">💰 Venda (Entrada - Receita)</option>
                        <option value="COMPRA">📦 Compra (Saída - Despesa)</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Data</Label>
                    <Input
                      type="date"
                      value={formData.data}
                      onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                      className="rounded-lg border-gray-300 focus:ring-[#de4838] focus:border-[#de4838]"
                    />
                  </div>
                </div>

                {/* Forma de Pagamento */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Forma de Pagamento</Label>
                  <div className="relative">
                    <select
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#de4838] focus:border-transparent appearance-none"
                      value={formData.formaPagamento}
                      onChange={(e) => setFormData({ ...formData, formaPagamento: e.target.value })}
                    >
                      <option value="DINHEIRO">💰 Dinheiro</option>
                      <option value="CARTAO_CREDITO">💳 Cartão de Crédito</option>
                      <option value="CARTAO_DEBITO">💳 Cartão de Débito</option>
                      <option value="PIX">📱 PIX</option>
                      <option value="IFOOD">🍔 iFood</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
                </div>

                {/* Produto */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Produto</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <select
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#de4838] focus:border-transparent appearance-none"
                        value={formData.produtoId}
                        onChange={(e) => {
                          const produto = produtos.find(p => p.id === Number(e.target.value))
                          setFormData({
                            ...formData,
                            produtoId: e.target.value,
                            valorUnitario: produto?.preco_venda || 0
                          })
                        }}
                      >
                        <option value="">Selecione um produto</option>
                        {produtos.map(prod => (
                          <option key={prod.id} value={prod.id}>
                            {prod.descricao} - {formatCurrency(prod.preco_venda)}/{prod.unidade} (Estoque: {prod.quantidade})
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push("/nfe/produtos/novo")}
                      className="border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <Package className="h-4 w-4 text-gray-500" />
                    </Button>
                  </div>
                </div>

                {/* Quantidade e Valor */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Quantidade</Label>
                    <Input
                      type="number"
                      step="1"
                      min="1"
                      value={formData.quantidade}
                      onChange={(e) => setFormData({ ...formData, quantidade: Number(e.target.value) })}
                      className="rounded-lg border-gray-300 focus:ring-[#de4838]"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Valor Unitário (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.valorUnitario}
                      onChange={(e) => setFormData({ ...formData, valorUnitario: Number(e.target.value) })}
                      className="rounded-lg border-gray-300 focus:ring-[#de4838]"
                    />
                  </div>
                </div>

                {/* Cliente/Fornecedor */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                    {formData.tipoLancamento === "VENDA" ? "Cliente" : "Fornecedor"}
                  </Label>
                  <Input
                    placeholder={formData.tipoLancamento === "VENDA" ? "Nome do cliente" : "Nome do fornecedor"}
                    value={formData.clienteFornecedor}
                    onChange={(e) => setFormData({ ...formData, clienteFornecedor: e.target.value })}
                    className="rounded-lg border-gray-300 focus:ring-[#de4838]"
                  />
                </div>

                {/* Conta para COMPRA */}
                {formData.tipoLancamento === "COMPRA" && (
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Conta de Despesa</Label>
                    <div className="relative">
                      <select
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#de4838] focus:border-transparent appearance-none"
                        value={formData.contaDespesa}
                        onChange={(e) => setFormData({ ...formData, contaDespesa: e.target.value })}
                      >
                        <option value="3.2.1 Compras de Mercadorias">📦 3.2.1 Compras de Mercadorias</option>
                        <option value="3.2.2 Compras de Insumos">🥩 3.2.2 Compras de Insumos</option>
                        <option value="3.2.3 Compras de Embalagens">📦 3.2.3 Compras de Embalagens</option>
                        <option value="3.2.4 Compras de Equipamentos">🔧 3.2.4 Compras de Equipamentos</option>
                        <option value="3.2.5 Compras de Material Limpeza">🧹 3.2.5 Compras de Material Limpeza</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                      </div>
                    </div>
                  </div>
                )}

                {/* Conta para VENDA */}
                {formData.tipoLancamento === "VENDA" && (
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Conta de Destino</Label>
                    <div className="relative">
                      <select
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#de4838] focus:border-transparent appearance-none"
                        value={formData.contaDestino}
                        onChange={(e) => setFormData({ ...formData, contaDestino: e.target.value })}
                      >
                        <option value="Dinheiro Físico">💰 Dinheiro Físico</option>
                        <option value="Caixa Econômica">🏦 Caixa Econômica</option>
                        <option value="iFood">🍔 iFood</option>
                        <option value="Infinity Empório">🏪 Infinity Empório</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                      </div>
                    </div>
                  </div>
                )}

                {/* Alerta informativo */}
                <Alert variant="default" className="bg-[#de4838]/10 border-[#de4838]/20 rounded-xl">
                  <AlertCircle className="h-4 w-4 text-[#de4838]" />
                  <AlertDescription className="text-sm text-gray-700">
                    {formData.tipoLancamento === "VENDA" 
                      ? "💰 Venda: O valor será registrado como RECEITA (Entrada no caixa)"
                      : "📦 Compra: O valor será registrado como DESPESA (Saída do caixa)"}
                  </AlertDescription>
                </Alert>

                {/* Total */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Valor Total:</span>
                    <span className="text-2xl font-bold text-[#de4838]">{formatCurrency(valorTotal)}</span>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Right Column - Preview Card */}
          <div className="lg:sticky lg:top-24 h-fit">
            <Card className="overflow-hidden border-0 shadow-lg rounded-2xl bg-white">
              <div className="bg-gray-50 p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800">Pré-visualização do lançamento</h3>
                <p className="text-xs text-gray-500">Confira os detalhes antes de salvar</p>
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Tipo:</span>
                  <span className={`text-sm font-medium px-2 py-1 rounded-full ${formData.tipoLancamento === 'VENDA' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                    {formData.tipoLancamento === 'VENDA' ? 'Venda (Entrada)' : 'Compra (Saída)'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Produto:</span>
                  <span className="font-medium text-gray-800 text-right">{produtoSelecionado?.descricao || "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Quantidade:</span>
                  <span className="font-medium text-gray-800">{formData.quantidade} {produtoSelecionado?.unidade || ""}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Valor Unitário:</span>
                  <span className="font-medium text-gray-800">{formatCurrency(produtoSelecionado?.preco_venda || formData.valorUnitario)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Forma de Pagto:</span>
                  <span className="font-medium text-gray-800 capitalize">{formData.formaPagamento.toLowerCase().replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{formData.tipoLancamento === "VENDA" ? "Cliente" : "Fornecedor"}:</span>
                  <span className="font-medium text-gray-800">{formData.clienteFornecedor || "—"}</span>
                </div>
                <div className="pt-4 mt-2 border-t border-dashed border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-700">Total a {formData.tipoLancamento === "VENDA" ? "receber" : "pagar"}:</span>
                    <span className="text-xl font-bold text-[#de4838]">{formatCurrency(valorTotal)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}