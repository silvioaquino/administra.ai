import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export type Alerta = {
  id: string
  severidade: "CRITICO" | "ATENCAO" | "INFO"
  titulo: string
  descricao: string
  href: string
}

const MARGEM_ALVO = 15

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }
  const empresaId = session.user.empresaId
  if (!empresaId) {
    return NextResponse.json({ error: "Empresa não encontrada" }, { status: 401 })
  }

  const hoje = new Date()
  const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
  const em7dias = new Date(inicioHoje.getTime() + 7 * 24 * 60 * 60 * 1000)

  try {
    const [fichasBaixaMargem, vencidos, aVencer, caixaAberto, produtosRevisao] = await Promise.all([
      prisma.fichaTecnica.findMany({
        where: { empresaId, margem: { lt: MARGEM_ALVO } },
        select: { id: true, nome: true, margem: true },
        orderBy: { margem: "asc" },
        take: 5,
      }),
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
      prisma.caixaAbertura.findFirst({
        where: { empresaId, status: "ABERTO" },
        select: { id: true, dataAbertura: true },
        orderBy: { dataAbertura: "desc" },
      }),
      prisma.produto.count({ where: { empresaId, precisaRevisao: true } }),
    ])

    const alertas: Alerta[] = []

    if (vencidos > 0) {
      alertas.push({
        id: "contas-vencidas",
        severidade: "CRITICO",
        titulo: `${vencidos} conta${vencidos > 1 ? "s" : ""} vencida${vencidos > 1 ? "s" : ""}`,
        descricao: "Pagamentos pendentes com data anterior a hoje.",
        href: "/livro-diario",
      })
    }

    if (aVencer > 0) {
      alertas.push({
        id: "contas-a-vencer",
        severidade: "ATENCAO",
        titulo: `${aVencer} conta${aVencer > 1 ? "s" : ""} a vencer em 7 dias`,
        descricao: "Programe o pagamento para não afetar o fluxo de caixa.",
        href: "/livro-diario",
      })
    }

    for (const ficha of fichasBaixaMargem) {
      alertas.push({
        id: `ficha-${ficha.id}`,
        severidade: Number(ficha.margem) < 0 ? "CRITICO" : "ATENCAO",
        titulo: `Margem baixa: ${ficha.nome}`,
        descricao: `Margem atual de ${Number(ficha.margem).toFixed(1)}% (alvo ${MARGEM_ALVO}%).`,
        href: `/fichas-tecnicas/${ficha.id}/edit`,
      })
    }

    if (caixaAberto) {
      const horas = Math.floor(
        (Date.now() - new Date(caixaAberto.dataAbertura).getTime()) / (1000 * 60 * 60)
      )
      if (horas >= 12) {
        alertas.push({
          id: "caixa-aberto",
          severidade: "ATENCAO",
          titulo: "Caixa aberto há muito tempo",
          descricao: `O caixa está aberto há ${horas}h. Faça o fechamento diário.`,
          href: "/caixa",
        })
      }
    }

    if (produtosRevisao > 0) {
      alertas.push({
        id: "produtos-revisao",
        severidade: "INFO",
        titulo: `${produtosRevisao} produto${produtosRevisao > 1 ? "s" : ""} para revisar`,
        descricao: "A normalização automática pediu confirmação manual.",
        href: "/nfe/produtos",
      })
    }

    return NextResponse.json({ success: true, data: alertas })
  } catch (error) {
    console.error("Erro ao carregar alertas:", error)
    return NextResponse.json({ error: "Erro ao carregar alertas" }, { status: 500 })
  }
}
