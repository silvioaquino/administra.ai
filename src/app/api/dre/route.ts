import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const ano = parseInt(searchParams.get('ano') || new Date().getFullYear().toString());

    // Buscar dados de produtos/insumos com data de compra
    const produtos = await prisma.produto.findMany({
      where: { userId },
      select: {
        descricao: true,
        valorTotal: true,
        dataCompra: true,
        fornecedor: true,
      },
    });

    // Nome das colunas dos meses
    const mesesNomes = [
      'janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho',
      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
    ];

    // Agrupar produtos por nome e mês de compra
    // Estrutura: { "nomeProduto": { janeiro: valor, fevereiro: valor, ... } }
    const produtosPorMes = produtos.reduce((acc: Record<string, Record<string, number>>, prod) => {
      const key = prod.descricao;
      const valor = Number(prod.valorTotal) || 0;

      // Determinar o mês da data de compra
      if (prod.dataCompra) {
        const dataCompra = new Date(prod.dataCompra);
        const mesIndex = dataCompra.getMonth();
        const mesNome = mesesNomes[mesIndex];

        if (!acc[key]) {
          acc[key] = mesesNomes.reduce((m, nome) => ({ ...m, [nome]: 0 }), {} as Record<string, number>);
        }
        acc[key][mesNome] += valor;
      }
      return acc;
    }, {} as Record<string, Record<string, number>>);

    // Criar lista de produtos com seus valores por mês
    const produtosLista = Object.entries(produtosPorMes).map(([nome, valoresPorMes]) => ({
      nome,
      meses: valoresPorMes,
    }));

    // Buscar lançamentos do livro diário para meses
    const livroDiario = await prisma.livroDiario.findMany({
      where: {
        userId,
        data: {
          gte: new Date(ano, 0, 1),
          lte: new Date(ano, 11, 31),
        },
      },
      select: {
        data: true,
        entrada: true,
        saida: true,
        tipo: true,
        conta: true,
      },
    });

    // Construir dados agrupados por mês
    const mesesData = Array.from({ length: 12 }, (_, i) => {
      const monthName = [
        'janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho',
        'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
      ][i];
      return { monthIndex: i, name: monthName };
    });

    // Calcular valores por mês
    const valoresPorMes = mesesData.map(({ monthIndex }) => {
      const mesLivro = livroDiario.filter((item) => {
        const itemDate = new Date(item.data);
        return itemDate.getMonth() === monthIndex;
      });

      const receitas = mesLivro
        .filter((i) => i.tipo === 'VENDA' && i.entrada)
        .reduce((sum, i) => sum + Number(i.entrada || 0), 0);

      const despesasVariaveis = mesLivro
        .filter((i) => i.tipo === 'COMPRA' && i.saida)
        .reduce((sum, i) => sum + Number(i.saida || 0), 0);

      return {
        receitaTotal: receitas,
        despesasVariaveis,
        receitaLiquida: receitas - despesasVariaveis,
      };
    });

    // Construir estrutura DRE
    const dadosDRE = construirDRE(valoresPorMes, produtosLista, null);

    // Calcular análise vertical e horizontal
    const dadosComAnalises = calcularAnalises(dadosDRE, valoresPorMes[0]?.receitaTotal || 1);

    return NextResponse.json({ success: true, data: dadosComAnalises });
  } catch (error) {
    console.error('Erro ao buscar DRE:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * Constrói a estrutura da DRE com base nos dados do banco
 */
function construirDRE(
  valoresPorMes: Array<{ receitaTotal: number; despesasVariaveis: number; receitaLiquida: number }>,
  produtosLista: Array<{ nome: string; meses: Record<string, number> }>,
  planejamento: any
) {
  const meses: string[] = [
    'janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
  ];

  // Calcular totais por mês
  const totaisPorMes = valoresPorMes.reduce(
    (acc, val, i) => {
      acc[meses[i]] = val;
      return acc;
    },
    {} as Record<string, { receitaTotal: number; despesasVariaveis: number; receitaLiquida: number }>
  );

  // Calcular totais de produtos por mês
  const produtosTotaisPorMes = meses.reduce(
    (acc, mes) => {
      acc[mes] = produtosLista.reduce((sum, prod) => sum + (prod.meses[mes] || 0), 0);
      return acc;
    },
    {} as Record<string, number>
  );

  const dados: any[] = [];

  // 1. RECEITA / FATURAMENTO
  dados.push({
    id: 'receita-faturamento',
    nome: 'RECEITA / FATURAMENTO',
    nivel: 0,
    tipo: 'receita',
    previsao: 0,
    meses: meses.reduce((acc, mes) => ({ ...acc, [mes]: totaisPorMes[mes]?.receitaTotal || 0 }), {} as any),
    av: 100,
    ah: 0,
    isBold: true,
  });

  // Sub-itens de receita
  dados.push({
    id: 'vendas-dinheiro',
    nome: 'Vendas em Dinheiro',
    nivel: 1,
    tipo: 'receita',
    previsao: 0,
    meses: meses.reduce((acc, mes) => ({ ...acc, [mes]: (totaisPorMes[mes]?.receitaTotal || 0) * 0.3 }), {} as any),
    av: 30,
    ah: 0,
  });

  dados.push({
    id: 'vendas-cartao-debito',
    nome: 'Vendas em Cartão Débito',
    nivel: 1,
    tipo: 'receita',
    previsao: 0,
    meses: meses.reduce((acc, mes) => ({ ...acc, [mes]: (totaisPorMes[mes]?.receitaTotal || 0) * 0.4 }), {} as any),
    av: 40,
    ah: 0,
  });

  dados.push({
    id: 'vendas-cartao-credito',
    nome: 'Vendas em Cartão Crédito',
    nivel: 1,
    tipo: 'receita',
    previsao: 0,
    meses: meses.reduce((acc, mes) => ({ ...acc, [mes]: (totaisPorMes[mes]?.receitaTotal || 0) * 0.3 }), {} as any),
    av: 30,
    ah: 0,
  });

  // 2. DESPESAS/CUSTOS VARIÁVEIS
  const despesasVariaveisPorMes = meses.reduce(
    (acc, mes) => {
      acc[mes] = totaisPorMes[mes]?.despesasVariaveis || 0;
      return acc;
    },
    {} as Record<string, number>
  );

  dados.push({
    id: 'despesas-variaveis',
    nome: 'DESPESAS/CUSTOS VARIÁVEIS',
    nivel: 0,
    tipo: 'despesa',
    previsao: 0,
    meses: despesasVariaveisPorMes,
    av: 0,
    ah: 0,
    isBold: true,
  });

  // 3. RECEITA LÍQUIDA
  const receitaLiquidaPorMes = meses.reduce(
    (acc, mes) => {
      acc[mes] = totaisPorMes[mes]?.receitaLiquida || 0;
      return acc;
    },
    {} as Record<string, number>
  );

  dados.push({
    id: 'receita-liquida',
    nome: 'RECEITA LÍQUIDA',
    nivel: 0,
    tipo: 'subtotal',
    previsao: 0,
    meses: receitaLiquidaPorMes,
    av: 0,
    ah: 0,
    isBold: true,
    isSubtotal: true,
  });

  // 4. CUSTOS COM PRODUTOS/INSUMOS
  dados.push({
    id: 'custos-insumos',
    nome: 'CUSTOS COM PRODUTOS/INSUMOS',
    nivel: 0,
    tipo: 'despesa',
    previsao: 0,
    meses: produtosTotaisPorMes,
    av: 0,
    ah: 0,
    isBold: true,
  });

  // Adicionar produtos individuais com seus valores por mês
  produtosLista.forEach((prod) => {
    dados.push({
      id: `produto-${prod.nome}`,
      nome: prod.nome,
      nivel: 1,
      tipo: 'despesa',
      previsao: 0,
      meses: meses.reduce((acc, mes) => ({ ...acc, [mes]: prod.meses[mes] || 0 }), {} as any),
      av: 0,
      ah: 0,
    });
  });

  // 5. LUCRO BRUTO
  const lucroBrutoPorMes = meses.reduce(
    (acc, mes) => {
      acc[mes] = receitaLiquidaPorMes[mes] - (produtosTotaisPorMes[mes] || 0);
      return acc;
    },
    {} as Record<string, number>
  );

  dados.push({
    id: 'lucro-bruto',
    nome: 'LUCRO BRUTO',
    nivel: 0,
    tipo: 'subtotal',
    previsao: 0,
    meses: lucroBrutoPorMes,
    av: 0,
    ah: 0,
    isBold: true,
    isSubtotal: true,
  });

  // 6. DESPESAS FIXAS
  const despesasFixasPorMes = meses.reduce(
    (acc, mes) => {
      acc[mes] = (totaisPorMes[mes]?.despesasVariaveis || 0) * 0.15;
      return acc;
    },
    {} as Record<string, number>
  );

  dados.push({
    id: 'despesas-fixas',
    nome: 'DESPESAS FIXAS',
    nivel: 0,
    tipo: 'despesa',
    previsao: 0,
    meses: despesasFixasPorMes,
    av: 0,
    ah: 0,
    isBold: true,
  });

  // Sub-itens de despesas fixas
  const despensasFixasItens = [
    'Tarifas Bancárias',
    'Aluguel de Maquinetas',
    'Empréstimos',
    'Aluguel Imóvel',
    'Energia (Celpe)',
    'Água (Compesa)',
    'Internet',
    'Telefone',
  ];

  despensasFixasItens.forEach((nome, idx) => {
    dados.push({
      id: `fixa-${idx}`,
      nome,
      nivel: 1,
      tipo: 'despesa',
      previsao: 0,
      meses: meses.reduce((acc, mes) => ({ ...acc, [mes]: (despesasFixasPorMes[mes] || 0) / despensasFixasItens.length }), {} as any),
      av: 0,
      ah: 0,
    });
  });

  // Despesas com Pessoal
  dados.push({
    id: 'despesas-pessoal',
    nome: 'Despesas com Pessoal',
    nivel: 1,
    tipo: 'despesa',
    previsao: 0,
    meses: meses.reduce((acc, mes) => ({ ...acc, [mes]: 5000 }), {} as any),
    av: 0,
    ah: 0,
  });

  // 7. LUCRO OPERACIONAL
  const lucroOperacionalPorMes = meses.reduce(
    (acc, mes) => {
      acc[mes] = (lucroBrutoPorMes[mes] || 0) - (despesasFixasPorMes[mes] || 0);
      return acc;
    },
    {} as Record<string, number>
  );

  dados.push({
    id: 'lucro-operacional',
    nome: 'LUCRO OPERACIONAL',
    nivel: 0,
    tipo: 'subtotal',
    previsao: 0,
    meses: lucroOperacionalPorMes,
    av: 0,
    ah: 0,
    isBold: true,
    isSubtotal: true,
  });

  // 8. LUCRO LÍQUIDO
  const lucroLiquidoPorMes = meses.reduce(
    (acc, mes) => {
      acc[mes] = (lucroOperacionalPorMes[mes] || 0) * 0.85; // Após 15% de impostos
      return acc;
    },
    {} as Record<string, number>
  );

  dados.push({
    id: 'lucro-liquido',
    nome: 'LUCRO LÍQUIDO',
    nivel: 0,
    tipo: 'total',
    previsao: 0,
    meses: lucroLiquidoPorMes,
    av: 0,
    ah: 0,
    isBold: true,
  });

  return dados;
}

/**
 * Calcula análise vertical e horizontal
 */
function calcularAnalises(dados: any[], receitaTotal: number) {
  return dados.map((item) => {
    const meses = item.meses;
    const novasMeses = { ...meses };

    // Calcular A.V. (baseado na receita total)
    if (item.tipo === 'receita') {
      item.av = 100;
    } else if (item.tipo !== 'subtotal' && item.tipo !== 'total') {
      const totalMes: number = Object.values(meses).reduce((sum: number, val: any) => sum + (val || 0), 0);
      item.av = receitaTotal > 0 ? Math.round((totalMes / receitaTotal) * 100 * 100) / 100 : 0;
    }

    // Calcular A.H. (variação percentual)
    const valores = Object.values(meses).map((v: any) => Number(v) || 0);
    const ultimoValor = valores[valores.length - 1];
    const penultimoValor = valores[valores.length - 2];
    item.ah = penultimoValor > 0 ? Math.round(((ultimoValor - penultimoValor) / penultimoValor) * 100 * 100) / 100 : 0;

    return { ...item, meses: novasMeses };
  });
}