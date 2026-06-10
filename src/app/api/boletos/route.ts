// src/app/api/boletos/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET - Listar todos os boletos do usuário
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')
    const dataInicio = searchParams.get('dataInicio')
    const dataFim = searchParams.get('dataFim')

    if (!userId) {
      return NextResponse.json(
        { error: "userId é obrigatório" },
        { status: 400 }
      )
    }

    const where: any = { userId }

    if (status) {
      where.status = status
    }

    if (dataInicio || dataFim) {
      where.dataVencimento = {}
      if (dataInicio) {
        where.dataVencimento.gte = new Date(dataInicio)
      }
      if (dataFim) {
        where.dataVencimento.lte = new Date(dataFim)
      }
    }

    const boletos = await prisma.boleto.findMany({
      where,
      include: {
        lancamento: true
      },
      orderBy: [
        { status: 'asc' },
        { dataVencimento: 'asc' }
      ]
    })

    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const boletosComStatusAtualizado = boletos.map(boleto => {
      if (boleto.dataPagamento) {
        return { ...boleto, status: "PAGO" }
      }

      const vencimento = new Date(boleto.dataVencimento)
      vencimento.setHours(0, 0, 0, 0)

      if (vencimento < hoje) {
        return { ...boleto, status: "VENCIDO" }
      }

      return { ...boleto, status: "PENDENTE" }
    })

    return NextResponse.json(boletosComStatusAtualizado)
  } catch (error) {
    console.error("Erro ao buscar boletos:", error)
    return NextResponse.json(
      { error: "Erro ao buscar boletos" },
      { status: 500 }
    )
  }
}

// POST - Criar um novo boleto e lançamento no livro diário
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      descricao,
      valor,
      dataVencimento,
      clienteFornecedor,
      conta,
      userId
    } = body

    // Validações
    if (!descricao || !descricao.trim()) {
      return NextResponse.json(
        { error: "Descrição é obrigatória" },
        { status: 400 }
      )
    }

    if (!valor || valor <= 0) {
      return NextResponse.json(
        { error: "Valor deve ser maior que zero" },
        { status: 400 }
      )
    }

    if (!dataVencimento) {
      return NextResponse.json(
        { error: "Data de vencimento é obrigatória" },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { error: "userId é obrigatório" },
        { status: 400 }
      )
    }

    const result = await prisma.$transaction(async (tx) => {
      const lancamento = await tx.livroDiario.create({
        data: {
          data: new Date(dataVencimento),
          conta: conta || "4.1.1 Despesas Operacionais",
          descricao: `Boleto: ${descricao}`,
          clienteFornecedor: clienteFornecedor || null,
          entrada: 0,
          saida: valor,
          tipo: "DESPESA",
          userId: userId,
          statusBoleto: "PENDENTE",
          dataVencimento: new Date(dataVencimento)
        }
      })

      const boleto = await tx.boleto.create({
        data: {
          descricao: descricao.trim(),
          valor,
          dataVencimento: new Date(dataVencimento),
          clienteFornecedor: clienteFornecedor || null,
          conta: conta || null,
          userId,
          lancamentoId: lancamento.id,
          status: "PENDENTE"
        }
      })

      await tx.livroDiario.update({
        where: { id: lancamento.id },
        data: { boletoId: boleto.id }
      })

      return { boleto, lancamento }
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar boleto:", error)
    return NextResponse.json(
      { error: "Erro ao criar boleto" },
      { status: 500 }
    )
  }
}

// PUT - Atualizar um boleto existente
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, descricao, valor, dataVencimento, clienteFornecedor, conta } = body

    if (!id) {
      return NextResponse.json(
        { error: "ID do boleto é obrigatório" },
        { status: 400 }
      )
    }

    const boletoExistente = await prisma.boleto.findUnique({
      where: { id: parseInt(id.toString()) },
      include: { lancamento: true }
    })

    if (!boletoExistente) {
      return NextResponse.json(
        { error: "Boleto não encontrado" },
        { status: 404 }
      )
    }

    if (boletoExistente.status === "PAGO") {
      return NextResponse.json(
        { error: "Não é possível editar um boleto já pago" },
        { status: 400 }
      )
    }

    const result = await prisma.$transaction(async (tx) => {
      const boleto = await tx.boleto.update({
        where: { id: parseInt(id.toString()) },
        data: {
          descricao: descricao || boletoExistente.descricao,
          valor: valor || boletoExistente.valor,
          dataVencimento: dataVencimento ? new Date(dataVencimento) : boletoExistente.dataVencimento,
          clienteFornecedor: clienteFornecedor !== undefined ? clienteFornecedor : boletoExistente.clienteFornecedor,
          conta: conta !== undefined ? conta : boletoExistente.conta
        }
      })

      if (boletoExistente.lancamento) {
        await tx.livroDiario.update({
          where: { id: boletoExistente.lancamento.id },
          data: {
            data: dataVencimento ? new Date(dataVencimento) : boletoExistente.dataVencimento,
            conta: conta || boletoExistente.conta || "4.1.1 Despesas Operacionais",
            descricao: `Boleto: ${descricao || boletoExistente.descricao}`,
            clienteFornecedor: clienteFornecedor !== undefined ? clienteFornecedor : boletoExistente.clienteFornecedor,
            saida: valor || boletoExistente.valor,
            dataVencimento: dataVencimento ? new Date(dataVencimento) : boletoExistente.dataVencimento
          }
        })
      }

      return boleto
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Erro ao atualizar boleto:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar boleto" },
      { status: 500 }
    )
  }
}

// DELETE - Excluir um boleto
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: "ID do boleto é obrigatório" },
        { status: 400 }
      )
    }

    const boletoExistente = await prisma.boleto.findUnique({
      where: { id: parseInt(id) },
      include: { lancamento: true }
    })

    if (!boletoExistente) {
      return NextResponse.json(
        { error: "Boleto não encontrado" },
        { status: 404 }
      )
    }

    if (boletoExistente.status === "PAGO") {
      return NextResponse.json(
        { error: "Não é possível excluir um boleto já pago" },
        { status: 400 }
      )
    }

    await prisma.$transaction(async (tx) => {
      if (boletoExistente.lancamento) {
        await tx.livroDiario.delete({
          where: { id: boletoExistente.lancamento.id }
        })
      }

      await tx.boleto.delete({
        where: { id: parseInt(id) }
      })
    })

    return NextResponse.json({ message: "Boleto excluído com sucesso" })
  } catch (error) {
    console.error("Erro ao excluir boleto:", error)
    return NextResponse.json(
      { error: "Erro ao excluir boleto" },
      { status: 500 }
    )
  }
}