// src/app/(dashboard)/nfe/xml/page.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Upload, FileText, Save, AlertCircle, Package, CheckCircle, XCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatCurrency } from "@/lib/utils"

export default function NfeXmlPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [xmlFile, setXmlFile] = useState<File | null>(null)
  const [notaProcessada, setNotaProcessada] = useState<any>(null)
  const [dragActive, setDragActive] = useState(false)

  async function processarXml() {
    if (!xmlFile) {
      alert("Selecione um arquivo XML")
      return
    }

    setLoading(true)

    try {
      const xmlContent = await xmlFile.text()
      
      const response = await fetch("/api/nfe/processar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ xmlContent })
      })

      const data = await response.json()

      if (data.success) {
        setNotaProcessada(data.data)
      } else {
        throw new Error(data.error || "Erro ao processar XML")
      }
    } catch (error) {
      console.error("Erro:", error)
      alert(error instanceof Error ? error.message : "Erro ao processar XML")
    } finally {
      setLoading(false)
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragActive(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    setDragActive(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file && (file.name.endsWith('.xml') || file.name.endsWith('.XML'))) {
      setXmlFile(file)
    } else {
      alert("Por favor, selecione um arquivo XML válido")
    }
  }

  function formatDate(dateString: string) {
    if (!dateString) return "-"
    try {
      return new Date(dateString).toLocaleDateString("pt-BR")
    } catch {
      return dateString
    }
  }

  const valorTotal = notaProcessada?.valor_total || 0

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
            <h1 className="text-xl font-semibold text-gray-800">Processar NF-e XML</h1>
            <p className="text-sm text-gray-500">Faça upload do arquivo XML da nota fiscal de compra</p>
          </div>
        </div>
        {notaProcessada && (
          <Button 
            onClick={() => router.push("/nfe/compra")}
            className="bg-[#de4838] hover:bg-[#c73d2e] text-white px-6 rounded-full shadow-sm"
          >
            <Save className="mr-2 h-4 w-4" />
            Salvar Compra
          </Button>
        )}
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column - Upload Area */}
          <div className="space-y-6">
            {/* Upload Card */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-gray-50 p-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-[#de4838]" />
                  <h3 className="font-semibold text-gray-800">Upload do Arquivo XML</h3>
                </div>
                <p className="text-xs text-gray-500 mt-1">Selecione o arquivo XML da NF-e de compra</p>
              </div>
              <div className="p-6 space-y-4">
                <Alert variant="default" className="bg-orange-50 border-orange-200 rounded-xl">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-sm text-orange-700">
                    Esta nota será registrada como DESPESA (Saída do caixa)
                  </AlertDescription>
                </Alert>

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Arquivo XML da NF-e</Label>
                  
                  {/* Drag and Drop Area */}
                  <div
                    className={`mt-1 relative border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer
                      ${dragActive ? 'border-[#de4838] bg-[#de4838]/5' : 'border-gray-300 hover:border-gray-400'}
                      ${xmlFile ? 'bg-green-50 border-green-300' : ''}
                    `}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('xml-upload')?.click()}
                  >
                    <input
                      id="xml-upload"
                      type="file"
                      accept=".xml, .XML"
                      onChange={(e) => setXmlFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    
                    {xmlFile ? (
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle className="h-12 w-12 text-green-500" />
                        <p className="text-sm font-medium text-green-700">Arquivo selecionado!</p>
                        <p className="text-xs text-gray-500 break-all">{xmlFile.name}</p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="mt-2 text-red-500 hover:text-red-700"
                          onClick={(e) => {
                            e.stopPropagation()
                            setXmlFile(null)
                          }}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Remover
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-12 w-12 text-gray-400" />
                        <p className="text-sm text-gray-600">
                          Arraste e solte o arquivo XML aqui
                        </p>
                        <p className="text-xs text-gray-400">ou clique para selecionar</p>
                        <p className="text-xs text-gray-400 mt-2">Aceita arquivos .xml</p>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 mt-2">
                    Selecione o arquivo XML da NF-e de compra (formato .xml)
                  </p>
                </div>

                <Button 
                  onClick={processarXml} 
                  className="w-full bg-[#de4838] hover:bg-[#c73d2e] text-white rounded-lg"
                  disabled={loading || !xmlFile}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Processar XML
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column - Preview */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-gray-50 p-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#de4838]" />
                  <h3 className="font-semibold text-gray-800">Resumo da Nota</h3>
                </div>
                <p className="text-xs text-gray-500 mt-1">Pré-visualização dos dados</p>
              </div>
              <div className="p-6 space-y-4">
                {notaProcessada ? (
                  <>
                    <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                      <span className="text-sm text-gray-500">Tipo:</span>
                      <span className="text-sm font-medium px-2 py-1 rounded-full bg-orange-100 text-orange-700">
                        Compra (Despesa)
                      </span>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-4">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Emitente</p>
                      <p className="text-sm font-medium text-gray-800 mt-1">{notaProcessada.nome_emitente || "Não informado"}</p>
                      <p className="text-xs text-gray-500 mt-0.5">CNPJ: {notaProcessada.cnpj_emitente || "Não informado"}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Número da Nota</p>
                        <p className="text-sm font-medium text-gray-800">{notaProcessada.numero || "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Data de Emissão</p>
                        <p className="text-sm font-medium text-gray-800">{formatDate(notaProcessada.data_emissao)}</p>
                      </div>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Produtos:</span>
                      <span className="font-medium text-gray-800">{notaProcessada.produtos?.length || 0} itens</span>
                    </div>

                    <div className="pt-4 mt-2 border-t border-dashed border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-gray-700">Valor Total da Nota:</span>
                        <span className="text-xl font-bold text-[#de4838]">{formatCurrency(valorTotal)}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">Nenhuma nota processada</p>
                    <p className="text-xs text-gray-400 mt-1">Faça upload de um arquivo XML para visualizar os dados</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Produtos - Full width */}
        {notaProcessada?.produtos && notaProcessada.produtos.length > 0 && (
          <div className="mt-8">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-gray-50 p-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-[#de4838]" />
                  <h3 className="font-semibold text-gray-800">Produtos da Nota</h3>
                </div>
                <p className="text-xs text-gray-500 mt-1">Itens processados a partir do XML</p>
              </div>
              <div className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">NCM</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Qtd</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Unit.</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notaProcessada.produtos.map((produto: any, index: number) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-gray-600">{produto.codigo || "-"}</td>
                        <td className="px-4 py-3 text-gray-800">{produto.descricao}</td>
                        <td className="px-4 py-3 text-center font-mono text-xs text-gray-500">{produto.ncm || "-"}</td>
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
                        Total da Nota:
                      </td>
                      <td className="px-4 py-4 text-right text-xl font-bold text-[#de4838]">
                        {formatCurrency(valorTotal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className="p-4 border-t border-gray-100 bg-gray-50">
                <Button 
                  onClick={() => router.push("/nfe/compra")}
                  className="w-full bg-[#de4838] hover:bg-[#c73d2e] text-white rounded-lg"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Continuar para registro da compra
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}