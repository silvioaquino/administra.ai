// src/app/(dashboard)/planejamento/configuracoes/components/ProvisoesConfig.tsx
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Save } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface Funcionario {
  nome: string
  salario: number
}

interface ProvisaoFuncionario {
  funcionarioNome: string
  provisao: string
  ativo: boolean
}

interface ProvisoesConfigProps {
  funcionarios: Funcionario[]
  provisoes: ProvisaoFuncionario[]
  provisoesAtivas: {
    decimo_terceiro: boolean
    ferias: boolean
    fgts: boolean
    inss_patronal: boolean
  }
  onUpdateProvisoes: (provisoes: ProvisaoFuncionario[]) => void
  onUpdateProvisoesAtivas: (provisoes: any) => void
  onSave: () => void
  saving?: boolean
}

const PROVISOES_CONFIG = [
  { key: "decimo_terceiro", nome: "13º Salário", percentual: 1/12, descricao: "Provisão mensal do 13º salário (salário / 12)" },
  { key: "ferias", nome: "Férias + 1/3", percentual: 1.3333/12, descricao: "Provisão mensal de férias acrescidas de 1/3 constitucional" },
  { key: "fgts", nome: "FGTS (8%)", percentual: 0.08, descricao: "Fundo de Garantia por Tempo de Serviço - 8% sobre o salário" },
  { key: "inss_patronal", nome: "INSS Patronal (20%)", percentual: 0.20, descricao: "Contribuição patronal do INSS - 20% sobre o salário" }
]

export function ProvisoesConfig({ 
  funcionarios, 
  provisoes, 
  provisoesAtivas,
  onUpdateProvisoes,
  onUpdateProvisoesAtivas,
  onSave, 
  saving 
}: ProvisoesConfigProps) {
  
  const getProvisaoStatus = (funcionarioNome: string, provisaoKey: string): boolean => {
    const found = provisoes.find(p => p.funcionarioNome === funcionarioNome && p.provisao === provisaoKey)
    return found ? found.ativo : true
  }

  const toggleProvisaoAtiva = (provisaoKey: string, ativo: boolean) => {
    onUpdateProvisoesAtivas({ ...provisoesAtivas, [provisaoKey]: ativo })
  }

  const toggleProvisaoFuncionario = (funcionarioNome: string, provisaoKey: string, ativo: boolean) => {
    const index = provisoes.findIndex(p => p.funcionarioNome === funcionarioNome && p.provisao === provisaoKey)
    let novasProvisoes = [...provisoes]
    
    if (index >= 0) {
      novasProvisoes[index].ativo = ativo
    } else {
      novasProvisoes.push({ funcionarioNome, provisao: provisaoKey, ativo })
    }
    
    onUpdateProvisoes(novasProvisoes)
  }

  const calcularTotalProvisao = (provisaoKey: string): number => {
    const config = PROVISOES_CONFIG.find(p => p.key === provisaoKey)
    if (!config) return 0
    
    let total = 0
    for (const func of funcionarios) {
      if (getProvisaoStatus(func.nome, provisaoKey)) {
        total += func.salario * config.percentual
      }
    }
    return total
  }

  const totalSalarios = funcionarios.reduce((sum, f) => sum + f.salario, 0)
  const totalProvisoes = PROVISOES_CONFIG.reduce((sum, prov) => {
    if (provisoesAtivas[prov.key as keyof typeof provisoesAtivas]) {
      return sum + calcularTotalProvisao(prov.key)
    }
    return sum
  }, 0)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Configuração de Provisões da Folha</CardTitle>
        <Button size="sm" onClick={onSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4">
          <AlertDescription>
            Para cada provisão, selecione se deseja incluir ou excluir do cálculo da folha salarial.
            Você pode configurar individualmente por funcionário.
          </AlertDescription>
        </Alert>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">Provisão</th>
                <th className="px-3 py-2 text-left">Funcionário</th>
                <th className="px-3 py-2 text-center">Status</th>
                <th className="px-3 py-2 text-right">Impacto Mensal (R$)</th>
              </tr>
            </thead>
            <tbody>
              {PROVISOES_CONFIG.map((prov) => (
                <tr key={prov.key} className="border-b bg-gray-50">
                  <td colSpan={4} className="px-3 py-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{prov.nome}</span>
                        <span className="ml-2 text-xs text-muted-foreground">({prov.descricao})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Ativar globalmente</span>
                        <Switch
                          checked={provisoesAtivas[prov.key as keyof typeof provisoesAtivas]}
                          onCheckedChange={(checked) => toggleProvisaoAtiva(prov.key, checked)}
                        />
                      </div>
                    </div>
                   </td>
                 </tr>
              ))}
              {funcionarios.map((func) => (
                PROVISOES_CONFIG.map((prov, provIdx) => {
                  const isAtivo = provisoesAtivas[prov.key as keyof typeof provisoesAtivas]
                  const isFuncAtivo = getProvisaoStatus(func.nome, prov.key)
                  const valorMensal = func.salario * prov.percentual
                  
                  return (
                    <tr key={`${func.nome}-${prov.key}`} className="border-b">
                      {provIdx === 0 && (
                        <td className="px-3 py-2 font-medium" rowSpan={funcionarios.length * PROVISOES_CONFIG.length}>
                          {/* Espaço reservado para alinhamento */}
                        </td>
                      )}
                      <td className="px-3 py-2">{func.nome}</td>
                      <td className="px-3 py-2 text-center">
                        <Switch
                          checked={isFuncAtivo}
                          onCheckedChange={(checked) => toggleProvisaoFuncionario(func.nome, prov.key, checked)}
                          disabled={!isAtivo}
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <span className={isFuncAtivo && isAtivo ? "text-green-600 font-medium" : "text-gray-400 line-through"}>
                          {formatCurrency(valorMensal)}
                        </span>
                      </td>
                    </tr>
                  )
                })
              ))}
            </tbody>
            <tfoot className="border-t bg-gray-50 font-bold">
              <tr>
                <td colSpan={3} className="px-3 py-3 text-right">TOTAL DE PROVISÕES ATIVAS:</td>
                <td className="px-3 py-3 text-right text-primary">{formatCurrency(totalProvisoes)}</td>
              </tr>
              <tr>
                <td colSpan={3} className="px-3 py-3 text-right">TOTAL FOLHA + ENCARGOS:</td>
                <td className="px-3 py-3 text-right text-primary">{formatCurrency(totalSalarios + totalProvisoes)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <Alert className="mt-4" variant="warning">
          <AlertDescription>
            As provisões marcadas como "desativadas" serão removidas do cálculo da folha salarial.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}