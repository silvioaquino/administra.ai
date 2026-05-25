// src/app/(dashboard)/planejamento/configuracoes/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Save, Plus, Trash2, RefreshCw, CreditCard, Percent, Users, Calendar, Settings } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatCurrency, formatPercentage } from "@/lib/utils"

// Tipos
interface DespesaFixa {
  nome: string
  valor: number
}

interface Funcionario {
  nome: string
  salario: number
}

interface MetaMensal {
  mes: number
  metaDiariaAlmoco: number
  metaDiariaJanta: number
  diasTrabalhados: number
  lucroDesejado: number
}

interface TaxasConfig {
  distribuicaoVendas: { debito: number; credito: number; voucher: number }
  distribuicaoMaquininhas: { infinitepay: number; stone: number; caixa: number }
  taxas: {
    debito: { infinitepay: number; stone: number; caixa: number }
    credito: { infinitepay: number; stone: number; caixa: number }
    voucher: number
  }
  aluguelMaquininhas: { stone1: number; stone2: number }
  manutencao: number
  simplesNacional: number
}

interface ProvisaoFuncionario {
  funcionarioNome: string
  provisao: string
  ativo: boolean
}

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

const PROVISOES_CONFIG = [
  { key: "decimo_terceiro", nome: "13º Salário", percentual: 1/12, descricao: "Provisão mensal do 13º salário (salário / 12)" },
  { key: "ferias", nome: "Férias + 1/3", percentual: 1.3333/12, descricao: "Provisão mensal de férias acrescidas de 1/3 constitucional" },
  { key: "fgts", nome: "FGTS (8%)", percentual: 0.08, descricao: "Fundo de Garantia por Tempo de Serviço - 8% sobre o salário" },
  { key: "inss_patronal", nome: "INSS Patronal (20%)", percentual: 0.20, descricao: "Contribuição patronal do INSS - 20% sobre o salário" }
]

const DESPESAS_FIXAS_PADRAO: DespesaFixa[] = [
  { nome: "ALUGUEL", valor: 1200 }, { nome: "CELPE", valor: 700 }, { nome: "COMPESA", valor: 310 },
  { nome: "TELEFONE", valor: 112 }, { nome: "INTERNET", valor: 70 }, { nome: "CONTABILIDADE", valor: 350 },
  { nome: "SOFTWARE GESTAO", valor: 144.4 }, { nome: "MANUT. BANCOS", valor: 99 }, { nome: "PASSAGEM FUNCIN.", valor: 635 },
  { nome: "INSS", valor: 446 }, { nome: "MERCANTIL", valor: 200 }, { nome: "MAQUINETAS", valor: 120 },
  { nome: "CARRO", valor: 0 }, { nome: "COMBUSTIVEL", valor: 200 }, { nome: "BOMBEIROS", valor: 30 },
  { nome: "IPTU", valor: 150 }, { nome: "ANOTAI", valor: 0 }, { nome: "GAS", valor: 1330 },
  { nome: "CELULAR", valor: 20 }, { nome: "PRO-LABORE", valor: 1500 }
]

const FUNCIONARIOS_PADRAO: Funcionario[] = [
  { nome: "Sandra", salario: 1302 }, { nome: "Lene", salario: 1302 },
  { nome: "Marilia", salario: 1302 }, { nome: "Meiry", salario: 1500 }, { nome: "Diarista", salario: 1920 }
]

export default function ConfiguracoesPlanejamentoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabInicial = searchParams.get("tab") || "fixas"
  
  const [anoReferencia] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Estados
  const [despesasFixas, setDespesasFixas] = useState<DespesaFixa[]>(DESPESAS_FIXAS_PADRAO)
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>(FUNCIONARIOS_PADRAO)
  const [metas, setMetas] = useState<MetaMensal[]>([])
  const [taxasConfig, setTaxasConfig] = useState<TaxasConfig>({
    distribuicaoVendas: { debito: 40, credito: 50, voucher: 10 },
    distribuicaoMaquininhas: { infinitepay: 50, stone: 30, caixa: 20 },
    taxas: {
      debito: { infinitepay: 1.37, stone: 2.34, caixa: 4.48 },
      credito: { infinitepay: 3.15, stone: 6.44, caixa: 5.78 },
      voucher: 7.0
    },
    aluguelMaquininhas: { stone1: 59.90, stone2: 19.90 },
    manutencao: 1.0,
    simplesNacional: 8.0
  })
  const [provisoesFuncionarios, setProvisoesFuncionarios] = useState<ProvisaoFuncionario[]>([])
  const [provisoesAtivas, setProvisoesAtivas] = useState({
    decimo_terceiro: true,
    ferias: true,
    fgts: true,
    inss_patronal: true
  })
  const [resultadosTaxas, setResultadosTaxas] = useState({
    debitoMedia: 0,
    creditoMedia: 0,
    taxaMediaGeral: 0,
    aluguelTotal: 0,
    percentualAluguel: 0,
    totalDespesasVariaveis: 0
  })

  useEffect(() => {
    carregarTodosDados()
  }, [anoReferencia])

  async function carregarTodosDados() {
    setLoading(true)
    try {
      await Promise.all([
        carregarDespesasFixas(),
        carregarFuncionarios(),
        carregarMetas(),
        carregarTaxasCartao(),
        carregarProvisoes()
      ])
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    } finally {
      setLoading(false)
    }
  }

  async function carregarDespesasFixas() {
    try {
      const response = await fetch(`/api/planejamento/despesas-fixas?ano=${anoReferencia}`)
      const data = await response.json()
      if (data.success && data.dados && data.dados.length > 0) {
        setDespesasFixas(data.dados)
      }
    } catch (error) {
      console.error("Erro:", error)
    }
  }

  async function carregarFuncionarios() {
    try {
      const response = await fetch(`/api/planejamento/funcionarios?ano=${anoReferencia}`)
      const data = await response.json()
      if (data.success && data.dados && data.dados.length > 0) {
        setFuncionarios(data.dados)
      }
    } catch (error) {
      console.error("Erro:", error)
    }
  }

  async function carregarMetas() {
    try {
      const response = await fetch(`/api/planejamento/metas?ano=${anoReferencia}`)
      const data = await response.json()
      if (data.success && data.metas) {
        setMetas(data.metas)
      } else {
        const metasPadrao: MetaMensal[] = []
        for (let i = 1; i <= 12; i++) {
          metasPadrao.push({ mes: i, metaDiariaAlmoco: 0, metaDiariaJanta: 0, diasTrabalhados: 26, lucroDesejado: 15 })
        }
        setMetas(metasPadrao)
      }
    } catch (error) {
      console.error("Erro:", error)
    }
  }

  async function carregarTaxasCartao() {
    try {
      const response = await fetch("/api/planejamento/taxas-cartao")
      const data = await response.json()
      if (data.success && data.config) {
        setTaxasConfig(data.config)
        calcularTaxas(data.config)
      }
    } catch (error) {
      console.error("Erro:", error)
    }
  }

  async function carregarProvisoes() {
    try {
      const response = await fetch(`/api/planejamento/provisoes-funcionarios?ano=${anoReferencia}`)
      const data = await response.json()
      if (data.success && data.dados) {
        setProvisoesFuncionarios(data.dados)
      }
    } catch (error) {
      console.error("Erro:", error)
    }
  }

  function calcularTaxas(config: TaxasConfig) {
    let taxaDebitoMedia = 0
    for (const [maquina, percentual] of Object.entries(config.distribuicaoMaquininhas)) {
      taxaDebitoMedia += config.taxas.debito[maquina as keyof typeof config.taxas.debito] * (percentual / 100)
    }

    let taxaCreditoMedia = 0
    for (const [maquina, percentual] of Object.entries(config.distribuicaoMaquininhas)) {
      taxaCreditoMedia += config.taxas.credito[maquina as keyof typeof config.taxas.credito] * (percentual / 100)
    }

    const percDebito = config.distribuicaoVendas.debito / 100
    const percCredito = config.distribuicaoVendas.credito / 100
    const percVoucher = config.distribuicaoVendas.voucher / 100
    const taxaMediaGeral = (taxaDebitoMedia * percDebito) + (taxaCreditoMedia * percCredito) + (config.taxas.voucher * percVoucher)

    const aluguelTotal = config.aluguelMaquininhas.stone1 + config.aluguelMaquininhas.stone2
    const percentualAluguel = (aluguelTotal / 30000) * 100
    const totalDespesasVariaveis = config.simplesNacional + taxaMediaGeral + config.manutencao + percentualAluguel

    setResultadosTaxas({
      debitoMedia: taxaDebitoMedia,
      creditoMedia: taxaCreditoMedia,
      taxaMediaGeral: taxaMediaGeral,
      aluguelTotal: aluguelTotal,
      percentualAluguel: percentualAluguel,
      totalDespesasVariaveis: totalDespesasVariaveis
    })
  }

  async function salvarDespesasFixas() {
    const response = await fetch("/api/planejamento/despesas-fixas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dados: despesasFixas, ano: anoReferencia })
    })
    return response.json()
  }

  async function salvarFuncionarios() {
    const response = await fetch("/api/planejamento/funcionarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dados: funcionarios, ano: anoReferencia })
    })
    return response.json()
  }

  async function salvarMetas() {
    const response = await fetch("/api/planejamento/metas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ano: anoReferencia, metas })
    })
    return response.json()
  }

  async function salvarTaxasCartao() {
    const response = await fetch("/api/planejamento/taxas-cartao", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(taxasConfig)
    })
    return response.json()
  }

  async function salvarProvisoes() {
    const response = await fetch("/api/planejamento/provisoes-funcionarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dados: provisoesFuncionarios, ano: anoReferencia })
    })
    return response.json()
  }

  async function salvarTudo() {
    setSaving(true)
    try {
      await Promise.all([
        salvarDespesasFixas(),
        salvarFuncionarios(),
        salvarMetas(),
        salvarTaxasCartao(),
        salvarProvisoes()
      ])
      alert("✅ Todas as configurações foram salvas com sucesso!")
      router.push("/planejamento")
    } catch (error) {
      console.error("Erro ao salvar:", error)
      alert("❌ Erro ao salvar configurações")
    } finally {
      setSaving(false)
    }
  }

  function resetarDespesasFixas() {
    if (confirm("Tem certeza que deseja restaurar as despesas fixas padrão?")) {
      setDespesasFixas([...DESPESAS_FIXAS_PADRAO])
    }
  }

  function resetarFuncionarios() {
    if (confirm("Tem certeza que deseja restaurar a lista de funcionários padrão?")) {
      setFuncionarios([...FUNCIONARIOS_PADRAO])
    }
  }

  function adicionarDespesaFixa() {
    setDespesasFixas([...despesasFixas, { nome: "Nova Despesa", valor: 0 }])
  }

  function removerDespesaFixa(index: number) {
    if (despesasFixas.length <= 1) {
      alert("Mantenha pelo menos uma despesa fixa cadastrada!")
      return
    }
    const novas = [...despesasFixas]
    novas.splice(index, 1)
    setDespesasFixas(novas)
  }

  function atualizarDespesaFixa(index: number, campo: keyof DespesaFixa, valor: string | number) {
    const novas = [...despesasFixas]
    if (campo === "valor") {
      novas[index].valor = Number(valor) || 0
    } else {
      novas[index].nome = valor as string
    }
    setDespesasFixas(novas)
  }

  function adicionarFuncionario() {
    setFuncionarios([...funcionarios, { nome: "Novo Funcionário", salario: 1412 }])
  }

  function removerFuncionario(index: number) {
    if (funcionarios.length <= 1) {
      alert("Mantenha pelo menos um funcionário cadastrado!")
      return
    }
    const novas = [...funcionarios]
    novas.splice(index, 1)
    setFuncionarios(novas)
  }

  function atualizarFuncionario(index: number, campo: keyof Funcionario, valor: string | number) {
    const novas = [...funcionarios]
    if (campo === "salario") {
      novas[index].salario = Number(valor) || 0
    } else {
      novas[index].nome = valor as string
    }
    setFuncionarios(novas)
  }

  function atualizarMeta(mes: number, campo: keyof MetaMensal, valor: number) {
    const novas = metas.map(m => m.mes === mes ? { ...m, [campo]: valor } : m)
    setMetas(novas)
  }

  function aplicarMetasParaTodosMeses() {
    const mesAtual = new Date().getMonth() + 1
    const metaAtual = metas.find(m => m.mes === mesAtual)
    if (metaAtual && confirm(`Aplicar valores do mês atual (${MESES[mesAtual-1]}) para todos os meses?`)) {
      const novas = metas.map(m => ({
        ...m,
        metaDiariaAlmoco: metaAtual.metaDiariaAlmoco,
        metaDiariaJanta: metaAtual.metaDiariaJanta,
        diasTrabalhados: metaAtual.diasTrabalhados,
        lucroDesejado: metaAtual.lucroDesejado
      }))
      setMetas(novas)
    }
  }

  function atualizarTaxasConfig(path: string, value: number) {
    const partes = path.split(".")
    const novoEstado = { ...taxasConfig }
    let atual: any = novoEstado
    for (let i = 0; i < partes.length - 1; i++) {
      atual = atual[partes[i]]
    }
    atual[partes[partes.length - 1]] = value
    setTaxasConfig(novoEstado)
    calcularTaxas(novoEstado)
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

  function getProvisaoStatus(funcionarioNome: string, provisaoKey: string): boolean {
    const found = provisoesFuncionarios.find(
      p => p.funcionarioNome === funcionarioNome && p.provisao === provisaoKey
    )
    return found ? found.ativo : true
  }

  const totalDespesasFixas = despesasFixas.reduce((s, d) => s + d.valor, 0)
  const totalSalarios = funcionarios.reduce((s, f) => s + f.salario, 0)

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
</div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Configurações do Planejamento</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie despesas fixas, variáveis, funcionários, metas e taxas
            </p>
          </div>
        </div>
        <Button onClick={salvarTudo} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Salvando..." : "Salvar Todas Configurações"}
        </Button>
      </div>

      <Tabs defaultValue={tabInicial} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="fixas" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Despesas Fixas
          </TabsTrigger>
          <TabsTrigger value="funcionarios" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Funcionários
          </TabsTrigger>
          <TabsTrigger value="metas" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Metas Mensais
          </TabsTrigger>
          <TabsTrigger value="taxas" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Taxas de Cartão
          </TabsTrigger>
          <TabsTrigger value="provisoes" className="flex items-center gap-2">
            <Percent className="h-4 w-4" />
            Provisões
          </TabsTrigger>
        </TabsList>

        {/* Tab Despesas Fixas */}
        <TabsContent value="fixas">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Despesas Fixas</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={resetarDespesasFixas}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Restaurar Padrão
                </Button>
                <Button variant="outline" size="sm" onClick={adicionarDespesaFixa}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <AlertDescription>
                  Despesas fixas são custos que não variam com o faturamento.
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
                    {despesasFixas.map((desp, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="px-3 py-2">
                          <Input
                            value={desp.nome}
                            onChange={(e) => atualizarDespesaFixa(idx, "nome", e.target.value)}
                            className="h-8"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            step="10"
                            value={desp.valor}
                            onChange={(e) => atualizarDespesaFixa(idx, "valor", e.target.value)}
                            className="h-8 text-right"
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Button variant="ghost" size="sm" onClick={() => removerDespesaFixa(idx)} className="h-8 w-8 p-0">
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </td>
                      <tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t bg-gray-50">
                    <tr className="font-bold">
                      <td className="px-3 py-3">TOTAL</td>
                      <td className="px-3 py-3 text-right text-primary">{formatCurrency(totalDespesasFixas)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Funcionários */}
        <TabsContent value="funcionarios">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Funcionários</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={resetarFuncionarios}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Restaurar Padrão
                </Button>
                <Button variant="outline" size="sm" onClick={adicionarFuncionario}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <AlertDescription>
                  Configure os salários dos funcionários. As provisões (13º, férias, FGTS, INSS) são calculadas automaticamente.
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
                    {funcionarios.map((func, idx) => (
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
        </TabsContent>

        {/* Tab Metas Mensais */}
        <TabsContent value="metas">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Metas de Faturamento por Mês</CardTitle>
              <Button variant="outline" size="sm" onClick={aplicarMetasParaTodosMeses}>
                Aplicar a Todos os Meses
              </Button>
            </CardHeader>
            <CardContent>
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
                    {metas.map((meta) => {
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
                              suffix="%"
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot className="border-t bg-gray-50 font-bold">
                    <tr>
                      <td className="px-3 py-3">TOTAL ANUAL</td>
                      <td colSpan={5} className="px-3 py-3 text-right">
                        {formatCurrency(metas.reduce((acc, m) => 
                          acc + (m.metaDiariaAlmoco + m.metaDiariaJanta) * m.diasTrabalhados, 0
                        ))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Taxas de Cartão */}
        <TabsContent value="taxas">
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Distribuição das Vendas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Percent className="h-5 w-5" />
                    Distribuição das Vendas (%)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Débito</Label>
                    <Input
                      type="number"
                      step="1"
                      value={taxasConfig.distribuicaoVendas.debito}
                      onChange={(e) => atualizarTaxasConfig("distribuicaoVendas.debito", Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Crédito</Label>
                    <Input
                      type="number"
                      step="1"
                      value={taxasConfig.distribuicaoVendas.credito}
                      onChange={(e) => atualizarTaxasConfig("distribuicaoVendas.credito", Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Voucher</Label>
                    <Input
                      type="number"
                      step="1"
                      value={taxasConfig.distribuicaoVendas.voucher}
                      onChange={(e) => atualizarTaxasConfig("distribuicaoVendas.voucher", Number(e.target.value))}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Distribuição das Maquininhas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Distribuição entre Maquininhas (%)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>InfinitePay</Label>
                    <Input
                      type="number"
                      step="1"
                      value={taxasConfig.distribuicaoMaquininhas.infinitepay}
                      onChange={(e) => atualizarTaxasConfig("distribuicaoMaquininhas.infinitepay", Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Stone</Label>
                    <Input
                      type="number"
                      step="1"
                      value={taxasConfig.distribuicaoMaquininhas.stone}
                      onChange={(e) => atualizarTaxasConfig("distribuicaoMaquininhas.stone", Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Caixa</Label>
                    <Input
                      type="number"
                      step="1"
                      value={taxasConfig.distribuicaoMaquininhas.caixa}
                      onChange={(e) => atualizarTaxasConfig("distribuicaoMaquininhas.caixa", Number(e.target.value))}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Taxas Débito */}
              <Card>
                <CardHeader>
                  <CardTitle>Taxas Débito (%)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label>InfinitePay Débito</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={taxasConfig.taxas.debito.infinitepay}
                      onChange={(e) => atualizarTaxasConfig("taxas.debito.infinitepay", Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Stone Débito</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={taxasConfig.taxas.debito.stone}
                      onChange={(e) => atualizarTaxasConfig("taxas.debito.stone", Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Caixa Débito</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={taxasConfig.taxas.debito.caixa}
                      onChange={(e) => atualizarTaxasConfig("taxas.debito.caixa", Number(e.target.value))}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Taxas Crédito */}
              <Card>
                <CardHeader>
                  <CardTitle>Taxas Crédito (%)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label>InfinitePay Crédito</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={taxasConfig.taxas.credito.infinitepay}
                      onChange={(e) => atualizarTaxasConfig("taxas.credito.infinitepay", Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Stone Crédito</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={taxasConfig.taxas.credito.stone}
                      onChange={(e) => atualizarTaxasConfig("taxas.credito.stone", Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Caixa Crédito</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={taxasConfig.taxas.credito.caixa}
                      onChange={(e) => atualizarTaxasConfig("taxas.credito.caixa", Number(e.target.value))}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Outras Taxas e Aluguel */}
              <Card>
                <CardHeader>
                  <CardTitle>Outras Taxas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label>Taxa Voucher (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={taxasConfig.taxas.voucher}
                      onChange={(e) => atualizarTaxasConfig("taxas.voucher", Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Manutenção (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={taxasConfig.manutencao}
                      onChange={(e) => atualizarTaxasConfig("manutencao", Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Simples Nacional (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={taxasConfig.simplesNacional}
                      onChange={(e) => atualizarTaxasConfig("simplesNacional", Number(e.target.value))}
                    />
                  </div>
                  <div className="pt-2">
                    <Label>Aluguel Stone 1 (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={taxasConfig.aluguelMaquininhas.stone1}
                      onChange={(e) => atualizarTaxasConfig("aluguelMaquininhas.stone1", Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Aluguel Stone 2 (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={taxasConfig.aluguelMaquininhas.stone2}
                      onChange={(e) => atualizarTaxasConfig("aluguelMaquininhas.stone2", Number(e.target.value))}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Resultados */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-600">📈 RESULTADOS DOS CÁLCULOS</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-blue-50 p-2 text-center">
                      <p className="text-xs text-muted-foreground">Taxa Débito Média</p>
                      <p className="text-lg font-bold text-blue-600">{formatPercentage(resultadosTaxas.debitoMedia)}</p>
                    </div>
                    <div className="rounded-lg bg-blue-50 p-2 text-center">
                      <p className="text-xs text-muted-foreground">Taxa Crédito Média</p>
                      <p className="text-lg font-bold text-blue-600">{formatPercentage(resultadosTaxas.creditoMedia)}</p>
                    </div>
                    <div className="rounded-lg bg-yellow-50 p-2 text-center">
                      <p className="text-xs text-muted-foreground">Taxa Média Geral</p>
                      <p className="text-lg font-bold text-yellow-600">{formatPercentage(resultadosTaxas.taxaMediaGeral)}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-2 text-center">
                      <p className="text-xs text-muted-foreground">Aluguel Total</p>
                      <p className="text-lg font-bold text-gray-600">{formatCurrency(resultadosTaxas.aluguelTotal)}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-2 text-center">
                      <p className="text-xs text-muted-foreground">Aluguel % (base R$30k)</p>
                      <p className="text-lg font-bold text-gray-600">{formatPercentage(resultadosTaxas.percentualAluguel)}</p>
                    </div>
                    <div className="rounded-lg bg-green-50 p-2 text-center">
                      <p className="text-xs text-muted-foreground">🎯 TOTAL DESPESAS VARIÁVEIS</p>
                      <p className="text-lg font-bold text-green-600">{formatPercentage(resultadosTaxas.totalDespesasVariaveis)}</p>
                    </div>
                  </div>
                  <Alert className="mt-4" variant="info">
                    <AlertDescription>
                      Utilize este percentual nas Fichas Técnicas para calcular o preço de venda
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Tab Provisões */}
        <TabsContent value="provisoes">
          <Card>
            <CardHeader>
              <CardTitle>Configuração de Provisões da Folha</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <AlertDescription>
                  Para cada provisão, selecione se deseja incluir ou excluir do cálculo da folha salarial.
                </AlertDescription>
              </Alert>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Provisão</th>
                      <th className="px-3 py-2 text-left">Funcionário</th>
                      <th className="px-3 py-2 text-center">Ativo</th>
                      <th className="px-3 py-2 text-right">Impacto Mensal (R$)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {funcionarios.map((func) => (
                      PROVISOES_CONFIG.map((prov) => {
                        const isAtivo = getProvisaoStatus(func.nome, prov.key)
                        const valorMensal = func.salario * prov.percentual
                        return (
                          <tr key={`${func.nome}-${prov.key}`} className="border-b">
                            <td className="px-3 py-2 font-medium">{prov.nome}</td>
                            <td className="px-3 py-2">{func.nome}</td>
                            <td className="px-3 py-2 text-center">
                              <Switch
                                checked={isAtivo}
                                onCheckedChange={(checked) => toggleProvisaoFuncionario(func.nome, prov.key, checked)}
                              />
                            </td>
                            <td className="px-3 py-2 text-right">
                              <span className={isAtivo ? "text-green-600 font-medium" : "text-gray-400 line-through"}>
                                {formatCurrency(valorMensal)}
                              </span>
                            </td>
                          </tr>
                        )
                      })
                    ))}
                  </tbody>
                </table>
              </div>

              <Alert className="mt-4" variant="warning">
                <AlertDescription>
                  As provisões marcadas como "desativadas" serão removidas do cálculo da folha salarial.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}