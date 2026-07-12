// app/api/planejamento/indicadores-resumo/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { calcularTotalDespesasVariaveis } from "@/lib/calculoDespesasVariaveis"

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

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const userId = session.user.id
  const empresaId = session.user.empresaId || "sem-empresa"
  const { searchParams } = new URL(request.url)
  const ano = parseInt(searchParams.get("ano") || new Date().getFullYear().toString())

  try {
    // 1. Buscar meta do mês atual (usando tabela NOVA)
    const mesAtual = new Date().getMonth() + 1
    const metaAtual = await prisma.planejamentoFaturamentoNovo.findFirst({
      where: {
        empresaId,
        userId,
        ano,
        mes: mesAtual
      }
    })

    // Usar metaTotal diretamente se disponível.
    // Sem "default silencioso": se o mês atual não tem meta, sinaliza metaFaltando (item 3).
    const metaDefinida = !!metaAtual && (Number(metaAtual.metaTotal) || 0) > 0
    const metaMensalTotal = metaDefinida ? Number(metaAtual!.metaTotal) : 0

    // Ler lucroDesejado persistido (ano-escopo) — elimina o magic number 15
    const lucroConfig = await prisma.planejamentoConfig.findFirst({
      where: {
        userId,
        tipo: "lucro_desejado",
        anoReferencia: ano
      }
    })
    const lucroDesejado = (lucroConfig?.dados as { lucroDesejado?: number } | null)?.lucroDesejado ?? 15

    // 2. Buscar despesas fixas (DA NOVA TABELA primeiro, depois fallback para tabela antiga)
    const despesasFixasNova = await prisma.planejamentoDespesaFixaNovo.findMany({
      where: {
        userId,
        empresaId,
        ano
      },
      orderBy: { nome: "asc" }
    })

    let despesasFixas: Array<{ nome: string; valor: number }> = []

    // Se encontrou na nova tabela, usar ela
    if (despesasFixasNova.length > 0) {
      despesasFixas = despesasFixasNova.map(d => ({
        nome: d.nome,
        valor: Number(d.valor)
      }))
    } else {
      // Fallback: buscar da tabela principal DespesaFixa
      const despesasFixasDb = await prisma.despesaFixa.findMany({
        where: {
          userId,
          empresaId
        },
        orderBy: { nome: "asc" }
      })

      // Se não encontrou na tabela principal, buscar do planejamentoConfig
      if (despesasFixasDb.length > 0) {
        despesasFixas = despesasFixasDb.map(d => ({
          nome: d.nome,
          valor: Number(d.valor)
        }))
      } else {
        const configFixas = await prisma.planejamentoConfig.findFirst({
          where: {
            empresaId,
            userId,
            tipo: "despesas_fixas",
            anoReferencia: ano
          }
        })
        despesasFixas = (configFixas?.dados as Array<{ nome: string; valor: number }>) || []
      }
    }

    // 3. Folha salarial (total de salários + encargos) — fonte enriquecida dos indicadores
    const folha = await prisma.planejamentoFolhaSalarial.findUnique({
      where: {
        empresaId_userId_anoReferencia: {
          empresaId,
          userId,
          anoReferencia: ano
        }
      }
    })
    const totalSalarios = Number(folha?.totalSalarios) || 0
    const encargosFolha =
      (Number(folha?.totalDecimo) || 0) +
      (Number(folha?.totalFerias) || 0) +
      (Number(folha?.totalFgts) || 0) +
      (Number(folha?.totalInss) || 0) +
      (Number(folha?.totalInssPatronal) || 0)

    // 4. Buscar configuração de despesas variáveis DIRETAMENTE do banco
    // (autônomo — sem fetch interno a outra API)
    const dvConfig = await prisma.planejamentoConfig.findFirst({
      where: {
        userId,
        tipo: "despesas_variaveis",
        anoReferencia: ano
      }
    })
    const dvResultado = await prisma.despesasVariaveisResultado.findFirst({
      where: {
        userId,
        ano,
        mes: mesAtual
      }
    })

    // Configuração padrão (mantém fallback caso não haja config salva)
    const dvDados = (dvConfig?.dados as DespesasVariaveisDados) || {}
    const configMaquininhas: ConfigMaquininhas = dvConfig?.dados
      ? {
          maquininhas: dvDados.maquininhas || [],
          distribuicaoVendas: dvDados.distribuicaoVendas || { debito: 40, credito: 50, voucher: 10 },
          outrasTaxas: {
            voucher: dvDados.taxaVoucher ?? 7.0,
            simplesNacional: dvDados.simplesNacional ?? 0,
            manutencao: dvDados.manutencao ?? 0
          }
        }
      : {
          maquininhas: [
            { id: "1", nome: "InfinitePay", taxaDebito: 1.37, taxaCredito: 3.15, aluguel: 0, ativo: true },
            { id: "2", nome: "Stone", taxaDebito: 2.34, taxaCredito: 6.44, aluguel: 79.80, ativo: true },
            { id: "3", nome: "Caixa", taxaDebito: 4.48, taxaCredito: 5.78, aluguel: 0, ativo: true },
          ],
          distribuicaoVendas: { debito: 40, credito: 50, voucher: 10 },
          outrasTaxas: {
            voucher: 7.0,
            simplesNacional: 8.0,
            manutencao: 1.0
          }
        }

    // 5. Cálculo enriquecido (mesma fonte das telas) -------------------------
    // % Fixas inclui aluguel das máquinas + salários sobre a meta mensal total
    const aluguelMaquininhas = configMaquininhas.maquininhas
      .filter((m) => m.ativo)
      .reduce((sum, m) => sum + (m.aluguel || 0), 0)

    const totalFixas = despesasFixas.reduce((sum, d) => sum + Number(d.valor ?? 0), 0)
    const totalDespesasFixas = totalFixas + aluguelMaquininhas + totalSalarios
    const pctFixas = metaMensalTotal > 0 ? (totalDespesasFixas / metaMensalTotal) * 100 : 0

    // Despesas variáveis incluem encargos da folha salarial (espelha o client).
    // faturamentoBase vem do resultado salvo (ou da meta mensal como fallback).
    const faturamentoBase = dvResultado?.faturamentoBase != null
      ? Number(dvResultado.faturamentoBase)
      : metaMensalTotal
    const calculoDV = calcularTotalDespesasVariaveis({
      maquininhas: configMaquininhas.maquininhas,
      distribuicaoVendas: configMaquininhas.distribuicaoVendas,
      outrasTaxas: configMaquininhas.outrasTaxas,
      faturamentoBase,
      folhaSalarialTotalMensal: encargosFolha
    })
    const folhaEncargosPercentual = metaMensalTotal > 0 ? (encargosFolha / metaMensalTotal) * 100 : 0
    const despesasVariaveisPct = calculoDV.total
    const despesasVariaveisBase = calculoDV.base

    // 6. Calcular CMV e Mark-Up (espelha o card Mark-Up e Precificação)
    // Se a meta do mês não está definida, não calcula (evita default silencioso de 0)
    const cmv = metaDefinida ? Math.max(0, 100 - (pctFixas + despesasVariaveisPct + lucroDesejado)) : null
    const markUp = metaDefinida && cmv !== null && cmv > 0 ? 100 / cmv : null

    return NextResponse.json({
      success: true,
      metaFaltando: !metaDefinida,
      despesasFixas: despesasFixas.map(d => ({ nome: d.nome, valor: Number(d.valor) })),
      despesasVariaveisPct,
      despesasVariaveisBase,
      totalDespesasVariaveis: calculoDV.total,
      metaMensalTotal,
      cmv: cmv === null ? null : Math.max(0, cmv),
      pctFixas,
      markUp,
      lucroDesejado,
      folhaEncargosPercentual
    })

  } catch (error) {
    console.error("Erro ao buscar indicadores:", error)
    return NextResponse.json({
      success: false,
      error: "Erro ao buscar dados dos indicadores"
    }, { status: 500 })
  }
}
