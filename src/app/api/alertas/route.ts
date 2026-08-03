import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { obterIndicadoresResumo } from "@/lib/planejamento/indicadoresResumo"
import {
  calcularAlertasFinanceiros,
  calcularAlertasFiscais,
  calcularAlertasEstoque,
  calcularAlertasOperacionais,
  calcularAlertasProdutos,
  type NotaResumo,
} from "@/lib/alertas/calculos"
import { ordenarAlertas, type Alerta } from "@/lib/alertas/tipos"

export type { Alerta } from "@/lib/alertas/tipos"

/**
 * GET /api/alertas — fonte única de verdade dos alertas do sistema.
 *
 * Retorna { success, data: Alerta[] } com todas as categorias:
 * financeiro, fiscal, estoque, operacional e produto.
 * Consumido por NotificationsBell, Dashboard e IndicadoresCard.
 */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }
  const userId = session.user.id
  const empresaId = session.user.empresaId
  if (!empresaId) {
    return NextResponse.json({ error: "Empresa não encontrada" }, { status: 401 })
  }

  const hoje = new Date()
  const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
  const fimHoje = new Date(inicioHoje.getTime() + 24 * 60 * 60 * 1000)
  const em3dias = new Date(inicioHoje.getTime() + 3 * 24 * 60 * 60 * 1000)
  const em7dias = new Date(inicioHoje.getTime() + 7 * 24 * 60 * 60 * 1000)
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1)
  const ano = hoje.getFullYear()
  const desde90dias = new Date(inicioHoje.getTime() - 90 * 24 * 60 * 60 * 1000)

  try {
    const [
      vencidos,
      aVencer,
      boletosProximos,
      totaisMes,
      lancamentosMes,
      vendasHoje,
      caixaAberto,
      produtosRevisao,
      produtosSemCategoria,
      produtosEstoque,
      fichas,
      notas,
      indicadores,
    ] = await Promise.all([
      prisma.livroDiario.count({
        where: { empresaId, status: "PENDENTE", saida: { gt: 0 }, data: { lt: inicioHoje } },
      }),
      prisma.livroDiario.count({
        where: {
          empresaId,
          status: "PENDENTE",
          saida: { gt: 0 },
          data: { gte: inicioHoje, lte: em7dias },
        },
      }),
      prisma.boleto.findMany({
        where: { empresaId, status: "PENDENTE", dataVencimento: { lte: em3dias } },
        select: { id: true, numeroDocumento: true, valor: true, dataVencimento: true },
        orderBy: { dataVencimento: "asc" },
        take: 5,
      }),
      prisma.livroDiario.aggregate({
        where: { empresaId, data: { gte: inicioMes, lt: fimMes } },
        _sum: { entrada: true, saida: true },
      }),
      prisma.livroDiario.findMany({
        where: { empresaId, data: { gte: inicioMes, lt: fimMes }, saida: { gt: 0 } },
        select: { conta: true, saida: true },
      }),
      prisma.livroDiario.count({
        where: { empresaId, data: { gte: inicioHoje, lt: fimHoje }, entrada: { gt: 0 } },
      }),
      prisma.caixaAbertura.findFirst({
        where: { empresaId, status: "ABERTO" },
        select: {
          id: true,
          dataAbertura: true,
          valorInicial: true,
          vendas: { select: { valorTotal: true } },
          vendasManuais: { select: { valor: true } },
          retiradas: { select: { valor: true } },
        },
        orderBy: { dataAbertura: "desc" },
      }),
      prisma.produto.count({ where: { empresaId, precisaRevisao: true } }),
      prisma.produto.count({
        where: {
          empresaId,
          OR: [{ categoriaSugestao: null }, { categoriaSugestao: "" }],
        },
      }),
      prisma.produto.findMany({
        where: { empresaId, quantidade: { not: null } },
        select: { id: true, descricao: true, quantidade: true },
        orderBy: { quantidade: "asc" },
        take: 20,
      }),
      prisma.fichaTecnica.findMany({
        where: { empresaId },
        select: { id: true, nome: true, margem: true },
        orderBy: { margem: "asc" },
        take: 10,
      }),
      prisma.notaFiscal.findMany({
        where: { empresaId, dataEmissao: { gte: desde90dias } },
        select: {
          id: true,
          numero: true,
          serie: true,
          chaveAcesso: true,
          cnpjEmitente: true,
          nomeEmitente: true,
          dataEmissao: true,
          valorTotal: true,
          produtos: { select: { valorTotal: true } },
          _count: { select: { pagamentos: true } },
        },
        orderBy: { dataEmissao: "desc" },
        take: 100,
      }),
      obterIndicadoresResumo(empresaId, userId, ano).catch(() => null),
    ])

    const totalReceitas = Number(totaisMes._sum.entrada || 0)
    const totalDespesas = Number(totaisMes._sum.saida || 0)
    const margem = totalReceitas > 0 ? ((totalReceitas - totalDespesas) / totalReceitas) * 100 : 0
    const lucroDesejado = indicadores?.lucroDesejado ?? 15

    // Despesas fixas: planejado (indicadores) x realizado (lançamentos do mês
    // cuja conta bate com o nome de uma despesa fixa planejada).
    const nomesFixas = (indicadores?.despesasFixas ?? []).map(d => d.nome.toLowerCase())
    const despesasFixasPlanejadas = (indicadores?.despesasFixas ?? []).reduce(
      (soma, d) => soma + d.valor,
      0
    )
    const despesasFixasRealizadas = lancamentosMes
      .filter(l => nomesFixas.some(nome => l.conta.toLowerCase().includes(nome)))
      .reduce((soma, l) => soma + Number(l.saida), 0)

    const saldoCaixa = caixaAberto
      ? caixaAberto.valorInicial +
        caixaAberto.vendas.reduce((s, v) => s + v.valorTotal, 0) +
        caixaAberto.vendasManuais.reduce((s, v) => s + v.valor, 0) -
        caixaAberto.retiradas.reduce((s, r) => s + r.valor, 0)
      : null

    const caixaAbertoHa = caixaAberto
      ? Math.floor((Date.now() - new Date(caixaAberto.dataAbertura).getTime()) / (1000 * 60 * 60))
      : null

    const notasResumo: NotaResumo[] = notas.map(n => ({
      id: n.id,
      numero: n.numero,
      serie: n.serie,
      chaveAcesso: n.chaveAcesso,
      cnpjEmitente: n.cnpjEmitente,
      nomeEmitente: n.nomeEmitente,
      dataEmissao: n.dataEmissao.toISOString(),
      valorTotal: Number(n.valorTotal),
      somaProdutos: n.produtos.reduce((s, p) => s + Number(p.valorTotal || 0), 0),
      qtdPagamentos: n._count.pagamentos,
    }))

    const alertas: Alerta[] = ordenarAlertas([
      ...calcularAlertasFinanceiros({
        contasVencidas: vencidos,
        contasAVencer: aVencer,
        boletosProximos: boletosProximos.map(b => ({
          id: b.id,
          numeroDocumento: b.numeroDocumento,
          valor: Number(b.valor),
          dataVencimento: b.dataVencimento.toISOString(),
        })),
        totalReceitas,
        totalDespesas,
        margem,
        lucroDesejado,
        faturamentoRealizado: totalReceitas,
        metaFaturamento: indicadores?.metaMensalTotal ?? 0,
        saldoCaixa,
        despesasFixasRealizadas,
        despesasFixasPlanejadas,
        vendasHoje,
        indicadores: {
          pctFixas: indicadores?.pctFixas ?? 0,
          despesasVariaveisPct: indicadores?.despesasVariaveisPct ?? 0,
          cmv: indicadores?.cmv ?? null,
        },
      }),
      ...calcularAlertasFiscais(notasResumo),
      ...calcularAlertasEstoque(
        produtosEstoque.map(p => ({
          id: p.id,
          descricao: p.descricao,
          quantidade: Number(p.quantidade || 0),
        }))
      ),
      ...calcularAlertasOperacionais({ caixaAbertoHa, primeiroAcessoDoDia: vendasHoje === 0 }),
      ...calcularAlertasProdutos({
        produtosRevisao,
        produtosSemCategoria,
        fichasMargemBaixa: fichas
          .filter(f => Number(f.margem) < lucroDesejado)
          .map(f => ({ id: String(f.id), nome: f.nome, margem: Number(f.margem) })),
        lucroDesejado,
      }),
    ])

    return NextResponse.json(
      { success: true, data: alertas },
      { headers: { "Cache-Control": "private, max-age=60" } }
    )
  } catch (error) {
    console.error("Erro ao carregar alertas:", error)
    return NextResponse.json({ error: "Erro ao carregar alertas" }, { status: 500 })
  }
}
