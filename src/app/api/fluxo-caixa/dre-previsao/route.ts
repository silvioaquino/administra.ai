import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH - Salvar/atualizar a previsão (planejamento) de uma linha do DRE.
// Persiste em planejamentoConfig (tipo DRE_PREVISAO, JSON de overrides),
// que é lido por /api/dre e pela calculadora do DRE.
export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const empresaId = session.user.empresaId;
  if (!empresaId) {
    return NextResponse.json({ error: "Empresa não encontrada" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { ano, codigo, valor } = body as {
      ano: number;
      codigo: string;
      valor: number;
    };

    if (!ano || !codigo || typeof valor !== "number") {
      return NextResponse.json(
        { error: "Campos obrigatórios: ano, codigo, valor" },
        { status: 400 }
      );
    }

    // Lê o override atual (JSON) e aplica a alteração
    const existente = await prisma.planejamentoConfig.findFirst({
      where: { empresaId, userId: session.user.id, tipo: "DRE_PREVISAO", anoReferencia: ano },
    });

    const dadosAtuais: Record<string, number> =
      (existente?.dados as Record<string, number>) || {};
    dadosAtuais[codigo] = valor;

    await prisma.planejamentoConfig.upsert({
      where: {
        empresaId_userId_tipo_anoReferencia: {
          empresaId,
          userId: session.user.id,
          tipo: "DRE_PREVISAO",
          anoReferencia: ano,
        },
      },
      update: { dados: dadosAtuais },
      create: {
        empresaId,
        userId: session.user.id,
        tipo: "DRE_PREVISAO",
        anoReferencia: ano,
        dados: dadosAtuais,
      },
    });

    return NextResponse.json({ success: true, data: { codigo, valor } });
  } catch (error) {
    console.error("Erro ao salvar previsão do DRE:", error);
    return NextResponse.json({ error: "Erro ao salvar previsão" }, { status: 500 });
  }
}
