import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Buscar insumos por mês (todos como INSUMOS)
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const ano = parseInt(searchParams.get('ano') || new Date().getFullYear().toString());

  try {
    // Buscar todos os produtos do usuário
    const produtos = await prisma.produto.findMany({
      where: {
        userId: session.user.id,
        dataCompra: {
          gte: new Date(ano, 0, 1),
          lte: new Date(ano, 11, 31),
        },
      },
    });

    // Agrupar valores por mês (todos como INSUMOS)
    const valoresPorMes: Record<number, number> = {};
    for (let i = 1; i <= 12; i++) {
      valoresPorMes[i] = 0;
    }

    // Processar produtos
    for (const produto of produtos) {
      const mes = produto.dataCompra?.getMonth() ? produto.dataCompra.getMonth() + 1 : null;
      const valor = Number(produto.valorTotal || 0);

      if (mes) {
        valoresPorMes[mes] = (valoresPorMes[mes] || 0) + valor;
      }
    }

    // Construir resposta
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
    ];

    const insumosPorMes = meses.map((mesNome, idx) => {
      const mesNum = idx + 1;
      return {
        mes: mesNum,
        nome: mesNome,
        total: valoresPorMes[mesNum] || 0,
      };
    });

    return NextResponse.json({
      success: true,
      data: insumosPorMes,
    });
  } catch (error) {
    console.error('Erro ao buscar insumos:', error);
    return NextResponse.json({ error: 'Erro ao buscar insumos' }, { status: 500 });
  }
}

// PUT - Atualizar categoria de um produto (desativado - sempre INSUMOS)
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    message: 'Categoria sempre será INSUMOS',
  });
}