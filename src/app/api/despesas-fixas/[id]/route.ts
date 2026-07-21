import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT - Atualizar status de uma despesa fixa (ex.: marcar como PAGO)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const empresaId = session.user.empresaId;
  if (!empresaId) {
    return NextResponse.json({ error: "Empresa não encontrada" }, { status: 401 });
  }

  const { id } = await params;
  const idNum = parseInt(id);

  try {
    const body = await request.json();
    const { status } = body;

    const existente = await prisma.despesaFixa.findFirst({
      where: { id: idNum, empresaId, userId: session.user.id },
    });

    if (!existente) {
      return NextResponse.json({ error: "Despesa não encontrada" }, { status: 404 });
    }

    const dados: { status?: string } = {};
    if (status) dados.status = status;

    const atualizada = await prisma.despesaFixa.update({
      where: { id: idNum },
      data: dados,
    });

    return NextResponse.json({
      success: true,
      data: atualizada,
      message: "Despesa atualizada com sucesso",
    });
  } catch (error) {
    console.error("Erro ao atualizar despesa fixa:", error);
    return NextResponse.json({ error: "Erro ao atualizar despesa fixa" }, { status: 500 });
  }
}
