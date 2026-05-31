// src/app/(dashboard)/planejamento/editar/funcionarios/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plus, Trash2, Save, RefreshCw, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatCurrency } from "@/lib/utils"

interface Funcionario {
  id?: number
  nome: string
  salario: number
}

const FUNCIONARIOS_PADRAO: Funcionario[] = [
  { nome: "Sandra", salario: 1302 },
  { nome: "Lene", salario: 1302 },
  { nome: "Marilia", salario: 1302 },
  { nome: "Meiry", salario: 1500 },
  { nome: "Diarista", salario: 1920 }
]

export default function EditarFuncionariosPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [anoReferencia, setAnoReferencia] = useState(new Date().getFullYear())

  useEffect(() => {
    carregarFuncionarios()
  }, [anoReferencia])

  async function carregarFuncionarios() {
    setLoading(true)
    try {
      const response = await fetch(`/api/planejamento/funcionarios?ano=${anoReferencia}`)
      const data = await response.json()
      if (data.success && data.dados && data.dados.length > 0) {
        setFuncionarios(data.dados)
      } else {
        setFuncionarios([...FUNCIONARIOS_PADRAO])
      }
    } catch (error) {
      console.error("Erro ao carregar funcionários:", error)
      setFuncionarios([...FUNCIONARIOS_PADRAO])
    } finally {
      setLoading(false)
    }
  }

  async function salvarFuncionarios() {
    setSaving(true)
    try {
      const response = await fetch("/api/planejamento/funcionarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dados: funcionarios,
          ano: anoReferencia
        })
      })
      const data = await response.json()
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

  const totalSalarios = funcionarios.reduce((sum, f) => sum + f.salario, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#de4838] border-t-transparent" />
      </div>
    )
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
            <h1 className="text-xl font-semibold text-gray-800">Editar Funcionários</h1>
            <p className="text-sm text-gray-500">Gerencie os funcionários e seus salários</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <select
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#de4838] appearance-none pr-8"
              value={anoReferencia}
              onChange={(e) => setAnoReferencia(Number(e.target.value))}
            >
              <option value={2024}>2024</option>
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
              <svg className="fill-current h-4 w-4" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-6 max-w-4xl">
        <Alert className="mb-6 bg-blue-50 border-blue-200 rounded-xl">
          <AlertDescription className="text-sm text-blue-700">
            Configure os salários dos funcionários. As provisões (13º, férias, FGTS, INSS) são calculadas automaticamente.
            Os valores são rateados automaticamente: 73% para Almoço e 27% para Janta.
          </AlertDescription>
        </Alert>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-gray-50 p-4 border-b border-gray-100">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-[#de4838]" />
                <h3 className="font-semibold text-gray-800">Lista de Funcionários</h3>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={resetarPadrao}
                  className="rounded-lg border-gray-200 hover:border-[#de4838]"
                >
                  <RefreshCw className="mr-2 h-3 w-3" />
                  Restaurar Padrão
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={adicionarFuncionario}
                  className="rounded-lg border-gray-200 hover:border-[#de4838]"
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
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Funcionário</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Salário (R$)</th>
                    <th className="px-4 py-3 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {funcionarios.map((func, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2">
                        <Input
                          value={func.nome}
                          onChange={(e) => atualizarFuncionario(idx, "nome", e.target.value)}
                          className="h-9 rounded-lg border-gray-200 focus:ring-[#de4838]"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Input
                          type="number"
                          step="100"
                          value={func.salario}
                          onChange={(e) => atualizarFuncionario(idx, "salario", e.target.value)}
                          className="h-9 text-right rounded-lg border-gray-200 focus:ring-[#de4838]"
                        />
                      </td>
                      <td className="px-4 py-2 text-center">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removerFuncionario(idx)} 
                          className="h-8 w-8 p-0 rounded-lg hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-gray-200 bg-gray-50">
                  <tr className="font-semibold">
                    <td className="px-4 py-3 text-gray-800">TOTAL DA FOLHA</td>
                    <td className="px-4 py-3 text-right text-[#de4838] text-lg">{formatCurrency(totalSalarios)}</td>
                    <td className="px-4 py-3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="mt-6 flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1 rounded-lg border-gray-200 hover:bg-gray-100"
                onClick={() => router.back()}
              >
                Cancelar
              </Button>
              <Button 
                onClick={salvarFuncionarios} 
                className="flex-1 bg-[#de4838] hover:bg-[#c73d2e] rounded-lg"
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