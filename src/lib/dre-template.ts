/**
 * Template canônico da hierarquia do DRE (Fluxo de Caixa).
 *
 * ÚNICA fonte de verdade para a estrutura do DRE. Antes existiam 3 listas
 * duplicadas (page.tsx CATEGORIAS_DESPESAS, /api/dre const, /api/fluxo-caixa/dre-mensal
 * CATEGORIAS_*). Agora todas importam daqui.
 *
 * Regras:
 * - Folha `fonte` (apenas em folhas): de onde vir o valor REAL no banco.
 * - Folha `calc` (apenas em nós calculados): como obter o valor.
 *     tipo 'sum'  => soma de todos os descendentes (folhas ou calc).
 *     tipo 'formula' => combinação explícita: add (+) e sub (-) por código.
 * - Linhas calculadas NUNCA usam % fixas nem literais — só somam dados reais.
 */

export type DreFonte =
  | 'livro' // classificado de livroDiario por prefixo de código em `conta`
  | 'insumos' // produto.valorTotal agrupado por dataCompra
  | 'despesasFixas' // despesaFixa pareada por nome
  | 'pessoal' // funcionario + provisoes
  | 'provisoes' // provisaoFuncionario / planejamentoFolhaSalarial
  | 'retiradas'; // retirada (não operacional)

export interface DreNoCalc {
  tipo: 'sum';
}
export interface DreNoFormula {
  tipo: 'formula';
  add?: string[]; // códigos somados (+)
  sub?: string[]; // códigos subtraídos (-)
}

export interface DreNo {
  codigo: string;
  nome: string;
  nivel: number;
  tipo: 'receita' | 'despesa';
  isHeader?: boolean;
  // Apenas folhas:
  fonte?: DreFonte;
  // Apenas nós calculados:
  calc?: DreNoCalc | DreNoFormula;
}

export const MESES = [
  'janeiro',
  'fevereiro',
  'marco',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
] as const;

export type DreMes = (typeof MESES)[number];

export const DRE_TEMPLATE: DreNo[] = [
  // ===================== RECEITA =====================
  { codigo: '3.1', nome: 'RECEITA / FATURAMENTO', nivel: 0, tipo: 'receita', isHeader: true, calc: { tipo: 'sum' } },
  { codigo: '3.1.1', nome: 'Receitas de Vendas', nivel: 1, tipo: 'receita', isHeader: true, calc: { tipo: 'sum' } },
  { codigo: '3.1.2', nome: 'Vendas em Dinheiro', nivel: 2, tipo: 'receita', fonte: 'livro' },
  { codigo: '3.1.3', nome: 'Maquineta Stone', nivel: 3, tipo: 'receita', fonte: 'livro' },
  { codigo: '3.1.4', nome: 'Maquineta Caixa', nivel: 3, tipo: 'receita', fonte: 'livro' },
  { codigo: '3.1.5', nome: 'Maquineta Infinity', nivel: 3, tipo: 'receita', fonte: 'livro' },
  { codigo: '3.1.6', nome: 'Vendas em Cartão Débito', nivel: 2, tipo: 'receita', fonte: 'livro' },
  { codigo: '3.1.7', nome: 'Maquineta Stone', nivel: 3, tipo: 'receita', fonte: 'livro' },
  { codigo: '3.1.8', nome: 'Maquineta Caixa', nivel: 3, tipo: 'receita', fonte: 'livro' },
  { codigo: '3.1.9', nome: 'Maquineta Infinity', nivel: 3, tipo: 'receita', fonte: 'livro' },
  { codigo: '3.1.10', nome: 'Vendas em Cartão Crédito', nivel: 2, tipo: 'receita', fonte: 'livro' },
  { codigo: '3.1.11', nome: 'Maquineta Stone', nivel: 3, tipo: 'receita', fonte: 'livro' },
  { codigo: '3.1.12', nome: 'Maquineta Caixa', nivel: 3, tipo: 'receita', fonte: 'livro' },
  { codigo: '3.1.13', nome: 'Maquineta Infinity', nivel: 3, tipo: 'receita', fonte: 'livro' },
  { codigo: '3.1.14', nome: 'Vendas em Plataformas Digitais (Ifood/99)', nivel: 2, tipo: 'receita', fonte: 'livro' },
  { codigo: '3.1.15', nome: 'Acertos', nivel: 2, tipo: 'receita', fonte: 'livro' },

  // ===================== CUSTOS VARIÁVEIS =====================
  { codigo: '4.1', nome: 'DESPESAS/CUSTOS VARIÁVEIS', nivel: 0, tipo: 'despesa', isHeader: true, calc: { tipo: 'sum' } },
  { codigo: '4.1.1', nome: 'Simples Nacional', nivel: 1, tipo: 'despesa', fonte: 'livro' },
  { codigo: '4.1.2', nome: 'Mercantil', nivel: 1, tipo: 'despesa', fonte: 'livro' },
  { codigo: '4.1.3', nome: 'IPTU', nivel: 1, tipo: 'despesa', fonte: 'livro' },
  { codigo: '4.1.4', nome: 'Parcelamento Impostos', nivel: 1, tipo: 'despesa', fonte: 'livro' },
  { codigo: '4.1.5', nome: 'Imposto Bombeiros', nivel: 1, tipo: 'despesa', fonte: 'livro' },
  { codigo: '4.1.6', nome: 'Devoluções de Vendas', nivel: 1, tipo: 'despesa', fonte: 'livro' },
  { codigo: '4.1.7', nome: 'Abatimentos sobre Vendas', nivel: 1, tipo: 'despesa', fonte: 'livro' },

  // Receita Líquida = Receita - Custos Variáveis
  { codigo: '4.2', nome: 'RECEITA LÍQUIDA', nivel: 0, tipo: 'receita', isHeader: true, calc: { tipo: 'formula', add: ['3.1'], sub: ['4.1'] } },

  // ===================== CUSTOS COM PRODUTOS/INSUMOS =====================
  { codigo: '4.3', nome: 'CUSTOS COM PRODUTOS/INSUMOS', nivel: 0, tipo: 'despesa', isHeader: true, calc: { tipo: 'sum' } },
  { codigo: '4.3.1', nome: 'Produtos/Insumos', nivel: 1, tipo: 'despesa', fonte: 'insumos' },
  { codigo: '4.3.2', nome: 'Acerto Despesas', nivel: 1, tipo: 'despesa', fonte: 'livro' },

  // Lucro Bruto = Receita Líquida - Custos com Insumos
  { codigo: '4.4', nome: 'LUCRO BRUTO', nivel: 0, tipo: 'receita', isHeader: true, calc: { tipo: 'formula', add: ['4.2'], sub: ['4.3'] } },

  // ===================== DESPESAS FIXAS =====================
  { codigo: '5.1', nome: 'DESPESAS FIXAS', nivel: 0, tipo: 'despesa', isHeader: true, calc: { tipo: 'sum' } },
  { codigo: '5.1.1', nome: 'Tarifas Bancárias', nivel: 1, tipo: 'despesa', fonte: 'livro' },
  { codigo: '5.1.2', nome: 'Aluguel de Maquinetas', nivel: 1, tipo: 'despesa', fonte: 'livro' },
  { codigo: '5.1.3', nome: 'Empréstimos', nivel: 1, tipo: 'despesa', fonte: 'livro' },

  { codigo: '5.2', nome: 'Despesas Administrativas', nivel: 1, tipo: 'despesa', isHeader: true, calc: { tipo: 'sum' } },
  { codigo: '5.2.1', nome: 'Aluguel Imóvel', nivel: 2, tipo: 'despesa', fonte: 'despesasFixas' },
  { codigo: '5.2.2', nome: 'Energia (Celpe)', nivel: 2, tipo: 'despesa', fonte: 'despesasFixas' },
  { codigo: '5.2.3', nome: 'Água (Compesa)', nivel: 2, tipo: 'despesa', fonte: 'despesasFixas' },
  { codigo: '5.2.4', nome: 'Internet', nivel: 2, tipo: 'despesa', fonte: 'despesasFixas' },
  { codigo: '5.2.5', nome: 'Telefone', nivel: 2, tipo: 'despesa', fonte: 'despesasFixas' },
  { codigo: '5.2.6', nome: 'Celular', nivel: 2, tipo: 'despesa', fonte: 'despesasFixas' },
  { codigo: '5.2.7', nome: 'Gasolina/Estacionamento/Táxi', nivel: 2, tipo: 'despesa', fonte: 'despesasFixas' },
  { codigo: '5.2.8', nome: 'Financiamento Carro', nivel: 2, tipo: 'despesa', fonte: 'despesasFixas' },
  { codigo: '5.2.9', nome: 'IPVA', nivel: 2, tipo: 'despesa', fonte: 'despesasFixas' },
  { codigo: '5.2.10', nome: 'Botijão de Gás', nivel: 2, tipo: 'despesa', fonte: 'despesasFixas' },
  { codigo: '5.2.11', nome: 'Outras Despesas', nivel: 2, tipo: 'despesa', fonte: 'despesasFixas' },
  { codigo: '5.2.12', nome: 'Acertos', nivel: 2, tipo: 'despesa', fonte: 'livro' },

  { codigo: '5.3', nome: 'Despesas com Pessoal', nivel: 1, tipo: 'despesa', isHeader: true, calc: { tipo: 'sum' } },
  { codigo: '5.3.1', nome: 'Salários de Funcionários', nivel: 2, tipo: 'despesa', fonte: 'pessoal' },
  { codigo: '5.3.2', nome: 'Adiantamento de Salários', nivel: 2, tipo: 'despesa', fonte: 'livro' },
  { codigo: '5.3.3', nome: 'Pro-Labore', nivel: 2, tipo: 'despesa', fonte: 'livro' },
  { codigo: '5.3.4', nome: 'Bolsa de Estágio', nivel: 2, tipo: 'despesa', fonte: 'livro' },
  { codigo: '5.3.5', nome: 'Vale Transporte', nivel: 2, tipo: 'despesa', fonte: 'livro' },
  { codigo: '5.3.6', nome: 'Rescisão', nivel: 2, tipo: 'despesa', fonte: 'livro' },
  { codigo: '5.3.7', nome: 'Outras Despesas', nivel: 2, tipo: 'despesa', fonte: 'livro' },
  { codigo: '5.3.8', nome: 'Ferias Funcionarios', nivel: 2, tipo: 'despesa', fonte: 'livro' },

  { codigo: '5.4', nome: 'PROVISÕES', nivel: 1, tipo: 'despesa', isHeader: true, calc: { tipo: 'sum' } },
  { codigo: '5.4.1', nome: 'Férias de Funcionários', nivel: 2, tipo: 'despesa', fonte: 'provisoes' },
  { codigo: '5.4.2', nome: '1/3 Férias', nivel: 2, tipo: 'despesa', fonte: 'provisoes' },
  { codigo: '5.4.3', nome: 'FGTS', nivel: 2, tipo: 'despesa', fonte: 'provisoes' },
  { codigo: '5.4.4', nome: 'INSS', nivel: 2, tipo: 'despesa', fonte: 'provisoes' },
  { codigo: '5.4.5', nome: '13º Salário', nivel: 2, tipo: 'despesa', fonte: 'provisoes' },
  { codigo: '5.4.6', nome: 'INSS Patronal', nivel: 2, tipo: 'despesa', fonte: 'provisoes' },

  { codigo: '5.5', nome: 'Despesas com Serviços de Terceiros', nivel: 1, tipo: 'despesa', isHeader: true, calc: { tipo: 'sum' } },
  { codigo: '5.5.1', nome: 'Contador', nivel: 2, tipo: 'despesa', fonte: 'despesasFixas' },
  { codigo: '5.5.2', nome: 'TI', nivel: 2, tipo: 'despesa', fonte: 'despesasFixas' },
  { codigo: '5.5.3', nome: 'Outras Despesas', nivel: 2, tipo: 'despesa', fonte: 'despesasFixas' },

  { codigo: '5.6', nome: 'Despesas com Materiais e Equipamentos', nivel: 1, tipo: 'despesa', isHeader: true, calc: { tipo: 'sum' } },
  { codigo: '5.6.1', nome: 'Manutenção de Equipamentos', nivel: 2, tipo: 'despesa', fonte: 'despesasFixas' },
  { codigo: '5.6.2', nome: 'Softwares', nivel: 2, tipo: 'despesa', fonte: 'despesasFixas' },
  { codigo: '5.6.3', nome: 'Materiais de Expediente/Manutenção/Limpeza', nivel: 2, tipo: 'despesa', fonte: 'despesasFixas' },
  { codigo: '5.6.4', nome: 'Manutenção de Veículos', nivel: 2, tipo: 'despesa', fonte: 'despesasFixas' },

  { codigo: '5.7', nome: 'Fornecedores', nivel: 1, tipo: 'despesa', isHeader: true, calc: { tipo: 'sum' } },
  { codigo: '5.7.1', nome: 'Karne Keijo', nivel: 2, tipo: 'despesa', fonte: 'despesasFixas' },
  { codigo: '5.7.2', nome: 'Natto', nivel: 2, tipo: 'despesa', fonte: 'despesasFixas' },
  { codigo: '5.7.3', nome: 'Coca-Cola', nivel: 2, tipo: 'despesa', fonte: 'despesasFixas' },
  { codigo: '5.7.4', nome: 'Outros', nivel: 2, tipo: 'despesa', fonte: 'despesasFixas' },

  // Lucro Operacional Antes dos Investimentos = Lucro Bruto - Despesas Fixas
  { codigo: '6.1', nome: 'LUCRO OPERACIONAL ANTES DOS INVESTIMENTOS', nivel: 0, tipo: 'receita', isHeader: true, calc: { tipo: 'formula', add: ['4.4'], sub: ['5.1'] } },

  // ===================== INVESTIMENTOS =====================
  { codigo: '6.2', nome: 'INVESTIMENTOS', nivel: 0, tipo: 'despesa', isHeader: true, calc: { tipo: 'sum' } },
  { codigo: '6.2.1', nome: 'Investimento em Marketing', nivel: 1, tipo: 'despesa', fonte: 'livro' },
  { codigo: '6.2.2', nome: 'Investimento em Bens Materiais', nivel: 1, tipo: 'despesa', fonte: 'livro' },
  { codigo: '6.2.3', nome: 'Investimento em Desenvolvimento Empresarial', nivel: 1, tipo: 'despesa', fonte: 'livro' },
  { codigo: '6.2.4', nome: 'Outros', nivel: 1, tipo: 'despesa', fonte: 'livro' },

  // Total Despesa Operacional = Despesas Fixas + Investimentos
  { codigo: '6.3', nome: 'TOTAL DESPESA OPERACIONAL', nivel: 0, tipo: 'despesa', isHeader: true, calc: { tipo: 'formula', add: ['5.1', '6.2'] } },

  // Lucro Operacional = Lucro Op Antes Inv - Total Despesa Op
  { codigo: '6.4', nome: 'LUCRO OPERACIONAL', nivel: 0, tipo: 'receita', isHeader: true, calc: { tipo: 'formula', add: ['6.1'], sub: ['6.3'] } },

  // ===================== NÃO OPERACIONAIS =====================
  { codigo: '7.1', nome: 'ENTRADAS E SAÍDAS NÃO OPERACIONAIS', nivel: 0, tipo: 'despesa', isHeader: true, calc: { tipo: 'sum' } },
  { codigo: '7.2', nome: 'Saídas não operacionais', nivel: 1, tipo: 'despesa', fonte: 'retiradas' },

  // Lucro Antes dos Juros e Impostos = Lucro Operacional - Não Operacionais
  { codigo: '8.1', nome: 'LUCRO ANTES DOS JUROS E IMPOSTOS', nivel: 0, tipo: 'receita', isHeader: true, calc: { tipo: 'formula', add: ['6.4'], sub: ['7.1'] } },

  { codigo: '8.2', nome: 'Despesas Financeiras', nivel: 1, tipo: 'despesa', fonte: 'livro' },

  // Lucro Antes dos Impostos = Lucro Antes Juros/Impostos - Despesas Financeiras
  { codigo: '9.1', nome: 'LUCRO ANTES DOS IMPOSTOS', nivel: 0, tipo: 'receita', isHeader: true, calc: { tipo: 'formula', add: ['8.1'], sub: ['8.2'] } },

  { codigo: '9.2', nome: 'Despesa Contribuição Social sobre Lucros (CSLL)', nivel: 1, tipo: 'despesa', fonte: 'livro' },
  { codigo: '9.3', nome: 'Despesa com Imposto de Renda', nivel: 1, tipo: 'despesa', fonte: 'livro' },

  // Lucro Líquido = Lucro Antes Impostos - CSLL - IR
  { codigo: 'RESULTADO', nome: 'LUCRO LÍQUIDO', nivel: 0, tipo: 'receita', isHeader: true, calc: { tipo: 'formula', add: ['9.1'], sub: ['9.2', '9.3'] } },
];

/** Retorna os nós folha (que têm fonte de dado real). */
export const DRE_FOLHAS = DRE_TEMPLATE.filter((n) => n.fonte);

/** Verifica se um código é descendente direto/indireto de outro (prefixo). */
export const ehDescendente = (codigo: string, pai: string): boolean =>
  codigo === pai || codigo.startsWith(pai + '.');
