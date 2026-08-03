import { describe, it, expect } from "vitest"
import {
  calcularAlertasFinanceiros,
  calcularAlertasFiscais,
  calcularAlertasEstoque,
  calcularAlertasOperacionais,
  calcularAlertasProdutos,
  type EntradaFinanceira,
  type NotaResumo,
} from "@/lib/alertas/calculos"
import { ordenarAlertas } from "@/lib/alertas/tipos"

const baseFinanceiro: EntradaFinanceira = {
  contasVencidas: 0,
  contasAVencer: 0,
  boletosProximos: [],
  totalReceitas: 10000,
  totalDespesas: 5000,
  margem: 50,
  lucroDesejado: 15,
  faturamentoRealizado: 10000,
  metaFaturamento: 10000,
  saldoCaixa: 100,
  despesasFixasRealizadas: 1000,
  despesasFixasPlanejadas: 1000,
  vendasHoje: 5,
  indicadores: { pctFixas: 25, despesasVariaveisPct: 10, cmv: 35 },
}

const notaBase: NotaResumo = {
  id: 1,
  numero: 10,
  serie: 1,
  chaveAcesso: "1".repeat(44),
  cnpjEmitente: "12345678000199",
  nomeEmitente: "Fornecedor X",
  dataEmissao: new Date().toISOString(),
  valorTotal: 100,
  somaProdutos: 100,
  qtdPagamentos: 1,
}

describe("alertas financeiros", () => {
  it("não gera alertas críticos com dados saudáveis", () => {
    const alertas = calcularAlertasFinanceiros(baseFinanceiro)
    expect(alertas.some(a => a.severidade === "CRITICO")).toBe(false)
    expect(alertas.some(a => a.id === "margem-saudavel")).toBe(true)
  })

  it("marca contas vencidas como críticas", () => {
    const alertas = calcularAlertasFinanceiros({ ...baseFinanceiro, contasVencidas: 2 })
    const alerta = alertas.find(a => a.id === "contas-vencidas")
    expect(alerta?.severidade).toBe("CRITICO")
    expect(alerta?.titulo).toContain("2 contas vencidas")
  })

  it("alerta saldo e caixa negativos", () => {
    const alertas = calcularAlertasFinanceiros({
      ...baseFinanceiro,
      totalDespesas: 20000,
      saldoCaixa: -50,
    })
    expect(alertas.map(a => a.id)).toEqual(
      expect.arrayContaining(["saldo-negativo", "caixa-negativo"])
    )
  })

  it("classifica margem abaixo da metade do alvo como crítica", () => {
    const alertas = calcularAlertasFinanceiros({ ...baseFinanceiro, margem: 5 })
    expect(alertas.find(a => a.id === "margem-baixa")?.severidade).toBe("CRITICO")
  })

  it("aponta indicadores fora da faixa ideal", () => {
    const alertas = calcularAlertasFinanceiros({
      ...baseFinanceiro,
      indicadores: { pctFixas: 50, despesasVariaveisPct: 2, cmv: 60 },
    })
    expect(alertas.map(a => a.id)).toEqual(
      expect.arrayContaining([
        "indicador-fixas-alto",
        "indicador-variaveis-baixo",
        "indicador-cmv-alto",
      ])
    )
  })

  it("avisa quando não há vendas no dia", () => {
    const alertas = calcularAlertasFinanceiros({ ...baseFinanceiro, vendasHoje: 0 })
    expect(alertas.some(a => a.id === "sem-vendas-hoje")).toBe(true)
  })
})

describe("alertas fiscais", () => {
  it("detecta notas duplicadas pela chave de acesso", () => {
    const alertas = calcularAlertasFiscais([notaBase, { ...notaBase, id: 2 }])
    expect(alertas.filter(a => a.id.startsWith("nota-duplicada")).length).toBe(1)
  })

  it("detecta duplicidade por CNPJ + número + série quando não há chave", () => {
    const semChave = { ...notaBase, chaveAcesso: "" }
    const alertas = calcularAlertasFiscais([semChave, { ...semChave, id: 2 }])
    expect(alertas.some(a => a.id === "nota-duplicada-2")).toBe(true)
  })

  it("detecta divergência entre valor total e soma dos produtos", () => {
    const alertas = calcularAlertasFiscais([{ ...notaBase, somaProdutos: 80 }])
    expect(alertas.some(a => a.id === "nota-inconsistente-1")).toBe(true)
  })

  it("ignora divergências dentro da tolerância", () => {
    const alertas = calcularAlertasFiscais([{ ...notaBase, somaProdutos: 99.6 }])
    expect(alertas.some(a => a.id.startsWith("nota-inconsistente"))).toBe(false)
  })

  it("sinaliza nota sem forma de pagamento", () => {
    const alertas = calcularAlertasFiscais([{ ...notaBase, qtdPagamentos: 0 }])
    expect(alertas.some(a => a.id === "nota-sem-pagamento-1")).toBe(true)
  })
})

describe("alertas de estoque", () => {
  it("agrupa insumos abaixo do mínimo", () => {
    const alertas = calcularAlertasEstoque([
      { id: 1, descricao: "Farinha", quantidade: 0 },
      { id: 2, descricao: "Queijo", quantidade: 5 },
    ])
    expect(alertas).toHaveLength(1)
    expect(alertas[0].titulo).toContain("1 insumo")
  })

  it("não gera alerta quando o estoque está ok", () => {
    expect(calcularAlertasEstoque([{ id: 1, descricao: "Farinha", quantidade: 10 }])).toHaveLength(0)
  })
})

describe("alertas operacionais", () => {
  it("alerta caixa aberto há 12h ou mais", () => {
    const alertas = calcularAlertasOperacionais({ caixaAbertoHa: 14, primeiroAcessoDoDia: false })
    expect(alertas.some(a => a.id === "caixa-aberto")).toBe(true)
  })

  it("não alerta caixa recém-aberto", () => {
    const alertas = calcularAlertasOperacionais({ caixaAbertoHa: 2, primeiroAcessoDoDia: false })
    expect(alertas.some(a => a.id === "caixa-aberto")).toBe(false)
  })
})

describe("alertas de produtos", () => {
  it("lista fichas com margem baixa e produtos pendentes", () => {
    const alertas = calcularAlertasProdutos({
      produtosRevisao: 3,
      produtosSemCategoria: 2,
      fichasMargemBaixa: [{ id: "a", nome: "Pizza", margem: -5 }],
      lucroDesejado: 15,
    })
    expect(alertas.map(a => a.id)).toEqual(
      expect.arrayContaining(["produtos-revisao", "produtos-sem-categoria", "ficha-a"])
    )
    expect(alertas.find(a => a.id === "ficha-a")?.severidade).toBe("CRITICO")
  })
})

describe("ordenação", () => {
  it("coloca os mais graves primeiro", () => {
    const ordenados = ordenarAlertas([
      { id: "1", titulo: "", descricao: "", severidade: "INFO", categoria: "financeiro" },
      { id: "2", titulo: "", descricao: "", severidade: "CRITICO", categoria: "financeiro" },
      { id: "3", titulo: "", descricao: "", severidade: "ATENCAO", categoria: "financeiro" },
    ])
    expect(ordenados.map(a => a.id)).toEqual(["2", "3", "1"])
  })
})
