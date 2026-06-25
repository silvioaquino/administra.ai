// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      email,
      password,
      establishment,
      whatsapp,
      segmento,
      address
    } = body

    console.log("Recebendo requisição de registro:", { email, establishment })

    // Validações
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email e senha são obrigatórios" },
        { status: 400 }
      )
    }

    if (!establishment) {
      return NextResponse.json(
        { error: "Nome da loja é obrigatório" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "A senha deve ter pelo menos 6 caracteres" },
        { status: 400 }
      )
    }

    // Verificar se usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Este email já está cadastrado" },
        { status: 400 }
      )
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10)

    // Criar usuário com período trial de 14 dias
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 14)

    // Criar usuário e empresa em uma transação
    const result = await prisma.$transaction(async (tx) => {
      // 1. Criar o usuário
      const user = await tx.user.create({
        data: {
          name: name || null,
          email,
          passwordHash: hashedPassword,
          trialEndsAt
        }
      })

      // 2. Criar a empresa vinculada ao usuário
      const empresa = await tx.empresa.create({
        data: {
          userId: user.id,
          nome: establishment,
          whatsapp: whatsapp || null,
          segmento: segmento || null,
          cep: address?.cep || null,
          logradouro: address?.street || null,
          numero: address?.number || null,
          complemento: address?.complemento || null,
          bairro: address?.district || null,
          cidade: address?.city || null,
          estado: address?.state || null
        }
      })

      return { user, empresa }
    })

    console.log("Usuário e empresa criados com sucesso:", result.user.id)

    // Criar dados iniciais para a empresa
    const despesasFixasPadrao = [
      { nome: "ALUGUEL", valor: 1200 },
      { nome: "CELPE", valor: 700 },
      { nome: "COMPESA", valor: 310 },
      { nome: "INTERNET", valor: 70 },
      { nome: "CONTABILIDADE", valor: 350 },
      { nome: "SOFTWARE GESTAO", valor: 144.4 },
      { nome: "MANUT. BANCOS", valor: 99 },
      { nome: "PASSAGEM FUNCIN.", valor: 635 },
      { nome: "INSS", valor: 446 },
      { nome: "MERCANTIL", valor: 200 },
      { nome: "BOMBEIROS", valor: 30 },
      { nome: "IPTU", valor: 150 },
      { nome: "CARRO", valor: 0 },
      { nome: "COMBUSTIVEL", valor: 200 },
      { nome: "GAS", valor: 1330 },
      { nome: "CELULAR", valor: 20 },
      { nome: "PRO-LABORE", valor: 1500 }
    ]

    await prisma.planejamentoConfig.create({
      data: {
        empresaId: result.empresa.id,
        userId: result.user.id,
        tipo: "despesas_fixas",
        dados: despesasFixasPadrao,
        anoReferencia: new Date().getFullYear()
      }
    })

    // Criar metas mensais padrão
    const anoAtual = new Date().getFullYear()
    for (let mes = 1; mes <= 12; mes++) {
      await prisma.planejamentoFaturamento.create({
        data: {
          empresaId: result.empresa.id,
          userId: result.user.id,
          ano: anoAtual,
          mes,
          metaDiariaAlmoco: 0,
          metaDiariaJanta: 0,
          diasTrabalhados: 26,
          lucroDesejado: 15
        }
      })
    }

    // Criar configuração de taxas de cartão padrão
    const taxasPadrao = {
      distribuicaoVendas: { debito: 40, credito: 50, voucher: 10 },
      distribuicaoMaquininhas: { infinitepay: 50, stone: 30, caixa: 20 },
      taxas: {
        debito: { infinitepay: 1.37, stone: 2.34, caixa: 4.48 },
        credito: { infinitepay: 3.15, stone: 6.44, caixa: 5.78 },
        voucher: 7.0
      },
      aluguelMaquininhas: { stone1: 59.90, stone2: 19.90 },
      manutencao: 1.0,
      simplesNacional: 8.0
    }

    await prisma.taxasCartaoConfig.create({
      data: {
        empresaId: result.empresa.id,
        userId: result.user.id,
        config: taxasPadrao
      }
    })

    return NextResponse.json({
      success: true,
      message: "Usuário criado com sucesso",
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        trialEndsAt: result.user.trialEndsAt
      },
      empresa: {
        nome: result.empresa.nome,
        whatsapp: result.empresa.whatsapp,
        segmento: result.empresa.segmento,
        endereco: {
          cep: result.empresa.cep,
          logradouro: result.empresa.logradouro,
          numero: result.empresa.numero,
          complemento: result.empresa.complemento,
          bairro: result.empresa.bairro,
          cidade: result.empresa.cidade,
          estado: result.empresa.estado
        }
      }
    })

  } catch (error) {
    console.error("Erro ao criar usuário:", error)
    return NextResponse.json(
      { error: "Erro interno ao criar usuário" },
      { status: 500 }
    )
  }
}