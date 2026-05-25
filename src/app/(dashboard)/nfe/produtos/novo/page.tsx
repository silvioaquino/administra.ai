// src/app/(dashboard)/nfe/produtos/novo/page.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Package, DollarSign, Box, Truck, Calendar } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function NovoProdutoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    descricao: "",
    unidade: "UN",
    preco_venda: 0,
    quantidade: 0,
    fornecedor: "",
    data_compra: new Date().toISOString().split("T")[0]
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!formData.descricao) {
      alert("Nome do produto é obrigatório")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/produtos/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([{
          descricao: formData.descricao,
          unidade: formData.unidade,
          preco_venda: formData.preco_venda,
          quantidade: formData.quantidade,
          fornecedor: formData.fornecedor,
          data_compra: formData.data_compra,
          valor_unitario: formData.preco_venda,
          valor_total: formData.preco_venda * formData.quantidade
        }])
      })

      if (response.ok) {
        alert("Produto cadastrado com sucesso!")
        router.push("/nfe/produtos")
      } else {
        throw new Error("Erro ao cadastrar")
      }
    } catch (error) {
      console.error("Erro:", error)
      alert("Erro ao cadastrar produto")
    } finally {
      setLoading(false)
    }
  }

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
            <h1 className="text-xl font-semibold text-gray-800">Novo Produto</h1>
            <p className="text-sm text-gray-500">Cadastre um novo produto no sistema</p>
          </div>
        </div>
        <Button 
          type="submit" 
          form="produto-form"
          disabled={loading}
          className="bg-[#de4838] hover:bg-[#c73d2e] text-white px-6 rounded-full shadow-sm"
        >
          <Save className="mr-2 h-4 w-4" />
          {loading ? "Salvando..." : "Salvar Produto"}
        </Button>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-gray-50 p-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-[#de4838]" />
              <h3 className="font-semibold text-gray-800">Dados do Produto</h3>
            </div>
            <p className="text-xs text-gray-500 mt-1">Preencha as informações básicas do produto</p>
          </div>
          <div className="p-6">
            <form id="produto-form" onSubmit={handleSubmit} className="space-y-6">
              {/* Nome do Produto */}
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Nome do Produto <span className="text-[#de4838]">*</span>
                </Label>
                <Input
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Ex: X-Burger Completo"
                  className="rounded-lg border-gray-300 focus:ring-[#de4838] focus:border-[#de4838]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Unidade de Medida */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Unidade de Medida</Label>
                  <div className="relative">
                    <select
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#de4838] focus:border-transparent appearance-none"
                      value={formData.unidade}
                      onChange={(e) => setFormData({ ...formData, unidade: e.target.value })}
                    >
                      <option value="UN">Unidade (UN)</option>
                      <option value="KG">Quilograma (KG)</option>
                      <option value="G">Grama (G)</option>
                      <option value="L">Litro (L)</option>
                      <option value="ML">Mililitro (ML)</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
                </div>

                {/* Preço de Venda */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Preço de Venda (R$)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.preco_venda}
                      onChange={(e) => setFormData({ ...formData, preco_venda: Number(e.target.value) })}
                      className="pl-8 rounded-lg border-gray-300 focus:ring-[#de4838]"
                      placeholder="0,00"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Quantidade Inicial */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Quantidade Inicial</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.quantidade}
                    onChange={(e) => setFormData({ ...formData, quantidade: Number(e.target.value) })}
                    className="rounded-lg border-gray-300 focus:ring-[#de4838]"
                    placeholder="0"
                  />
                </div>

                {/* Fornecedor */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Fornecedor</Label>
                  <Input
                    value={formData.fornecedor}
                    onChange={(e) => setFormData({ ...formData, fornecedor: e.target.value })}
                    placeholder="Nome do fornecedor"
                    className="rounded-lg border-gray-300 focus:ring-[#de4838]"
                  />
                </div>
              </div>

              {/* Data da Compra */}
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Data da Compra</Label>
                <Input
                  type="date"
                  value={formData.data_compra}
                  onChange={(e) => setFormData({ ...formData, data_compra: e.target.value })}
                  className="rounded-lg border-gray-300 focus:ring-[#de4838]"
                />
              </div>

              {/* Divider com informação */}
              <div className="pt-4 border-t border-gray-200">
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-sm text-blue-700">
                    💡 Após cadastrar, o produto estará disponível para venda e será registrado no estoque.
                  </p>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}