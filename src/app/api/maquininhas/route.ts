// src/app/api/maquininhas/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type MaquininhaPayload = {
  id?: string
  nome: string
  taxaDebito?: number
  taxaCredito?: number
  taxaPix?: number
  aluguel?: number
  ativo?: boolean
  ordem?: number
  contaCreditoId?: number | null
  contaDebitoId?: number | null
  contaPixId?: number | null
}

const num = (v: unknown) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

const contaId = (v: unknown) => {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isInteger(n) && n > 0 ? n : null
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const empresaId = session.user.empresaId
  if (!empresaId) {
    return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 401 })
  }

  const include = {
    contaCredito: { select: { id: true, nome: true } },
    contaDebito: { select: { id: true, nome: true } },
    contaPix: { select: { id: true, nome: true } }
  }

  try {
    let maquininhas = await prisma.maquininha.findMany({
      where: { empresaId },
      orderBy: [{ ordem: 'asc' }, { nome: 'asc' }],
      include
    })

    // Migração automática: importa maquininhas antigas salvas no JSON do planejamento
    if (maquininhas.length === 0) {
      const registros = await prisma.planejamentoDespesaVariavelNovo.findMany({
        where: { empresaId },
        orderBy: [{ ano: 'desc' }, { mes: 'desc' }]
      })

      const legado = registros
        .map(r => (r.config as any)?.maquininhas)
        .find(l => Array.isArray(l) && l.length > 0) as any[] | undefined

      if (legado && legado.length > 0) {
        const vistos = new Set<string>()
        const novas = legado
          .filter(m => m?.nome && String(m.nome).trim() !== '')
          .filter(m => {
            const chave = String(m.nome).trim().toLowerCase()
            if (vistos.has(chave)) return false
            vistos.add(chave)
            return true
          })

        if (novas.length > 0) {
          await prisma.maquininha.createMany({
            data: novas.map((m, i) => ({
              empresaId,
              userId: session.user.id,
              nome: String(m.nome).trim(),
              taxaDebito: num(m.taxaDebito),
              taxaCredito: num(m.taxaCredito),
              taxaPix: num(m.taxaPix),
              aluguel: num(m.aluguel),
              ativo: m.ativo !== false,
              ordem: i
            })),
            skipDuplicates: true
          })

          maquininhas = await prisma.maquininha.findMany({
            where: { empresaId },
            orderBy: [{ ordem: 'asc' }, { nome: 'asc' }],
            include
          })
        }
      }
    }

    return NextResponse.json({ success: true, data: maquininhas })
  } catch (error) {
    console.error('Erro ao buscar maquininhas:', error)
    return NextResponse.json({ error: 'Erro ao buscar maquininhas' }, { status: 500 })
  }
}

// POST - salva a lista completa de maquininhas (substitui as removidas)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const empresaId = session.user.empresaId
  if (!empresaId) {
    return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const lista: MaquininhaPayload[] = Array.isArray(body?.maquininhas) ? body.maquininhas : []

    const validas = lista.filter(m => m?.nome && String(m.nome).trim() !== '')
    const nomes = validas.map(m => String(m.nome).trim().toLowerCase())
    if (new Set(nomes).size !== nomes.length) {
      return NextResponse.json({ error: 'Existem maquininhas com o mesmo nome' }, { status: 400 })
    }

    const salvas = await prisma.$transaction(async tx => {
      const existentes = await tx.maquininha.findMany({ where: { empresaId }, select: { id: true } })
      const idsMantidos = new Set(validas.map(m => m.id).filter(Boolean) as string[])
      const idsRemovidos = existentes.map(e => e.id).filter(id => !idsMantidos.has(id))

      if (idsRemovidos.length > 0) {
        await tx.venda.updateMany({
          where: { empresaId, maquininhaId: { in: idsRemovidos } },
          data: { maquininhaId: null }
        })
        await tx.maquininha.deleteMany({ where: { empresaId, id: { in: idsRemovidos } } })
      }

      const resultado = []
      for (let i = 0; i < validas.length; i++) {
        const m = validas[i]
        const dados = {
          nome: String(m.nome).trim(),
          taxaDebito: num(m.taxaDebito),
          taxaCredito: num(m.taxaCredito),
          taxaPix: num(m.taxaPix),
          aluguel: num(m.aluguel),
          ativo: m.ativo !== false,
          ordem: m.ordem ?? i,
          contaCreditoId: contaId(m.contaCreditoId),
          contaDebitoId: contaId(m.contaDebitoId),
          contaPixId: contaId(m.contaPixId)
        }

        if (m.id) {
          resultado.push(
            await tx.maquininha.update({ where: { id: m.id }, data: dados })
          )
        } else {
          resultado.push(
            await tx.maquininha.create({
              data: { ...dados, empresaId, userId: session.user.id }
            })
          )
        }
      }
      return resultado
    })

    return NextResponse.json({ success: true, data: salvas })
  } catch (error) {
    console.error('Erro ao salvar maquininhas:', error)
    return NextResponse.json({ error: 'Erro ao salvar maquininhas' }, { status: 500 })
  }
}
