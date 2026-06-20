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
    isSubtotal: true,
    isCalcRow: true,
  });

  // Receitas de Vendas
  dados.push({
    id: 'receitas-vendas',
    nome: 'Receitas de Vendas',
    nivel: 1,
    tipo: 'receita',
    previsao: 0,
    meses: meses.reduce((acc, mes) => ({ ...acc, [mes]: totaisPorMes[mes]?.receitaTotal || 0 }), {} as any),
    av: 0,
    ah: 0,
    isSubtotal: true,
  });

  // Vendas em Dinheiro
  dados.push({
    id: 'vendas-dinheiro',
    nome: 'Vendas em Dinheiro',
    nivel: 2,
    tipo: 'receita',
    previsao: 0,
    meses: meses.reduce((acc, mes) => ({ ...acc, [mes]: (totaisPorMes[mes]?.receitaTotal || 0) * 0.25 }), {} as any),
    av: 0,
    ah: 0,
  });

  // Vendas em Cartão Débito
  dados.push({
    id: 'vendas-cartao-debito',
    nome: 'Vendas em Cartão Débito',
    nivel: 2,
    tipo: 'receita',
    previsao: 0,
    meses: meses.reduce((acc, mes) => ({ ...acc, [mes]: (totaisPorMes[mes]?.receitaTotal || 0) * 0.35 }), {} as any),
    av: 0,
    ah: 0,
  });

  // Vendas em Cartão Crédito
  dados.push({
    id: 'vendas-cartao-credito',
    nome: 'Vendas em Cartão Crédito',
    nivel: 2,
    tipo: 'receita',
    previsao: 0,
    meses: meses.reduce((acc, mes) => ({ ...acc, [mes]: (totaisPorMes[mes]?.receitaTotal || 0) * 0.30 }), {} as any),
    av: 0,
    ah: 0,
  });

  // Vendas em Plataformas Digitais (Ifood/99)
  dados.push({
    id: 'vendas-plataformas',
    nome: 'Vendas em Plataformas Digitais (Ifood/99)',
    nivel: 2,
    tipo: 'receita',
    previsao: 0,
    meses: meses.reduce((acc, mes) => ({ ...acc, [mes]: (totaisPorMes[mes]?.receitaTotal || 0) * 0.10 }), {} as any),
    av: 0,
    ah: 0,
  });

  // Sub-itens de Vendas em Plataformas Digitais (Ifood/99)
  const vendasDigitaisItens = [
    'Ifood',
    '99',
    'Outras Despesas'
  ];
  vendasDigitaisItens.forEach((nome, idx) => {
    dados.push({
      id: `vendasDigitais-${idx}`,
      nome,
      nivel: 2,
      tipo: 'despesa',
      previsao: 0,
      meses: meses.reduce((acc, mes) => ({ ...acc, [mes]: 700 }), {} as any),
      av: 0,
      ah: 0,
    });
  });

  // Acertos
  dados.push({
    id: 'acertos-vendas',
    nome: 'Acertos',
    nivel: 2,
    tipo: 'receita',
    previsao: 0,
    meses: meses.reduce((acc, mes) => ({ ...acc, [mes]: (totaisPorMes[mes]?.receitaTotal || 0) * 0.05 }), {} as any),
    av: 0,
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
    isSubtotal: true,
  });

  // Sub-itens de despesas variáveis
  const despesasVarItens = ['Simples Nacional', 'Mercantil', 'IPTU', 'Parcelamento Impostos', 'Imposto Bombeiros', 'Devoluções de Vendas', 'Abatimentos sobre Vendas'];
  despesasVarItens.forEach((nome, idx) => {
    dados.push({
      id: `desp-var-${idx}`,
      nome,
      nivel: 1,
      tipo: 'despesa',
      previsao: 0,
      meses: meses.reduce((acc, mes) => ({ ...acc, [mes]: (despesasVariaveisPorMes[mes] || 0) * 0.15 }), {} as any),
      av: 0,
      ah: 0,
    });
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
    isCalcRow: true,
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
    isSubtotal: true,
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

  // Acerto Despesas
  dados.push({
    id: 'acerto-despesas',
    nome: 'Acerto Despesas',
    nivel: 1,
    tipo: 'despesa',
    previsao: 0,
    meses: meses.reduce((acc, mes) => ({ ...acc, [mes]: (produtosTotaisPorMes[mes] || 0) * 0.05 }), {} as any),
    av: 0,
    ah: 0,
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
    isCalcRow: true,
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
    isSubtotal: true,
  });

  // Tarifas Bancárias
  dados.push({
    id: 'tarifas-bancarias',
    nome: 'Tarifas Bancárias',
    nivel: 1,
    tipo: 'despesa',
    previsao: 0,
    meses: meses.reduce((acc, mes) => ({ ...acc, [mes]: (despesasFixasPorMes[mes] || 0) * 0.2 }), {} as any),
    av: 0,
    ah: 0,
  });

  // Aluguel de Maquinetas
  dados.push({
    id: 'aluguel-maquinas',
    nome: 'Aluguel de Maquinetas',
    nivel: 1,
    tipo: 'despesa',
    previsao: 0,
    meses: meses.reduce((acc, mes) => ({ ...acc, [mes]: (despesasFixasPorMes[mes] || 0) * 0.2 }), {} as any),
    av: 0,
    ah: 0,
  });

  // Empréstimos
  dados.push({
    id: 'emprestimos',
    nome: 'Empréstimos',
    nivel: 1,
    tipo: 'despesa',
    previsao: 0,
    meses: meses.reduce((acc, mes) => ({ ...acc, [mes]: (despesasFixasPorMes[mes] || 0) * 0.1 }), {} as any),
    av: 0,
    ah: 0,
  });

  // Despesas Administrativas (categoria)
  dados.push({
    id: 'despesas-admin',
    nome: 'Despesas Administrativas',
    nivel: 1,
    tipo: 'despesa',
    previsao: 0,
    meses: meses.reduce((acc, mes) => ({ ...acc, [mes]: 0 }), {} as any),
    av: 0,
    ah: 0,
    isHeader: true,
    isSubtotal: true,
  });

  // Adicionar sub-itens de despesas administrativas
  const despAdminItens = ['Aluguel Imóvel', 'Energia (Celpe)', 'Água (Compesa)', 'Internet', 'Telefone', 'Celular', 'Gasolina/Estacionamento/Táxi', 'Outras Despesas'];
  despAdminItens.forEach((nome, idx) => {
    dados.push({
      id: `admin-${idx}`,
      nome,
      nivel: 2,
      tipo: 'despesa',
      previsao: 0,
      meses: meses.reduce((acc, mes) => ({ ...acc, [mes]: (despesasFixasPorMes[mes] || 0) * 0.04 }), {} as any),
      av: 0,
      ah: 0,
    });
  });

  // Despesas com Serviços de Terceiros (categoria)
  dados.push({
    id: 'terceiros',
    nome: 'Despesas com Serviços de Terceiros',
    nivel: 2,
    tipo: 'despesa',
    previsao: 0,
    meses: meses.reduce((acc, mes) => ({ ...acc, [mes]: (despesasFixasPorMes[mes] || 0) * 0.1 }), {} as any),
    av: 0,
    ah: 0,
    isHeader: true,
    isSubtotal: true,
  });

  // Sub-itens de despesas com serviços de terceiros
  const despesasServicoItens = [
    'Contador',
    'TI',
    'Outras Despesas'
  ];
  despesasServicoItens.forEach((nome, idx) => {
    dados.push({
      id: `servico-${idx}`,
      nome,
      nivel: 2,
      tipo: 'despesa',
      previsao: 0,
      meses: meses.reduce((acc, mes) => ({ ...acc, [mes]: 700 }), {} as any),
      av: 0,
      ah: 0,
    });
  });

  // Despesas com Materiais e Equipamentos (categoria)
  dados.push({
    id: 'materiais',
    nome: 'Despesas com Materiais e Equipamentos',
    nivel: 2,
    tipo: 'despesa',
    previsao: 0,
    meses: meses.reduce((acc, mes) => ({ ...acc, [mes]: (despesasFixasPorMes[mes] || 0) * 0.1 }), {} as any),
    av: 0,
    ah: 0,
    isHeader: true,
    isSubtotal: true,
  });

  // Sub-itens de despesas com Materiais e Equipamentos
  const despesasMateriaisItens = [
    'Manutenção de Equipamentos',
    'Softwares',
    'Materiais de Expedientes/Manutenção',
    'Manutenção de Veículos'
  ];
  despesasMateriaisItens.forEach((nome, idx) => {
    dados.push({
      id: `materiais-${idx}`,
      nome,
      nivel: 2,
      tipo: 'despesa',
      previsao: 0,
      meses: meses.reduce((acc, mes) => ({ ...acc, [mes]: 700 }), {} as any),
      av: 0,
      ah: 0,
    });
  });

  // Despesas com Pessoal (categoria)
  dados.push({
    id: 'despesas-pessoal',
    nome: 'Despesas com Pessoal',
    nivel: 1,
    tipo: 'despesa',
    previsao: 0,
    meses: meses.reduce((acc, mes) => ({ ...acc, [mes]: 0 }), {} as any),
    av: 0,
    ah: 0,
    isHeader: true,
    isSubtotal: true,
  });

  // Sub-itens de despesas com pessoal
  const despesasPessoalItens = [
    'Salários de Funcionários',
    'Adiantamento de Salários',
    'Pro-Labore',
    'Bolsa de Estágio',
    'Vale Transporte',
    'Rescisão',
    'Férias de Funcionários',
    '1/3 Férias',
    'FGTS',
    'INSS',
    '13º Salário',
    'INSS Patronal',
    'Outras Despesas'
  ];
  despesasPessoalItens.forEach((nome, idx) => {
    dados.push({
      id: `pessoal-${idx}`,
      nome,
      nivel: 2,
      tipo: 'despesa',
      previsao: 0,
      meses: meses.reduce((acc, mes) => ({ ...acc, [mes]: 700 }), {} as any),
      av: 0,
      ah: 0,
    });
  });

  // Fornecedores (categoria)
  dados.push({
    id: 'fornecedores',
    nome: 'Fornecedores',
    nivel: 1,
    tipo: 'despesa',
    previsao: 0,
    meses: meses.reduce((acc, mes) => ({ ...acc, [mes]: 0 }), {} as any),
    av: 0,
    ah: 0,
    isHeader: true,
    isSubtotal: true,
  });

  // Sub-itens de fornecedores
  const fornecedoresItens = ['Karne Keijo', 'Natto', 'Coca-Cola', 'Outros'];
  fornecedoresItens.forEach((nome, idx) => {
    dados.push({
      id: `fornecedor-${idx}`,
      nome,
      nivel: 2,
      tipo: 'despesa',
      previsao: 0,
      meses: meses.reduce((acc, mes) => ({ ...acc, [mes]: 500 }), {} as any),
      av: 0,
      ah: 0,
    });
  });

  // 7. LUCRO OPERACIONAL ANTES DOS INVESTIMENTOS
  const lucroOperacionalAntesInvPorMes = meses.reduce(
    (acc, mes) => {
      acc[mes] = lucroBrutoPorMes[mes] - (despesasFixasPorMes[mes] || 0);
      return acc;
    },
    {} as Record<string, number>
  );

  dados.push({
    id: 'lucro-operacional-antes',
    nome: 'LUCRO OPERACIONAL ANTES DOS INVESTIMENTOS',
    nivel: 0,
    tipo: 'subtotal',
    previsao: 0,
    meses: lucroOperacionalAntesInvPorMes,
    av: 0,
    ah: 0,
    isBold: true,
    isSubtotal: true,
    isCalcRow: true,
  });

  // INVESTIMENTOS
  dados.push({
    id: 'investimentos',
    nome: 'INVESTIMENTOS',
    nivel: 0,
    tipo: 'despesa',
    previsao: 0,
    meses: meses.reduce((acc, mes) => ({ ...acc, [mes]: (lucroOperacionalAntesInvPorMes[mes] || 0) * 0.05 }), {} as any),
    av: 0,
    ah: 0,
    isBold: true,
    isSubtotal: true,
  });

  // Sub-itens de investimentos
  const investimentos = ['Investimento em Marketing', 'Investimento em Bens Materiais', 'Investimento em Desenvolvimento Empresarial', 'Outros'];
  investimentos.forEach((nome, idx) => {
    dados.push({
      id: `inv-${idx}`,
      nome,
      nivel: 1,
      tipo: 'despesa',
      previsao: 0,
      meses: meses.reduce((acc, mes) => ({ ...acc, [mes]: (lucroOperacionalAntesInvPorMes[mes] || 0) * 0.0125 }), {} as any),
      av: 0,
      ah: 0,
    });
  });

  // TOTAL DESPESA OPERACIONAL
  const totalDespesaOpPorMes = meses.reduce(
    (acc, mes) => {
      acc[mes] = (despesasFixasPorMes[mes] || 0) + (lucroOperacionalAntesInvPorMes[mes] || 0) * 0.05;
      return acc;
    },
    {} as Record<string, number>
  );

  dados.push({
    id: 'total-despesa-op',
    nome: 'TOTAL DESPESA OPERACIONAL',
    nivel: 0,
    tipo: 'despesa',
    previsao: 0,
    meses: totalDespesaOpPorMes,
    av: 0,
    ah: 0,
    isBold: true,
    isSubtotal: true,
    
  });

  // LUCRO OPERACIONAL
  const lucroOperacionalPorMes = meses.reduce(
    (acc, mes) => {
      acc[mes] = (lucroOperacionalAntesInvPorMes[mes] || 0) - (totalDespesaOpPorMes[mes] || 0);
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
    isCalcRow: true,
  });

  // ENTRADAS E SAÍDAS NÃO OPERACIONAIS
  dados.push({
    id: 'nao-operacionais',
    nome: 'ENTRADAS E SAÍDAS NÃO OPERACIONAIS',
    nivel: 0,
    tipo: 'despesa',
    previsao: 0,
    meses: meses.reduce((acc, mes) => ({ ...acc, [mes]: 0 }), {} as any),
    av: 0,
    ah: 0,
    isBold: true,
    isSubtotal: true,
  });

  // Saídas não operacionais
  dados.push({
    id: 'saidas-nao-op',
    nome: 'Saídas não operacionais',
    nivel: 1,
    tipo: 'despesa',
    previsao: 0,
    meses: meses.reduce((acc, mes) => ({ ...acc, [mes]: 0 }), {} as any),
    av: 0,
    ah: 0,
  });

  // LUCRO ANTES DOS JUROS E IMPOSTOS
  const lucroAntesJuroImpostosPorMes = meses.reduce(
    (acc, mes) => {
      acc[mes] = lucroOperacionalPorMes[mes] || 0;
      return acc;
    },
    {} as Record<string, number>
  );

  dados.push({
    id: 'lucro-antes-juros',
    nome: 'LUCRO ANTES DOS JUROS E IMPOSTOS',
    nivel: 0,
    tipo: 'subtotal',
    previsao: 0,
    meses: lucroAntesJuroImpostosPorMes,
    av: 0,
    ah: 0,
    isBold: true,
    isSubtotal: true,
    isCalcRow: true,
  });

  // Despesas Financeiras
  dados.push({
    id: 'despesas-financeiras',
    nome: 'Despesas Financeiras',
    nivel: 1,
    tipo: 'despesa',
    previsao: 0,
    meses: meses.reduce((acc, mes) => ({ ...acc, [mes]: (lucroAntesJuroImpostosPorMes[mes] || 0) * 0.02 }), {} as any),
    av: 0,
    ah: 0,
  });

  // LUCRO ANTES DOS IMPOSTOS
  const lucroAntesImpostosPorMes = meses.reduce(
    (acc, mes) => {
      acc[mes] = (lucroAntesJuroImpostosPorMes[mes] || 0) - (lucroAntesJuroImpostosPorMes[mes] || 0) * 0.02;
      return acc;
    },
    {} as Record<string, number>
  );

  dados.push({
    id: 'lucro-antes-impostos',
    nome: 'LUCRO ANTES DOS IMPOSTOS',
    nivel: 0,
    tipo: 'subtotal',
    previsao: 0,
    meses: lucroAntesImpostosPorMes,
    av: 0,
    ah: 0,
    isBold: true,
    isSubtotal: true,
    isCalcRow: true,
  });

  // CSLL e IR
  dados.push({
    id: 'csll',
    nome: 'Despesa Contribuição Social sobre Lucros (CSLL)',
    nivel: 1,
    tipo: 'despesa',
    previsao: 0,
    meses: meses.reduce((acc, mes) => ({ ...acc, [mes]: (lucroAntesImpostosPorMes[mes] || 0) * 0.09 }), {} as any),
    av: 0,
    ah: 0,
  });

  dados.push({
    id: 'ir',
    nome: 'Despesa com Imposto de Renda',
    nivel: 1,
    tipo: 'despesa',
    previsao: 0,
    meses: meses.reduce((acc, mes) => ({ ...acc, [mes]: (lucroAntesImpostosPorMes[mes] || 0) * 0.05 }), {} as any),
    av: 0,
    ah: 0,
  });

  // LUCRO LÍQUIDO
  const lucroLiquidoPorMes = meses.reduce(
    (acc, mes) => {
      acc[mes] = (lucroAntesImpostosPorMes[mes] || 0) * 0.86;
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