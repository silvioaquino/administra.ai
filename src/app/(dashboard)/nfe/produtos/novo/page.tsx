"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Package, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function NovoProdutoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    descricao: "",
    unidade: "UN",
    precoVenda: 0,
    quantidade: 0,
    fornecedor: "",
    dataCompra: new Date().toISOString().split("T")[0]
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    
    if (!formData.descricao.trim()) {
      setError("Nome do produto é obrigatório")
      return
    }

    if (formData.precoVenda <= 0) {
      setError("Preço de venda deve ser maior que zero")
      return
    }

    setLoading(true)

    try {
      // Formatar dados - usar snake_case para o Prisma
      const produtoData = {
        descricao: formData.descricao.trim(),
        unidade: formData.unidade,
        precoVenda: Number(formData.precoVenda),
        quantidade: Number(formData.quantidade),
        fornecedor: formData.fornecedor.trim() || null,
        dataCompra: formData.dataCompra,
        valorUnitario: Number(formData.precoVenda), // Mesmo valor do preço de venda inicialmente
        valorTotal: Number(formData.quantidade) * Number(formData.precoVenda)
      }

      console.log("Enviando produto:", produtoData)

      // Usar API de produto único, não batch
      const response = await fetch("/api/produtos", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify(produtoData)
      })

      let data
      const textResponse = await response.text()
      
      try {
        data = JSON.parse(textResponse)
      } catch (e) {
        console.error("Resposta não é JSON:", textResponse.substring(0, 200))
        throw new Error(`Erro do servidor: ${textResponse.substring(0, 100)}`)
      }

      console.log("Resposta:", data)

      if (response.ok && data.success) {
        alert("✅ Produto cadastrado com sucesso!")
        router.push("/nfe/produtos")
        router.refresh()
      } else {
        throw new Error(data.error || data.message || "Erro ao cadastrar produto")
      }
    } catch (error) {
      console.error("Erro detalhado:", error)
      setError(error instanceof Error ? error.message : "Erro ao cadastrar produto")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
            {error && (
              <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200 text-red-800">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <form id="produto-form" onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Nome do Produto <span className="text-[#de4838]">*</span>
                </Label>
                <Input
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Ex: X-Burger Completo"
                  className="rounded-lg border-gray-300"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Unidade de Medida</Label>
                  <select
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm"
                    value={formData.unidade}
                    onChange={(e) => setFormData({ ...formData, unidade: e.target.value })}
                  >
                    <option value="UN">Unidade (UN)</option>
                    <option value="KG">Quilograma (KG)</option>
                    <option value="G">Grama (G)</option>
                    <option value="L">Litro (L)</option>
                    <option value="ML">Mililitro (ML)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Valor Total da Compra (R$) <span className="text-[#de4838]">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.precoVenda}
                      onChange={(e) => setFormData({ ...formData, precoVenda: Number(e.target.value) })}
                      className="pl-8 rounded-lg border-gray-300"
                      placeholder="0,00"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Quantidade Comprada</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.quantidade}
                    onChange={(e) => setFormData({ ...formData, quantidade: Number(e.target.value) })}
                    className="rounded-lg border-gray-300"
                    placeholder="0"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Fornecedor</Label>
                  <Input
                    value={formData.fornecedor}
                    onChange={(e) => setFormData({ ...formData, fornecedor: e.target.value })}
                    placeholder="Nome do fornecedor (opcional)"
                    className="rounded-lg border-gray-300"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Data da Compra</Label>
                <Input
                  type="date"
                  value={formData.dataCompra}
                  onChange={(e) => setFormData({ ...formData, dataCompra: e.target.value })}
                  className="rounded-lg border-gray-300"
                />
              </div>

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