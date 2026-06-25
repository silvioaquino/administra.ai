// src/app/(dashboard)/nfe/compra/page.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Truck, Search, Save, AlertCircle, Package, Building2, Calendar, DollarSign, CheckCircle, Camera } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatCurrency } from "@/lib/utils"
import { CameraScanner } from "@/components/camera-scanner"

interface ProdutoNota {
  codigo: string
  descricao: string
  ncm: string
  unidade: string
  quantidade: number
  valor_unitario: number
  valor_total: number
  selecionado: boolean
}

export default function CompraNfePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [processando, setProcessando] = useState(false)
  const [url, setUrl] = useState("")
  const [notaProcessada, setNotaProcessada] = useState<any>(null)
  const [produtos, setProdutos] = useState<ProdutoNota[]>([])
  const [showScanner, setShowScanner] = useState(false)
  const [formData, setFormData] = useState({
    contaDespesa: "3.2.1 Compras de Mercadorias",
    dataCompra: new Date().toISOString().split("T")[0]
  })

  function handleScanResult(result: string) {
    setUrl(result)
    setShowScanner(false)
    processarUrl(result)
  }

  async function processarUrl(scanResult: string) {
    if (!scanResult.includes("nfce.sefaz.pe.gov.br")) {
      alert("URL inválida. Apenas URLs da SEFAZ-PE são aceitas")
      return
    }

    setProcessando(true)

    try {
      const response = await fetch("/api/nfe/processar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: scanResult })
      })

      const data = await response.json()

      if (data.success) {
        setNotaProcessada(data.data)
        const produtosComSelecao = (data.data.produtos || []).map((p: any) => ({
          ...p,
          selecionado: true
        }))
        setProdutos(produtosComSelecao)
      } else {
        throw new Error(data.error || "Erro ao processar nota")
      }
    } catch (error) {
      console.error("Erro:", error)
      alert(error instanceof Error ? error.message : "Erro ao processar nota")
    } finally {
      setProcessando(false)
    }
  }

  async function processarNota() {
    if (!url) {
      alert("Informe a URL da NFC-e")
      return
    }

    if (!url.includes("nfce.sefaz.pe.gov.br")) {
      alert("URL inválida. Apenas URLs da SEFAZ-PE são aceitas")
      return
    }

    setProcessando(true)

    try {
      const response = await fetch("/api/nfe/processar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      })

      const data = await response.json()

      if (data.success) {
        setNotaProcessada(data.data)
        const produtosComSelecao = (data.data.produtos || []).map((p: any) => ({
          ...p,
          selecionado: true
        }))
        setProdutos(produtosComSelecao)
      } else {
        throw new Error(data.error || "Erro ao processar nota")
      }
    } catch (error) {
      console.error("Erro:", error)
      alert(error instanceof Error ? error.message : "Erro ao processar nota")
    } finally {
      setProcessando(false)
    }
  }

  async function salvarCompra() {
    const produtosSelecionados = produtos.filter(p => p.selecionado)

    if (produtosSelecionados.length === 0) {
      alert("Selecione pelo menos um produto")
      return
    }

    setLoading(true)

    try {
      // Registrar compra no livro diário
      const valorTotal = produtosSelecionados.reduce((sum, p) => sum + p.valor_total, 0)

      const response = await fetch("/api/livro-diario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: formData.dataCompra,
          conta: formData.contaDespesa,
          descricao: `NF-e Compra: ${notaProcessada?.nome_emitente || "Fornecedor"} - ${produtosSelecionados.length} itens`,
          cliente_fornecedor: `${notaProcessada?.nome_emitente || ""} | ${notaProcessada?.cnpj_emitente || ""}`,
          entrada: 0,
          saida: valorTotal,
          tipo: "COMPRA",
          notaFiscalId: notaProcessada?.notaFiscalId
        })
      })

      if (!response.ok) throw new Error("Erro ao registrar no livro diário")

      // Salvar produtos no banco
      const produtosParaSalvar = produtosSelecionados.map(p => ({
        descricao: p.descricao,
        unidade: p.unidade,
        quantidade: p.quantidade,
        valor_unitario: p.valor_unitario,
        valor_total: p.valor_total,
        codigo: p.codigo,
        fornecedor: notaProcessada?.nome_emitente || "",
        data_compra: formData.dataCompra,
        preco_venda: p.valor_unitario * 1.3 // Margem sugerida de 30%
      }))

      const batchResponse = await fetch("/api/produtos/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(produtosParaSalvar)
      })

      if (!batchResponse.ok) throw new Error("Erro ao salvar produtos")

      alert(`✅ Compra registrada com sucesso!\n💰 Total: ${formatCurrency(valorTotal)}\n📦 Produtos: ${produtosSelecionados.length}`)
      
      // Resetar formulário
      setUrl("")
      setNotaProcessada(null)
      setProdutos([])
      
    } catch (error) {
      console.error("Erro:", error)
      alert("Erro ao salvar compra")
    } finally {
      setLoading(false)
    }
  }

  function toggleProduto(index: number) {
    const novosProdutos = [...produtos]
    novosProdutos[index].selecionado = !novosProdutos[index].selecionado
    setProdutos(novosProdutos)
  }

  function toggleTodos() {
    const todosSelecionados = produtos.every(p => p.selecionado)
    setProdutos(produtos.map(p => ({ ...p, selecionado: !todosSelecionados })))
  }

  const produtosSelecionados = produtos.filter(p => p.selecionado)
  const valorTotalCompra = produtosSelecionados.reduce((sum, p) => sum + p.valor_total, 0)

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
            <h1 className="text-xl font-semibold text-gray-800">NFC-e de Compra</h1>
            <p className="text-sm text-gray-500">Processe notas fiscais de compra da SEFAZ-PE</p>
          </div>
        </div>
        {produtos.length > 0 && (
          <Button 
            onClick={salvarCompra}
            disabled={loading || produtosSelecionados.length === 0}
            className="bg-[#de4838] hover:bg-[#c73d2e] text-white px-6 rounded-full shadow-sm"
          >
            <Save className="mr-2 h-4 w-4" />
            {loading ? "Salvando..." : `Salvar Compra (${formatCurrency(valorTotalCompra)})`}
          </Button>
        )}
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column - URL Processing */}
          <div className="space-y-6">
            {/* Processar NFC-e Card */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-gray-50 p-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-[#de4838]" />
                  <h3 className="font-semibold text-gray-800">Processar NFC-e</h3>
                </div>
                <p className="text-xs text-gray-500 mt-1">Insira a URL da nota fiscal de compra</p>
              </div>
              <div className="p-6 space-y-4">
                <Alert variant="default" className="bg-orange-50 border-orange-200 rounded-xl">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-sm text-orange-700">
                    Esta nota será registrada como DESPESA (Saída do caixa)
                  </AlertDescription>
                </Alert>

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">URL da NFC-e de Compra</Label>
                  <div className="relative mt-1">
                    <textarea
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#de4838] focus:border-transparent resize-none"
                      rows={3}
                      placeholder="https://nfce.sefaz.pe.gov.br/nfce/consulta?p=..."
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowScanner(true)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-gray-600 hover:text-[#de4838]"
                      title="Escanear QR Code"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Insira a URL da NFC-e de COMPRA da SEFAZ-PE ou escaneie o QR Code
                  </p>
                </div>

                <Button
                  onClick={processarNota}
                  className="w-full bg-[#de4838] hover:bg-[#c73d2e] text-white rounded-lg"
                  disabled={processando || !url}
                >
                  <Search className="mr-2 h-4 w-4" />
                  {processando ? "Processando..." : "Processar Nota de Compra"}
                </Button>
              </div>
            </div>

            {/* Informações da Compra */}
            {notaProcessada && (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-gray-50 p-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-[#de4838]" />
                    <h3 className="font-semibold text-gray-800">Informações da Compra</h3>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="rounded-lg bg-gray-50 p-4">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Fornecedor</p>
                    <p className="text-sm font-medium text-gray-800 mt-1">{notaProcessada.nome_emitente || "Não informado"}</p>
                    <p className="text-xs text-gray-500 mt-0.5">CNPJ: {notaProcessada.cnpj_emitente || "Não informado"}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Conta de Despesa</Label>
                      <div className="relative">
                        <select
                          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#de4838] focus:border-transparent appearance-none"
                          value={formData.contaDespesa}
                          onChange={(e) => setFormData({ ...formData, contaDespesa: e.target.value })}
                        >
                          <option value="3.2.1 Compras de Mercadorias">📦 Compras de Mercadorias</option>
                          <option value="3.2.2 Compras de Insumos">🥩 Compras de Insumos</option>
                          <option value="3.2.3 Compras de Embalagens">📦 Compras de Embalagens</option>
                          <option value="3.2.4 Compras de Equipamentos">🔧 Compras de Equipamentos</option>
                          <option value="3.2.5 Compras de Material Limpeza">🧹 Compras de Material Limpeza</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Data da Compra</Label>
                      <Input
                        type="date"
                        value={formData.dataCompra}
                        onChange={(e) => setFormData({ ...formData, dataCompra: e.target.value })}
                        className="rounded-lg border-gray-300 focus:ring-[#de4838] focus:border-[#de4838]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Preview */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-gray-50 p-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-[#de4838]" />
                  <h3 className="font-semibold text-gray-800">Resumo da Operação</h3>
                </div>
                <p className="text-xs text-gray-500 mt-1">Pré-visualização da compra</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Tipo:</span>
                  <span className="text-sm font-medium px-2 py-1 rounded-full bg-orange-100 text-orange-700">
                    Compra (Saída)
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Fornecedor:</span>
                  <span className="font-medium text-gray-800 text-right max-w-[200px] truncate">
                    {notaProcessada?.nome_emitente || "Aguardando nota..."}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Produtos na nota:</span>
                  <span className="font-medium text-gray-800">{produtos.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Produtos selecionados:</span>
                  <span className="font-medium text-gray-800">{produtosSelecionados.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Conta de despesa:</span>
                  <span className="font-medium text-gray-800 text-right max-w-[200px] truncate">
                    {formData.contaDespesa.split(" ").slice(1).join(" ")}
                  </span>
                </div>
                <div className="pt-4 mt-2 border-t border-dashed border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-700">Total a pagar:</span>
                    <span className="text-xl font-bold text-[#de4838]">{formatCurrency(valorTotalCompra)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Camera Scanner Modal */}
        {showScanner && (
          <CameraScanner
            onScan={handleScanResult}
            onClose={() => setShowScanner(false)}
            scanMode="qrcode"
          />
        )}

        {/* Lista de produtos da nota - Full width */}
        {produtos.length > 0 && (
          <div className="mt-8">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-gray-50 p-4 border-b border-gray-100">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-[#de4838]" />
                    <h3 className="font-semibold text-gray-800">Produtos da Nota</h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      <input
                        type="checkbox"
                        checked={produtos.length > 0 && produtos.every(p => p.selecionado)}
                        onChange={toggleTodos}
                        className="rounded border-gray-300 text-[#de4838] focus:ring-[#de4838]"
                      />
                      Selecionar todos
                    </label>
                    <span className="text-sm text-gray-500">
                      {produtosSelecionados.length} de {produtos.length} selecionados
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left w-10"></th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Qtd</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Unit.</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {produtos.map((produto, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={produto.selecionado}
                            onChange={() => toggleProduto(index)}
                            className="rounded border-gray-300 text-[#de4838] focus:ring-[#de4838]"
                          />
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-600">{produto.codigo || "-"}</td>
                        <td className="px-4 py-3 text-gray-800">{produto.descricao}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center gap-1">
                            {produto.quantidade} <span className="text-xs text-gray-500">{produto.unidade}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(produto.valor_unitario)}</td>
                        <td className="px-4 py-3 text-right font-medium text-gray-800">{formatCurrency(produto.valor_total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t border-gray-200">
                    <tr>
                      <td colSpan={5} className="px-4 py-4 text-right font-semibold text-gray-700">
                        Total da Compra:
                      </td>
                      <td className="px-4 py-4 text-right text-xl font-bold text-[#de4838]">
                        {formatCurrency(valorTotalCompra)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}