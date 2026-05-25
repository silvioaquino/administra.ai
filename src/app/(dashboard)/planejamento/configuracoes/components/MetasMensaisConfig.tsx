// src/app/(dashboard)/planejamento/configuracoes/components/MetasMensaisConfig.tsx
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar, Save } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface MetaMensal {
  mes: number
  metaDiariaAlmoco: number
  metaDiariaJanta: number
  diasTrabalhados: number
  lucroDesejado: number
}

interface MetasMensaisConfigProps {
  metas: MetaMensal[]
  onUpdate: (metas: MetaMensal[]) => void
  onSave: () => void
  saving?: boolean
}

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

export function MetasMensaisConfig({ metas, onUpdate, onSave, saving }: MetasMensaisConfigProps) {
  const [localMetas, setLocalMetas] = useState<MetaMensal[]>(metas)

  const handleUpdate = (novasMetas: MetaMensal[]) => {
    setLocalMetas(novasMetas)
    onUpdate(novasMetas)
  }

  const atualizarMeta = (mes: number, campo: keyof MetaMensal, valor: number) => {
    const novas = localMetas.map(m => m.mes === mes ? { ...m, [campo]: valor } : m)
    handleUpdate(novas)
  }

  const aplicarParaTodosMeses = () => {
    const mesAtual = new Date().getMonth() + 1
    const metaAtual = localMetas.find(m => m.mes === mesAtual)
    if (metaAtual && confirm(`Aplicar valores do mês atual (${MESES[mesAtual-1]}) para todos os meses?`)) {
      const novas = localMetas.map(m => ({
        ...m,
        metaDiariaAlmoco: metaAtual.metaDiariaAlmoco,
        metaDiariaJanta: metaAtual.metaDiariaJanta,
        diasTrabalhados: metaAtual.diasTrabalhados,
        lucroDesejado: metaAtual.lucroDesejado
      }))
      handleUpdate(novas)
    }
  }

  const totais = localMetas.reduce((acc, meta) => {
    const metaAlmoco = meta.metaDiariaAlmoco * meta.diasTrabalhados
    const metaJanta = meta.metaDiariaJanta * meta.diasTrabalhados
    return {
      almoco: acc.almoco + metaAlmoco,
      janta: acc.janta + metaJanta,
      geral: acc.geral + metaAlmoco + metaJanta
    }
  }, { almoco: 0, janta: 0, geral: 0 })

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Metas de Faturamento por Mês</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={aplicarParaTodosMeses}>
            <Calendar className="mr-2 h-4 w-4" />
            Aplicar a Todos
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
            Defina a meta diária de faturamento para cada mês. O sistema calcula automaticamente a meta mensal e anual.
          </AlertDescription>
        </Alert>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">Mês</th>
                <th className="px-3 py-2 text-right">Meta Diária Almoço</th>
                <th className="px-3 py-2 text-right">Meta Diária Janta</th>
                <th className="px-3 py-2 text-center">Dias</th>
                <th className="px-3 py-2 text-right">Meta Mensal</th>
                <th className="px-3 py-2 text-right">Lucro Desejado</th>
              </tr>
            </thead>
            <tbody>
              {localMetas.map((meta) => {
                const metaMensal = (meta.metaDiariaAlmoco + meta.metaDiariaJanta) * meta.diasTrabalhados
                return (
                  <tr key={meta.mes} className="border-b">
                    <td className="px-3 py-2 font-medium">{MESES[meta.mes - 1]}</td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        step="50"
                        value={meta.metaDiariaAlmoco}
                        onChange={(e) => atualizarMeta(meta.mes, "metaDiariaAlmoco", Number(e.target.value))}
                        className="h-8 text-right"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        step="50"
                        value={meta.metaDiariaJanta}
                        onChange={(e) => atualizarMeta(meta.mes, "metaDiariaJanta", Number(e.target.value))}
                        className="h-8 text-right"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        step="1"
                        min="1"
                        max="31"
                        value={meta.diasTrabalhados}
                        onChange={(e) => atualizarMeta(meta.mes, "diasTrabalhados", Number(e.target.value))}
                        className="h-8 text-center w-20"
                      />
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-primary">
                      {formatCurrency(metaMensal)}
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        step="1"
                        value={meta.lucroDesejado}
                        onChange={(e) => atualizarMeta(meta.mes, "lucroDesejado", Number(e.target.value))}
                        className="h-8 text-right w-20"
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot className="border-t bg-gray-50 font-bold">
              <tr>
                <td className="px-3 py-3">TOTAL ANUAL</td>
                <td colSpan={2} className="px-3 py-3 text-center">{formatCurrency(totais.almoco)}</td>
                <td colSpan={2} className="px-3 py-3 text-center">{formatCurrency(totais.janta)}</td>
                <td className="px-3 py-3 text-center text-primary">{formatCurrency(totais.geral)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}