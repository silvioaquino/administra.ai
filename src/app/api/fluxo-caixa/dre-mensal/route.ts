import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Estrutura de categorias do DRE baseado na planilha
const CATEGORIAS_RECEITA = [
  { codigo: '3.1', nome: 'Receita de Vendas', grupo: 'RECEITA' },
  { codigo: '3.1.1', nome: 'Receita com Cash - Diaria', grupo: 'RECEITA' },
  { codigo: '3.1.2', nome: 'Receita com Cartão (Caixa)', grupo: 'RECEITA' },
  { codigo: '3.1.3', nome: 'Receita Ifood', grupo: 'RECEITA' },
  { codigo: '3.1.4', nome: 'Receita com Cartão - (Infinity Emp)', grupo: 'RECEITA' },
  { codigo: '3.1.5', nome: 'Receita com Cartão - (Infinity Sil)', grupo: 'RECEITA' },
  { codigo: '3.1.10', nome: 'Acerto', grupo: 'RECEITA' },
];

const CATEGORIAS_CUSTOS_VARIAVEIS = [
  { codigo: '4.1', nome: 'Custos Tributários e Financeiros', grupo: 'CUSTO' },
  { codigo: '4.1.1', nome: 'Simples Federal', grupo: 'CUSTO' },
  { codigo: '4.1.2', nome: 'Mercantil', grupo: 'CUSTO' },
  { codigo: '4.1.3', nome: 'IPTU', grupo: 'CUSTO' },
  { codigo: '4.1.4', nome: 'FGTS', grupo: 'CUSTO' },
  { codigo: '4.1.5', nome: 'INSS', grupo: 'CUSTO' },
  { codigo: '4.1.6', nome: 'Parcelamento Imposto', grupo: 'CUSTO' },
];

const CATEGORIAS_INSUMOS = [
  { codigo: '4.2', nome: 'Custos com Produtos/Insumos', grupo: 'CUSTO' },
  { codigo: '4.2.1', nome: 'Insumos', grupo: 'CUSTO_DETALHE' },
];

const CATEGORIAS_DESPESAS_FIXAS = [
  { codigo: '5.1', nome: 'Despesas Financeiras', grupo: 'DESPESA_FIXA' },
  { codigo: '5.1.1', nome: 'Tarifas Bancárias', grupo: 'DESPESA_FIXA_DETALHE' },
  { codigo: '5.1.2', nome: 'Aluguel e tarifas Operadora Cartão', grupo: 'DESPESA_FIXA_DETALHE' },
  { codigo: '5.1.5', nome: 'Emprestimos', grupo: 'DESPESA_FIXA_DETALHE' },
  { codigo: '5.1.6', nome: 'Imposto Bombeiros', grupo: 'DESPESA_FIXA_DETALHE' },
  { codigo: '5.2', nome: 'Despesas Administrativas', grupo: 'DESPESA_FIXA' },
  { codigo: '5.2.1', nome: 'Telefones', grupo: 'DESPESA_FIXA_DETALHE' },
  { codigo: '5.2.2', nome: 'Celular', grupo: 'DESPESA_FIXA_DETALHE' },
  { codigo: '5.2.3', nome: 'Energia Elétrica (CELPE)', grupo: 'DESPESA_FIXA_DETALHE' },
  { codigo: '5.2.4', nome: 'Aluguel', grupo: 'DESPESA_FIXA_DETALHE' },
  { codigo: '5.2.5', nome: 'Água(COMPESA)', grupo: 'DESPESA_FIXA_DETALHE' },
  { codigo: '5.2.6', nome: 'Gasolina / Estacionamento / Táxi', grupo: 'DESPESA_FIXA_DETALHE' },
  { codigo: '5.2.7', nome: 'Taxa Antecipação Ifood', grupo: 'DESPESA_FIXA_DETALHE' },
  { codigo: '5.2.9', nome: 'Carro', grupo: 'DESPESA_FIXA_DETALHE' },
  { codigo: '5.2.10', nome: 'Outras despesas administrativas', grupo: 'DESPESA_FIXA_DETALHE' },
  { codigo: '5.2.11', nome: 'Internet', grupo: 'DESPESA_FIXA_DETALHE' },
  { codigo: '5.2.12', nome: 'IPVA', grupo: 'DESPESA_FIXA_DETALHE' },
  { codigo: '5.2.13', nome: 'Botijão de gás', grupo: 'DESPESA_FIXA_DETALHE' },
  { codigo: '5.3', nome: 'Despesas com Pessoal', grupo: 'DESPESA_FIXA' },
  { codigo: '5.3.1', nome: 'Salário de Funcionários', grupo: 'DESPESA_FIXA_DETALHE' },
  { codigo: '5.3.2', nome: 'Bolsa de Estágio', grupo: 'DESPESA_FIXA_DETALHE' },
  { codigo: '5.3.3', nome: 'Vale Transporte (Passagem)', grupo: 'DESPESA_FIXA_DETALHE' },
  { codigo: '5.3.4', nome: 'Rescisão', grupo: 'DESPESA_FIXA_DETALHE' },
  { codigo: '5.3.5', nome: 'Pro-Labores', grupo: 'DESPESA_FIXA_DETALHE' },
  { codigo: '5.3.6', nome: 'Adiantamento Salarios', grupo: 'DESPESA_FIXA_DETALHE' },
  { codigo: '5.3.7', nome: 'Outras despesas com pessoal', grupo: 'DESPESA_FIXA_DETALHE' },
  { codigo: '5.3.8', nome: 'Ferias Funcionarios', grupo: 'DESPESA_FIXA_DETALHE' },
  { codigo: '5.4', nome: 'Despesas com Serviços de Terceiros', grupo: 'DESPESA_FIXA' },
  { codigo: '5.4.1', nome: 'Contador', grupo: 'DESPESA_FIXA_DETALHE' },
  { codigo: '5.4.2', nome: 'TI', grupo: 'DESPESA_FIXA_DETALHE' },
  { codigo: '5.4.3', nome: 'Outras Despesas', grupo: 'DESPESA_FIXA_DETALHE' },
  { codigo: '5.5', nome: 'Despesas com Materiais e Equipamentos', grupo: 'DESPESA_FIXA' },
  { codigo: '5.5.1', nome: 'Manutenção Equipamentos Informática', grupo: 'DESPESA_FIXA_DETALHE' },
  { codigo: '5.5.2', nome: 'Softwares', grupo: 'DESPESA_FIXA_DETALHE' },
  { codigo: '5.5.3', nome: 'Materiais de Expediente/Manutenção/Limpeza', grupo: 'DESPESA_FIXA_DETALHE' },
  { codigo: '5.5.4', nome: 'Manutenção Veículo', grupo: 'DESPESA_FIXA_DETALHE' },
  { codigo: '5.6', nome: 'OUTROS FORNECEDORES', grupo: 'DESPESA_FIXA' },
  { codigo: '5.6.1', nome: 'Karne Keijo', grupo: 'DESPESA_FIXA_DETALHE' },
  { codigo: '5.6.2', nome: 'Natto', grupo: 'DESPESA_FIXA_DETALHE' },
  { codigo: '5.6.3', nome: 'Coca-Cola', grupo: 'DESPESA_FIXA_DETALHE' },
];

const CATEGORIAS_INVESTIMENTOS = [
  { codigo: '6.1', nome: 'Investimentos em Marketing', grupo: 'INVESTIMENTO' },
  { codigo: '6.2', nome: 'Investimentos em Bens Materiais', grupo: 'INVESTIMENTO' },
  { codigo: '6.3', nome: 'Investimentos em Desenvolvimento Empresarial', grupo: 'INVESTIMENTO' },
  { codigo: '6.4', nome: 'Outros investimentos', grupo: 'INVESTIMENTO' },
];

const CATEGORIAS_NAO_OPERACIONAIS = [
  { codigo: '7.1', nome: 'Entradas não operacionais', grupo: 'NAO_OPERACIONAL' },
  { codigo: '7.2', nome: 'Saídas não operacionais', grupo: 'NAO_OPERACIONAL' },
];

const CONTAS_FINAL = [
  { codigo: 'MARGEM', nome: 'MARGEM DE CONTRIBUIÇÃO', grupo: 'CALCULO' },
  { codigo: 'LUCRO_ANTE', nome: 'LUCRO OPERACIONAL ANTES DOS INVESTIMENTOS', grupo: 'CALCULO' },
  { codigo: 'DESP_ANT', nome: 'DESPESA OPERACIONAL TOTAL', grupo: 'CALCULO' },
  { codigo: 'LUCRO_OP', nome: 'LUCRO OPERACIONAL', grupo: 'CALCULO' },
  { codigo: 'RESULTADO', nome: 'RESULTADO LÍQUIDO', grupo: 'CALCULO' },
];

// GET - Buscar DRE completo com categorias
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const ano = parseInt(searchParams.get('ano') || new Date().getFullYear().toString());

  try {
    // Buscar todos os lançamentos do ano
    const lancamentos = await prisma.livroDiario.findMany({
      where: {
        userId: session.user.id,
        data: {
          gte: new Date(ano, 0, 1),
          lte: new Date(ano, 11, 31),
        },
      },
    });

    // Buscar metas do ano para calcular as previsões
    const metas = await prisma.metaFluxoCaixa.findMany({
      where: {
        userId: session.user.id,
        ano,
      },
    });

    // Buscar produtos/insumos do ano para categorizar automaticamente
    const produtos = await prisma.produto.findMany({
      where: {
        userId: session.user.id,
        dataCompra: {
          gte: new Date(ano, 0, 1),
          lte: new Date(ano, 11, 31),
        },
      },
    });

    // Agrupar valores por mês
    const valoresPorMes: Record<number, Record<string, number>> = {};
    for (let i = 1; i <= 12; i++) {
      valoresPorMes[i] = {};
    }

    // Processar lançamentos do livro diário
    lancamentos.forEach(lanc => {
      const mes = lanc.data.getMonth() + 1;
      const valor = Number(lanc.entrada || lanc.saida);
      const codigo = lanc.conta?.split(' ')[0] || '';

      if (!valoresPorMes[mes][codigo]) {
        valoresPorMes[mes][codigo] = 0;
      }

      // Se for receita, soma entrada; se for despesa, soma saída
      if (lanc.tipo === 'VENDA' || lanc.tipo === 'RECEITA') {
        valoresPorMes[mes][codigo] += valor;
      } else {
        valoresPorMes[mes][codigo] += valor;
      }
    });

    // Processar produtos/insumos para valores (todos como INSUMOS)
    // Isso garante que insumos são contabilizados mesmo sem lançamento manual
    const valoresInsumosPorMes: Record<number, number> = {};
    for (let i = 1; i <= 12; i++) {
      valoresInsumosPorMes[i] = 0;
    }

    for (const produto of produtos) {
      if (produto.dataCompra) {
        const mes = produto.dataCompra.getMonth() + 1;
        const valor = Number(produto.valorTotal || 0);
        valoresInsumosPorMes[mes] += valor;
      }
    }

    // Construir estrutura DRE mensal
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
    ];

    const dreMensal = meses.map((mesNome, idx) => {
      const mesNum = idx + 1;
      const metaMes = metas.find(m => m.mes === mesNum);
      const previsaoTotal = metaMes
        ? Number(metaMes.metaFaturamentoDiaria || 0) * (metaMes.diasUteis || 30)
        : 0;

      // Calcular valores de insumos (todos como INSUMOS)
      const totalInsumos = valoresInsumosPorMes[mesNum] || 0;

      const dadosMes: any = {
        mes: mesNum,
        nome: mesNome,
        previsao: previsaoTotal,
        realizado: valoresPorMes[mesNum]['3.1'] || 0,
        // Total de custos com produtos/insumos (código 4.2)
        cmv: totalInsumos || valoresPorMes[mesNum]['4.2'] || 0,
        // Detalhamento dos códigos específicos
        '4.2.1': totalInsumos || valoresPorMes[mesNum]['4.2.1'] || 0,
        despesasVariaveis: valoresPorMes[mesNum]['4.1'] || 0,
        despesasFixas: valoresPorMes[mesNum]['5.1'] || valoresPorMes[mesNum]['5.2'] || valoresPorMes[mesNum]['5.3'] || 0,
        lucroOperacional: {
          previsao: previsaoTotal - (totalInsumos || 0) - (valoresPorMes[mesNum]['5.1'] || 0),
          realizado: 0,
        },
      };

      return dadosMes;
    });

    // Calcular totais anuais para Análise Vertical
    const totalAno = {
      previsao: dreMensal.reduce((sum, m) => sum + m.previsao, 0),
      realizado: dreMensal.reduce((sum, m) => sum + m.realizado, 0),
      insumosPorCategoria: {
        INSUMO: dreMensal.reduce((sum, m) => sum + m.cmv, 0),
      },
    };

    // Agrupar produtos por descrição com valores por mês
    const produtosAgrupados: Record<string, { id: number; descricao: string; valoresPorMes: Record<number, number>; origem: string }[]> = {};
    for (const produto of produtos) {
      if (produto.dataCompra) {
        const mes = produto.dataCompra.getMonth() + 1;
        const valor = Number(produto.valorTotal || 0);
        const descricaoNormalizada = produto.descricao.trim().toLowerCase();

        if (!produtosAgrupados[descricaoNormalizada]) {
          produtosAgrupados[descricaoNormalizada] = [];
        }

        // Encontrar se já existe um registro para essa descrição
        let registro = produtosAgrupados[descricaoNormalizada][0];
        if (!registro) {
          registro = {
            id: produto.id,
            descricao: produto.descricao,
            valoresPorMes: {},
            origem: produto.notaFiscalId ? 'NFC-e' : 'Manual'
          };
          produtosAgrupados[descricaoNormalizada][0] = registro;
        }

        // Somar valor ao mês correspondente
        registro.valoresPorMes[mes] = (registro.valoresPorMes[mes] || 0) + valor;
      }
    }

    // Converter para array
    const produtosPorMes = Object.values(produtosAgrupados).map(arr => arr[0]);

    // Adicionar Análise Vertical e Horizontal
    dreMensal.forEach((mes, idx) => {
      mes.avPrevisao = totalAno.previsao > 0 ? (mes.previsao / totalAno.previsao) * 100 : 0;
      mes.avRealizado = totalAno.realizado > 0 ? (mes.realizado / totalAno.realizado) * 100 : 0;

      // Análise Horizontal - comparação com mês anterior
      if (idx > 0) {
        const mesAnterior = dreMensal[idx - 1];
        mes.ahPrevisao = mesAnterior.previsao > 0 ? ((mes.previsao - mesAnterior.previsao) / mesAnterior.previsao) * 100 : 0;
        mes.ahRealizado = mesAnterior.realizado > 0 ? ((mes.realizado - mesAnterior.realizado) / mesAnterior.realizado) * 100 : 0;
      } else {
        mes.ahPrevisao = 0;
        mes.ahRealizado = 0;
      }
    });

    return NextResponse.json({
      success: true,
      data: dreMensal,
      totaisAno: totalAno,
      produtosPorMes,
      categorias: {
        receita: CATEGORIAS_RECEITA,
        custosVariaveis: CATEGORIAS_CUSTOS_VARIAVEIS,
        insumos: CATEGORIAS_INSUMOS,
        despesasFixas: CATEGORIAS_DESPESAS_FIXAS,
        investimentos: CATEGORIAS_INVESTIMENTOS,
        naoOperacionais: CATEGORIAS_NAO_OPERACIONAIS,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar DRE mensal:', error);
    return NextResponse.json({ error: 'Erro ao buscar DRE mensal' }, { status: 500 });
  }
}