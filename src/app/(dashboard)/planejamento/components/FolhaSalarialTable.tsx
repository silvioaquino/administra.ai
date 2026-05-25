// src/app/(dashboard)/planejamento/components/FolhaSalarialTable.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { Users, Calculator, Settings } from "lucide-react"

interface Funcionario {
  nome: string
  salario: number
}

interface ProvisaoFuncionario {
  funcionarioNome: string
  provisao: string
  ativo: boolean
}

interface FolhaSalarialTableProps {
  funcionarios: Funcionario[]
  onEdit: () => void
  onConfigProvisoes: () => void
}

const PROVISOES_CONFIG = {
  decimo_terceiro: { nome: "13º Salário", percentual: 1/12 },
  ferias: { nome: "Férias + 1/3", percentual: 1.3333/12 },
  fgts: { nome: "FGTS (8%)", percentual: 0.08 },
  inss_patronal: { nome: "INSS Patronal (20%)", percentual: 0.20 }
}

export function FolhaSalarialTable({ funcionarios, onEdit, onConfigProvisoes }: FolhaSalarialTableProps) {
  const [provisoesAtivas, setProvisoesAtivas] = useState({
    decimo_terceiro: true,
    ferias: true,
    fgts: true,
    inss_patronal: true
  })
  const [provisoesFuncionarios, setProvisoesFuncionarios] = useState<ProvisaoFuncionario[]>([])

  useEffect(() => {
    carregarProvisoes()
  }, [])

  async function carregarProvisoes() {
    try {
      const response = await fetch("/api/planejamento/provisoes-funcionarios")
      const data = await response.json()
      if (data.success && data.dados) {
        setProvisoesFuncionarios(data.dados)
      }
    } catch (error) {
      console.error("Erro ao carregar provisões:", error)
    }
  }

  function getProvisaoStatus(funcionarioNome: string, provisaoKey: string): boolean {
    const found = provisoesFuncionarios.find(
      p => p.funcionarioNome === funcionarioNome && p.provisao === provisaoKey
    )
    return found ? found.ativo : true
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

  const totais = calcularTotais()
  const totalMensal = totais.totalSalarios + totais.totalDecimo + totais.totalFerias + totais.totalFgts + totais.totalInss

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
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
          </div>
        </div>
      </div>
      <div className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Funcionário</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Salário</th>
                {provisoesAtivas.decimo_terceiro && <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">13º (mês)</th>}
                {provisoesAtivas.ferias && <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Férias (mês)</th>}
                {provisoesAtivas.fgts && <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">FGTS (mês)</th>}
                {provisoesAtivas.inss_patronal && <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">INSS Patronal</th>}
              </tr>
            </thead>
            <tbody>
              {funcionarios.map((func, idx) => {
                const decimo = (provisoesAtivas.decimo_terceiro && getProvisaoStatus(func.nome, "decimo_terceiro")) ? func.salario / 12 : 0
                const ferias = (provisoesAtivas.ferias && getProvisaoStatus(func.nome, "ferias")) ? (func.salario * 1.3333) / 12 : 0
                const fgts = (provisoesAtivas.fgts && getProvisaoStatus(func.nome, "fgts")) ? func.salario * 0.08 : 0
                const inss = (provisoesAtivas.inss_patronal && getProvisaoStatus(func.nome, "inss_patronal")) ? func.salario * 0.20 : 0
                
                return (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{func.nome}</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-700">{formatCurrency(func.salario)}</td>
                    {provisoesAtivas.decimo_terceiro && <td className="px-4 py-3 text-right font-mono text-gray-600">{formatCurrency(decimo)}</td>}
                    {provisoesAtivas.ferias && <td className="px-4 py-3 text-right font-mono text-gray-600">{formatCurrency(ferias)}</td>}
                    {provisoesAtivas.fgts && <td className="px-4 py-3 text-right font-mono text-gray-600">{formatCurrency(fgts)}</td>}
                    {provisoesAtivas.inss_patronal && <td className="px-4 py-3 text-right font-mono text-gray-600">{formatCurrency(inss)}</td>}
                  </tr>
                )
              })}
            </tbody>
            <tfoot className="border-t border-gray-200 bg-gray-50">
              <tr className="font-semibold">
                <td className="px-4 py-3 text-gray-800">TOTAL</td>
                <td className="px-4 py-3 text-right text-gray-800">{formatCurrency(totais.totalSalarios)}</td>
                {provisoesAtivas.decimo_terceiro && <td className="px-4 py-3 text-right text-gray-800">{formatCurrency(totais.totalDecimo)}</td>}
                {provisoesAtivas.ferias && <td className="px-4 py-3 text-right text-gray-800">{formatCurrency(totais.totalFerias)}</td>}
                {provisoesAtivas.fgts && <td className="px-4 py-3 text-right text-gray-800">{formatCurrency(totais.totalFgts)}</td>}
                {provisoesAtivas.inss_patronal && <td className="px-4 py-3 text-right text-gray-800">{formatCurrency(totais.totalInss)}</td>}
              </tr>
              <tr className="bg-yellow-50">
                <td colSpan={5} className="px-4 py-3 font-bold text-gray-700">TOTAL Folha + Encargos Mensal</td>
                <td className="px-4 py-3 text-right font-bold text-[#de4838] text-lg">{formatCurrency(totalMensal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}