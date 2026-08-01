// src/app/(dashboard)/planejamento/editar/metas-mensais/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Calendar, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatCurrency } from "@/lib/utils"

interface MetaMensal {
  mes: number
  metaDiariaAlmoco: number
  metaDiariaJanta: number
  diasTrabalhados: number
  lucroDesejado: number
}

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

export default function EditarMetasMensaisPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [anoReferencia, setAnoReferencia] = useState(new Date().getFullYear())
  const [metas, setMetas] = useState<MetaMensal[]>([])

  useEffect(() => {
    carregarMetas()
  }, [anoReferencia])

  async function carregarMetas() {
    setLoading(true)
    try {
      const response = await fetch(`/api/planejamento/metas?ano=${anoReferencia}`)
      const data = await response.json()
      if (data.success && data.metas) {
        setMetas(data.metas)
      } else {
        const metasPadrao: MetaMensal[] = []
        for (let i = 1; i <= 12; i++) {
          metasPadrao.push({
            mes: i,
            metaDiariaAlmoco: 0,
            metaDiariaJanta: 0,
            diasTrabalhados: 26,
            lucroDesejado: 15
          })
        }
        setMetas(metasPadrao)
      }
    } catch (error) {
      console.error("Erro ao carregar metas:", error)
      const metasPadrao: MetaMensal[] = []
      for (let i = 1; i <= 12; i++) {
        metasPadrao.push({
          mes: i,
          metaDiariaAlmoco: 0,
          metaDiariaJanta: 0,
          diasTrabalhados: 26,
          lucroDesejado: 15
        })
      }
      setMetas(metasPadrao)
    } finally {
      setLoading(false)
    }
  }

  async function salvarMetas() {
    setSaving(true)
    try {
      const response = await fetch("/api/planejamento/metas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ano: anoReferencia,
          metas: metas
        })
      })
      const data = await response.json()
      if (data.success) {
        alert("Metas salvas com sucesso!")
        router.push("/planejamento")
      } else {
        alert(data.message || "Erro ao salvar")
      }
    } catch (error) {
      console.error("Erro ao salvar:", error)
      alert("Erro ao salvar metas")
    } finally {
      setSaving(false)
    }
  }

  function atualizarMeta(mes: number, campo: keyof MetaMensal, valor: number) {
    const novasMetas = metas.map(m => 
      m.mes === mes ? { ...m, [campo]: valor } : m
    )
    setMetas(novasMetas)
  }

  function aplicarParaTodosMeses() {
    const mesAtual = new Date().getMonth() + 1
    const metaAtual = metas.find(m => m.mes === mesAtual)
    if (metaAtual && confirm(`Aplicar valores do mês atual (${MESES[mesAtual-1]}) para todos os meses?`)) {
      const novasMetas = metas.map(m => ({
        ...m,
        metaDiariaAlmoco: metaAtual.metaDiariaAlmoco,
        metaDiariaJanta: metaAtual.metaDiariaJanta,
        diasTrabalhados: metaAtual.diasTrabalhados,
        lucroDesejado: metaAtual.lucroDesejado
      }))
      setMetas(novasMetas)
    }
  }

  const totais = metas.reduce((acc, meta) => {
    const metaAlmoco = meta.metaDiariaAlmoco * meta.diasTrabalhados
    const metaJanta = meta.metaDiariaJanta * meta.diasTrabalhados
    return {
      almoco: acc.almoco + metaAlmoco,
      janta: acc.janta + metaJanta,
      geral: acc.geral + metaAlmoco + metaJanta
    }
  }, { almoco: 0, janta: 0, geral: 0 })

  // ADICIONAR CONSOLE.LOG AQUI
  const mesAtual = new Date().getMonth() + 1
  const metaMesAtual = metas.find(m => m.mes === mesAtual)
  
  if (metaMesAtual) {
    const metaGeralMesAtual = (metaMesAtual.metaDiariaAlmoco + metaMesAtual.metaDiariaJanta) * metaMesAtual.diasTrabalhados
    console.log("📊 INFORMAÇÕES DO MÊS ATUAL:")
    console.log(`📅 Mês atual: ${MESES[mesAtual - 1]}`)
    console.log(`📆 Dias trabalhados: ${metaMesAtual.diasTrabalhados}`)
    console.log(`💰 Meta Geral do mês: ${formatCurrency(metaGeralMesAtual)}`)
    console.log(`🍽️  Meta Almoço: ${formatCurrency(metaMesAtual.metaDiariaAlmoco * metaMesAtual.diasTrabalhados)}`)
    console.log(`🌙 Meta Janta: ${formatCurrency(metaMesAtual.metaDiariaJanta * metaMesAtual.diasTrabalhados)}`)
    console.log(`📈 Lucro desejado: ${metaMesAtual.lucroDesejado}%`)
    console.log("----------------------------------------")
  } else {
    console.log("⚠️ Dados do mês atual não encontrados")
  }

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
            <h1 className="text-xl font-semibold text-white">Editar Metas Mensais</h1>
            <p className="text-sm text-muted-foreground">Defina metas de faturamento para cada mês do ano</p>
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
          <Button 
            variant="outline" 
            onClick={aplicarParaTodosMeses}
            className="rounded-full border-border hover:border-primary"
          >
            <Calendar className="mr-2 h-4 w-4" />
            Aplicar a Todos
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-6 max-w-6xl">
        <Alert className="mb-6 bg-info/5 border-info/30 rounded-xl">
          <AlertDescription className="text-sm text-info">
            Defina a meta diária de faturamento para cada mês. O sistema calcula automaticamente a meta mensal e anual.
            Distribuição: Almoço (73%) | Janta (27%)
          </AlertDescription>
        </Alert>

        <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-surface-2 p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-white">Metas de Faturamento</h3>
            </div>
          </div>
          <div className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-2 border-b border-border">
                  <tr className="border-b border-border">
                    <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Mês</th>
                    <th colSpan={2} className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider border-x border-border">Meta Diária</th>
                    <th rowSpan={2} className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Dias</th>
                    <th rowSpan={2} className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Meta Mensal</th>
                    <th rowSpan={2} className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Lucro Desejado</th>
                  </tr>
                  <tr className="bg-surface-2">
                    <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Almoço</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Janta</th>
                  </tr>
                </thead>
                <tbody>
                  {metas.map((meta) => {
                    const metaMensal = (meta.metaDiariaAlmoco + meta.metaDiariaJanta) * meta.diasTrabalhados
                    return (
                      <tr key={meta.mes} className="border-b border-border hover:bg-surface-2 transition-colors">
                        <td className="px-4 py-3 font-medium text-white">{MESES[meta.mes - 1]}</td>
                        <td className="px-4 py-2">
                          <Input
                            type="number"
                            step="50"
                            value={meta.metaDiariaAlmoco}
                            onChange={(e) => atualizarMeta(meta.mes, "metaDiariaAlmoco", Number(e.target.value))}
                            className="h-9 text-right rounded-lg border-border focus:ring-primary w-28"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            type="number"
                            step="50"
                            value={meta.metaDiariaJanta}
                            onChange={(e) => atualizarMeta(meta.mes, "metaDiariaJanta", Number(e.target.value))}
                            className="h-9 text-right rounded-lg border-border focus:ring-primary w-28"
                          />
                        </td>
                        <td className="px-4 py-2 text-center">
                          <Input
                            type="number"
                            step="1"
                            min="1"
                            max="31"
                            value={meta.diasTrabalhados}
                            onChange={(e) => atualizarMeta(meta.mes, "diasTrabalhados", Number(e.target.value))}
                            className="h-9 text-center rounded-lg border-border focus:ring-primary w-20"
                          />
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-primary">
                          {formatCurrency(metaMensal)}
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            type="number"
                            step="1"
                            value={meta.lucroDesejado}
                            onChange={(e) => atualizarMeta(meta.mes, "lucroDesejado", Number(e.target.value))}
                            className="h-9 text-right rounded-lg border-border focus:ring-primary w-24"
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot className="border-t-2 border-border bg-surface-2">
                  <tr className="font-semibold">
                    <td className="px-4 py-3 text-white">TOTAL ANUAL</td>
                    <td colSpan={2} className="px-4 py-3 text-center text-white">{formatCurrency(totais.almoco)}</td>
                    <td className="px-4 py-3 text-center text-white"></td>
                    <td className="px-4 py-3 text-right text-primary text-lg">{formatCurrency(totais.geral)}</td>
                    <td className="px-4 py-3 text-right"></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="p-5 border-t border-border">
              <div className="flex gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1 rounded-lg border-border hover:bg-surface-2"
                  onClick={() => router.back()}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={salvarMetas} 
                  className="flex-1 bg-primary hover:bg-primary/90 rounded-lg"
                  disabled={saving}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Salvando..." : "Salvar Metas"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}