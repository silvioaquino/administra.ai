// src/lib/planejamento/indicadoresResumo.ts
// Fonte única do resumo de indicadores financeiros (usada pela API
// /api/planejamento/indicadores-resumo e pelo motor de alertas).
import { prisma } from "@/lib/prisma"
import { calcularIndicadores } from "@/lib/planejamento/calcularIndicadores"
import { garantirFolhaAno } from "@/lib/folha"

interface DespesasVariaveisDados {
  maquininhas?: Array<{ id?: string; nome?: string; taxaDebito: number; taxaCredito: number; aluguel: number; ativo: boolean }>
  distribuicaoVendas?: { debito: number; credito: number; voucher: number }
  taxaVoucher?: number
  simplesNacional?: number
  manutencao?: number
}

interface ConfigMaquininhas {
  maquininhas: Array<{ taxaDebito: number; taxaCredito: number; aluguel: number; ativo: boolean }>
  distribuicaoVendas: { debito: number; credito: number; voucher: number }
  outrasTaxas: { voucher: number; simplesNacional: number; manutencao: number }
}

export interface IndicadoresResumo {
  metaFaltando: boolean
  despesasFixas: Array<{ nome: string; valor: number }>
  despesasVariaveisPct: number
  despesasVariaveisBase: number
  totalDespesasVariaveis: number
  metaMensalTotal: number
  cmv: number | null
  pctFixas: number
  markUp: number | null
  lucroDesejado: number
  folhaEncargosPercentual: number
}

export async function obterIndicadoresResumo(
  empresaId: string,
  userId: string,
  ano: number
): Promise<IndicadoresResumo> {
  const mesAtual = new Date().getMonth() + 1

  const metaAtual = await prisma.planejamentoFaturamentoNovo.findFirst({
    where: { empresaId, userId, ano, mes: mesAtual },
  })

  const metaDefinida = !!metaAtual && (Number(metaAtual.metaTotal) || 0) > 0
  const metaMensalTotal = metaDefinida ? Number(metaAtual!.metaTotal) : 0

  const lucroConfig = await prisma.planejamentoConfig.findFirst({
    where: { userId, tipo: "lucro_desejado", anoReferencia: ano },
  })
  const lucroDesejado = (lucroConfig?.dados as { lucroDesejado?: number } | null)?.lucroDesejado ?? 15

  const despesasFixasNova = await prisma.planejamentoDespesaFixaNovo.findMany({
    where: { userId, empresaId, ano },
    orderBy: { nome: "asc" },
  })

  let despesasFixas: Array<{ nome: string; valor: number }> = []

  if (despesasFixasNova.length > 0) {
    despesasFixas = despesasFixasNova.map(d => ({ nome: d.nome, valor: Number(d.valor) }))
  } else {
    const despesasFixasDb = await prisma.despesaFixa.findMany({
      where: { userId, empresaId },
      orderBy: { nome: "asc" },
    })

    if (despesasFixasDb.length > 0) {
      despesasFixas = despesasFixasDb.map(d => ({ nome: d.nome, valor: Number(d.valor) }))
    } else {
      const configFixas = await prisma.planejamentoConfig.findFirst({
        where: { empresaId, userId, tipo: "despesas_fixas", anoReferencia: ano },
      })
      despesasFixas = (configFixas?.dados as Array<{ nome: string; valor: number }>) || []
    }
  }

  await garantirFolhaAno(empresaId, userId, ano)
  const folha =
    (await prisma.planejamentoFolhaSalarial.findUnique({
      where: {
        empresaId_userId_anoReferencia_mes: { empresaId, userId, anoReferencia: ano, mes: mesAtual },
      },
    })) ||
    (await prisma.planejamentoFolhaSalarial.findFirst({
      where: { empresaId, userId, anoReferencia: ano },
      orderBy: { mes: "asc" },
    }))

  const totalSalarios = Number(folha?.totalSalarios) || 0
  const encargosFolha =
    (Number(folha?.totalDecimo) || 0) +
    (Number(folha?.totalFerias) || 0) +
    (Number(folha?.totalFgts) || 0) +
    (Number(folha?.totalInss) || 0) +
    (Number(folha?.totalInssPatronal) || 0)

  const dvConfig = await prisma.planejamentoConfig.findFirst({
    where: { userId, tipo: "despesas_variaveis", anoReferencia: ano },
  })
  const dvDados = (dvConfig?.dados as DespesasVariaveisDados) || {}
  const configMaquininhas: ConfigMaquininhas = dvConfig?.dados
    ? {
        maquininhas: dvDados.maquininhas || [],
        distribuicaoVendas: dvDados.distribuicaoVendas || { debito: 40, credito: 50, voucher: 10 },
        outrasTaxas: {
          voucher: dvDados.taxaVoucher ?? 7.0,
          simplesNacional: dvDados.simplesNacional ?? 0,
          manutencao: dvDados.manutencao ?? 0,
        },
      }
    : {
        maquininhas: [
          { taxaDebito: 1.37, taxaCredito: 3.15, aluguel: 0, ativo: true },
          { taxaDebito: 2.34, taxaCredito: 6.44, aluguel: 79.8, ativo: true },
          { taxaDebito: 4.48, taxaCredito: 5.78, aluguel: 0, ativo: true },
        ],
        distribuicaoVendas: { debito: 40, credito: 50, voucher: 10 },
        outrasTaxas: { voucher: 7.0, simplesNacional: 8.0, manutencao: 1.0 },
      }

  const faturamentoBase = metaDefinida
    ? Number(metaAtual!.metaTotal) ||
      Number(metaAtual!.metaDiaria ?? 0) * Number(metaAtual!.diasTrabalhados ?? 26)
    : 0

  const resultado = calcularIndicadores({
    metaMensalTotal,
    lucroDesejado,
    despesasFixas,
    totalSalarios,
    encargosFolha,
    maquininhas: configMaquininhas.maquininhas,
    distribuicaoVendas: configMaquininhas.distribuicaoVendas,
    outrasTaxas: configMaquininhas.outrasTaxas,
    faturamentoBase,
  })

  return {
    metaFaltando: resultado.metaFaltando,
    despesasFixas: resultado.despesasFixas,
    despesasVariaveisPct: resultado.despesasVariaveisPct,
    despesasVariaveisBase: resultado.despesasVariaveisBase,
    totalDespesasVariaveis: resultado.totalDespesasVariaveis,
    metaMensalTotal: resultado.metaMensalTotal,
    cmv: resultado.cmv,
    pctFixas: resultado.pctFixas,
    markUp: resultado.markUp,
    lucroDesejado: resultado.lucroDesejado,
    folhaEncargosPercentual: resultado.folhaEncargosPercentual,
  }
}
