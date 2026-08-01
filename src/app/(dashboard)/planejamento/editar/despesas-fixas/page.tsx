// src/app/(dashboard)/planejamento/editar/despesas-fixas/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plus, Trash2, Save, RefreshCw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatCurrency } from "@/lib/utils"

interface DespesaFixa {
  id?: number
  nome: string
  valor: number
  vencimento?: string
}

const DESPESAS_FIXAS_PADRAO: DespesaFixa[] = [
  { nome: "ALUGUEL", valor: 1200 },
  { nome: "ENERGIA", valor: 700 },
  { nome: "AGUA", valor: 310 },
  { nome: "TELEFONE", valor: 112 },
  { nome: "INTERNET", valor: 70 },
  { nome: "CONTABILIDADE", valor: 350 },
  { nome: "SOFTWARE GESTAO", valor: 144.4 },
  { nome: "MANUT. BANCOS", valor: 99 },
  { nome: "PASSAGEM FUNCIN.", valor: 635 },
  { nome: "INSS", valor: 446 },
  { nome: "MERCANTIL", valor: 200 },
  { nome: "BOMBEIROS", valor: 30 },
  { nome: "IPTU", valor: 150 },
  { nome: "GAS", valor: 1330 },
]

export default function EditarDespesasFixasPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [despesas, setDespesas] = useState<DespesaFixa[]>([])
  const [anoReferencia, setAnoReferencia] = useState(new Date().getFullYear())

  useEffect(() => {
    carregarDespesas()
  }, [anoReferencia])

  async function carregarDespesas() {
    setLoading(true)
    try {
      const response = await fetch(`/api/planejamento/despesas-fixas?ano=${anoReferencia}`)
      const data = await response.json()
      if (data.success && data.dados && data.dados.length > 0) {
        setDespesas(data.dados)
      } else {
        setDespesas([...DESPESAS_FIXAS_PADRAO])
      }
    } catch (error) {
      console.error("Erro ao carregar despesas:", error)
      setDespesas([...DESPESAS_FIXAS_PADRAO])
    } finally {
      setLoading(false)
    }
  }

  async function salvarDespesas() {
    setSaving(true)
    try {
      const response = await fetch("/api/planejamento/despesas-fixas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dados: despesas,
          ano: anoReferencia
        })
      })
      const data = await response.json()
      if (data.success) {
        alert("Despesas fixas salvas com sucesso!")
        router.push("/planejamento")
      } else {
        alert(data.message || "Erro ao salvar")
      }
    } catch (error) {
      console.error("Erro ao salvar:", error)
      alert("Erro ao salvar despesas fixas")
    } finally {
      setSaving(false)
    }
  }

  function resetarPadrao() {
    if (confirm("Tem certeza que deseja restaurar as despesas fixas padrão?")) {
      setDespesas([...DESPESAS_FIXAS_PADRAO])
    }
  }

  function adicionarDespesa() {
    const novaData = new Date()
    novaData.setMonth(novaData.getMonth() + 1)
    setDespesas([...despesas, { nome: "Nova Despesa", valor: 0, vencimento: novaData.toISOString().split('T')[0] }])
  }

  function removerDespesa(index: number) {
    if (despesas.length <= 1) {
      alert("Mantenha pelo menos uma despesa cadastrada!")
      return
    }
    const novas = [...despesas]
    novas.splice(index, 1)
    setDespesas(novas)
  }

  function atualizarDespesa(index: number, campo: keyof DespesaFixa, valor: string | number) {
    const novas = [...despesas]
    if (campo === "valor") {
      novas[index].valor = Number(valor) || 0
    } else if (campo === "vencimento") {
      novas[index].vencimento = valor as string
    } else {
      novas[index].nome = valor as string
    }
    setDespesas(novas)
  }

  const totalDespesas = despesas.reduce((sum, d) => sum + d.valor, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-2 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-surface border-b border-border px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.back()}
            className="rounded-full hover:bg-surface-2"
          >
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-white">Editar Despesas Fixas</h1>
            <p className="text-sm text-muted-foreground">Gerencie os custos fixos do seu negócio</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <select
              className="rounded-full border border-border bg-surface px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none pr-8"
              value={anoReferencia}
              onChange={(e) => setAnoReferencia(Number(e.target.value))}
            >
              <option value={2024}>2024</option>
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
              <svg className="fill-current h-4 w-4" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-6 max-w-4xl">
        <Alert className="mb-6 bg-info/5 border-info/30 rounded-xl">
          <AlertDescription className="text-sm text-info">
            Despesas fixas são custos que não variam com o faturamento, como aluguel, contas de luz/água, salários, etc.
            Os valores são rateados automaticamente: 73% para Almoço e 27% para Janta.
          </AlertDescription>
        </Alert>

        <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-surface-2 p-4 border-b border-border">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Home className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-white">Lista de Despesas Fixas</h3>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={resetarPadrao}
                  className="rounded-lg border-border hover:border-primary"
                >
                  <RefreshCw className="mr-2 h-3 w-3" />
                  Restaurar Padrão
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={adicionarDespesa}
                  className="rounded-lg border-border hover:border-primary"
                >
                  <Plus className="mr-2 h-3 w-3" />
                  Adicionar
                </Button>
              </div>
            </div>
          </div>
          <div className="p-5">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-2 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Despesa</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Valor (R$)</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Vencimento</th>
                    <th className="px-4 py-3 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {despesas.map((desp, idx) => (
                    <tr key={idx} className="border-b border-border hover:bg-surface-2 transition-colors">
                      <td className="px-4 py-2">
                        <Input
                          value={desp.nome}
                          onChange={(e) => atualizarDespesa(idx, "nome", e.target.value)}
                          className="h-9 rounded-lg border-border focus:ring-primary"
                          placeholder="Nome da despesa"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Input
                          type="number"
                          step="0.01"
                          value={desp.valor}
                          onChange={(e) => atualizarDespesa(idx, "valor", e.target.value)}
                          className="h-9 text-right rounded-lg border-border focus:ring-primary"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Input
                          type="date"
                          value={desp.vencimento || ""}
                          onChange={(e) => atualizarDespesa(idx, "vencimento", e.target.value)}
                          className="h-9 rounded-lg border-border focus:ring-primary"
                        />
                      </td>
                      <td className="px-4 py-2 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removerDespesa(idx)}
                          className="h-8 w-8 p-0 rounded-lg hover:bg-destructive/5"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-border bg-surface-2">
                  <tr className="font-semibold">
                    <td className="px-4 py-3 text-white">TOTAL</td>
                    <td className="px-4 py-3 text-right text-primary text-lg">{formatCurrency(totalDespesas)}</td>
                    <td className="px-4 py-3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="mt-6 flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1 rounded-lg border-border hover:bg-surface-2"
                onClick={() => router.back()}
              >
                Cancelar
              </Button>
              <Button 
                onClick={salvarDespesas} 
                className="flex-1 bg-primary hover:bg-primary/90 rounded-lg"
                disabled={saving}
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Salvando..." : "Salvar Despesas Fixas"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}