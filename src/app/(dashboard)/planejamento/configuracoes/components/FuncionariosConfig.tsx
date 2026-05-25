// src/app/(dashboard)/planejamento/configuracoes/components/FuncionariosConfig.tsx
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Trash2, RefreshCw, Save } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface Funcionario {
  nome: string
  salario: number
}

interface FuncionariosConfigProps {
  funcionarios: Funcionario[]
  onUpdate: (funcionarios: Funcionario[]) => void
  onSave: () => void
  onReset: () => void
  saving?: boolean
}

const FUNCIONARIOS_PADRAO: Funcionario[] = [
  { nome: "Sandra", salario: 1302 },
  { nome: "Lene", salario: 1302 },
  { nome: "Marilia", salario: 1302 },
  { nome: "Meiry", salario: 1500 },
  { nome: "Diarista", salario: 1920 }
]

export function FuncionariosConfig({ funcionarios, onUpdate, onSave, onReset, saving }: FuncionariosConfigProps) {
  const [localFuncionarios, setLocalFuncionarios] = useState<Funcionario[]>(funcionarios)

  const totalSalarios = localFuncionarios.reduce((sum, f) => sum + f.salario, 0)

  const handleUpdate = (novosFuncionarios: Funcionario[]) => {
    setLocalFuncionarios(novosFuncionarios)
    onUpdate(novosFuncionarios)
  }

  const adicionarFuncionario = () => {
    handleUpdate([...localFuncionarios, { nome: "Novo Funcionário", salario: 1412 }])
  }

  const removerFuncionario = (index: number) => {
    if (localFuncionarios.length <= 1) {
      alert("Mantenha pelo menos um funcionário cadastrado!")
      return
    }
    const novos = [...localFuncionarios]
    novos.splice(index, 1)
    handleUpdate(novos)
  }

  const atualizarFuncionario = (index: number, campo: keyof Funcionario, valor: string | number) => {
    const novos = [...localFuncionarios]
    if (campo === "salario") {
      novos[index].salario = Number(valor) || 0
    } else {
      novos[index].nome = valor as string
    }
    handleUpdate(novos)
  }

  const resetarPadrao = () => {
    if (confirm("Tem certeza que deseja restaurar a lista de funcionários padrão?")) {
      handleUpdate([...FUNCIONARIOS_PADRAO])
      onReset()
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Funcionários</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={resetarPadrao}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Restaurar Padrão
          </Button>
          <Button variant="outline" size="sm" onClick={adicionarFuncionario}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar
          </Button>
          <Button size="sm" onClick={onSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4">
          <AlertDescription>
            Configure os salários dos funcionários. As provisões (13º, férias, FGTS, INSS) são calculadas automaticamente.
            Os valores são rateados automaticamente: 73% para Almoço e 27% para Janta.
          </AlertDescription>
        </Alert>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr>
                <th className="px-3 py-2 text-left">Funcionário</th>
                <th className="px-3 py-2 text-right">Salário (R$)</th>
                <th className="px-3 py-2 text-center w-10"></th>
              </tr>
            </thead>
            <tbody>
              {localFuncionarios.map((func, idx) => (
                <tr key={idx} className="border-b">
                  <td className="px-3 py-2">
                    <Input
                      value={func.nome}
                      onChange={(e) => atualizarFuncionario(idx, "nome", e.target.value)}
                      className="h-8"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      step="100"
                      value={func.salario}
                      onChange={(e) => atualizarFuncionario(idx, "salario", e.target.value)}
                      className="h-8 text-right"
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <Button variant="ghost" size="sm" onClick={() => removerFuncionario(idx)} className="h-8 w-8 p-0">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t bg-gray-50">
              <tr className="font-bold">
                <td className="px-3 py-3">TOTAL DA FOLHA</td>
                <td className="px-3 py-3 text-right text-primary">{formatCurrency(totalSalarios)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}