// src/app/(dashboard)/nfe/produtos/[id]/edit/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Save, Trash2, Package, DollarSign, Box, Truck, Calendar, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Produto {
  id: number
  descricao: string
  unidade: string
  preco_venda: number
  quantidade: number
  fornecedor: string
  data_compra: string
  codigo: string
  valor_unitario: number
  valor_total: number
}

export default function EditarProdutoPage() {
  const router = useRouter()
  const params = useParams()
  const produtoId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<Produto>({
    id: 0,
    descricao: "",
    unidade: "UN",
    preco_venda: 0,
    quantidade: 0,
    fornecedor: "",
    data_compra: "",
    codigo: "",
    valor_unitario: 0,
    valor_total: 0
  })

  useEffect(() => {
    carregarProduto()
  }, [produtoId])

  async function carregarProduto() {
    try {
      const response = await fetch(`/api/produtos/${produtoId}`)
      const data = await response.json()
      if (data.success) {
        setFormData({
          ...data.data,
          preco_venda: data.data.precoVenda || data.data.preco_venda || 0,
          valor_unitario: data.data.valorUnitario || data.data.valor_unitario || 0,
          valor_total: data.data.valorTotal || data.data.valor_total || 0
        })
      }
    } catch (error) {
      console.error("Erro ao carregar produto:", error)
      alert("Erro ao carregar dados do produto")
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!formData.descricao) {
      alert("Nome do produto é obrigatório")
      return
    }

    setSaving(true)

    try {
      const response = await fetch(`/api/produtos/${produtoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descricao: formData.descricao,
          unidade: formData.unidade,
          preco_venda: formData.preco_venda,
          quantidade: formData.quantidade,
          fornecedor: formData.fornecedor,
          data_compra: formData.data_compra,
          valor_unitario: formData.valor_unitario,
          valor_total: formData.valor_total
        })
      })

      if (response.ok) {
        alert("Produto atualizado com sucesso!")
        router.push("/nfe/produtos")
      } else {
        throw new Error("Erro ao atualizar")
      }
    } catch (error) {
      console.error("Erro:", error)
      alert("Erro ao atualizar produto")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm("Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.")) return
    
    setSaving(true)

    try {
      const response = await fetch(`/api/produtos/${produtoId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        alert("Produto excluído com sucesso!")
        router.push("/nfe/produtos")
      } else {
        throw new Error("Erro ao excluir")
      }
    } catch (error) {
      console.error("Erro:", error)
      alert("Erro ao excluir produto")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#de4838] border-t-transparent" />
      </div>
    )
  }

  const valorTotalEstoque = formData.quantidade * formData.preco_venda

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
            <h1 className="text-xl font-semibold text-gray-800">Editar Produto</h1>
            <p className="text-sm text-gray-500">Atualize as informações do produto</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={saving}
            className="bg-red-500 hover:bg-red-600 text-white rounded-full px-6"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </Button>
          <Button 
            type="submit" 
            form="produto-edit-form"
            disabled={saving}
            className="bg-[#de4838] hover:bg-[#c73d2e] text-white px-6 rounded-full shadow-sm"
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-gray-50 p-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-[#de4838]" />
              <h3 className="font-semibold text-gray-800">Dados do Produto</h3>
            </div>
            <p className="text-xs text-gray-500 mt-1">Atualize as informações do produto #{formData.id}</p>
          </div>
          <div className="p-6">
            <form id="produto-edit-form" onSubmit={handleSubmit} className="space-y-6">
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
                {/* Código do Produto */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Código do Produto</Label>
                  <Input
                    value={formData.codigo || ""}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    placeholder="Código de barras ou SKU"
                    className="rounded-lg border-gray-300 focus:ring-[#de4838]"
                  />
                </div>

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
                      <option value="PC">Peça (PC)</option>
                      <option value="CX">Caixa (CX)</option>
                      <option value="PT">Pacote (PT)</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    />
                  </div>
                </div>

                {/* Custo Unitário */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Custo Unitário (R$)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.valor_unitario}
                      onChange={(e) => setFormData({ ...formData, valor_unitario: Number(e.target.value) })}
                      className="pl-8 rounded-lg border-gray-300 focus:ring-[#de4838]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Quantidade em Estoque */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Quantidade em Estoque</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.quantidade}
                    onChange={(e) => setFormData({ ...formData, quantidade: Number(e.target.value) })}
                    className="rounded-lg border-gray-300 focus:ring-[#de4838]"
                  />
                </div>

                {/* Valor Total em Estoque (calculado) */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Valor Total em Estoque</Label>
                  <Input
                    type="text"
                    value={formatCurrency(valorTotalEstoque)}
                    disabled
                    className="rounded-lg bg-gray-50 border-gray-200 text-gray-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Fornecedor */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Fornecedor</Label>
                  <Input
                    value={formData.fornecedor || ""}
                    onChange={(e) => setFormData({ ...formData, fornecedor: e.target.value })}
                    placeholder="Nome do fornecedor"
                    className="rounded-lg border-gray-300 focus:ring-[#de4838]"
                  />
                </div>

                {/* Data da Última Compra */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Data da Última Compra</Label>
                  <Input
                    type="date"
                    value={formData.data_compra?.split("T")[0] || ""}
                    onChange={(e) => setFormData({ ...formData, data_compra: e.target.value })}
                    className="rounded-lg border-gray-300 focus:ring-[#de4838]"
                  />
                </div>
              </div>

              {/* Alert informativo */}
              <div className="pt-2">
                <Alert variant="default" className="bg-blue-50 border-blue-200 rounded-xl">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-sm text-blue-700">
                    As alterações serão aplicadas imediatamente no estoque e nos registros de venda.
                  </AlertDescription>
                </Alert>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value)
}