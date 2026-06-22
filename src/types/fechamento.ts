/**
 * Tipos para a página de Fechamento Mensal
 */

export interface FuncionarioFechamento {
  id: string;
  nome: string;
  salario: number;
  adiantamento: number;
  desconto15: number;
  desconto30: number;
  inss: number;
  total: number;
}

export interface DespesaFechamento {
  id: string;
  nome: string;
  valor: number;
  dataVencimento: string;
  status: 'PENDENTE' | 'PAGO' | 'VENCIDO' | 'CANCELADO';
  contaId?: number;
  observacao?: string;
}

export interface ContaSaldo {
  id: number;
  nome: string;
  saldoAtual: number;
  saldoAnterior: number;
  despesas: number;
  sobra: number;
}

export interface DistribuicaoLucro {
  id: string;
  nome: string;
  percentual: number;
  valor: number;
  pago: boolean;
}

export interface FechamentoResult {
  saldoTotal: number;
  capitalGiro: number;
  fundoInvestimento: number;
  provisoes: number;
  lucroLiquido: number;
  faturamentoTotal: number;
}

export interface FechamentoData {
  funcionarios: FuncionarioFechamento[];
  despesas: DespesaFechamento[];
  contas: ContaSaldo[];
  distribuicao: DistribuicaoLucro[];
  boletos: Array<{
    id: number;
    descricao: string;
    valor: number;
    dataVencimento: string;
    status: string;
  }>;
  resultados: FechamentoResult;
}