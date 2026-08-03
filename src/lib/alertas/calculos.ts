// src/lib/alertas/calculos.ts
// Funções PURAS de cálculo de alertas — sem acesso a banco, testáveis.
// Cada função devolve os alertas de uma categoria.
import type { Alerta } from "./tipos"

const brl = (valor: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor)

/** Quantidade mínima considerada aceitável no estoque de um insumo. */
export const ESTOQUE_MINIMO_PADRAO = 1

/** Tolerância (%) entre o valor da NF-e e a soma dos produtos. */
export const TOLERANCIA_NFE_PCT = 1

// ---------------------------------------------------------------- FINANCEIRO

export interface EntradaFinanceira {
  contasVencidas: number
  contasAVencer: number
  boletosProximos: Array<{ id: number; numeroDocumento: string; valor: number; dataVencimento: string }>
  totalReceitas: number
  totalDespesas: number
  margem: number
  lucroDesejado: number
  faturamentoRealizado: number
  metaFaturamento: number
  saldoCaixa: number | null
  despesasFixasRealizadas: number
  despesasFixasPlanejadas: number
  vendasHoje: number
  indicadores: {
    pctFixas: number
    despesasVariaveisPct: number
    cmv: number | null
  }
}

export function calcularAlertasFinanceiros(dados: EntradaFinanceira): Alerta[] {
  const alertas: Alerta[] = []
  const saldo = dados.totalReceitas - dados.totalDespesas

  if (dados.contasVencidas > 0) {
    const plural = dados.contasVencidas > 1
    alertas.push({
      id: "contas-vencidas",
      categoria: "financeiro",
      severidade: "CRITICO",
      titulo: `${dados.contasVencidas} conta${plural ? "s" : ""} vencida${plural ? "s" : ""}`,
      descricao: "Pagamentos pendentes com data anterior a hoje.",
      href: "/livro-diario",
    })
  }

  if (dados.contasAVencer > 0) {
    const plural = dados.contasAVencer > 1
    alertas.push({
      id: "contas-a-vencer",
      categoria: "financeiro",
      severidade: "ATENCAO",
      titulo: `${dados.contasAVencer} conta${plural ? "s" : ""} a vencer em 7 dias`,
      descricao: "Programe o pagamento para não afetar o fluxo de caixa.",
      href: "/livro-diario",
    })
  }

  for (const boleto of dados.boletosProximos) {
    alertas.push({
      id: `boleto-${boleto.id}`,
      categoria: "financeiro",
      severidade: "CRITICO",
      titulo: `Boleto ${boleto.numeroDocumento} vence em breve`,
      descricao: `${brl(boleto.valor)} com vencimento em ${new Date(boleto.dataVencimento).toLocaleDateString("pt-BR")}.`,
      href: "/livro-diario",
    })
  }

  if (saldo < 0) {
    alertas.push({
      id: "saldo-negativo",
      categoria: "financeiro",
      severidade: "CRITICO",
      titulo: "Situação crítica no resultado",
      descricao: `Despesas superam receitas em ${brl(Math.abs(saldo))}.`,
      href: "/fluxo-caixa",
    })
  }

  if (dados.saldoCaixa != null && dados.saldoCaixa < 0) {
    alertas.push({
      id: "caixa-negativo",
      categoria: "financeiro",
      severidade: "CRITICO",
      titulo: "Caixa negativo",
      descricao: `O saldo do caixa está em ${brl(dados.saldoCaixa)}. Verifique o fluxo de caixa.`,
      href: "/caixa",
    })
  }

  const alvo = dados.lucroDesejado
  if (dados.totalReceitas > 0) {
    if (dados.margem < alvo) {
      alertas.push({
        id: "margem-baixa",
        categoria: "financeiro",
        indicador: "margem",
        severidade: dados.margem < alvo / 2 ? "CRITICO" : "ATENCAO",
        titulo: `Margem de lucro em ${dados.margem.toFixed(1)}%`,
        descricao: `Abaixo do lucro desejado de ${alvo.toFixed(1)}%. Reveja custos e preços.`,
        href: "/planejamento",
      })
    } else {
      alertas.push({
        id: "margem-saudavel",
        categoria: "financeiro",
        indicador: "margem",
        severidade: "SUCCESS",
        titulo: `Margem de lucro saudável (${dados.margem.toFixed(1)}%)`,
        descricao: `Acima do lucro desejado de ${alvo.toFixed(1)}%. Continue assim!`,
        href: "/planejamento",
      })
    }
  }

  if (dados.metaFaturamento > 0) {
    const pct = (dados.faturamentoRealizado / dados.metaFaturamento) * 100
    if (pct < 90) {
      alertas.push({
        id: "faturamento-abaixo-meta",
        categoria: "financeiro",
        indicador: "faturamento",
        severidade: pct < 70 ? "ATENCAO" : "INFO",
        titulo: `Faturamento ${(100 - pct).toFixed(0)}% abaixo da meta`,
        descricao: `Realizado ${brl(dados.faturamentoRealizado)} de ${brl(dados.metaFaturamento)} planejados.`,
        href: "/planejamento",
      })
    }
  }

  if (
    dados.despesasFixasPlanejadas > 0 &&
    dados.despesasFixasRealizadas > dados.despesasFixasPlanejadas * 1.1
  ) {
    const excesso =
      (dados.despesasFixasRealizadas / dados.despesasFixasPlanejadas - 1) * 100
    alertas.push({
      id: "despesas-fixas-acima",
      categoria: "financeiro",
      indicador: "fixas",
      severidade: "ATENCAO",
      titulo: `Despesas fixas ${excesso.toFixed(0)}% acima do planejado`,
      descricao: `Realizado ${brl(dados.despesasFixasRealizadas)} contra ${brl(dados.despesasFixasPlanejadas)} planejados.`,
      href: "/planejamento",
    })
  }

  if (dados.vendasHoje === 0) {
    alertas.push({
      id: "sem-vendas-hoje",
      categoria: "financeiro",
      severidade: "INFO",
      titulo: "Nenhuma venda registrada hoje",
      descricao: "Registre as vendas do dia para manter os números atualizados.",
      href: "/nfe/lancamento",
    })
  }

  // Indicadores (mesmas faixas do IndicadoresCard)
  const faixas: Array<{
    chave: "fixas" | "variaveis" | "cmv"
    nome: string
    valor: number | null
    min: number
    max: number
  }> = [
    { chave: "fixas", nome: "Despesas fixas", valor: dados.indicadores.pctFixas, min: 20, max: 35 },
    { chave: "variaveis", nome: "Despesas variáveis", valor: dados.indicadores.despesasVariaveisPct, min: 5, max: 20 },
    { chave: "cmv", nome: "CMV", valor: dados.indicadores.cmv, min: 30, max: 40 },
  ]

  for (const faixa of faixas) {
    if (faixa.valor == null || faixa.valor === 0) continue
    if (faixa.valor > faixa.max) {
      alertas.push({
        id: `indicador-${faixa.chave}-alto`,
        categoria: "financeiro",
        indicador: faixa.chave,
        severidade: "ATENCAO",
        titulo: `${faixa.nome} em ${faixa.valor.toFixed(1)}%`,
        descricao: `Acima da faixa ideal (${faixa.min}% a ${faixa.max}%).`,
        href: "/planejamento",
      })
    } else if (faixa.valor < faixa.min) {
      alertas.push({
        id: `indicador-${faixa.chave}-baixo`,
        categoria: "financeiro",
        indicador: faixa.chave,
        severidade: "INFO",
        titulo: `${faixa.nome} em ${faixa.valor.toFixed(1)}%`,
        descricao: `Abaixo da faixa ideal (${faixa.min}% a ${faixa.max}%). Confirme o planejamento.`,
        href: "/planejamento",
      })
    }
  }

  return alertas
}

// -------------------------------------------------------------------- FISCAL

export interface NotaResumo {
  id: number
  numero: number
  serie: number
  chaveAcesso: string
  cnpjEmitente: string
  nomeEmitente: string
  dataEmissao: string
  valorTotal: number
  somaProdutos: number
  qtdPagamentos: number
}

export function calcularAlertasFiscais(notas: NotaResumo[]): Alerta[] {
  const alertas: Alerta[] = []

  // 1. Duplicidade: mesma chave de acesso OU mesmo CNPJ + número/série
  const vistos = new Map<string, NotaResumo>()
  for (const nota of notas) {
    const chave = nota.chaveAcesso
      ? `chave:${nota.chaveAcesso.replace(/\D/g, "")}`
      : `nsc:${nota.cnpjEmitente.replace(/\D/g, "")}-${nota.numero}-${nota.serie}`
    const anterior = vistos.get(chave)
    if (anterior) {
      alertas.push({
        id: `nota-duplicada-${nota.id}`,
        categoria: "fiscal",
        severidade: "CRITICO",
        titulo: `Nota fiscal duplicada: nº ${nota.numero}`,
        descricao: `${nota.nomeEmitente} — a mesma nota aparece lançada mais de uma vez.`,
        href: "/nfe",
      })
    } else {
      vistos.set(chave, nota)
    }
  }

  for (const nota of notas) {
    // 2. Inconsistência de valores
    if (nota.valorTotal > 0 && nota.somaProdutos > 0) {
      const diff = Math.abs(nota.valorTotal - nota.somaProdutos)
      if ((diff / nota.valorTotal) * 100 > TOLERANCIA_NFE_PCT) {
        alertas.push({
          id: `nota-inconsistente-${nota.id}`,
          categoria: "fiscal",
          severidade: "ATENCAO",
          titulo: `Divergência na nota nº ${nota.numero}`,
          descricao: `Valor da nota ${brl(nota.valorTotal)} difere da soma dos produtos ${brl(nota.somaProdutos)}.`,
          href: "/nfe",
        })
      }
    }

    // 3. Nota sem forma de pagamento
    if (nota.qtdPagamentos === 0) {
      alertas.push({
        id: `nota-sem-pagamento-${nota.id}`,
        categoria: "fiscal",
        severidade: "INFO",
        titulo: `Nota nº ${nota.numero} sem forma de pagamento`,
        descricao: `${nota.nomeEmitente} — confira a importação/integração da nota.`,
        href: "/nfe",
      })
    }
  }

  return alertas
}

// ------------------------------------------------------------------- ESTOQUE

export interface ProdutoEstoque {
  id: number
  descricao: string
  quantidade: number
}

export function calcularAlertasEstoque(
  produtos: ProdutoEstoque[],
  limiteMinimo = ESTOQUE_MINIMO_PADRAO
): Alerta[] {
  const baixos = produtos.filter(p => p.quantidade < limiteMinimo)
  if (baixos.length === 0) return []

  const plural = baixos.length > 1
  return [
    {
      id: "estoque-baixo",
      categoria: "estoque",
      severidade: "ATENCAO",
      titulo: `${baixos.length} insumo${plural ? "s" : ""} com estoque baixo`,
      descricao: `Abaixo de ${limiteMinimo} unidade(s): ${baixos.slice(0, 3).map(p => p.descricao).join(", ")}${baixos.length > 3 ? "…" : ""}. Considere reabastecer.`,
      href: "/nfe/produtos",
    },
  ]
}

// --------------------------------------------------------------- OPERACIONAL

export interface EntradaOperacional {
  caixaAbertoHa: number | null // horas
  primeiroAcessoDoDia: boolean
}

export function calcularAlertasOperacionais(dados: EntradaOperacional): Alerta[] {
  const alertas: Alerta[] = []

  if (dados.caixaAbertoHa != null && dados.caixaAbertoHa >= 12) {
    alertas.push({
      id: "caixa-aberto",
      categoria: "operacional",
      severidade: "ATENCAO",
      titulo: "Caixa aberto há muito tempo",
      descricao: `O caixa está aberto há ${dados.caixaAbertoHa}h. Faça o fechamento diário.`,
      href: "/caixa",
    })
  }

  alertas.push({
    id: "dica-nfce",
    categoria: "operacional",
    severidade: "INFO",
    titulo: "Dica: use a leitura de NFC-e",
    descricao: "A importação por QR Code/XML agiliza o registro das compras.",
    href: "/nfe",
  })

  return alertas
}

// ------------------------------------------------------------------- PRODUTO

export interface EntradaProduto {
  produtosRevisao: number
  produtosSemCategoria: number
  fichasMargemBaixa: Array<{ id: string; nome: string; margem: number }>
  lucroDesejado: number
}

export function calcularAlertasProdutos(dados: EntradaProduto): Alerta[] {
  const alertas: Alerta[] = []

  if (dados.produtosRevisao > 0) {
    const plural = dados.produtosRevisao > 1
    alertas.push({
      id: "produtos-revisao",
      categoria: "produto",
      severidade: "INFO",
      titulo: `${dados.produtosRevisao} produto${plural ? "s" : ""} para revisar`,
      descricao: "A normalização automática pediu confirmação manual.",
      href: "/nfe/produtos",
    })
  }

  if (dados.produtosSemCategoria > 0) {
    const plural = dados.produtosSemCategoria > 1
    alertas.push({
      id: "produtos-sem-categoria",
      categoria: "produto",
      severidade: "INFO",
      titulo: `${dados.produtosSemCategoria} produto${plural ? "s" : ""} sem categoria`,
      descricao: "Categorize os produtos para melhorar relatórios e CMV.",
      href: "/nfe/produtos",
    })
  }

  for (const ficha of dados.fichasMargemBaixa) {
    alertas.push({
      id: `ficha-${ficha.id}`,
      categoria: "produto",
      severidade: ficha.margem < 0 ? "CRITICO" : "ATENCAO",
      titulo: `Margem baixa: ${ficha.nome}`,
      descricao: `Margem atual de ${ficha.margem.toFixed(1)}% (alvo ${dados.lucroDesejado.toFixed(1)}%).`,
      href: `/fichas-tecnicas/${ficha.id}/edit`,
    })
  }

  return alertas
}
