// src/app/(dashboard)/livro-diario/page.tsx
"use client"

import React from "react"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  BookOpen,
  Plus,
  RefreshCw,
  Search,
  Eraser,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Eye,
  Edit,
  Trash2,
  FileText,
  Package,
  Calendar,
  Filter,
  ChevronDown,
  ChevronRight,
  X,
  Barcode,
  CheckCircle,
  Clock,
  AlertCircle,
  Users,
  Calculator,
  Briefcase,
  Zap
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatCurrency, formatDate } from "@/lib/utils"

// Tipos
interface ProdutoNota {
  codigo: string
  descricao: string
  unidade: string
  quantidade: number
  valorUnitario: number
  valorTotal: number
}

interface NotaFiscal {
  id: number
  chaveAcesso: string
  numero: number
  serie: number
  dataEmissao: string
  cnpjEmitente: string
  nomeEmitente: string
  valorTotal: number
  produtos: ProdutoNota[]
  pagamentos: Array<{
    formaPagamento: string
    valor: number
  }>
}

interface Lancamento {
  id: number
  data: string
  conta: string
  descricao: string
  clienteFornecedor: string | null
  entrada: number
  saida: number
  tipo: string
  notaFiscalId: number | null
  boletoId: number | null
  statusBoleto: string | null
  dataVencimento: string | null
  dataPagamento: string | null
  createdAt: string
  updatedAt: string
}

const obterDataHoje = () => {
  const hoje = new Date()
  const ano = hoje.getFullYear()
  const mes = String(hoje.getMonth() + 1).padStart(2, "0")
  const dia = String(hoje.getDate()).padStart(2, "0")

  return `${ano}-${mes}-${dia}`
}

// Dados mocados de exemplo (IDs 9991-10000)
const lancamentosExemploMocados: Lancamento[] = [
  {
    id: 9991,
    data: new Date(new Date().getFullYear(), new Date().getMonth(), 10).toISOString(),
    conta: "4.1.1 Despesas Administrativas",
    descricao: "Boleto: Aluguel do Mês (Escritório)",
    clienteFornecedor: "Imobiliária Central",
    entrada: 0,
    saida: 2500.00,
    tipo: "DESPESA",
    notaFiscalId: null,
    boletoId: 9991,
    statusBoleto: "PENDENTE",
    dataVencimento: new Date(new Date().getFullYear(), new Date().getMonth(), 10).toISOString(),
    dataPagamento: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 9992,
    data: new Date(new Date().getFullYear(), new Date().getMonth(), 15).toISOString(),
    conta: "4.1.3 Despesas com Materiais",
    descricao: "Boleto: Fornecedor - Materiais de Limpeza",
    clienteFornecedor: "LimpeMax Distribuidora",
    entrada: 0,
    saida: 850.50,
    tipo: "DESPESA",
    notaFiscalId: null,
    boletoId: 9992,
    statusBoleto: "PENDENTE",
    dataVencimento: new Date(new Date().getFullYear(), new Date().getMonth(), 15).toISOString(),
    dataPagamento: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 9993,
    data: new Date(new Date().getFullYear(), new Date().getMonth(), 20).toISOString(),
    conta: "4.1.2 Despesas de Utilidades",
    descricao: "Boleto: Energia Elétrica",
    clienteFornecedor: "Concessionária de Energia",
    entrada: 0,
    saida: 420.75,
    tipo: "DESPESA",
    notaFiscalId: null,
    boletoId: 9993,
    statusBoleto: "PENDENTE",
    dataVencimento: new Date(new Date().getFullYear(), new Date().getMonth(), 20).toISOString(),
    dataPagamento: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 9994,
    data: new Date(new Date().getFullYear(), new Date().getMonth(), 25).toISOString(),
    conta: "4.1.2 Despesas de Utilidades",
    descricao: "Boleto: Internet e Telefonia",
    clienteFornecedor: "Telecomunicações Ltda",
    entrada: 0,
    saida: 189.90,
    tipo: "DESPESA",
    notaFiscalId: null,
    boletoId: 9994,
    statusBoleto: "PENDENTE",
    dataVencimento: new Date(new Date().getFullYear(), new Date().getMonth(), 25).toISOString(),
    dataPagamento: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 9995,
    data: new Date(new Date().getFullYear(), new Date().getMonth(), 5).toISOString(),
    conta: "4.2.1 Custo de Mercadorias",
    descricao: "Boleto: Fornecedor - Gêneros Alimentícios",
    clienteFornecedor: "Distribuidora Alimentos",
    entrada: 0,
    saida: 1250.00,
    tipo: "DESPESA",
    notaFiscalId: null,
    boletoId: 9995,
    statusBoleto: "VENCIDO",
    dataVencimento: new Date(new Date().getFullYear(), new Date().getMonth(), 5).toISOString(),
    dataPagamento: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 9996,
    data: new Date(new Date().getFullYear(), new Date().getMonth(), 2).toISOString(),
    conta: "4.1.2 Despesas de Utilidades",
    descricao: "Boleto: Água e Esgoto",
    clienteFornecedor: "Companhia de Saneamento",
    entrada: 0,
    saida: 180.30,
    tipo: "DESPESA",
    notaFiscalId: null,
    boletoId: 9996,
    statusBoleto: "VENCIDO",
    dataVencimento: new Date(new Date().getFullYear(), new Date().getMonth(), 2).toISOString(),
    dataPagamento: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 9997,
    data: new Date(new Date().getFullYear(), new Date().getMonth(), 28).toISOString(),
    conta: "4.1.4 Despesas com Software",
    descricao: "Boleto: Software de Gestão",
    clienteFornecedor: "Tech Solutions",
    entrada: 0,
    saida: 299.90,
    tipo: "DESPESA",
    notaFiscalId: null,
    boletoId: 9997,
    statusBoleto: "PENDENTE",
    dataVencimento: new Date(new Date().getFullYear(), new Date().getMonth(), 28).toISOString(),
    dataPagamento: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 9998,
    data: new Date(new Date().getFullYear(), new Date().getMonth(), 22).toISOString(),
    conta: "4.1.5 Despesas com Manutenção",
    descricao: "Boleto: Manutenção de Equipamentos",
    clienteFornecedor: "Assistência Técnica",
    entrada: 0,
    saida: 350.00,
    tipo: "DESPESA",
    notaFiscalId: null,
    boletoId: 9998,
    statusBoleto: "PENDENTE",
    dataVencimento: new Date(new Date().getFullYear(), new Date().getMonth(), 22).toISOString(),
    dataPagamento: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 9999,
    data: new Date(new Date().getFullYear(), new Date().getMonth(), 30).toISOString(),
    conta: "4.1.1 Despesas Administrativas",
    descricao: "Boleto: Serviços Contábeis",
    clienteFornecedor: "Contabilidade Associada",
    entrada: 0,
    saida: 550.00,
    tipo: "DESPESA",
    notaFiscalId: null,
    boletoId: 9999,
    statusBoleto: "PENDENTE",
    dataVencimento: new Date(new Date().getFullYear(), new Date().getMonth(), 30).toISOString(),
    dataPagamento: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 10000,
    data: new Date(new Date().getFullYear(), new Date().getMonth(), 12).toISOString(),
    conta: "4.2.1 Custo de Mercadorias",
    descricao: "Boleto: Fornecedor - Embalagens",
    clienteFornecedor: "Embalagens Ltda",
    entrada: 0,
    saida: 420.00,
    tipo: "DESPESA",
    notaFiscalId: null,
    boletoId: 10000,
    statusBoleto: "PENDENTE",
    dataVencimento: new Date(new Date().getFullYear(), new Date().getMonth(), 12).toISOString(),
    dataPagamento: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 10001,
    data: new Date(new Date().getFullYear(), new Date().getMonth(), 5).toISOString(),
    conta: "4.1.6 Despesas com Pessoal",
    descricao: "Folha de Pagamento - Mês Atual",
    clienteFornecedor: "Funcionários",
    entrada: 0,
    saida: 15000.00,
    tipo: "DESPESA",
    notaFiscalId: null,
    boletoId: null,
    statusBoleto: null,
    dataVencimento: null,
    dataPagamento: new Date(new Date().getFullYear(), new Date().getMonth(), 5).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

// Função para obter o estilo da linha baseado no status do boleto
const getRowStyleForBoleto = (statusBoleto: string | null, dataVencimento: string | null, dataPagamento: string | null) => {
  if (statusBoleto === "PAGO" || dataPagamento) return "bg-emerald-50/30"
  if (!dataVencimento) return ""

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const vencimento = new Date(dataVencimento)
  vencimento.setHours(0, 0, 0, 0)

  const diffDays = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))

  if (vencimento < hoje) return "bg-red-100 border-l-4 border-red-500"
  if (diffDays === 0) return "bg-amber-100 border-l-4 border-amber-500"
  if (diffDays <= 3) return "bg-amber-50 border-l-4 border-amber-400"
  if (diffDays <= 5) return "bg-blue-50 border-l-4 border-blue-400"
  return "bg-blue-50/60 border-l-4 border-blue-300"
}

// Função para obter o ícone de status do boleto
const getBoletoStatusIcon = (statusBoleto: string | null, dataPagamento: string | null) => {
  if (statusBoleto === "PAGO" || dataPagamento) {
    return <CheckCircle className="h-4 w-4 text-emerald-600" />
  }
  if (statusBoleto === "VENCIDO") {
    return <AlertCircle className="h-4 w-4 text-red-600" />
  }
  return <Clock className="h-4 w-4 text-amber-600" />
}

// Função para obter o badge de status do boleto
const getBoletoStatusBadge = (statusBoleto: string | null, dataPagamento: string | null) => {
  const isPago = statusBoleto === "PAGO" || dataPagamento
  const isVencido = statusBoleto === "VENCIDO"

  if (isPago) {
    return <Badge className="bg-emerald-100 text-emerald-700">Pago</Badge>
  }
  if (isVencido) {
    return <Badge className="bg-red-100 text-red-700">Vencido</Badge>
  }
  return <Badge className="bg-amber-100 text-amber-700">Pendente</Badge>
}

export default function LivroDiarioPage() {
  const router = useRouter()
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
  const [notasCache, setNotasCache] = useState<Map<number, NotaFiscal>>(new Map())
  const [loadingNotas, setLoadingNotas] = useState<Set<number>>(new Set())
  const [mostrarExemplos, setMostrarExemplos] = useState(true)

  const [resumo, setResumo] = useState({
    totalEntradas: 0,
    totalSaidas: 0,
    saldoAtual: 0,
    totalLancamentos: 0,
    totalBoletosPendentes: 0,
    totalBoletosVencidos: 0,
    valorBoletosPendentes: 0,
    totalFolhaPagamento: 0
  })

  // Filtros
  const [filtros, setFiltros] = useState({
    dataInicio: obterDataHoje(),
    dataFim: obterDataHoje(),
    conta: "",
    tipo: "",
    statusBoleto: ""
  })

  // Modal unificado
  const [modalOpen, setModalOpen] = useState(false)
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [tipoLancamento, setTipoLancamento] = useState<"comum" | "boleto" | "folha">("comum")
  const [formData, setFormData] = useState({
    data: new Date().toISOString().split("T")[0],
    conta: "",
    descricao: "",
    clienteFornecedor: "",
    entrada: 0,
    saida: 0,
    tipo: "DESPESA",
    dataVencimento: new Date().toISOString().split("T")[0],
    funcionarios: "",
    salariosBase: 0,
    inss: 0,
    fgts: 0,
    valeTransporte: 0,
    valeRefeicao: 0,
    decimoTerceiro: 0,
    ferias: 0,
    outrosBeneficios: 0,
    totalEncargos: 0,
    totalFolha: 0
  })
  const [saving, setSaving] = useState(false)

  // Modal de pagamento
  const [pagamentoModalOpen, setPagamentoModalOpen] = useState(false)
  const [lancamentoParaPagar, setLancamentoParaPagar] = useState<Lancamento | null>(null)
  const [dataPagamento, setDataPagamento] = useState(new Date().toISOString().split("T")[0])

  // Verificar se é uma nota fiscal
  const isNotaFiscal = (lancamento: Lancamento) => {
    return lancamento.descricao.toLowerCase().includes("nfc-e") ||
      lancamento.descricao.toLowerCase().includes("nf-e") ||
      lancamento.notaFiscalId !== null
  }

  // Verificar se é um boleto
  const isBoleto = (lancamento: Lancamento) => {
    return lancamento.boletoId !== null || lancamento.statusBoleto !== null
  }

  // Verificar se pode expandir (nota fiscal ou boleto)
  const canExpand = (lancamento: Lancamento) => {
    return isNotaFiscal(lancamento) || isBoleto(lancamento)
  }

  // Verificar se é folha de pagamento
  const isFolhaPagamento = (lancamento: Lancamento) => {
    return lancamento.descricao.toLowerCase().includes("folha de pagamento") ||
      lancamento.conta === "4.1.6 Despesas com Pessoal"
  }

  // Calcular total da folha com encargos
  const calcularTotalFolha = () => {
    const total = formData.salariosBase +
      formData.inss +
      formData.fgts +
      formData.valeTransporte +
      formData.valeRefeicao +
      formData.decimoTerceiro +
      formData.ferias +
      formData.outrosBeneficios
    setFormData(prev => ({ ...prev, totalFolha: total, saida: total }))
  }

  // Atualizar total quando campos mudam
  useEffect(() => {
    if (tipoLancamento === "folha") {
      calcularTotalFolha()
    }
  }, [
    formData.salariosBase,
    formData.inss,
    formData.fgts,
    formData.valeTransporte,
    formData.valeRefeicao,
    formData.decimoTerceiro,
    formData.ferias,
    formData.outrosBeneficios
  ])

  // Buscar detalhes da nota fiscal
  const buscarNotaFiscal = async (lancamento: Lancamento) => {
    const id = lancamento.id

    // Sempre alternar a expansão ao clicar
    const isCurrentlyExpanded = expandedRows.has(id)

    if (isCurrentlyExpanded) {
      toggleRowExpand(id)
      return
    }

    // Se já está em cache, apenas expandir
    if (notasCache.has(id)) {
      toggleRowExpand(id)
      return
    }

    // Se já está carregando, não fazer nada
    if (loadingNotas.has(id)) return

    setLoadingNotas(prev => new Set(prev).add(id))

    try {
      let notaData: NotaFiscal | null = null

      if (lancamento.notaFiscalId) {
        const response = await fetch(`/api/notas/${lancamento.notaFiscalId}`)
        if (response.ok) {
          notaData = await response.json()
        }
      } else {
        const response = await fetch("/api/notas?limit=100")
        const notasResponse = await response.json()
        const notas = Array.isArray(notasResponse.data) ? notasResponse.data : notasResponse
        const nota = notas.find((n: any) =>
          lancamento.descricao.includes(n.chaveAcesso?.substring(0, 10)) ||
          lancamento.descricao.includes(n.numero?.toString())
        )
        if (nota) {
          const notaDetailRes = await fetch(`/api/notas/${nota.id}`)
          notaData = await notaDetailRes.json()
        }
      }

      if (notaData) {
        setNotasCache(prev => new Map(prev).set(lancamento.id, notaData))
      }
      // Sempre expandir a linha, mesmo que não encontre a nota
      toggleRowExpand(id)
    } catch (error) {
      console.error("Erro ao buscar nota fiscal:", error)
      // Ainda assim expande para mostrar o estado de erro
      toggleRowExpand(id)
    } finally {
      setLoadingNotas(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }

  // Expandir/recolher linha
  const toggleRowExpand = (id: number) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  // Carregar dados
  const carregarDados = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("limit", "500")
      if (filtros.dataInicio) params.set("data_inicio", filtros.dataInicio)
      if (filtros.dataFim) params.set("data_fim", filtros.dataFim)
      if (filtros.conta) params.set("conta", filtros.conta)
      if (filtros.tipo) params.set("tipo", filtros.tipo)
      if (filtros.statusBoleto) params.set("status_boleto", filtros.statusBoleto)

      const resumoParams = new URLSearchParams()
      if (filtros.dataInicio) resumoParams.set("data_inicio", filtros.dataInicio)
      if (filtros.dataFim) resumoParams.set("data_fim", filtros.dataFim)
      const resumoUrl = resumoParams.toString()
        ? `/api/livro-diario/resumo/saldo?${resumoParams.toString()}`
        : "/api/livro-diario/resumo/saldo"

      const [lancamentosRes, resumoRes] = await Promise.all([
        fetch(`/api/livro-diario?${params.toString()}`),
        fetch(resumoUrl)
      ])

      const lancamentosJson = await lancamentosRes.json()
      let lancamentosData: Lancamento[] = Array.isArray(lancamentosJson.data) ? lancamentosJson.data : []
      const resumoData = await resumoRes.json()

      // Adicionar dados mocados de exemplo
      if (mostrarExemplos) {
        let lancamentosMocados = [...lancamentosExemploMocados]

        if (filtros.dataInicio) {
          const dataInicio = new Date(filtros.dataInicio)
          lancamentosMocados = lancamentosMocados.filter(l => new Date(l.data) >= dataInicio)
        }
        if (filtros.dataFim) {
          const dataFim = new Date(filtros.dataFim)
          lancamentosMocados = lancamentosMocados.filter(l => new Date(l.data) <= dataFim)
        }
        if (filtros.conta) {
          lancamentosMocados = lancamentosMocados.filter(l =>
            l.conta.toLowerCase().includes(filtros.conta.toLowerCase())
          )
        }
        if (filtros.tipo) {
          lancamentosMocados = lancamentosMocados.filter(l => l.tipo === filtros.tipo)
        }
        if (filtros.statusBoleto) {
          lancamentosMocados = lancamentosMocados.filter(l => l.statusBoleto === filtros.statusBoleto)
        }

        lancamentosData = [...lancamentosData, ...lancamentosMocados]
      }

      if (lancamentosRes.ok) {
        const hoje = new Date()
        hoje.setHours(0, 0, 0, 0)

        const lancamentosAtualizados = lancamentosData.map((lanc: Lancamento) => {
          if (lanc.statusBoleto === "PAGO" || lanc.dataPagamento) {
            return { ...lanc, statusBoleto: "PAGO" }
          }
          if (lanc.dataVencimento) {
            const vencimento = new Date(lanc.dataVencimento)
            vencimento.setHours(0, 0, 0, 0)
            if (vencimento < hoje) {
              return { ...lanc, statusBoleto: "VENCIDO" }
            }
          }
          return lanc
        })

        setLancamentos(lancamentosAtualizados)
        setNotasCache(new Map())
        setExpandedRows(new Set())
      }

      if (resumoRes.ok) {
        const boletosPendentes = lancamentosData.filter((l: Lancamento) =>
          l.boletoId && (!l.statusBoleto || l.statusBoleto === "PENDENTE") && !l.dataPagamento
        )
        const boletosVencidos = lancamentosData.filter((l: Lancamento) =>
          l.boletoId && l.statusBoleto === "VENCIDO"
        )
        const valorPendente = boletosPendentes.reduce((sum: number, l: Lancamento) => sum + l.saida, 0)
        const totalFolha = lancamentosData
          .filter((l: Lancamento) => isFolhaPagamento(l))
          .reduce((sum: number, l: Lancamento) => sum + l.saida, 0)

        setResumo({
          totalEntradas: resumoData.total_entradas || 0,
          totalSaidas: resumoData.total_saidas || 0,
          saldoAtual: resumoData.saldo_atual || 0,
          totalLancamentos: resumoData.total_lancamentos || 0,
          totalBoletosPendentes: boletosPendentes.length,
          totalBoletosVencidos: boletosVencidos.length,
          valorBoletosPendentes: valorPendente,
          totalFolhaPagamento: totalFolha
        })
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    } finally {
      setLoading(false)
    }
  }, [filtros, mostrarExemplos])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  // Salvar lançamento
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (tipoLancamento === "boleto") {
        const url = editandoId ? `/api/boletos/${editandoId}` : "/api/boletos"
        const method = editandoId ? "PUT" : "POST"

        const boletoPayload = {
          descricao: formData.descricao,
          valor: formData.saida,
          dataVencimento: formData.dataVencimento,
          clienteFornecedor: formData.clienteFornecedor,
          conta: formData.conta,
          userId: "current-user-id"
        }

        const response = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(boletoPayload)
        })

        if (response.ok) {
          alert(editandoId ? "Boleto atualizado!" : "Boleto adicionado!")
          setModalOpen(false)
          resetForm()
          carregarDados()
        } else {
          const error = await response.json()
          alert(error.error || "Erro ao salvar boleto")
        }
      } else {
        const url = editandoId ? `/api/livro-diario/${editandoId}` : "/api/livro-diario"
        const method = editandoId ? "PUT" : "POST"

        let descricaoFinal = formData.descricao
        if (tipoLancamento === "folha") {
          descricaoFinal = `Folha de Pagamento - ${formData.funcionarios || "Funcionários"}`
        }

        const lancamentoPayload = {
          data: formData.data,
          conta: tipoLancamento === "folha" ? "4.1.6 Despesas com Pessoal" : formData.conta,
          descricao: descricaoFinal,
          clienteFornecedor: tipoLancamento === "folha" ? "Funcionários" : formData.clienteFornecedor,
          entrada: formData.entrada,
          saida: tipoLancamento === "folha" ? formData.totalFolha : formData.saida,
          tipo: "DESPESA",
          userId: "current-user-id"
        }

        const response = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(lancamentoPayload)
        })

        if (response.ok) {
          alert(editandoId ? "Lançamento atualizado!" : "Lançamento criado!")
          setModalOpen(false)
          resetForm()
          carregarDados()
        } else {
          const error = await response.json()
          alert(error.error || "Erro ao salvar")
        }
      }
    } catch (error) {
      console.error("Erro:", error)
      alert("Erro ao salvar")
    } finally {
      setSaving(false)
    }
  }

  // Marcar boleto como pago
  const handlePagarBoleto = async () => {
    if (!lancamentoParaPagar || !lancamentoParaPagar.boletoId) return

    try {
      const response = await fetch(`/api/boletos/${lancamentoParaPagar.boletoId}/pagar`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataPagamento })
      })

      if (response.ok) {
        alert("Boleto marcado como pago!")
        setPagamentoModalOpen(false)
        setLancamentoParaPagar(null)
        carregarDados()
      } else {
        alert("Erro ao marcar boleto como pago")
      }
    } catch (error) {
      console.error("Erro:", error)
      alert("Erro ao marcar boleto como pago")
    }
  }

  // Excluir lançamento
  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este lançamento?")) return

    try {
      const response = await fetch(`/api/livro-diario/${id}`, { method: "DELETE" })
      if (response.ok) {
        alert("Lançamento excluído!")
        carregarDados()
      } else {
        alert("Erro ao excluir")
      }
    } catch (error) {
      console.error("Erro:", error)
      alert("Erro ao excluir lançamento")
    }
  }

  // Editar lançamento
  const handleEdit = (lancamento: Lancamento) => {
    const isBoletoLanc = isBoleto(lancamento)
    const isFolhaLanc = isFolhaPagamento(lancamento)

    setEditandoId(lancamento.id)
    if (isBoletoLanc) {
      setTipoLancamento("boleto")
      setFormData({
        data: lancamento.data.split("T")[0],
        conta: lancamento.conta,
        descricao: lancamento.descricao.replace("Boleto: ", ""),
        clienteFornecedor: lancamento.clienteFornecedor || "",
        entrada: lancamento.entrada,
        saida: lancamento.saida,
        tipo: lancamento.tipo,
        dataVencimento: lancamento.dataVencimento?.split("T")[0] || new Date().toISOString().split("T")[0],
        funcionarios: "",
        salariosBase: 0,
        inss: 0,
        fgts: 0,
        valeTransporte: 0,
        valeRefeicao: 0,
        decimoTerceiro: 0,
        ferias: 0,
        outrosBeneficios: 0,
        totalEncargos: 0,
        totalFolha: 0
      })
    } else if (isFolhaLanc) {
      setTipoLancamento("folha")
      setFormData({
        data: lancamento.data.split("T")[0],
        conta: lancamento.conta,
        descricao: lancamento.descricao.replace("Folha de Pagamento - ", ""),
        clienteFornecedor: lancamento.clienteFornecedor || "",
        entrada: lancamento.entrada,
        saida: lancamento.saida,
        tipo: lancamento.tipo,
        dataVencimento: new Date().toISOString().split("T")[0],
        funcionarios: lancamento.descricao.replace("Folha de Pagamento - ", ""),
        salariosBase: lancamento.saida * 0.6,
        inss: lancamento.saida * 0.2,
        fgts: lancamento.saida * 0.08,
        valeTransporte: lancamento.saida * 0.04,
        valeRefeicao: lancamento.saida * 0.04,
        decimoTerceiro: 0,
        ferias: 0,
        outrosBeneficios: lancamento.saida * 0.04,
        totalEncargos: lancamento.saida * 0.4,
        totalFolha: lancamento.saida
      })
    } else {
      setTipoLancamento("comum")
      setFormData({
        data: lancamento.data.split("T")[0],
        conta: lancamento.conta,
        descricao: lancamento.descricao,
        clienteFornecedor: lancamento.clienteFornecedor || "",
        entrada: lancamento.entrada,
        saida: lancamento.saida,
        tipo: lancamento.tipo,
        dataVencimento: new Date().toISOString().split("T")[0],
        funcionarios: "",
        salariosBase: 0,
        inss: 0,
        fgts: 0,
        valeTransporte: 0,
        valeRefeicao: 0,
        decimoTerceiro: 0,
        ferias: 0,
        outrosBeneficios: 0,
        totalEncargos: 0,
        totalFolha: 0
      })
    }
    setModalOpen(true)
  }

  const resetForm = () => {
    setEditandoId(null)
    setTipoLancamento("comum")
    setFormData({
      data: new Date().toISOString().split("T")[0],
      conta: "",
      descricao: "",
      clienteFornecedor: "",
      entrada: 0,
      saida: 0,
      tipo: "DESPESA",
      dataVencimento: new Date().toISOString().split("T")[0],
      funcionarios: "",
      salariosBase: 0,
      inss: 0,
      fgts: 0,
      valeTransporte: 0,
      valeRefeicao: 0,
      decimoTerceiro: 0,
      ferias: 0,
      outrosBeneficios: 0,
      totalEncargos: 0,
      totalFolha: 0
    })
  }

  const limparFiltros = () => {
    setFiltros({
      dataInicio: obterDataHoje(),
      dataFim: obterDataHoje(),
      conta: "",
      tipo: "",
      statusBoleto: ""
    })
  }

  const getTipoBadge = (tipo: string) => {
    const tipos: Record<string, { label: string; color: string }> = {
      VENDA: { label: "💰 Venda", color: "bg-emerald-100 text-emerald-700" },
      COMPRA: { label: "📦 Compra", color: "bg-red-100 text-red-700" },
      DESPESA: { label: "📉 Despesa", color: "bg-amber-100 text-amber-700" },
      RECEITA: { label: "📈 Receita", color: "bg-emerald-100 text-emerald-700" },
      MANUAL: { label: "✏️ Manual", color: "bg-gray-100 text-gray-700" }
    }
    return tipos[tipo] || { label: tipo, color: "bg-gray-100 text-gray-700" }
  }

  // Componente da linha expandida com produtos
  const ExpandedRowContent = ({ lancamento }: { lancamento: Lancamento }) => {
    const nota = notasCache.get(lancamento.id)
    const isLoading = loadingNotas.has(lancamento.id)
    const isNota = isNotaFiscal(lancamento)

    if (isLoading) {
      return (
        <tr className="bg-gray-50">
          <td colSpan={11} className="px-4 py-4">
            <div className="flex justify-center items-center gap-2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#de4838] border-t-transparent" />
              <span className="text-sm text-gray-500">Carregando detalhes...</span>
            </div>
          </td>
        </tr>
      )
    }

    // Se é uma nota fiscal e temos os dados
    if (isNota && nota) {
      return (
        <>
          <tr className="bg-blue-50">
            <td colSpan={11} className="px-4 py-3">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="font-semibold text-blue-800">Detalhes da Nota Fiscal</span>
                  <Badge variant="outline" className="ml-2">NFe {nota.numero}</Badge>
                </div>
                <div className="grid gap-2 md:grid-cols-4 text-sm">
                  <div>
                    <span className="text-gray-500">Emitente:</span>
                    <p className="font-medium">{nota.nomeEmitente}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">CNPJ:</span>
                    <p className="font-mono text-xs">{nota.cnpjEmitente}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Data Emissão:</span>
                    <p>{formatDate(nota.dataEmissao)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Chave Acesso:</span>
                    <p className="font-mono text-xs break-all">{nota.chaveAcesso}</p>
                  </div>
                </div>
              </div>
            </td>
          </tr>

          {nota.produtos && nota.produtos.length > 0 && (
            <>
              {nota.produtos.map((produto, idx) => (
                <tr key={`prod-${idx}`} className="bg-blue-50/50 hover:bg-blue-100/50">
                  <td className="px-4 py-2 text-gray-500 text-xs">{idx === 0 ? "Produtos:" : ""}</td>
                  <td className="px-4 py-2" colSpan={1}>
                    <div className="flex items-center gap-2">
                      <Package className="h-3 w-3 text-blue-500" />
                      <span className="text-sm">{produto.descricao}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500">{produto.codigo || "-"}</td>
                  <td className="px-4 py-2 text-sm">{produto.quantidade} {produto.unidade}</td>
                  <td className="px-4 py-2 text-right text-sm">{formatCurrency(produto.valorUnitario)}</td>
                  <td className="px-4 py-2 text-right text-sm font-medium">{formatCurrency(produto.valorTotal)}</td>
                  <td className="px-4 py-2" colSpan={5} />
                </tr>
              ))}

              <tr className="bg-blue-100">
                <td className="px-4 py-2" />
                <td className="px-4 py-2" colSpan={4} />
                <td className="px-4 py-2 text-right font-semibold">Total Produtos:</td>
                <td className="px-4 py-2 text-right font-bold text-[#de4838]">{formatCurrency(nota.valorTotal)}</td>
                <td className="px-4 py-2" colSpan={4} />
              </tr>
            </>
          )}

          {nota.pagamentos && nota.pagamentos.length > 0 && (
            <tr className="bg-blue-50">
              <td colSpan={11} className="px-4 py-2">
                <div className="mt-2 pt-2 border-t border-blue-200">
                  <span className="text-sm font-medium">Formas de Pagamento:</span>
                  <div className="flex flex-wrap gap-3 mt-1">
                    {nota.pagamentos.map((pg, idx) => (
                      <span key={idx} className="text-sm">{pg.formaPagamento}: {formatCurrency(pg.valor)}</span>
                    ))}
                  </div>
                </div>
              </td>
            </tr>
          )}
        </>
      )
    }

    // Se é um boleto, mostrar detalhes do boleto
    if (isBoleto(lancamento)) {
      return (
        <tr className="bg-purple-50">
          <td colSpan={11} className="px-4 py-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Barcode className="h-4 w-4 text-purple-600" />
                <span className="font-semibold text-purple-800">Detalhes do Boleto</span>
              </div>
              <div className="grid gap-2 md:grid-cols-3 text-sm">
                <div>
                  <span className="text-gray-500">Valor:</span>
                  <p className="font-medium text-red-600">{formatCurrency(lancamento.saida)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Vencimento:</span>
                  <p>{lancamento.dataVencimento ? formatDate(lancamento.dataVencimento) : "-"}</p>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <p>{getBoletoStatusBadge(lancamento.statusBoleto, lancamento.dataPagamento)}</p>
                </div>
              </div>
              {lancamento.clienteFornecedor && (
                <p className="text-sm text-gray-600">Fornecedor: {lancamento.clienteFornecedor}</p>
              )}
            </div>
          </td>
        </tr>
      )
    }

    // Para outros tipos de lançamento, mostrar informações básicas
    return (
      <tr className="bg-gray-50">
        <td colSpan={11} className="px-4 py-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-600" />
              <span className="font-semibold text-gray-800">Detalhes do Lançamento</span>
            </div>
            <div className="grid gap-2 md:grid-cols-3 text-sm">
              <div>
                <span className="text-gray-500">Tipo:</span>
                <p>{getTipoBadge(lancamento.tipo).label}</p>
              </div>
              <div>
                <span className="text-gray-500">Data:</span>
                <p>{formatDate(lancamento.data)}</p>
              </div>
              <div>
                <span className="text-gray-500">Valor:</span>
                <p className={lancamento.entrada > 0 ? "text-emerald-600 font-medium" : "text-red-500 font-medium"}>
                  {lancamento.entrada > 0 ? formatCurrency(lancamento.entrada) : formatCurrency(lancamento.saida)}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600">Descrição: {lancamento.descricao}</p>
            {lancamento.clienteFornecedor && (
              <p className="text-sm text-gray-600">Cliente/Fornecedor: {lancamento.clienteFornecedor}</p>
            )}
          </div>
        </td>
      </tr>
    )
  }

  const cardsResumo = [
    {
      title: "Total Entradas",
      value: formatCurrency(resumo.totalEntradas),
      icon: TrendingUp,
      gradient: "from-emerald-500 to-emerald-600",
      detail: `${resumo.totalLancamentos} lançamentos`
    },
    {
      title: "Total Saídas",
      value: formatCurrency(resumo.totalSaidas),
      icon: TrendingDown,
      gradient: "from-red-500 to-red-600",
      detail: "Despesas totais"
    },
    {
      title: "Saldo Atual",
      value: formatCurrency(resumo.saldoAtual),
      icon: DollarSign,
      gradient: resumo.saldoAtual >= 0 ? "from-blue-500 to-blue-600" : "from-orange-500 to-orange-600",
      detail: resumo.saldoAtual >= 0 ? "Positivo" : "Negativo"
    },
    {
      title: "Boletos Pendentes",
      value: resumo.totalBoletosPendentes.toString(),
      icon: Barcode,
      gradient: "from-purple-500 to-purple-600",
      detail: formatCurrency(resumo.valorBoletosPendentes)
    },
    {
      title: "Total Folha",
      value: formatCurrency(resumo.totalFolhaPagamento),
      icon: Users,
      gradient: "from-indigo-500 to-indigo-600",
      detail: "Pagamento de funcionários"
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 ml-6 mr-6 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Livro Diário</h1>
          <p className="text-sm text-gray-500">
            Registro contábil de todas as movimentações financeiras, boletos e folha de pagamento
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => carregarDados()}
            className="rounded-full border-gray-200 hover:bg-gray-100"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>

          {/*<Button
                          variant={mostrarExemplos ? "default" : "outline"}
                          onClick={() => setMostrarExemplos(!mostrarExemplos)}
                          className={mostrarExemplos ? "bg-purple-600 hover:bg-purple-700 rounded-full" : "rounded-full border-gray-200"}
                        >
                          {mostrarExemplos ? "Ocultar Exemplos" : "Mostrar Exemplos"}
                        </Button>*/}

          <Button
            onClick={() => { resetForm(); setModalOpen(true); }}
            className="bg-[#de4838] hover:bg-[#c73d2e] text-white rounded-full px-5"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Lançamento
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Cards de Resumo */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {cardsResumo.map((card, idx) => (
            <Card
              key={idx}
              className={`relative overflow-hidden bg-gradient-to-r ${card.gradient} text-white border-0 h-full min-h-[132px] sm:min-h-[150px]`}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium opacity-90">{card.title}</p>
                  <card.icon className="h-5 w-5 opacity-80" />
                </div>
                <div className="mt-2 text-2xl font-bold">
                  {card.value}
                </div>
                <p className="mt-1 text-xs opacity-80">{card.detail}</p>
              </CardContent>
              <div className="absolute -bottom-4 -right-4 opacity-10">
                <card.icon className="h-20 w-20" />
              </div>
            </Card>
          ))}
        </div>

        {/* Filtros */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-gray-50 p-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-[#de4838]" />
              <h3 className="font-semibold text-gray-800">Filtros</h3>
            </div>
          </div>
          <div className="p-5">
            <div className="grid gap-4 md:grid-cols-5">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Data Início</Label>
                <Input
                  type="date"
                  value={filtros.dataInicio}
                  onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
                  className="rounded-lg border-gray-200 focus:ring-[#de4838]"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Data Fim</Label>
                <Input
                  type="date"
                  value={filtros.dataFim}
                  onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
                  className="rounded-lg border-gray-200 focus:ring-[#de4838]"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Conta</Label>
                <Input
                  placeholder="Filtrar por conta..."
                  value={filtros.conta}
                  onChange={(e) => setFiltros({ ...filtros, conta: e.target.value })}
                  className="rounded-lg border-gray-200 focus:ring-[#de4838]"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Tipo</Label>
                <div className="relative">
                  <select
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#de4838] appearance-none"
                    value={filtros.tipo}
                    onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
                  >
                    <option value="">Todos</option>
                    <option value="VENDA">Venda</option>
                    <option value="COMPRA">Compra</option>
                    <option value="DESPESA">Despesa</option>
                    <option value="RECEITA">Receita</option>
                    <option value="MANUAL">Manual</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Status Boleto</Label>
                <div className="relative">
                  <select
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#de4838] appearance-none"
                    value={filtros.statusBoleto}
                    onChange={(e) => setFiltros({ ...filtros, statusBoleto: e.target.value })}
                  >
                    <option value="">Todos</option>
                    <option value="PENDENTE">Boletos Pendentes</option>
                    <option value="PAGO">Boletos Pagos</option>
                    <option value="VENCIDO">Boletos Vencidos</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <Button onClick={() => carregarDados()} className="flex-1 bg-[#de4838] hover:bg-[#c73d2e] rounded-lg">
                <Search className="mr-2 h-4 w-4" />
                Filtrar
              </Button>
              <Button variant="outline" onClick={limparFiltros} className="flex-1 border-gray-200 hover:bg-gray-100 rounded-lg">
                <Eraser className="mr-2 h-4 w-4" />
                Limpar Filtros
              </Button>
            </div>
          </div>
        </div>

        {/* Tabela de Lançamentos */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-gray-50 p-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-[#de4838]" />
              <h3 className="font-semibold text-gray-800">Lançamentos</h3>
              <Badge className="bg-gray-200 text-gray-700">{lancamentos.length} registros</Badge>
            </div>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left w-8"></th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conta</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente/Fornecedor</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Entrada</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Saída</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr className="border-b border-gray-100">
                    <td colSpan={11} className="py-12 text-center">
                      <div className="flex justify-center items-center gap-2">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#de4838] border-t-transparent" />
                        <span className="text-sm text-gray-500">Carregando lançamentos...</span>
                      </div>
                    </td>
                  </tr>
                ) : lancamentos.length === 0 ? (
                  <tr className="border-b border-gray-100">
                    <td colSpan={11} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <BookOpen className="h-12 w-12 text-gray-300" />
                        <p className="text-gray-500">Nenhum lançamento encontrado</p>
                        <Button
                          onClick={() => { resetForm(); setModalOpen(true); }}
                          className="mt-2 bg-[#de4838] hover:bg-[#c73d2e] rounded-lg"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Criar primeiro lançamento
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  lancamentos.map((lanc) => {
                    const tipoBadge = getTipoBadge(lanc.tipo)
                    const isNota = isNotaFiscal(lanc)
                    const canExpandRow = canExpand(lanc)
                    const isBoletoLanc = isBoleto(lanc)
                    const isFolhaLanc = isFolhaPagamento(lanc)
                    const isExpanded = expandedRows.has(lanc.id)
                    const rowStyle = isBoletoLanc ? getRowStyleForBoleto(lanc.statusBoleto, lanc.dataVencimento, lanc.dataPagamento) : ""
                    const boletoStatus = lanc.statusBoleto || (lanc.dataPagamento ? "PAGO" : (lanc.dataVencimento ? "PENDENTE" : null))
                    const podePagar = isBoletoLanc && boletoStatus !== "PAGO" && !lanc.dataPagamento

                    return (
                      <React.Fragment key={lanc.id}>
                        <tr
                          className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${rowStyle} ${canExpandRow ? "cursor-pointer" : ""}`}
                          role={canExpandRow ? "button" : undefined}
                          tabIndex={canExpandRow ? 0 : undefined}
                          aria-expanded={canExpandRow ? isExpanded : undefined}
                          aria-label={canExpandRow ? `Expandir detalhes de ${lanc.descricao}` : undefined}
                          onClick={canExpandRow ? () => buscarNotaFiscal(lanc) : undefined}
                          onKeyDown={(e) => {
                            if (!canExpandRow) return
                            if ((e.target as HTMLElement).closest("button")) return
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault()
                              buscarNotaFiscal(lanc)
                            }
                          }}
                        >
                          <td className="px-4 py-3">
                            {canExpandRow && (
                              <button className="text-[#de4838]">
                                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              </button>
                            )}
                            {isFolhaLanc && <Users className="h-4 w-4 text-indigo-500" />}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-gray-500">#{lanc.id}</td>
                          <td className="px-4 py-3 text-gray-700">{formatDate(lanc.data)}</td>
                          <td className="px-4 py-3 max-w-[200px] truncate text-gray-600">{lanc.conta}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {isBoletoLanc && <Barcode className="h-3 w-3 text-purple-500" />}
                              {isNota && <FileText className="h-3 w-3 text-blue-500" />}
                              {isFolhaLanc && <Users className="h-3 w-3 text-indigo-500" />}
                              <span className="truncate max-w-[200px] text-gray-800">{lanc.descricao}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{lanc.clienteFornecedor || "-"}</td>
                          <td className="px-4 py-3 text-right text-emerald-600 font-medium">
                            {lanc.entrada > 0 ? formatCurrency(lanc.entrada) : "-"}
                          </td>
                          <td className="px-4 py-3 text-right text-red-500 font-medium">
                            {lanc.saida > 0 ? formatCurrency(lanc.saida) : "-"}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${tipoBadge.color}`}>
                              {tipoBadge.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {isBoletoLanc ? (
                              <div className="flex items-center justify-center gap-1">
                                {getBoletoStatusIcon(boletoStatus, lanc.dataPagamento)}
                                {getBoletoStatusBadge(boletoStatus, lanc.dataPagamento)}
                              </div>
                            ) : isFolhaLanc ? (
                              <Badge className="bg-indigo-100 text-indigo-700">Processada</Badge>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center gap-1">
                              {podePagar && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setLancamentoParaPagar(lanc); setPagamentoModalOpen(true); }}
                                  className="p-1 text-emerald-500 hover:bg-emerald-100 rounded-lg transition-colors"
                                  title="Marcar como Pago"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={(e) => { e.stopPropagation(); handleEdit(lanc); }}
                                className="p-1 text-amber-500 hover:bg-amber-100 rounded-lg transition-colors"
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(lanc.id); }}
                                className="p-1 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                                title="Excluir"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {isExpanded && isNota && <ExpandedRowContent lancamento={lanc} />}
                      </React.Fragment>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Unificado de Lançamento/Boleto/Folha */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className={`
    ${tipoLancamento === "folha" ? "max-w-4xl" : "max-w-xl"}
    bg-white rounded-2xl p-0 border-none shadow-2xl
    max-h-[90vh] overflow-hidden flex flex-col
  `}>
          {/* Header fixo */}
          <div className="sticky top-0 z-10 bg-white px-6 py-5 border-b border-gray-100 rounded-t-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-800">
                {editandoId ? "Editar" : "Novo"}
                {tipoLancamento === "boleto" ? " Boleto" : tipoLancamento === "folha" ? " Folha de Pagamento" : " Lançamento"}
              </DialogTitle>
            </DialogHeader>
          </div>

          {/* Conteúdo rolável */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* Seletor de tipo de lançamento */}
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setTipoLancamento("comum")}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${tipoLancamento === "comum"
                    ? "bg-[#de4838] text-white border-[#de4838] shadow-sm"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
              >
                <FileText className="h-4 w-4" />
                <span className="text-sm font-medium">Comum</span>
              </button>
              <button
                type="button"
                onClick={() => setTipoLancamento("boleto")}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${tipoLancamento === "boleto"
                    ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
              >
                <Barcode className="h-4 w-4" />
                <span className="text-sm font-medium">Boleto</span>
              </button>
              <button
                type="button"
                onClick={() => setTipoLancamento("folha")}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${tipoLancamento === "folha"
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
              >
                <Users className="h-4 w-4" />
                <span className="text-sm font-medium">Folha</span>
              </button>
            </div>

            {/* Campos comuns */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                    {tipoLancamento === "boleto" ? "Data de Vencimento *" : "Data *"}
                  </Label>
                  <Input
                    type="date"
                    value={tipoLancamento === "boleto" ? formData.dataVencimento : formData.data}
                    onChange={(e) => {
                      if (tipoLancamento === "boleto") {
                        setFormData({ ...formData, dataVencimento: e.target.value })
                      } else {
                        setFormData({ ...formData, data: e.target.value })
                      }
                    }}
                    className="rounded-lg border-gray-200 focus:ring-[#de4838] focus:border-[#de4838]"
                    required
                  />
                </div>

                {tipoLancamento !== "folha" && (
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Conta *</Label>
                    <Input
                      value={formData.conta}
                      onChange={(e) => setFormData({ ...formData, conta: e.target.value })}
                      placeholder={tipoLancamento === "boleto" ? "Ex: 4.1.1 Despesas Administrativas" : "Ex: 3.1.1 Receita com Vendas"}
                      className="rounded-lg border-gray-200 focus:ring-[#de4838]"
                      required
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Descrição *</Label>
                <Input
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder={
                    tipoLancamento === "boleto" ? "Ex: Aluguel, Fornecedor, Fatura..." :
                      tipoLancamento === "folha" ? "Ex: Competência Maio/2024" :
                        "Descrição do lançamento"
                  }
                  className="rounded-lg border-gray-200 focus:ring-[#de4838]"
                  required
                />
              </div>

              {tipoLancamento !== "folha" && (
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Cliente / Fornecedor</Label>
                  <Input
                    value={formData.clienteFornecedor}
                    onChange={(e) => setFormData({ ...formData, clienteFornecedor: e.target.value })}
                    placeholder="Nome do cliente ou fornecedor"
                    className="rounded-lg border-gray-200 focus:ring-[#de4838]"
                  />
                </div>
              )}
            </div>

            {/* Campos específicos para Folha de Pagamento */}
            {tipoLancamento === "folha" && (
              <div className="space-y-4 border rounded-xl p-5 bg-gray-50">
                <div className="flex items-center gap-2 text-indigo-600 font-semibold">
                  <Calculator className="h-4 w-4" />
                  <span>Cálculo da Folha de Pagamento</span>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Funcionários / Descrição</Label>
                  <Input
                    value={formData.funcionarios}
                    onChange={(e) => setFormData({ ...formData, funcionarios: e.target.value })}
                    placeholder="Ex: Equipe Operacional (5 funcionários)"
                    className="rounded-lg border-gray-200 focus:ring-[#de4838]"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-600">Salários Base</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">R$</span>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.salariosBase}
                        onChange={(e) => setFormData({ ...formData, salariosBase: parseFloat(e.target.value) || 0 })}
                        className="pl-8 font-mono rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-600">INSS (20%)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">R$</span>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.inss}
                        onChange={(e) => setFormData({ ...formData, inss: parseFloat(e.target.value) || 0 })}
                        className="pl-8 font-mono rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-600">FGTS (8%)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">R$</span>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.fgts}
                        onChange={(e) => setFormData({ ...formData, fgts: parseFloat(e.target.value) || 0 })}
                        className="pl-8 font-mono rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-600">Vale Transporte</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">R$</span>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.valeTransporte}
                        onChange={(e) => setFormData({ ...formData, valeTransporte: parseFloat(e.target.value) || 0 })}
                        className="pl-8 font-mono rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-600">Vale Refeição</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">R$</span>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.valeRefeicao}
                        onChange={(e) => setFormData({ ...formData, valeRefeicao: parseFloat(e.target.value) || 0 })}
                        className="pl-8 font-mono rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-600">Décimo Terceiro</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">R$</span>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.decimoTerceiro}
                        onChange={(e) => setFormData({ ...formData, decimoTerceiro: parseFloat(e.target.value) || 0 })}
                        className="pl-8 font-mono rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-600">Férias</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">R$</span>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.ferias}
                        onChange={(e) => setFormData({ ...formData, ferias: parseFloat(e.target.value) || 0 })}
                        className="pl-8 font-mono rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-600">Outros Benefícios</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">R$</span>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.outrosBeneficios}
                        onChange={(e) => setFormData({ ...formData, outrosBeneficios: parseFloat(e.target.value) || 0 })}
                        className="pl-8 font-mono rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-lg text-gray-800">TOTAL DA FOLHA:</span>
                    <span className="text-2xl font-bold text-indigo-600">
                      {formatCurrency(formData.totalFolha)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    * O lançamento será registrado como despesa no livro diário
                  </div>
                </div>
              </div>
            )}

            {/* Campos para lançamento comum */}
            {tipoLancamento === "comum" && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Tipo *</Label>
                  <div className="relative">
                    <select
                      className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#de4838] appearance-none"
                      value={formData.tipo}
                      onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                      required
                    >
                      <option value="VENDA">Venda</option>
                      <option value="COMPRA">Compra</option>
                      <option value="DESPESA">Despesa</option>
                      <option value="RECEITA">Receita</option>
                      <option value="MANUAL">Manual</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Entrada (R$)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">R$</span>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.entrada}
                        onChange={(e) => setFormData({ ...formData, entrada: parseFloat(e.target.value) || 0, saida: 0 })}
                        className="pl-8 rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Saída (R$)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">R$</span>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.saida}
                        onChange={(e) => setFormData({ ...formData, saida: parseFloat(e.target.value) || 0, entrada: 0 })}
                        className="pl-8 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Campo para boleto */}
            {tipoLancamento === "boleto" && (
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Valor (R$) *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">R$</span>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.saida}
                    onChange={(e) => setFormData({ ...formData, saida: parseFloat(e.target.value) || 0, entrada: 0 })}
                    placeholder="0,00"
                    className="pl-8 rounded-lg"
                    required
                  />
                </div>
              </div>
            )}
          </form>

          {/* Footer fixo */}
          <div className="sticky bottom-0 z-10 bg-white px-6 py-4 border-t border-gray-100 rounded-b-2xl">
            <DialogFooter className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                className="flex-1 rounded-lg border-gray-200 hover:bg-gray-100"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                form="submit-button"
                disabled={saving}
                className="flex-1 bg-[#de4838] hover:bg-[#c73d2e] text-white rounded-lg"
              >
                {saving ? "Salvando..." : (editandoId ? "Atualizar" : "Salvar")}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Pagamento */}
      <Dialog open={pagamentoModalOpen} onOpenChange={setPagamentoModalOpen}>
        <DialogContent className="max-w-md bg-white rounded-2xl p-0 border-none shadow-2xl">
          <div className="p-6">
            <DialogHeader className="pb-4 border-b border-gray-100">
              <DialogTitle className="text-xl font-semibold text-gray-800">Marcar Boleto como Pago</DialogTitle>
            </DialogHeader>
            {lancamentoParaPagar && (
              <div className="space-y-5 pt-4">
                <Alert className="bg-blue-50 border-blue-200 rounded-xl">
                  <AlertDescription className="text-sm text-blue-700">
                    <div className="space-y-2">
                      <p><strong>Descrição:</strong> {lancamentoParaPagar.descricao}</p>
                      <p><strong>Valor:</strong> {formatCurrency(lancamentoParaPagar.saida)}</p>
                      <p><strong>Vencimento:</strong> {lancamentoParaPagar.dataVencimento ? formatDate(lancamentoParaPagar.dataVencimento) : "-"}</p>
                    </div>
                  </AlertDescription>
                </Alert>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Data de Pagamento *</Label>
                  <Input
                    type="date"
                    value={dataPagamento}
                    onChange={(e) => setDataPagamento(e.target.value)}
                    className="rounded-lg border-gray-200 focus:ring-[#de4838]"
                    required
                  />
                </div>
                <DialogFooter className="flex gap-3 pt-4 border-t border-gray-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setPagamentoModalOpen(false)}
                    className="flex-1 rounded-lg border-gray-200"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handlePagarBoleto}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 rounded-lg"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Confirmar Pagamento
                  </Button>
                </DialogFooter>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}