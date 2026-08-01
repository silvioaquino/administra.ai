import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { garantirDespesasVariaveisMes } from '@/lib/planejamento/rollover'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Não autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const ano = parseInt(searchParams.get('ano') || new Date().getFullYear().toString())
  const mes = searchParams.get('mes') ? parseInt(searchParams.get('mes')!) : undefined

  try {
    const empresaIdAtual = session.user.empresaId || 'sem-empresa'

    // Virada de mês: replica a configuração do último mês preenchido.
    const hoje = new Date()
    const mesAlvo = mes ?? (ano === hoje.getFullYear() ? hoje.getMonth() + 1 : 1)
    try {
      await garantirDespesasVariaveisMes(empresaIdAtual, session.user.id, ano, mesAlvo)
    } catch (rolloverError) {
      console.error('Erro na virada de mês das despesas variáveis:', rolloverError)
    }

    const whereClause: any = {
      userId: session.user.id,
      empresaId: empresaIdAtual,
      ano
    }

    if (mes !== undefined) {
      whereClause.mes = mes
    }

    const dados = await prisma.planejamentoDespesaVariavelNovo.findMany({
      where: whereClause
    })


    // Buscar faturamento do mês para preencher faturamentoBase
    const mesAtual = mes !== undefined ? mes : new Date().getMonth() + 1
    const faturamentoData = await prisma.planejamentoFaturamentoNovo.findFirst({
      where: {
        userId: session.user.id,
        empresaId: session.user.empresaId || 'sem-empresa',
        ano,
        mes: mesAtual
      }
    })

    const registro = dados.length > 0 ? dados[0] : null
    // Calcular faturamentoBase do mês
    const diasTrabalhados = faturamentoData?.diasTrabalhados ?? 26
    const metaDiariaValor = faturamentoData?.metaDiaria ?? 0
    const faturamentoBase = faturamentoData ? Number(faturamentoData.metaTotal || metaDiariaValor * diasTrabalhados) : 0

    return NextResponse.json({
      success: true,
      dados: registro ? {
        ...registro,
        faturamentoBase: faturamentoBase,
        config: {
          ...(registro.config as object),
          outrasTaxas: {
            voucher: (registro.config as any)?.taxaVoucher || 7.0,
            simplesNacional: (registro.config as any)?.simplesNacional || 0,
            manutencao: (registro.config as any)?.manutencao || 0
          }
        }
      } : null
    })
  } catch (error) {
    console.error('Erro ao buscar despesas variáveis:', error)
    return NextResponse.json(
      { success: false, message: 'Erro ao buscar dados' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { ano, mes, percentualTotal, faturamentoBase, impactoMensal, config, resultados } = await request.json()
    const empresaId = session.user.empresaId || 'sem-empresa'

    const dados = await prisma.planejamentoDespesaVariavelNovo.upsert({
      where: {
        empresaId_userId_ano_mes: {
          empresaId,
          userId: session.user.id,
          ano,
          mes: mes ?? 0
        }
      },
      update: {
        percentualTotal,
        faturamentoBase,
        impactoMensal,
        config,
        resultados
      },
      create: {
        empresaId,
        userId: session.user.id,
        ano,
        mes: mes ?? 0,
        percentualTotal,
        faturamentoBase,
        impactoMensal,
        config: config || {},
        resultados: resultados || {}
      }
    })

    return NextResponse.json({ success: true, message: 'Dados salvos com sucesso', dados })
  } catch (error) {
    console.error('Erro ao salvar despesas variáveis:', error)
    return NextResponse.json(
      { success: false, message: 'Erro ao salvar dados' },
      { status: 500 }
    )
  }
}