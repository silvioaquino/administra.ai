import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Categorias padrão do sistema (baseadas nas definidas no fluxo-caixa)
const CATEGORIAS_PADRAO = {
  receita: [
    { codigo: '3.1', nome: 'Receita de Vendas', nivel: 1, tipo: 'receita' },
    { codigo: '3.1.1', nome: 'Receitas de Vendas', nivel: 2, tipo: 'receita' },
    { codigo: '3.1.2', nome: 'Vendas em Dinheiro', nivel: 3, tipo: 'receita' },
    { codigo: '3.1.3', nome: 'Maquineta Stone', nivel: 3, tipo: 'receita' },
    { codigo: '3.1.4', nome: 'Maquineta Caixa', nivel: 3, tipo: 'receita' },
    { codigo: '3.1.5', nome: 'Maquineta Infinity', nivel: 3, tipo: 'receita' },
    { codigo: '3.1.6', nome: 'Vendas em Cartão Débito', nivel: 2, tipo: 'receita' },
    { codigo: '3.1.7', nome: 'Maquineta Stone', nivel: 3, tipo: 'receita' },
    { codigo: '3.1.8', nome: 'Maquineta Caixa', nivel: 3, tipo: 'receita' },
    { codigo: '3.1.9', nome: 'Maquineta Infinity', nivel: 3, tipo: 'receita' },
    { codigo: '3.1.10', nome: 'Vendas em Cartão Crédito', nivel: 2, tipo: 'receita' },
    { codigo: '3.1.11', nome: 'Maquineta Stone', nivel: 3, tipo: 'receita' },
    { codigo: '3.1.12', nome: 'Maquineta Caixa', nivel: 3, tipo: 'receita' },
    { codigo: '3.1.13', nome: 'Maquineta Infinity', nivel: 3, tipo: 'receita' },
    { codigo: '3.1.14', nome: 'Vendas em Plataformas Digitais', nivel: 2, tipo: 'receita' },
    { codigo: '3.1.15', nome: 'Acertos', nivel: 2, tipo: 'receita' },
  ],
  despesas: [
    // CUSTOS VARIÁVEIS
    { codigo: '4.1', nome: 'CUSTOS VARIÁVEIS', nivel: 0, tipo: 'despesa', isHeader: true },
    { codigo: '4.1.1', nome: 'Simples Nacional', nivel: 1, tipo: 'despesa' },
    { codigo: '4.1.2', nome: 'Mercantil', nivel: 1, tipo: 'despesa' },
    { codigo: '4.1.3', nome: 'IPTU', nivel: 1, tipo: 'despesa' },
    { codigo: '4.1.4', nome: 'Parcelamento Impostos', nivel: 1, tipo: 'despesa' },
    { codigo: '4.1.5', nome: 'Imposto Bombeiros', nivel: 1, tipo: 'despesa' },
    { codigo: '4.1.6', nome: 'Devoluções de Vendas', nivel: 1, tipo: 'despesa' },
    { codigo: '4.1.7', nome: 'Abatimentos sobre Vendas', nivel: 1, tipo: 'despesa' },
    // CUSTOS COM PRODUTOS/INSUMOS
    { codigo: '4.2', nome: 'CUSTOS COM PRODUTOS/INSUMOS', nivel: 0, tipo: 'despesa', isHeader: true },
    { codigo: '4.3.1', nome: 'Produtos/Insumos', nivel: 1, tipo: 'despesa' },
    { codigo: '4.3.2', nome: 'Acerto Despesas', nivel: 1, tipo: 'despesa' },
    // DESPESAS FIXAS
    { codigo: '5.1', nome: 'DESPESAS FIXAS', nivel: 0, tipo: 'despesa', isHeader: true },
    { codigo: '5.1.1', nome: 'Tarifas Bancárias', nivel: 1, tipo: 'despesa' },
    { codigo: '5.1.2', nome: 'Aluguel de Maquinetas', nivel: 1, tipo: 'despesa' },
    { codigo: '5.1.3', nome: 'Empréstimos', nivel: 1, tipo: 'despesa' },
    { codigo: '5.2.1', nome: 'Aluguel Imóvel', nivel: 1, tipo: 'despesa' },
    { codigo: '5.2.2', nome: 'Energia (Celpe)', nivel: 1, tipo: 'despesa' },
    { codigo: '5.2.3', nome: 'Água (Compesa)', nivel: 1, tipo: 'despesa' },
    { codigo: '5.2.4', nome: 'Internet', nivel: 1, tipo: 'despesa' },
    { codigo: '5.2.5', nome: 'Telefone', nivel: 1, tipo: 'despesa' },
    { codigo: '5.2.6', nome: 'Celular', nivel: 1, tipo: 'despesa' },
    { codigo: '5.2.7', nome: 'Gasolina/Estacionamento/Táxi', nivel: 1, tipo: 'despesa' },
    { codigo: '5.2.8', nome: 'Financiamento Carro', nivel: 1, tipo: 'despesa' },
    { codigo: '5.2.9', nome: 'IPVA', nivel: 1, tipo: 'despesa' },
    { codigo: '5.2.10', nome: 'Botijão de Gás', nivel: 1, tipo: 'despesa' },
    { codigo: '5.2.11', nome: 'Outras Despesas', nivel: 1, tipo: 'despesa' },
    { codigo: '5.2.12', nome: 'Acertos', nivel: 1, tipo: 'despesa' },
    // DESPESAS COM PESSOAIS
    { codigo: '5.3', nome: 'Despesas com Pessoal', nivel: 0, tipo: 'despesa', isHeader: true },
    { codigo: '5.3.1', nome: 'Salários de Funcionários', nivel: 1, tipo: 'despesa' },
    { codigo: '5.3.2', nome: 'Adiantamento de Salários', nivel: 1, tipo: 'despesa' },
    { codigo: '5.3.3', nome: 'Pro-Labore', nivel: 1, tipo: 'despesa' },
    { codigo: '5.3.4', nome: 'Bolsa de Estágio', nivel: 1, tipo: 'despesa' },
    { codigo: '5.3.5', nome: 'Vale Transporte', nivel: 1, tipo: 'despesa' },
    { codigo: '5.3.6', nome: 'Rescisão', nivel: 1, tipo: 'despesa' },
    { codigo: '5.3.7', nome: 'Outras Despesas', nivel: 1, tipo: 'despesa' },
    { codigo: '5.3.8', nome: 'Ferias Funcionários', nivel: 1, tipo: 'despesa' },
    // PROVISÕES
    { codigo: '5.4', nome: 'PROVISÕES', nivel: 0, tipo: 'despesa', isHeader: true },
    { codigo: '5.4.1', nome: 'Férias de Funcionários', nivel: 1, tipo: 'despesa' },
    { codigo: '5.4.2', nome: '1/3 Férias', nivel: 1, tipo: 'despesa' },
    { codigo: '5.4.3', nome: 'FGTS', nivel: 1, tipo: 'despesa' },
    { codigo: '5.4.4', nome: 'INSS', nivel: 1, tipo: 'despesa' },
    { codigo: '5.4.5', nome: '13º Salário', nivel: 1, tipo: 'despesa' },
    { codigo: '5.4.6', nome: 'INSS Patronal', nivel: 1, tipo: 'despesa' },
    // Despesas com Serviços de Terceiros
    { codigo: '5.5', nome: 'Despesas com Serviços de Terceiros', nivel: 0, tipo: 'despesa', isHeader: true },
    { codigo: '5.5.1', nome: 'Contador', nivel: 1, tipo: 'despesa' },
    { codigo: '5.5.2', nome: 'TI', nivel: 1, tipo: 'despesa' },
    { codigo: '5.5.3', nome: 'Outras Despesas', nivel: 1, tipo: 'despesa' },
    // Despesas com Materiais e Equipamentos
    { codigo: '5.6', nome: 'Despesas com Materiais e Equipamentos', nivel: 0, tipo: 'despesa', isHeader: true },
    { codigo: '5.6.1', nome: 'Manutenção de Equipamentos', nivel: 1, tipo: 'despesa' },
    { codigo: '5.6.2', nome: 'Softwares', nivel: 1, tipo: 'despesa' },
    { codigo: '5.6.3', nome: 'Materiais de Expediente/Manutenção/Limpeza', nivel: 1, tipo: 'despesa' },
    { codigo: '5.6.4', nome: 'Manutenção de Veículos', nivel: 1, tipo: 'despesa' },
    // Fornecedores
    { codigo: '5.7', nome: 'Fornecedores', nivel: 0, tipo: 'despesa', isHeader: true },
    { codigo: '5.7.1', nome: 'Karne Keijo', nivel: 1, tipo: 'despesa' },
    { codigo: '5.7.2', nome: 'Natto', nivel: 1, tipo: 'despesa' },
    { codigo: '5.7.3', nome: 'Coca-Cola', nivel: 1, tipo: 'despesa' },
    { codigo: '5.7.4', nome: 'Outros', nivel: 1, tipo: 'despesa' },
    // INVESTIMENTOS
    { codigo: '6.1', nome: 'INVESTIMENTOS', nivel: 0, tipo: 'despesa', isHeader: true },
    { codigo: '6.1.1', nome: 'Investimento em Marketing', nivel: 1, tipo: 'despesa' },
    { codigo: '6.1.2', nome: 'Investimento em Bens Materiais', nivel: 1, tipo: 'despesa' },
    { codigo: '6.1.3', nome: 'Investimento em Desenvolvimento Empresarial', nivel: 1, tipo: 'despesa' },
    { codigo: '6.1.4', nome: 'Outros', nivel: 1, tipo: 'despesa' },
  ],
};

export interface CategoriaItem {
  codigo: string;
  nome: string;
  nivel: number;
  tipo: 'receita' | 'despesa';
  isHeader?: boolean;
}

// GET - Buscar todas as categorias
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const empresaId = session.user.empresaId;
  if (!empresaId) {
    return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get('tipo') as 'receita' | 'despesa' | null;
  const nivel = searchParams.get('nivel');
  const codigoPai = searchParams.get('codigo_pai');

  try {
    // Buscar categorias personalizadas do banco
    let whereClause: any = { empresaId };

    const categoriasPersonalizadas = await prisma.categoria.findMany({
      where: whereClause,
      orderBy: { codigo: 'asc' },
    });

    // Combinar com categorias padrão
    const todasCategorias: CategoriaItem[] = [
      ...CATEGORIAS_PADRAO.despesas.map(c => ({ ...c, tipo: c.tipo as 'receita' | 'despesa' })),
      ...CATEGORIAS_PADRAO.receita.map(c => ({ ...c, tipo: c.tipo as 'receita' | 'despesa' })),
      ...categoriasPersonalizadas.map((c: any) => ({
        codigo: c.codigo,
        nome: c.nome,
        nivel: c.nivel,
        tipo: c.tipo as 'receita' | 'despesa',
        isHeader: c.isHeader,
      })),
    ];

    // Aplicar filtros
    let resultado = todasCategorias;

    if (tipo) {
      resultado = resultado.filter((c) => c.tipo === tipo);
    }

    if (nivel) {
      const nivelNum = parseInt(nivel);
      resultado = resultado.filter((c) => c.nivel === nivelNum);
    }

    if (codigoPai) {
      resultado = resultado.filter((c) => c.codigo.startsWith(codigoPai));
    }

    return NextResponse.json({
      success: true,
      data: tipo ? resultado : { receita: CATEGORIAS_PADRAO.receita, despesas: resultado },
    });
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar categorias' },
      { status: 500 }
    );
  }
}

// POST - Criar nova categoria
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const empresaId = session.user.empresaId;
  if (!empresaId) {
    return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { codigo, nome, nivel, tipo, isHeader, parentId } = body;

    if (!nome || !nivel || !tipo) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: nome, nivel, tipo' },
        { status: 400 }
      );
    }

    // Gerar código automaticamente se não for fornecido
    let codigoFinal = codigo;
    if (!codigoFinal) {
      // Determinar o próximo código baseado no nível
      const ultimaCategoria = await prisma.categoria.findFirst({
        where: { nivel },
        orderBy: { codigo: 'desc' },
      });

      if (ultimaCategoria) {
        const partes = ultimaCategoria.codigo.split('.');
        const ultimoNumero = parseInt(partes[partes.length - 1]);
        codigoFinal = `${partes.slice(0, -1).join('.')}.${ultimoNumero + 1}`;
      } else {
        // Código inicial baseado no nível
        codigoFinal = nivel === 1 ? '1' : nivel === 2 ? '1.1' : '1.1.1';
      }
    }

    const categoria = await prisma.categoria.create({
      data: {
        empresaId,
        codigo: codigoFinal,
        nome,
        nivel,
        tipo,
        isHeader: isHeader || false,
        parentId: parentId || null,
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: categoria,
    });
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    return NextResponse.json(
      { error: 'Erro ao criar categoria' },
      { status: 500 }
    );
  }
}