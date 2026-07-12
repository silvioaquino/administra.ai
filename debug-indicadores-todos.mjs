import fs from 'fs'
import { PrismaClient } from '@prisma/client'

const envText = fs.readFileSync('.env', 'utf8')
for (const line of envText.split('\n')) {
  const m = line.match(/^DATABASE_URL=(.*)$/)
  if (m) process.env.DATABASE_URL = m[1].trim()
}

const prisma = new PrismaClient()
const ano = new Date().getFullYear()
const mesAtual = new Date().getMonth() + 1

function calcularTotalDespesasVariaveis({ maquininhas, distribuicaoVendas, outrasTaxas, faturamentoBase, folhaSalarialTotalMensal = 0 }) {
  const maquininhasAtivas = maquininhas.filter((m) => m.ativo)
  const taxaDebitoMedia = maquininhasAtivas.length ? maquininhasAtivas.reduce((s, m) => s + (m.taxaDebito || 0), 0) / maquininhasAtivas.length : 0
  const taxaCreditoMedia = maquininhasAtivas.length ? maquininhasAtivas.reduce((s, m) => s + (m.taxaCredito || 0), 0) / maquininhasAtivas.length : 0
  const percDebito = (distribuicaoVendas.debito || 0) / 100
  const percCredito = (distribuicaoVendas.credito || 0) / 100
  const percVoucher = (distribuicaoVendas.voucher || 0) / 100
  const taxaVoucher = outrasTaxas.voucher || 7.0
  const taxaMediaGeral = taxaDebitoMedia * percDebito + taxaCreditoMedia * percCredito + taxaVoucher * percVoucher
  const aluguelTotal = maquininhasAtivas.reduce((s, m) => s + (m.aluguel || 0), 0)
  const percentualFolhaSalarial = faturamentoBase > 0 && folhaSalarialTotalMensal > 0 ? (folhaSalarialTotalMensal / faturamentoBase) * 100 : 0
  const base = (outrasTaxas.simplesNacional || 0) + taxaMediaGeral + (outrasTaxas.manutencao || 0)
  const total = base + percentualFolhaSalarial
  return { taxaMediaGeral, aluguelTotal, percentualFolhaSalarial, base, total }
}

async function calcularPara(userId, empresaId) {
  const metaAtual = await prisma.planejamentoFaturamentoNovo.findFirst({ where: { empresaId, userId, ano, mes: mesAtual } })
  const metaDefinida = !!metaAtual && (Number(metaAtual.metaTotal) || 0) > 0
  const metaMensalTotal = metaDefinida ? Number(metaAtual.metaTotal) : 0

  const lucroConfig = await prisma.planejamentoConfig.findFirst({ where: { userId, tipo: 'lucro_desejado', anoReferencia: ano } })
  const lucroDesejado = lucroConfig?.dados?.lucroDesejado ?? 15

  const despesasFixasNova = await prisma.planejamentoDespesaFixaNovo.findMany({ where: { userId, empresaId, ano } })
  let despesasFixas = []
  if (despesasFixasNova.length > 0) {
    despesasFixas = despesasFixasNova.map((d) => ({ nome: d.nome, valor: Number(d.valor) }))
  } else {
    const df = await prisma.despesaFixa.findMany({ where: { userId, empresaId } })
    if (df.length > 0) {
      despesasFixas = df.map((d) => ({ nome: d.nome, valor: Number(d.valor) }))
    } else {
      const cfg = await prisma.planejamentoConfig.findFirst({ where: { empresaId, userId, tipo: 'despesas_fixas', anoReferencia: ano } })
      despesasFixas = cfg?.dados || []
    }
  }

  const folha = await prisma.planejamentoFolhaSalarial.findUnique({ where: { empresaId_userId_anoReferencia: { empresaId, userId, anoReferencia: ano } } })
  const totalSalarios = Number(folha?.totalSalarios) || 0
  const encargosFolha = (Number(folha?.totalDecimo) || 0) + (Number(folha?.totalFerias) || 0) + (Number(folha?.totalFgts) || 0) + (Number(folha?.totalInss) || 0) + (Number(folha?.totalInssPatronal) || 0)

  const dvConfig = await prisma.planejamentoConfig.findFirst({ where: { userId, tipo: 'despesas_variaveis', anoReferencia: ano } })
  const dvResultado = await prisma.despesasVariaveisResultado.findFirst({ where: { userId, ano, mes: mesAtual } })
  const dvDados = dvConfig?.dados || {}
  const configMaquininhas = dvConfig?.dados
    ? {
        maquininhas: dvDados.maquininhas || [],
        distribuicaoVendas: dvDados.distribuicaoVendas || { debito: 40, credito: 50, voucher: 10 },
        outrasTaxas: { voucher: dvDados.taxaVoucher ?? 7.0, simplesNacional: dvDados.simplesNacional ?? 0, manutencao: dvDados.manutencao ?? 0 }
      }
    : { maquininhas: [], distribuicaoVendas: { debito: 40, credito: 50, voucher: 10 }, outrasTaxas: { voucher: 7.0, simplesNacional: 8.0, manutencao: 1.0 } }

  const aluguelMaquininhas = configMaquininhas.maquininhas.filter((m) => m.ativo).reduce((s, m) => s + (m.aluguel || 0), 0)
  const totalFixas = despesasFixas.reduce((s, d) => s + Number(d.valor || 0), 0)
  const totalDespesasFixas = totalFixas + aluguelMaquininhas + totalSalarios
  const pctFixas = metaMensalTotal > 0 ? (totalDespesasFixas / metaMensalTotal) * 100 : 0
  const faturamentoBase = dvResultado?.faturamentoBase != null ? Number(dvResultado.faturamentoBase) : metaMensalTotal
  const calculoDV = calcularTotalDespesasVariaveis({ maquininhas: configMaquininhas.maquininhas, distribuicaoVendas: configMaquininhas.distribuicaoVendas, outrasTaxas: configMaquininhas.outrasTaxas, faturamentoBase, folhaSalarialTotalMensal: encargosFolha })
  const despesasVariaveisPct = calculoDV.total
  const despesasVariaveisBase = calculoDV.base
  const cmv = metaDefinida ? Math.max(0, 100 - (pctFixas + despesasVariaveisPct + lucroDesejado)) : null
  const markUp = metaDefinida && cmv !== null && cmv > 0 ? 100 / cmv : null

  return {
    userId,
    empresaId,
    metaFaltando: !metaDefinida,
    metaMensalTotal: Number(metaMensalTotal.toFixed(2)),
    lucroDesejado,
    pctFixas: Number(pctFixas.toFixed(4)),
    despesasVariaveisPct: Number(despesasVariaveisPct.toFixed(4)),
    despesasVariaveisBase: Number(despesasVariaveisBase.toFixed(4)),
    cmv: cmv === null ? null : Number(cmv.toFixed(4)),
    markUp: markUp === null ? null : Number(markUp.toFixed(4)),
    _fixas: { totalFixas: Number(totalFixas.toFixed(2)), aluguel: Number(aluguelMaquininhas.toFixed(2)), salarios: Number(totalSalarios.toFixed(2)) },
  }
}

const configs = await prisma.planejamentoConfig.findMany({
  distinct: ['userId', 'empresaId'],
  select: { userId: true, empresaId: true },
})
console.log(`Ano=${ano} Mes=${mesAtual} — ${configs.length} usuário(s) com planejamentoConfig\n`)
for (const c of configs) {
  const r = await calcularPara(c.userId, c.empresaId)
  console.log(JSON.stringify(r))
}

await prisma.$disconnect()
