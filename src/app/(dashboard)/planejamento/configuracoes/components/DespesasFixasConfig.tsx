// src/app/(dashboard)/planejamento/configuracoes/components/DespesasFixasConfig.tsx
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Trash2, RefreshCw, Save } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface DespesaFixa {
  nome: string
  valor: number
}

interface DespesasFixasConfigProps {
  despesas: DespesaFixa[]
  onUpdate: (despesas: DespesaFixa[]) => void
  onSave: () => void
  onReset: () => void
  saving?: boolean
}

const DESPESAS_FIXAS_PADRAO: DespesaFixa[] = [
  { nome: "ALUGUEL", valor: 1200 }, { nome: "CELPE", valor: 700 }, { nome: "COMPESA", valor: 310 },
  { nome: "TELEFONE", valor: 112 }, { nome: "INTERNET", valor: 70 }, { nome: "CONTABILIDADE", valor: 350 },
  { nome: "SOFTWARE GESTAO", valor: 144.4 }, { nome: "MANUT. BANCOS", valor: 99 }, { nome: "PASSAGEM FUNCIN.", valor: 635 },
  { nome: "INSS", valor: 446 }, { nome: "MERCANTIL", valor: 200 }, { nome: "MAQUINETAS", valor: 120 },
  { nome: "CARRO", valor: 0 }, { nome: "COMBUSTIVEL", valor: 200 }, { nome: "BOMBEIROS", valor: 30 },
  { nome: "IPTU", valor: 150 }, { nome: "ANOTAI", valor: 0 }, { nome: "GAS", valor: 1330 },
  { nome: "CELULAR", valor: 20 }, { nome: "PRO-LABORE", valor: 1500 }
]

export function DespesasFixasConfig({ despesas, onUpdate, onSave, onReset, saving }: DespesasFixasConfigProps) {
  const [localDespesas, setLocalDespesas] = useState<DespesaFixa[]>(despesas)

  const totalDespesas = localDespesas.reduce((sum, d) => sum + d.valor, 0)

  const handleUpdate = (novasDespesas: DespesaFixa[]) => {
    setLocalDespesas(novasDespesas)
    onUpdate(novasDespesas)
  }

  const adicionarDespesa = () => {
    handleUpdate([...localDespesas, { nome: "Nova Despesa", valor: 0 }])
  }

  const removerDespesa = (index: number) => {
    if (localDespesas.length <= 1) {
      alert("Mantenha pelo menos uma despesa fixa cadastrada!")
      return
    }
    const novas = [...localDespesas]
    novas.splice(index, 1)
    handleUpdate(novas)
  }

  const atualizarDespesa = (index: number, campo: keyof DespesaFixa, valor: string | number) => {
    const novas = [...localDespesas]
    if (campo === "valor") {
      novas[index].valor = Number(valor) || 0
    } else {
      novas[index].nome = valor as string
    }
    handleUpdate(novas)
  }

  const resetarPadrao = () => {
    if (confirm("Tem certeza que deseja restaurar as despesas fixas padrão?")) {
      handleUpdate([...DESPESAS_FIXAS_PADRAO])
      onReset()
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Despesas Fixas</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={resetarPadrao}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Restaurar Padrão
          </Button>
          <Button variant="outline" size="sm" onClick={adicionarDespesa}>
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
            Despesas fixas são custos que não variam com o faturamento, como aluguel, contas de luz/água, salários, etc.
            Os valores são rateados automaticamente: 73% para Almoço e 27% para Janta.
          </AlertDescription>
        </Alert>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr>
                <th className="px-3 py-2 text-left">Despesa</th>
                <th className="px-3 py-2 text-right">Valor Mensal (R$)</th>
                <th className="px-3 py-2 text-center w-10"></th>
              </tr>
            </thead>
            <tbody>
              {localDespesas.map((desp, idx) => (
                <tr key={idx} className="border-b">
                  <td className="px-3 py-2">
                    <Input
                      value={desp.nome}
                      onChange={(e) => atualizarDespesa(idx, "nome", e.target.value)}
                      className="h-8"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      step="10"
                      value={desp.valor}
                      onChange={(e) => atualizarDespesa(idx, "valor", e.target.value)}
                      className="h-8 text-right"
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <Button variant="ghost" size="sm" onClick={() => removerDespesa(idx)} className="h-8 w-8 p-0">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t bg-gray-50">
              <tr className="font-bold">
                <td className="px-3 py-3">TOTAL</td>
                <td className="px-3 py-3 text-right text-primary">{formatCurrency(totalDespesas)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}