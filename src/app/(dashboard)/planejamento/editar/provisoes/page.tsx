// src/app/(dashboard)/planejamento/editar/provisoes/page.tsx
"use client"

import React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Shield, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatCurrency } from "@/lib/utils"

interface Funcionario {
  id?: number
  nome: string
  salario: number
}

interface ProvisaoFuncionario {
  funcionarioNome: string
  provisao: string
  ativo: boolean
}

const PROVISOES_CONFIG = [
  { key: "decimo_terceiro", nome: "13º Salário", percentual: 1/12, descricao: "Provisão mensal do 13º salário (salário / 12)" },
  { key: "ferias", nome: "Férias + 1/3", percentual: 1.3333/12, descricao: "Provisão mensal de férias acrescidas de 1/3 constitucional" },
  { key: "fgts", nome: "FGTS (8%)", percentual: 0.08, descricao: "Fundo de Garantia por Tempo de Serviço - 8% sobre o salário" },
  { key: "inss_patronal", nome: "INSS Patronal (20%)", percentual: 0.20, descricao: "Contribuição patronal do INSS - 20% sobre o salário" }
]

export default function EditarProvisoesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [provisoesFuncionarios, setProvisoesFuncionarios] = useState<ProvisaoFuncionario[]>([])
  const [anoReferencia] = useState(new Date().getFullYear())

  useEffect(() => {
    carregarDados()
  }, [])

  async function carregarDados() {
    setLoading(true)
    try {
      const [funcResponse, provResponse] = await Promise.all([
        fetch(`/api/planejamento/funcionarios?ano=${anoReferencia}`),
        fetch(`/api/planejamento/provisoes-funcionarios?ano=${anoReferencia}`)
      ])

      const funcData = await funcResponse.json()
      if (funcData.success && funcData.dados) {
        setFuncionarios(funcData.dados)
      } else {
        setFuncionarios([
          { nome: "Sandra", salario: 1302 },
          { nome: "Lene", salario: 1302 },
          { nome: "Marilia", salario: 1302 },
          { nome: "Meiry", salario: 1500 },
          { nome: "Diarista", salario: 1920 }
        ])
      }

      const provData = await provResponse.json()
      if (provData.success && provData.dados) {
        setProvisoesFuncionarios(provData.dados)
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    } finally {
      setLoading(false)
    }
  }

  async function salvarProvisoes() {
    setSaving(true)
    try {
      const response = await fetch("/api/planejamento/provisoes-funcionarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dados: provisoesFuncionarios,
          ano: anoReferencia
        })
      })
      const data = await response.json()
      if (data.success) {
        alert("Configurações de provisões salvas com sucesso!")
        router.push("/planejamento")
      } else {
        alert(data.message || "Erro ao salvar")
      }
    } catch (error) {
      console.error("Erro ao salvar:", error)
      alert("Erro ao salvar configurações")
    } finally {
      setSaving(false)
    }
  }

  function getProvisaoStatus(funcionarioNome: string, provisaoKey: string): boolean {
    const found = provisoesFuncionarios.find(
      p => p.funcionarioNome === funcionarioNome && p.provisao === provisaoKey
    )
    return found ? found.ativo : true
  }

  function toggleProvisaoFuncionario(funcionarioNome: string, provisaoKey: string, ativo: boolean) {
    const index = provisoesFuncionarios.findIndex(
      p => p.funcionarioNome === funcionarioNome && p.provisao === provisaoKey
    )
    if (index >= 0) {
      const novas = [...provisoesFuncionarios]
      novas[index].ativo = ativo
      setProvisoesFuncionarios(novas)
    } else {
      setProvisoesFuncionarios([
        ...provisoesFuncionarios,
        { funcionarioNome, provisao: provisaoKey, ativo }
      ])
    }
  }

  const totalSalarios = funcionarios.reduce((sum, f) => sum + f.salario, 0)

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
            <h1 className="text-xl font-semibold text-white">Configurar Provisões</h1>
            <p className="text-sm text-muted-foreground">
              Configure as provisões da folha salarial (13º, férias, FGTS, INSS Patronal)
            </p>
          </div>
        </div>
        <Button 
          onClick={salvarProvisoes}
          className="bg-primary hover:bg-primary/90 text-white rounded-full px-5"
          disabled={saving}
        >
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-6 max-w-6xl">
        <Alert className="mb-6 bg-info/5 border-info/30 rounded-xl">
          <AlertDescription className="text-sm text-info">
            As provisões são calculadas automaticamente com base nos salários dos funcionários.
            Você pode ativar/desativar cada provisão individualmente por funcionário.
          </AlertDescription>
        </Alert>

        <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-surface-2 p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-white">Provisões por Funcionário</h3>
            </div>
          </div>
          <div className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-2 border-b border-border">
                  <tr className="border-b border-border">
                    <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Provisão</th>
                    <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Funcionário</th>
                    <th rowSpan={2} className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Ativo</th>
                    <th rowSpan={2} className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Impacto Mensal (R$)</th>
                  </tr>
                </thead>
                <tbody>
                  {PROVISOES_CONFIG.map((prov, provIdx) => (
                    <React.Fragment key={prov.key}>
                      <tr className="bg-surface-2">
                        <td colSpan={4} className="px-4 py-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium text-white">{prov.nome}</span>
                              <span className="ml-2 text-xs text-muted-foreground">({prov.descricao})</span>
                            </div>
                          </div>
                        </td>
                       </tr>
                      {funcionarios.map((func, funcIdx) => {
                        const isAtivo = getProvisaoStatus(func.nome, prov.key)
                        const valorMensal = func.salario * prov.percentual
                        
                        return (
                          <tr key={`${func.nome}-${prov.key}`} className="border-b border-border hover:bg-surface-2 transition-colors">
                            {funcIdx === 0 && provIdx === 0 && (
                              <td className="px-4 py-2 align-middle" rowSpan={PROVISOES_CONFIG.length * funcionarios.length}>
                                {/* Espaço reservado */}
                              </td>
                            )}
                            <td className="px-4 py-2 text-white">{func.nome}</td>
                            <td className="px-4 py-2 text-center">
                              <Switch
                                checked={isAtivo}
                                onCheckedChange={(checked) => toggleProvisaoFuncionario(func.nome, prov.key, checked)}
                              />
                            </td>
                            <td className="px-4 py-2 text-right">
                              <span className={isAtivo ? "text-success font-medium" : "text-muted-foreground/70 line-through"}>
                                {formatCurrency(valorMensal)}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </React.Fragment>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-border bg-surface-2">
                  <tr className="font-semibold">
                    <td colSpan={3} className="px-4 py-3 text-right text-white">TOTAL DA FOLHA:</td>
                    <td className="px-4 py-3 text-right text-primary text-lg">{formatCurrency(totalSalarios)}</td>
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
                  onClick={salvarProvisoes} 
                  className="flex-1 bg-primary hover:bg-primary/90 rounded-lg"
                  disabled={saving}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Salvando..." : "Salvar Configurações"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}