import { z } from 'zod';

// Schema para funcionário
export const funcionarioSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  salario: z.number().min(0, 'Salário deve ser positivo'),
  adiantamento: z.number().min(0).default(0),
  desconto15: z.number().min(0).default(0),
  desconto30: z.number().min(0).default(0),
  inss: z.number().min(0).default(0),
});

// Schema para despesa
export const despesaSchema = z.object({
  nome: z.string().min(1, 'Nome da despesa é obrigatório'),
  valor: z.number().min(0.01, 'Valor deve ser maior que zero'),
  dataVencimento: z.string().min(1, 'Data de vencimento é obrigatória'),
  status: z.enum(['PENDENTE', 'PAGO', 'VENCIDO', 'CANCELADO']),
  contaId: z.number().optional(),
  observacao: z.string().optional(),
});

// Schema para conta
export const contaSchema = z.object({
  nome: z.string().min(1, 'Nome da conta é obrigatório'),
  saldoAtual: z.number().default(0),
});

// Schema para distribuição de lucros
export const distribuicaoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  percentual: z.number().min(0).max(100, 'Percentual deve ser entre 0 e 100'),
  valor: z.number().min(0, 'Valor deve ser positivo'),
  pago: z.boolean().default(false),
});