import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface ProdutividadeMensal {
  mes: number;
  ano: number;
  mesNome: string;
  faturamento: number;
  cmv: number;
  taxasCartao: number;
  outrosCustosVariaveis: number;
  custosVariaveisTotais: number;
  funcionarios: number;
  produtividade: number;
}

// Taxas padrão de cartão (valores percentuais)
const TAXAS_CARTAO_DEFAULT = {
  debito: { infinitepay: 1.37, stone: 2.34, caixa: 4.48 },
  credito: { infinitepay: 3.15, stone: 6.44, caixa: 5.78 },
  voucher: 7.0,
};

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.empresaId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const empresaId = session.user.empresaId;
  const userId = session.user.id;
  const anoParam = request.nextUrl.searchParams.get('ano');
  const anoAtual = new Date().getFullYear();
  const ano = anoParam ? parseInt(anoParam) : anoAtual;

  try {
    // Buscar dados de funcionários
    const funcionariosAtivos = await prisma.funcionario.count({
      where: { empresaId },
    });

    // Buscar configuração de taxas de cartão
    const taxasConfig = await prisma.taxasCartaoConfig.findUnique({
      where: { userId },
    });

    // Buscar configuração de planejamento para percentuais
    const planejamentoConfig = await prisma.planejamentoConfig.findFirst({
      where: { userId, tipo: 'despesas_variaveis', anoReferencia: ano },
    });

    const mesesData: ProdutividadeMensal[] = [];
    const mesesNome = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];

    const dataAtual = new Date();
    const mesAtual = dataAtual.getMonth();

    for (let i = 11; i >= 0; i--) {
      // Calcular mês e ano de forma mais simples
      const mesIndex = (mesAtual - i + 12) % 12;
      const anoRef = mesAtual - i < 0 ? ano - 1 : ano;
      const mes = mesIndex + 1;

      // Calcular faturamento do mês
      const faturamentoResult = await prisma.livroDiario.aggregate({
        where: {
          empresaId,
          data: {
            gte: new Date(anoRef, mes - 1, 1),
            lte: new Date(anoRef, mes, 0),
          },
          tipo: { in: ['VENDA', 'RECEITA'] },
        },
        _sum: { entrada: true },
      });

      const faturamento = Number(faturamentoResult._sum.entrada || 0);

      // Calcular CMV (custo dos insumos/produtos)
      // Buscar produtos comprados no mês
      const produtosResult = await prisma.produto.aggregate({
        where: {
          empresaId,
          dataCompra: {
            gte: new Date(anoRef, mes - 1, 1),
            lte: new Date(anoRef, mes, 0),
          },
        },
        _sum: { valorTotal: true },
      });

      const cmv = Number(produtosResult._sum.valorTotal || 0);

      // Calcular taxas de cartão variáveis
      let taxasCartao = 0;
      if (faturamento > 0) {
        const taxasConfigJson = taxasConfig?.config as {
          debito: { infinitepay: number; stone: number; caixa: number };
          credito: { infinitepay: number; stone: number; caixa: number };
          voucher: number;
        } | undefined;
        const taxas = taxasConfigJson || TAXAS_CARTAO_DEFAULT;
        const percDebito = 40; // distribuicaoVendas default
        const percCredito = 50;
        const percVoucher = 10;

        // Calcular taxa média ponderada
        const mediaDebito = Object.values(taxas.debito || TAXAS_CARTAO_DEFAULT.debito)
          .reduce((sum: number, val: number) => sum + val, 0) / 3;
        const mediaCredito = Object.values(taxas.credito || TAXAS_CARTAO_DEFAULT.credito)
          .reduce((sum: number, val: number) => sum + val, 0) / 3;

        taxasCartao = faturamento * (
          (mediaDebito * percDebito / 100) +
          (mediaCredito * percCredito / 100) +
          (taxas.voucher * percVoucher / 100)
        ) / 100;
      }

      // Outros custos variáveis (manutenção, serviços que variam com vendas)
      let outrosCustosVariaveis = 0;
      if (planejamentoConfig?.dados) {
        const dados = planejamentoConfig.dados as any;
        outrosCustosVariaveis = (dados.manutencao || 0) * faturamento / 100;
      }

      // Custos variáveis totais
      const custosVariaveisTotais = cmv + taxasCartao + outrosCustosVariaveis;

      // Calcular produtividade
      const produtividade = funcionariosAtivos > 0
        ? (faturamento - custosVariaveisTotais) / funcionariosAtivos
        : 0;

      mesesData.push({
        mes,
        ano: anoRef,
        mesNome: `${mesesNome[mes - 1]}/${anoRef.toString().slice(-2)}`,
        faturamento,
        cmv,
        taxasCartao,
        outrosCustosVariaveis,
        custosVariaveisTotais,
        funcionarios: funcionariosAtivos,
        produtividade,
      });
    }

    return NextResponse.json({
      success: true,
      data: mesesData,
    });
  } catch (error) {
    console.error('Erro ao calcular produtividade mensal:', error);
    return NextResponse.json(
      { error: 'Erro ao calcular produtividade mensal' },
      { status: 500 }
    );
  }
}