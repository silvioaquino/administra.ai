import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Exportar Excel do DRE
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const ano = parseInt(searchParams.get("ano") || new Date().getFullYear().toString());
  const mes = parseInt(searchParams.get("mes") || (new Date().getMonth() + 1).toString());

  try {
    // Por enquanto, retorna um JSON indicando que a funcionalidade está em desenvolvimento
    // Na prática, você usaria xlsx ou similar para gerar o Excel
    return NextResponse.json({
      success: true,
      message: "Funcionalidade de Excel em desenvolvimento",
      data: {
        ano,
        mes,
        fileName: `DRE_${ano}_${mes}.xlsx`,
      },
    });
  } catch (error) {
    console.error("Erro ao exportar Excel:", error);
    return NextResponse.json({ error: "Erro ao exportar Excel" }, { status: 500 });
  }
}