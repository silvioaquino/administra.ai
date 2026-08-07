// src/app/(dashboard)/nfe/xml/page.tsx

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Upload, FileText, Save, AlertCircle, Package, CheckCircle, XCircle, Building2, Camera, Image as ImageIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatCurrency, hojeISO, formatarTipoPagamento } from "@/lib/utils"
import { toast } from "sonner"

import { PageContainer } from "@/components/layout/PageContainer"
import { PageHeader } from "@/components/layout/PageHeader"
import { CameraScanner } from "@/components/camera-scanner"
import { useContasFinanceiras } from "@/hooks/useContasFinanceiras"

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

export default function NfeXmlPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [xmlFile, setXmlFile] = useState<File | null>(null)
  const [url, setUrl] = useState("")
  const [notaProcessada, setNotaProcessada] = useState<any>(null)
  const [produtos, setProdutos] = useState<ProdutoNota[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [scanMode, setScanMode] = useState<'qrcode' | 'barcode' | 'image'>('qrcode')
  const [notaDuplicada, setNotaDuplicada] = useState<any>(null)

  // Carregar contas financeiras da API
  const { contas, loading: loadingContas } = useContasFinanceiras()

  const [formData, setFormData] = useState({
    contaDespesa: "",
    dataCompra: hojeISO(),
    formaPagamento: "À vista"
  })

  // Definir a primeira conta como padrão quando carregar
  useEffect(() => {
    if (contas.length > 0 && !formData.contaDespesa) {
      setFormData(prev => ({ ...prev, contaDespesa: contas[0].id.toString() }))
    }
  }, [contas, formData.contaDespesa])

  // Função para processar resultado do scanner
  function handleScanResult(result: string) {
    setShowScanner(false)
    if (result.startsWith('{')) {
      try {
        const dados = JSON.parse(result)
        processarDados(dados)
        toast.success('Nota fiscal processada com sucesso!')
      } catch (error) {
        console.error('Erro ao processar JSON:', error)
        toast.error('Erro ao processar os dados da nota')
      }
    } else {
      // É uma URL
      setUrl(result)
    }
  }

  // Função para processar imagem diretamente
  function handleImageProcess(data: any) {
    processarDados(data)
    setShowCamera(false)
    toast.success('Nota fiscal processada com sucesso!')
  }

  async function verificarDuplicidade(nota: any) {
    try {
      const params = new URLSearchParams({
        chaveAcesso: nota?.chave_acesso || "",
        numero: String(nota?.numero || ""),
        serie: String(nota?.serie || ""),
        cnpjEmitente: nota?.cnpj_emitente || "",
      })
      const res = await fetch(`/api/nfe/verificar?${params.toString()}`)
      const json = await res.json()
      return json?.duplicada ? json.notaExistente : null
    } catch {
      return null
    }
  }

  async function processarDados(dados: any) {
    setNotaProcessada(dados)
    const produtosComSelecao = (dados.produtos || []).map((p: any) => ({
      ...p,
      selecionado: true
    }))
    setProdutos(produtosComSelecao)
    if (dados.data_emissao) {
      setFormData(prev => ({ ...prev, dataCompra: String(dados.data_emissao).slice(0, 10) }))
    }
    if (dados.formas_pagamento && dados.formas_pagamento.length > 0) {
      const forma = dados.formas_pagamento[0].forma
      setFormData(prev => ({ ...prev, formaPagamento: forma === 'Dinheiro' ? 'À vista' : forma }))
    }

    const duplicada = await verificarDuplicidade(dados)
    if (duplicada) {
      setNotaDuplicada(duplicada)
      toast.error("Nota já lançada", {
        description: `Nº ${duplicada.numero}/série ${duplicada.serie} — ${duplicada.nomeEmitente}`,
      })
    }
  }

  async function processarXml() {
    if (!xmlFile) {
      toast.error("Selecione um arquivo XML")
      return
    }

    setLoading(true)
    setNotaDuplicada(null)

    try {
      const xmlContent = await xmlFile.text()
      
      const response = await fetch("/api/nfe/processar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ xmlContent })
      })

      const data = await response.json()

      if (data.success) {
        await processarDados(data.data)
      } else {
        throw new Error(data.error || "Erro ao processar XML")
      }
    } catch (error) {
      console.error("Erro:", error)
      toast.error(error instanceof Error ? error.message : "Erro ao processar XML")
    } finally {
      setLoading(false)
    }
  }

  async function salvarCompra() {
    const produtosSelecionados = produtos.filter(p => p.selecionado)

    if (produtosSelecionados.length === 0) {
      toast.error("Selecione pelo menos um produto")
      return
    }

    if (!formData.contaDespesa) {
      toast.error("Selecione uma Conta Financeira", {
        description: "Acesse 'Contas Bancárias' e cadastre uma conta antes de salvar.",
      })
      return
    }

    if (notaDuplicada) {
      toast.error("Lançamento bloqueado: nota já registrada")
      return
    }

    setSalvando(true)

    try {
      const valorTotal = notaProcessada?.valor_total > 0
        ? notaProcessada.valor_total
        : (produtosSelecionados.reduce((sum, p) => sum + p.valor_total, 0) - (notaProcessada?.desconto || 0))
      const contaSelecionada = contas.find(c => c.id.toString() === formData.contaDespesa);

      // 1) Salvar a nota fiscal + produtos
      const resNota = await fetch("/api/nfe/salvar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nota: notaProcessada,
          produtos: produtosSelecionados,
          contaDespesa: formData.contaDespesa,
          dataCompra: formData.dataCompra,
          valorTotal,
          formaPagamento: formData.formaPagamento,
          desconto: notaProcessada?.desconto || 0,
          formasPagamento: notaProcessada?.formas_pagamento || []
        })
      })

      const dataNota = await resNota.json()

      if (resNota.status === 409) {
        setNotaDuplicada(dataNota.notaExistente || true)
        toast.error(dataNota.error || "Nota já lançada")
        return
      }

      if (!resNota.ok || !dataNota.success) {
        throw new Error(dataNota.error || "Erro ao salvar nota fiscal")
      }

      // 2) Registrar no livro diário
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
          origemDestino: contaSelecionada?.nome || null,
          notaFiscalId: dataNota.data?.id || null,
          formaPagamento: formData.formaPagamento,
          origemXml: true
        })
      })

      if (!response.ok) throw new Error("Erro ao registrar no livro diário")

      const descontoMsg = descontoNota > 0 ? `\n💸 Desconto: ${formatCurrency(descontoNota)}` : ""
      toast.success(`✅ Compra registrada com sucesso!\n💰 Total: ${formatCurrency(valorTotal)}\n📦 Produtos: ${produtosSelecionados.length}${descontoMsg}`)

      // Resetar formulário
      setXmlFile(null)
      setNotaProcessada(null)
      setProdutos([])
      setNotaDuplicada(null)
      setFormData({
        contaDespesa: "",
        dataCompra: hojeISO(),
        formaPagamento: "À vista"
      })

    } catch (error) {
      console.error("Erro:", error)
      toast.error(error instanceof Error ? error.message : "Erro ao salvar compra")
    } finally {
      setSalvando(false)
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
      toast.error("Por favor, selecione um arquivo XML válido")
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
  const totalProdutos = produtosSelecionados.reduce((sum, p) => sum + p.valor_total, 0)
  const descontoNota = notaProcessada?.desconto || 0
  const formasPagamentoNota = notaProcessada?.formas_pagamento || []
  const valorTotalCompra = notaProcessada?.valor_total > 0
    ? notaProcessada.valor_total
    : (totalProdutos - descontoNota)

  return (
    <div className="min-h-screen bg-background">
      <PageContainer>
        <PageHeader
          title="Processar NF-e XML"
          onBack={() => router.back()}
          subtitle="Faça upload do arquivo XML da nota fiscal de compra"
        >
          {produtos.length > 0 && (
            <Button 
              onClick={salvarCompra}
              disabled={salvando || produtosSelecionados.length === 0 || !!notaDuplicada}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 rounded-full shadow-sm"
            >
              <Save className="mr-2 h-4 w-4" />
              {salvando ? "Salvando..." : notaDuplicada ? "Nota já lançada" : `Salvar Compra (${formatCurrency(valorTotalCompra)})`}
            </Button>
          )}
        </PageHeader>

        {notaDuplicada && (
          <Alert variant="destructive" className="border-destructive/40 bg-destructive/10 rounded-xl">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Esta nota já foi lançada
              {notaDuplicada?.numero
                ? ` (nº ${notaDuplicada.numero}/série ${notaDuplicada.serie} — ${notaDuplicada.nomeEmitente})`
                : ""}
              . O lançamento em duplicidade está bloqueado.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column - Upload Area */}
          <div className="space-y-6">
            {/* Upload Card */}
            <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-surface-2 p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Upload do Arquivo XML</h3>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Selecione o arquivo XML da NF-e de compra</p>
              </div>
              <div className="p-6 space-y-4">
                <Alert variant="default" className="bg-warning/5 border-warning/30 rounded-xl">
                  <AlertCircle className="h-4 w-4 text-warning" />
                  <AlertDescription className="text-sm text-warning">
                    Esta nota será registrada como DESPESA (Saída do caixa)
                  </AlertDescription>
                </Alert>

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Arquivo XML da NF-e</Label>

                  {/* Botões para foto e scanner */}
                  <div className="flex gap-2 mt-1 mb-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setScanMode('image')
                        setShowCamera(true)
                      }}
                      className="flex-1 border-dashed border-border hover:border-primary hover:text-primary"
                    >
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Tirar Foto
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setScanMode('barcode')
                        setShowScanner(true)
                      }}
                      className="flex-1 border-dashed border-border hover:border-primary hover:text-primary"
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      Escanear Código
                    </Button>
                  </div>

                  {/* Drag and Drop Area */}
                  <div
                    className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer
                      ${dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/50'}
                      ${xmlFile ? 'bg-success/10 border-success/40' : ''}
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
                      onChange={(e) => {
                        setXmlFile(e.target.files?.[0] || null)
                        setNotaProcessada(null)
                        setProdutos([])
                      }}
                      className="hidden"
                    />

                    {xmlFile ? (
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle className="h-12 w-12 text-success" />
                        <p className="text-sm font-medium text-success">Arquivo selecionado!</p>
                        <p className="text-xs text-muted-foreground break-all">{xmlFile.name}</p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="mt-2 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            setXmlFile(null)
                            setNotaProcessada(null)
                            setProdutos([])
                          }}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Remover
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-12 w-12 text-muted-foreground/70" />
                        <p className="text-sm text-muted-foreground">
                          Arraste e solte o arquivo XML aqui
                        </p>
                        <p className="text-xs text-muted-foreground/70">ou clique para selecionar</p>
                        <p className="text-xs text-muted-foreground/70 mt-2">Aceita arquivos .xml</p>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground mt-2">
                    Selecione o arquivo XML da NF-e de compra, tire uma foto ou escaneie o código
                  </p>
                </div>

                <Button
                  onClick={processarXml}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
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

            {/* Informações da Compra */}
            {notaProcessada && (
              <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-surface-2 p-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-foreground">Informações da Compra</h3>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="rounded-lg bg-surface-2 p-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Fornecedor</p>
                    <p className="text-sm font-medium text-foreground mt-1">{notaProcessada.nome_emitente || "Não informado"}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">CNPJ: {notaProcessada.cnpj_emitente || "Não informado"}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Conta de Despesa</Label>
                      <div className="relative">
                        <select
                          className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none"
                          value={formData.contaDespesa}
                          onChange={(e) => setFormData({ ...formData, contaDespesa: e.target.value })}
                          disabled={loadingContas || contas.length === 0}
                        >
                          {loadingContas ? (
                            <option value="">Carregando contas...</option>
                          ) : contas.length === 0 ? (
                            <option value="">Nenhuma conta disponível</option>
                          ) : (
                            contas.map((conta) => (
                              <option key={conta.id} value={conta.id.toString()}>
                                {conta.nome}
                              </option>
                            ))
                          )}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-foreground">
                          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Data da Compra</Label>
                      <Input
                        type="date"
                        value={formData.dataCompra}
                        onChange={(e) => setFormData({ ...formData, dataCompra: e.target.value })}
                        className="rounded-lg border-border focus:ring-primary focus:border-primary"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Preview */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-surface-2 p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Resumo da Operação</h3>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Pré-visualização da compra</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-border">
                  <span className="text-sm text-muted-foreground">Tipo:</span>
                  <span className="text-sm font-medium px-2 py-1 rounded-full bg-warning/10 text-warning">
                    Compra (Saída)
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Fornecedor:</span>
                  <span className="font-medium text-foreground text-right max-w-[200px] truncate">
                    {notaProcessada?.nome_emitente || "Aguardando nota..."}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Produtos na nota:</span>
                  <span className="font-medium text-foreground">{produtos.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Produtos selecionados:</span>
                  <span className="font-medium text-foreground">{produtosSelecionados.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Conta de despesa:</span>
                  <span className="font-medium text-foreground text-right max-w-[200px] truncate">
                    {formData.contaDespesa.split(" ").slice(1).join(" ")}
                  </span>
                </div>
                {descontoNota > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Desconto:</span>
                    <span className="font-medium text-green-400">-{formatCurrency(descontoNota)}</span>
                  </div>
                )}
                {formasPagamentoNota.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Formas de pagamento detectadas ({formasPagamentoNota.length})</span>
                    {formasPagamentoNota.map((fp: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{formatarTipoPagamento(fp.forma)}</span>
                        <span className="font-medium text-white">{formatCurrency(fp.valor)}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="pt-4 mt-2 border-t border-dashed border-border">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-foreground">Total a pagar:</span>
                    <span className="text-xl font-bold text-primary">{formatCurrency(valorTotalCompra)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Camera Scanner Modals */}
        {showScanner && (
          <CameraScanner
            onScan={handleScanResult}
            onClose={() => setShowScanner(false)}
            scanMode={scanMode}
          />
        )}

        {showCamera && (
          <CameraScanner
            onScan={handleScanResult}
            onImageProcess={handleImageProcess}
            onClose={() => setShowCamera(false)}
            scanMode="image"
          />
        )}

        {/* Lista de Produtos - Full width with checkboxes */}
        {produtos.length > 0 && (
          <div className="mt-8">
            <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-surface-2 p-4 border-b border-border">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-foreground">Produtos da Nota</h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={produtos.length > 0 && produtos.every(p => p.selecionado)}
                        onChange={toggleTodos}
                        className="rounded border-border text-primary focus:ring-primary"
                      />
                      Selecionar todos
                    </label>
                    <span className="text-sm text-muted-foreground">
                      {produtosSelecionados.length} de {produtos.length} selecionados
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Selecione os itens que deseja registrar na compra</p>
              </div>
              <div className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-surface-2 border-b border-border">
                    <tr>
                      <th className="px-4 py-3 text-left w-10"></th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Código</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Descrição</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">NCM</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Qtd</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Valor Unit.</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Valor Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {produtos.map((produto, index) => (
                      <tr key={index} className="border-b border-border hover:bg-surface-2 transition-colors">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={produto.selecionado}
                            onChange={() => toggleProduto(index)}
                            className="rounded border-border text-primary focus:ring-primary"
                          />
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{produto.codigo || "-"}</td>
                        <td className="px-4 py-3 text-foreground">{produto.descricao}</td>
                        <td className="px-4 py-3 text-center font-mono text-xs text-muted-foreground">{produto.ncm || "-"}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center gap-1">
                            {produto.quantidade} <span className="text-xs text-muted-foreground">{produto.unidade}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">{formatCurrency(produto.valor_unitario)}</td>
                        <td className="px-4 py-3 text-right font-medium text-foreground">{formatCurrency(produto.valor_total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-surface-2 border-t border-border">
                    <tr>
                      <td colSpan={6} className="px-4 py-4 text-right font-semibold text-foreground">
                        Total da Compra:
                      </td>
                      <td className="px-4 py-4 text-right text-xl font-bold text-primary">
                        {formatCurrency(valorTotalCompra)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}
      </PageContainer>
    </div>
  )
}