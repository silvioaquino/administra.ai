import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Detalhamento dos funcionários de um mês (usado ao expandir
// o lançamento de Adiantamento/Salário no Livro Diário)
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const empresaId = session.user.empresaId || "sem-empresa";
  const { searchParams } = new URL(request.url);
  const ano = parseInt(searchParams.get("ano") || new Date().getFullYear().toString());
  const mes = parseInt(searchParams.get("mes") || (new Date().getMonth() + 1).toString());

  try {
    const config = await prisma.folhaPagamentoConfig.findUnique({
      where: { empresaId_userId_ano_mes: { empresaId, userId: session.user.id, ano, mes } },
    });

    const pct = Number(config?.percentualAdiantamento) || 0;

    // Prioriza o snapshot do mês; cai no cadastro atual se não houver
    let lista: { nome: string; salario: number }[] = [];
    if (Array.isArray(config?.funcionariosSnapshot) && config.funcionariosSnapshot.length > 0) {
      lista = (config.funcionariosSnapshot as any[]).map(f => ({
        nome: String(f.nome ?? ""),
        salario: Number(f.salario) || 0,
      }));
    } else {
      const funcs = await prisma.funcionario.findMany({
        where: { userId: session.user.id, empresaId },
        orderBy: { nome: "asc" },
      });
      lista = funcs.map(f => ({ nome: f.nome, salario: Number(f.salario) }));
    }

    const itens = lista.map(f => {
      const salario = Number(f.salario) || 0;
      const adiantamento = Math.round((salario * pct) / 100 * 100) / 100;
      const salarioRestante = Math.round((salario - adiantamento) * 100) / 100;
      return {
        nome: f.nome,
        salario,
        adiantamento,
        salarioRestante,
      };
    });

    return NextResponse.json({
      success: true,
      pct,
      totalSalarios: Number(config?.totalSalarios) || itens.reduce((s, i) => s + i.salario, 0),
      totalAdiantamento: itens.reduce((s, i) => s + i.adiantamento, 0),
      totalSalarioRestante: itens.reduce((s, i) => s + i.salarioRestante, 0),
      itens,
    });
  } catch (error) {
    console.error("Erro ao buscar detalhes da folha:", error);
    return NextResponse.json({ error: "Erro ao buscar detalhes da folha" }, { status: 500 });
  }
}
