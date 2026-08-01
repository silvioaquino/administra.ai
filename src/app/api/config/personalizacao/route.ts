// src/app/api/config/personalizacao/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const TIPO = "loja_personalizacao"
const ANO_REF = 0

export interface PersonalizacaoSistema {
  /** Cor de destaque da interface do sistema */
  corDestaque: string
  /** Tema da interface */
  tema: "claro" | "escuro"
  /** Nome exibido no topo/sidebar do sistema */
  nomeExibicao: string
  /** Logo usada na interface (URL) */
  logoUrl: string
  /** Densidade da interface */
  densidade: "confortavel" | "compacta"
  /** Raio das bordas dos componentes */
  bordas: "suave" | "arredondada" | "reta"
  /** Reduzir animações da interface */
  reduzirAnimacoes: boolean
}

const PADRAO: PersonalizacaoSistema = {
  corDestaque: "#4F46E5",
  tema: "escuro",
  nomeExibicao: "",
  logoUrl: "",
  densidade: "confortavel",
  bordas: "arredondada",
  reduzirAnimacoes: false,
}

async function resolverEmpresaId(userId: string): Promise<string | null> {
  const empresa = await prisma.empresa.findFirst({
    where: { userId },
    select: { id: true },
  })
  return empresa?.id ?? null
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const empresaId = await resolverEmpresaId(session.user.id)
    if (!empresaId) {
      return NextResponse.json({ success: true, dados: PADRAO })
    }

    const config = await prisma.planejamentoConfig.findFirst({
      where: { empresaId, userId: session.user.id, tipo: TIPO, anoReferencia: ANO_REF },
    })

    return NextResponse.json({
      success: true,
      dados: { ...PADRAO, ...((config?.dados as Partial<PersonalizacaoSistema>) || {}) },
    })
  } catch (error) {
    console.error("Erro ao buscar personalização:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const body = (await request.json()) as Partial<PersonalizacaoSistema>
    const dados: PersonalizacaoSistema = { ...PADRAO, ...body }

    let empresaId = await resolverEmpresaId(session.user.id)
    if (!empresaId) {
      const criada = await prisma.empresa.create({
        data: { userId: session.user.id, nome: dados.nomeExibicao || "Minha Loja" },
        select: { id: true },
      })
      empresaId = criada.id
    }

    await prisma.planejamentoConfig.upsert({
      where: {
        empresaId_userId_tipo_anoReferencia: {
          empresaId,
          userId: session.user.id,
          tipo: TIPO,
          anoReferencia: ANO_REF,
        },
      },
      update: { dados: dados as any },
      create: {
        empresaId,
        userId: session.user.id,
        tipo: TIPO,
        anoReferencia: ANO_REF,
        dados: dados as any,
      },
    })

    return NextResponse.json({ success: true, dados })
  } catch (error) {
    console.error("Erro ao salvar personalização:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
