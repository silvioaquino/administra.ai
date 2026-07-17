import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { obterNodes, calcularDREAno, obterPrevisoesAno } from '@/lib/dre-calculator';
import { MESES } from '@/lib/dre-template';
import { DreItem, DreMeses, DreItemType } from '@/types/dre';

// GET - Buscar DRE real do ano (lido de dreResultado)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }
    const empresaId = session.user.empresaId;
    if (!empresaId) {
      return NextResponse.json({ success: false, error: 'Empresa não encontrada' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ano = parseInt(searchParams.get('ano') || new Date().getFullYear().toString());

    // Garantir que o ano esteja calculado (first-load / após nova categoria)
    const existentes = await prisma.dreResultado.count({
      where: { empresaId, userId: session.user.id, ano },
    });
    if (existentes === 0) {
      await calcularDREAno(empresaId, session.user.id, ano);
    }

    const [nodes, resultados, previsoes] = await Promise.all([
      obterNodes(empresaId),
      prisma.dreResultado.findMany({
        where: { empresaId, userId: session.user.id, ano },
        orderBy: { mes: 'asc' },
      }),
      obterPrevisoesAno(empresaId, ano),
    ]);

    // Indexa valor por linha+mes
    const porLinha: Record<string, number[]> = {};
    for (const r of resultados) {
      if (!porLinha[r.linha]) porLinha[r.linha] = new Array(12).fill(0);
      porLinha[r.linha][(r.mes ?? 1) - 1] = Number(r.valor) || 0;
    }

    const receitaBrutaAnual = (porLinha['3.1'] ?? new Array(12).fill(0)).reduce(
      (s, v) => s + v,
      0
    );

    const data: DreItem[] = nodes.map((n) => {
      const mesesVal = porLinha[n.codigo] ?? new Array(12).fill(0);
      const meses = MESES.reduce((acc, m, i) => {
        acc[m] = mesesVal[i] || 0;
        return acc;
      }, {} as Record<string, number>) as unknown as DreMeses;

      const anual = mesesVal.reduce((s, v) => s + v, 0);
      const av =
        receitaBrutaAnual > 0 ? Math.round((anual / receitaBrutaAnual) * 10000) / 100 : 0;

      // A.H.: variação do último mês vs o penúltimo (mês a mês)
      const penult = mesesVal[10] || 0;
      const ult = mesesVal[11] || 0;
      const ah = penult > 0 ? Math.round(((ult - penult) / penult) * 10000) / 100 : 0;

      let tipo: DreItemType;
      if (n.codigo === 'RESULTADO') tipo = 'total';
      else if (n.calc) tipo = 'subtotal';
      else tipo = n.tipo;

      const isCalcRow = Boolean(n.calc) || n.codigo === 'RESULTADO';
      const isSubtotal = Boolean(n.calc) || n.codigo === 'RESULTADO';

      return {
        id: n.codigo,
        nome: n.nome,
        nivel: n.nivel,
        tipo,
        previsao: Math.round((previsoes[n.codigo] ?? 0) * 100) / 100,
        meses,
        av,
        ah,
        isBold: n.nivel === 0 || n.codigo === 'RESULTADO',
        isSubtotal,
        isHeader: Boolean(n.isHeader),
        isCalcRow,
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Erro ao buscar DRE:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
