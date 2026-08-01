// src/app/(dashboard)/planejamento/editar/funcionarios/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plus, Trash2, Save, RefreshCw, Users, CalendarClock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatCurrency } from "@/lib/utils"
import { useDebounce } from "@/hooks/useDebounce"

interface Funcionario {
  id?: number
  nome: string
  salario: number
}

interface FolhaConfig {
  diaAdiantamento: number
  percentualAdiantamento: number
  diaSalario: number
}

const FUNCIONARIOS_PADRAO: Funcionario[] = [
  { nome: "Pro-Labore(add seu Nome)", salario: 1302 },
]

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

export default function EditarFuncionariosPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [anoReferencia, setAnoReferencia] = useState(new Date().getFullYear())
  const [mesReferencia, setMesReferencia] = useState(new Date().getMonth() + 1)
  const [config, setConfig] = useState<FolhaConfig>({
    diaAdiantamento: 15,
    percentualAdiantamento: 40,
    diaSalario: 5,
  })
  const [configCarregada, setConfigCarregada] = useState(false)

  useEffect(() => {
    carregarDados()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anoReferencia, mesReferencia])

  // Persistência automática da configuração (salva a cada mudança e ao trocar de mês)
  const debouncedConfig = useDebounce(config, 800)
  useEffect(() => {
    if (!configCarregada) return
    salvarConfig(debouncedConfig)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedConfig, configCarregada])

  async function carregarDados() {
    setLoading(true)
    try {
      const [resFunc, resConfig] = await Promise.all([
        fetch(`/api/planejamento/funcionarios?ano=${anoReferencia}`),
        fetch(`/api/planejamento/folha-pagamento-config?ano=${anoReferencia}&mes=${mesReferencia}`),
      ])

      const dataFunc = await resFunc.json()
      if (dataFunc.success && dataFunc.dados && dataFunc.dados.length > 0) {
        setFuncionarios(dataFunc.dados)
      } else {
        setFuncionarios([...FUNCIONARIOS_PADRAO])
      }

      const dataConfig = await resConfig.json()
      if (dataConfig.success && dataConfig.dados) {
        setConfig({
          diaAdiantamento: dataConfig.dados.diaAdiantamento,
          percentualAdiantamento: dataConfig.dados.percentualAdiantamento,
          diaSalario: dataConfig.dados.diaSalario,
        })
      }
      setConfigCarregada(true)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      setFuncionarios([...FUNCIONARIOS_PADRAO])
    } finally {
      setLoading(false)
    }
  }

  async function salvarConfig(cfg: FolhaConfig) {
    try {
      const total = funcionarios.reduce((sum, f) => sum + (Number(f.salario) || 0), 0)
      await fetch("/api/planejamento/folha-pagamento-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ano: anoReferencia,
          mes: mesReferencia,
          diaAdiantamento: cfg.diaAdiantamento,
          percentualAdiantamento: cfg.percentualAdiantamento,
          diaSalario: cfg.diaSalario,
          totalSalarios: total,
          funcionarios: funcionarios.map(f => ({ nome: f.nome, salario: Number(f.salario) || 0 })),
        }),
      })
    } catch (error) {
      console.error("Erro ao salvar config de pagamento:", error)
    }
  }

  async function salvarFuncionarios() {
    setSaving(true)
    try {
      const total = funcionarios.reduce((sum, f) => sum + (Number(f.salario) || 0), 0)
      const [resFunc] = await Promise.all([
        fetch("/api/planejamento/funcionarios", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dados: funcionarios,
            ano: anoReferencia,
          }),
        }),
        fetch("/api/planejamento/folha-pagamento-config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ano: anoReferencia,
            mes: mesReferencia,
            diaAdiantamento: config.diaAdiantamento,
            percentualAdiantamento: config.percentualAdiantamento,
            diaSalario: config.diaSalario,
            totalSalarios: total,
            funcionarios: funcionarios.map(f => ({ nome: f.nome, salario: Number(f.salario) || 0 })),
          }),
        }),
      ])

      const data = await resFunc.json()
      if (data.success) {
        alert("Funcionários salvos com sucesso!")
        router.push("/planejamento")
      } else {
        alert(data.message || "Erro ao salvar")
      }
    } catch (error) {
      console.error("Erro ao salvar:", error)
      alert("Erro ao salvar funcionários")
    } finally {
      setSaving(false)
    }
  }

  function resetarPadrao() {
    if (confirm("Tem certeza que deseja restaurar a lista de funcionários padrão?")) {
      setFuncionarios([...FUNCIONARIOS_PADRAO])
    }
  }

  function adicionarFuncionario() {
    setFuncionarios([...funcionarios, { nome: "Novo Funcionário", salario: 1412 }])
  }

  function removerFuncionario(index: number) {
    if (funcionarios.length <= 1) {
      alert("Mantenha pelo menos um funcionário cadastrado!")
      return
    }
    const novos = [...funcionarios]
    novos.splice(index, 1)
    setFuncionarios(novos)
  }

  function atualizarFuncionario(index: number, campo: keyof Funcionario, valor: string | number) {
    const novos = [...funcionarios]
    if (campo === "salario") {
      novos[index].salario = Number(valor) || 0
    } else {
      novos[index].nome = valor as string
    }
    setFuncionarios(novos)
  }

  function atualizarConfig(campo: keyof FolhaConfig, valor: string) {
    setConfig(c => ({ ...c, [campo]: Number(valor) || 0 }))
  }

  const totalSalarios = funcionarios.reduce((sum, f) => sum + (Number(f.salario) || 0), 0)
  const valorAdiantamento = Math.round((totalSalarios * config.percentualAdiantamento) / 100 * 100) / 100
  const valorSalario = Math.round((totalSalarios - valorAdiantamento) * 100) / 100

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
            <h1 className="text-xl font-semibold text-white">Editar Funcionários</h1>
            <p className="text-sm text-muted-foreground">Gerencie os funcionários e seus salários</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <select
              className="rounded-full border border-border bg-surface px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none pr-8"
              value={mesReferencia}
              onChange={(e) => setMesReferencia(Number(e.target.value))}
            >
              {MESES.map((nome, i) => (
                <option key={i + 1} value={i + 1}>{nome}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
              <svg className="fill-current h-4 w-4" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
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
            Configure os salários dos funcionários. As provisões (13º, férias, FGTS, INSS) são calculadas automaticamente.
            Os valores são rateados automaticamente: 73% para Almoço e 27% para Janta.
          </AlertDescription>
        </Alert>

        {/* Configuração de Pagamento */}
        <div className="bg-surface rounded-2xl shadow-sm overflow-hidden mb-6">
          <div className="bg-surface-2 p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-white">Configuração de Pagamento</h3>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Define o adiantamento e o pagamento do restante do salário para {MESES[mesReferencia - 1]}/{anoReferencia}.
              Salvo automaticamente e mês a mês.
            </p>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Dia do Adiantamento
              </label>
              <Input
                type="number"
                min={1}
                max={31}
                value={config.diaAdiantamento}
                onChange={(e) => atualizarConfig("diaAdiantamento", e.target.value)}
                className="h-9 rounded-lg border-border focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Percentual do Adiantamento (%)
              </label>
              <Input
                type="number"
                min={0}
                max={100}
                value={config.percentualAdiantamento}
                onChange={(e) => atualizarConfig("percentualAdiantamento", e.target.value)}
                className="h-9 rounded-lg border-border focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Dia do Salário (restante)
              </label>
              <Input
                type="number"
                min={1}
                max={31}
                value={config.diaSalario}
                onChange={(e) => atualizarConfig("diaSalario", e.target.value)}
                className="h-9 rounded-lg border-border focus:ring-primary"
              />
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-surface-2 p-4 border-b border-border">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-white">Lista de Funcionários</h3>
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
                  onClick={adicionarFuncionario}
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Funcionário</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Salário (R$)</th>
                    <th className="px-4 py-3 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {funcionarios.map((func, idx) => (
                    <tr key={idx} className="border-b border-border hover:bg-surface-2 transition-colors">
                      <td className="px-4 py-2">
                        <Input
                          value={func.nome}
                          onChange={(e) => atualizarFuncionario(idx, "nome", e.target.value)}
                          className="h-9 rounded-lg border-border focus:ring-primary"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Input
                          type="number"
                          step="100"
                          value={func.salario}
                          onChange={(e) => atualizarFuncionario(idx, "salario", e.target.value)}
                          className="h-9 text-right rounded-lg border-border focus:ring-primary"
                        />
                      </td>
                      <td className="px-4 py-2 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removerFuncionario(idx)}
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
                    <td className="px-4 py-3 text-white">TOTAL DA FOLHA</td>
                    <td className="px-4 py-3 text-right text-primary text-lg">{formatCurrency(totalSalarios)}</td>
                    <td className="px-4 py-3"></td>
                  </tr>
                  <tr className="font-semibold text-white">
                    <td className="px-4 py-2">
                      ADIANTAMENTO ({config.percentualAdiantamento}%) — dia {config.diaAdiantamento}
                    </td>
                    <td className="px-4 py-2 text-right text-primary">{formatCurrency(valorAdiantamento)}</td>
                    <td className="px-4 py-2"></td>
                  </tr>
                  <tr className="font-semibold text-white">
                    <td className="px-4 py-2">
                      SALÁRIO (restante) — dia {config.diaSalario}
                    </td>
                    <td className="px-4 py-2 text-right">{formatCurrency(valorSalario)}</td>
                    <td className="px-4 py-2"></td>
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
                onClick={salvarFuncionarios}
                className="flex-1 bg-primary hover:bg-primary/90 rounded-lg"
                disabled={saving}
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Salvando..." : "Salvar Funcionários"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
