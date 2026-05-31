// src/app/(dashboard)/planejamento/components/FolhaSalarialTable.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { formatCurrency } from "@/lib/utils"
import { Users, Calculator, Settings, ChevronDown, ChevronRight, Save } from "lucide-react"

interface Funcionario {
  nome: string
  salario: number
}

interface ProvisaoFuncionario {
  id?: number
  funcionarioNome: string
  provisao: string
  ativo: boolean
}

interface FolhaSalarialTableProps {
  funcionarios: Funcionario[]
  onEdit: () => void
  onConfigProvisoes: () => void
}

// Configuração das provisões
const PROVISOES_CONFIG = {
  decimo_terceiro: { 
    nome: "13º Salário", 
    percentual: 1/12,
    descricao: "Provisão mensal do 13º salário (salário / 12)"
  },
  ferias: { 
    nome: "Férias + 1/3", 
    percentual: 1.3333/12,
    descricao: "Provisão mensal de férias acrescidas de 1/3 constitucional"
  },
  fgts: { 
    nome: "FGTS (8%)", 
    percentual: 0.08,
    descricao: "Fundo de Garantia por Tempo de Serviço - 8% sobre o salário"
  },
  inss_patronal: { 
    nome: "INSS Patronal (20%)", 
    percentual: 0.20,
    descricao: "Contribuição patronal do INSS - 20% sobre o salário"
  }
}

export function FolhaSalarialTable({ funcionarios, onEdit, onConfigProvisoes }: FolhaSalarialTableProps) {
  const [provisoesAtivas, setProvisoesAtivas] = useState({
    decimo_terceiro: true,
    ferias: true,
    fgts: true,
    inss_patronal: true
  })
  const [provisoesFuncionarios, setProvisoesFuncionarios] = useState<ProvisaoFuncionario[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [anoReferencia] = useState(new Date().getFullYear())

  useEffect(() => {
    carregarProvisoes()
    carregarProvisoesAtivas()
  }, [])

  async function carregarProvisoes() {
    try {
      const response = await fetch(`/api/planejamento/provisoes-funcionarios?ano=${anoReferencia}`)
      const data = await response.json()
      if (data.success && data.dados) {
        setProvisoesFuncionarios(data.dados)
      }
    } catch (error) {
      console.error("Erro ao carregar provisões:", error)
    } finally {
      setLoading(false)
    }
  }

  function carregarProvisoesAtivas() {
    const saved = localStorage.getItem("provisoesAtivas")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setProvisoesAtivas(prev => ({ ...prev, ...parsed }))
      } catch (e) {
        console.error("Erro ao carregar provisões ativas:", e)
      }
    }
  }

  function getProvisaoStatus(funcionarioNome: string, provisaoKey: string): boolean {
    const found = provisoesFuncionarios.find(
      p => p.funcionarioNome === funcionarioNome && p.provisao === provisaoKey
    )
    // Se não encontrado, padrão é true (ativo)
    return found !== undefined ? found.ativo : true
  }

  async function toggleProvisaoFuncionario(
    funcionarioNome: string, 
    provisaoKey: string, 
    isChecked: boolean
  ) {
    // Atualizar estado local
    const index = provisoesFuncionarios.findIndex(
      p => p.funcionarioNome === funcionarioNome && p.provisao === provisaoKey
    )
    
    let novasProvisoes: ProvisaoFuncionario[]
    
    if (index >= 0) {
      novasProvisoes = [...provisoesFuncionarios]
      novasProvisoes[index].ativo = isChecked
    } else {
      novasProvisoes = [
        ...provisoesFuncionarios,
        { funcionarioNome, provisao: provisaoKey, ativo: isChecked }
      ]
    }
    
    setProvisoesFuncionarios(novasProvisoes)
    
    // Salvar no backend em tempo real
    try {
      const response = await fetch("/api/planejamento/provisoes-funcionarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dados: [{ provisao: provisaoKey, funcionario_nome: funcionarioNome, ativo: isChecked }],
          ano: anoReferencia
        })
      })
      
      if (!response.ok) {
        console.error("Erro ao salvar provisão")
      }
    } catch (error) {
      console.error("Erro ao salvar provisão:", error)
    }
  }

  async function salvarTodasProvisoes() {
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
      } else {
        alert("Erro ao salvar configurações")
      }
    } catch (error) {
      console.error("Erro ao salvar:", error)
      alert("Erro ao salvar configurações")
    } finally {
      setSaving(false)
    }
  }

  function calcularTotais() {
    let totalSalarios = 0
    let totalDecimo = 0
    let totalFerias = 0
    let totalFgts = 0
    let totalInss = 0

    for (const func of funcionarios) {
      totalSalarios += func.salario
      
      if (provisoesAtivas.decimo_terceiro && getProvisaoStatus(func.nome, "decimo_terceiro")) {
        totalDecimo += func.salario / 12
      }
      if (provisoesAtivas.ferias && getProvisaoStatus(func.nome, "ferias")) {
        totalFerias += (func.salario * 1.3333) / 12
      }
      if (provisoesAtivas.fgts && getProvisaoStatus(func.nome, "fgts")) {
        totalFgts += func.salario * 0.08
      }
      if (provisoesAtivas.inss_patronal && getProvisaoStatus(func.nome, "inss_patronal")) {
        totalInss += func.salario * 0.20
      }
    }

    return { totalSalarios, totalDecimo, totalFerias, totalFgts, totalInss }
  }

  function calcularTotaisPorFuncionario(funcionarioNome: string) {
    const func = funcionarios.find(f => f.nome === funcionarioNome)
    if (!func) return { decimo: 0, ferias: 0, fgts: 0, inss: 0 }
    
    return {
      decimo: provisoesAtivas.decimo_terceiro && getProvisaoStatus(funcionarioNome, "decimo_terceiro") ? func.salario / 12 : 0,
      ferias: provisoesAtivas.ferias && getProvisaoStatus(funcionarioNome, "ferias") ? (func.salario * 1.3333) / 12 : 0,
      fgts: provisoesAtivas.fgts && getProvisaoStatus(funcionarioNome, "fgts") ? func.salario * 0.08 : 0,
      inss: provisoesAtivas.inss_patronal && getProvisaoStatus(funcionarioNome, "inss_patronal") ? func.salario * 0.20 : 0
    }
  }

  const totais = calcularTotais()
  const totalMensal = totais.totalSalarios + totais.totalDecimo + totais.totalFerias + totais.totalFgts + totais.totalInss

  const toggleRow = (funcionarioNome: string) => {
    setExpandedRow(expandedRow === funcionarioNome ? null : funcionarioNome)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-8 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#de4838] border-t-transparent mx-auto" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 p-4 border-b border-gray-100">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[#de4838]" />
            <h3 className="font-semibold text-gray-800">Folha Salarial & Provisões</h3>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onEdit}
              className="rounded-lg border-gray-200 hover:border-[#de4838]"
            >
              <Settings className="mr-1 h-3 w-3" />
              Editar Funcionários
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onConfigProvisoes}
              className="rounded-lg border-gray-200 hover:border-[#de4838]"
            >
              <Calculator className="mr-1 h-3 w-3" />
              Configurar Provisões
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              onClick={salvarTodasProvisoes}
              disabled={saving}
              className="bg-[#de4838] hover:bg-[#c73d2e]"
            >
              <Save className="mr-1 h-3 w-3" />
              {saving ? "Salvando..." : "Salvar Todas"}
            </Button>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8"></th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Funcionário</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Salário</th>
                {provisoesAtivas.decimo_terceiro && (
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    13º Salário
                  </th>
                )}
                {provisoesAtivas.ferias && (
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Férias + 1/3
                  </th>
                )}
                {provisoesAtivas.fgts && (
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    FGTS (8%)
                  </th>
                )}
                {provisoesAtivas.inss_patronal && (
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    INSS Patronal (20%)
                  </th>
                )}
              </tr>
              {/* Sub-header para indicar valor + switch */}
              <tr className="border-b border-gray-200 bg-gray-100">
                <td className="px-4 py-2"></td>
                <td className="px-4 py-2"></td>
                <td className="px-4 py-2"></td>
                {provisoesAtivas.decimo_terceiro && (
                  <td className="px-4 py-2 text-center text-xs text-gray-500">Valor / Status</td>
                )}
                {provisoesAtivas.ferias && (
                  <td className="px-4 py-2 text-center text-xs text-gray-500">Valor / Status</td>
                )}
                {provisoesAtivas.fgts && (
                  <td className="px-4 py-2 text-center text-xs text-gray-500">Valor / Status</td>
                )}
                {provisoesAtivas.inss_patronal && (
                  <td className="px-4 py-2 text-center text-xs text-gray-500">Valor / Status</td>
                )}
              </tr>
            </thead>
            <tbody>
              {funcionarios.map((func) => {
                const valores = calcularTotaisPorFuncionario(func.nome)
                const isExpanded = expandedRow === func.nome
                
                return (
                  <>
                    {/* Linha principal */}
                    <tr key={func.nome} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleRow(func.nome)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">{func.nome}</td>
                      <td className="px-4 py-3 text-right font-mono text-gray-700">{formatCurrency(func.salario)}</td>
                      
                      {/* 13º Salário */}
                      {provisoesAtivas.decimo_terceiro && (
                        <td className="px-4 py-3">
                          <div className="flex flex-col items-center gap-2">
                            <span className={`font-mono text-sm ${getProvisaoStatus(func.nome, "decimo_terceiro") ? 'text-green-600' : 'text-gray-400 line-through'}`}>
                              {formatCurrency(valores.decimo)}
                            </span>
                            <Switch
                              checked={getProvisaoStatus(func.nome, "decimo_terceiro")}
                              onCheckedChange={(checked) => toggleProvisaoFuncionario(func.nome, "decimo_terceiro", checked)}
                              className="scale-75"
                            />
                          </div>
                        </td>
                      )}
                      
                      {/* Férias */}
                      {provisoesAtivas.ferias && (
                        <td className="px-4 py-3">
                          <div className="flex flex-col items-center gap-2">
                            <span className={`font-mono text-sm ${getProvisaoStatus(func.nome, "ferias") ? 'text-green-600' : 'text-gray-400 line-through'}`}>
                              {formatCurrency(valores.ferias)}
                            </span>
                            <Switch
                              checked={getProvisaoStatus(func.nome, "ferias")}
                              onCheckedChange={(checked) => toggleProvisaoFuncionario(func.nome, "ferias", checked)}
                              className="scale-75"
                            />
                          </div>
                        </td>
                      )}
                      
                      {/* FGTS */}
                      {provisoesAtivas.fgts && (
                        <td className="px-4 py-3">
                          <div className="flex flex-col items-center gap-2">
                            <span className={`font-mono text-sm ${getProvisaoStatus(func.nome, "fgts") ? 'text-green-600' : 'text-gray-400 line-through'}`}>
                              {formatCurrency(valores.fgts)}
                            </span>
                            <Switch
                              checked={getProvisaoStatus(func.nome, "fgts")}
                              onCheckedChange={(checked) => toggleProvisaoFuncionario(func.nome, "fgts", checked)}
                              className="scale-75"
                            />
                          </div>
                        </td>
                      )}
                      
                      {/* INSS Patronal */}
                      {provisoesAtivas.inss_patronal && (
                        <td className="px-4 py-3">
                          <div className="flex flex-col items-center gap-2">
                            <span className={`font-mono text-sm ${getProvisaoStatus(func.nome, "inss_patronal") ? 'text-green-600' : 'text-gray-400 line-through'}`}>
                              {formatCurrency(valores.inss)}
                            </span>
                            <Switch
                              checked={getProvisaoStatus(func.nome, "inss_patronal")}
                              onCheckedChange={(checked) => toggleProvisaoFuncionario(func.nome, "inss_patronal", checked)}
                              className="scale-75"
                            />
                          </div>
                        </td>
                      )}
                    </tr>

                    {/* Linha expandida com detalhes das provisões */}
                    {isExpanded && (
                      <tr className="bg-gray-50">
                        <td colSpan={7} className="px-4 py-3">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Calculator className="h-4 w-4 text-[#de4838]" />
                              <span className="font-medium text-gray-700">Detalhes das Provisões - {func.nome}</span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              {Object.entries(PROVISOES_CONFIG).map(([key, config]) => {
                                const isAtivo = getProvisaoStatus(func.nome, key)
                                const valor = isAtivo ? func.salario * config.percentual : 0
                                
                                return (
                                  <div key={key} className="bg-white rounded-lg p-3 border border-gray-100">
                                    <div className="flex justify-between items-start mb-2">
                                      <p className="text-sm font-medium text-gray-800">{config.nome}</p>
                                      <Switch
                                        checked={isAtivo}
                                        onCheckedChange={(checked) => toggleProvisaoFuncionario(func.nome, key, checked)}
                                        className="scale-75"
                                      />
                                    </div>
                                    <p className={`text-lg font-bold ${isAtivo ? 'text-green-600' : 'text-gray-400 line-through'}`}>
                                      {formatCurrency(valor)}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">{config.descricao}</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                      Percentual: {(config.percentual * 100).toFixed(1)}%
                                    </p>
                                  </div>
                                )
                              })}
                            </div>
                            <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
                              <span className="font-medium">Total de encargos mensais:</span> {formatCurrency(valores.decimo + valores.ferias + valores.fgts + valores.inss)}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
            <tfoot className="border-t border-gray-200 bg-gray-50">
              <tr className="font-semibold">
                <td className="px-4 py-3"></td>
                <td className="px-4 py-3 text-gray-800">TOTAL</td>
                <td className="px-4 py-3 text-right text-gray-800">{formatCurrency(totais.totalSalarios)}</td>
                {provisoesAtivas.decimo_terceiro && (
                  <td className="px-4 py-3 text-center text-gray-800">{formatCurrency(totais.totalDecimo)}</td>
                )}
                {provisoesAtivas.ferias && (
                  <td className="px-4 py-3 text-center text-gray-800">{formatCurrency(totais.totalFerias)}</td>
                )}
                {provisoesAtivas.fgts && (
                  <td className="px-4 py-3 text-center text-gray-800">{formatCurrency(totais.totalFgts)}</td>
                )}
                {provisoesAtivas.inss_patronal && (
                  <td className="px-4 py-3 text-center text-gray-800">{formatCurrency(totais.totalInss)}</td>
                )}
              </tr>
              <tr className="bg-yellow-50">
                <td className="px-4 py-3"></td>
                <td colSpan={5} className="px-4 py-3 font-bold text-gray-700">TOTAL Folha + Encargos Mensal</td>
                <td className="px-4 py-3 text-right font-bold text-[#de4838] text-lg">{formatCurrency(totalMensal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Informação sobre provisões */}
      <div className="bg-gray-50 p-3 border-t border-gray-100 text-xs text-gray-500 flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>Ativo</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-gray-300"></div>
          <span>Desativado</span>
        </div>
        <div className="ml-auto text-xs text-muted-foreground">
          Clique no switch para ativar/desativar a provisão para cada funcionário
        </div>
      </div>
    </div>
  )
}