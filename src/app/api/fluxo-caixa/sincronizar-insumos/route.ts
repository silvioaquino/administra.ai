import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST - Sincronizar produtos como lançamentos no livro diário
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const empresaId = session.user.empresaId;
  if (!empresaId) {
    return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const ano = parseInt(searchParams.get('ano') || new Date().getFullYear().toString());
  const sobrescrever = searchParams.get('sobrescrever') === 'true';

  try {
    // Buscar todos os produtos do ano que ainda não foram sincronizados como lançamentos
    const produtos = await prisma.produto.findMany({
      where: {
        empresaId,
        dataCompra: {
          gte: new Date(ano, 0, 1),
          lte: new Date(ano, 11, 31),
        },
      },
      orderBy: { dataCompra: 'asc' },
    });

    let sincronizados = 0;
    let erros: string[] = [];

    // Agrupar produtos por data (todos como INSUMOS)
    const produtosPorDia: Record<string, { valor: number; produtos: any[] }> = {};

    for (const produto of produtos) {
      const dataKey = produto.dataCompra?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0];

      if (!produtosPorDia[dataKey]) {
        produtosPorDia[dataKey] = { valor: 0, produtos: [] };
      }

      produtosPorDia[dataKey].valor += Number(produto.valorTotal || 0);
      produtosPorDia[dataKey].produtos.push(produto);
    }

    // Criar lançamentos no livro diário para cada data (categoria INSUMOS = código 4.2.1)
    for (const [data, dados] of Object.entries(produtosPorDia)) {
      const codigo = '4.2.1';
      const descricaoProdutos = dados.produtos.map(p => p.descricao).join(', ');

      // Verificar se já existe lançamento
      const lancamentoExistente = await prisma.livroDiario.findFirst({
        where: {
          empresaId,
          data: new Date(data),
          conta: { contains: codigo },
        },
      });

      if (lancamentoExistente && !sobrescrever) {
        continue; // Pular se já existe e não quer sobrescrever
      }

      if (lancamentoExistente && sobrescrever) {
        // Atualizar lançamento existente
        await prisma.livroDiario.update({
          where: { id: lancamentoExistente.id },
          data: {
            saida: dados.valor,
            descricao: `Insumos - ${descricaoProdutos.substring(0, 100)}`,
          },
        });
      } else {
        // Criar novo lançamento
        await prisma.livroDiario.create({
          data: {
            empresaId,
            userId: session.user.id,
            data: new Date(data),
            conta: codigo,
            descricao: `Insumos - ${descricaoProdutos.substring(0, 100)}`,
            saida: dados.valor,
            tipo: 'DESPESA',
          },
        });
      }
      sincronizados++;
    }

    return NextResponse.json({
      success: true,
      message: `${sincronizados} lançamentos de insumos sincronizados`,
      sincronizados,
      erros: erros.length > 0 ? erros : undefined,
    });
  } catch (error) {
    console.error('Erro ao sincronizar insumos:', error);
    return NextResponse.json({ error: 'Erro ao sincronizar insumos' }, { status: 500 });
  }
}