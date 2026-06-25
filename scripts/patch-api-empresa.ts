/**
 * Script de patch para adicionar empresaId em APIs
 *
 * ESTE ARQUIVO É UM MODELO - use como referência para atualizar suas APIs
 *
 * Padrões de atualização:
 *
 * 1. Adicionar imports:
 * ```typescript
 * import { getCurrentEmpresaId } from '@/lib/prisma-middleware'
 * import { getServerSession } from 'next-auth'
 * import { authOptions } from '@/lib/auth'
 *
 * async function getCurrentUserId(): Promise<string | null> {
 *   const session = await getServerSession(authOptions)
 *   return session?.user?.id ?? null
 * }
 * ```
 *
 * 2. Para CREATE operations:
 * ```typescript
 * // ANTES:
 * await prisma.produto.create({
 *   data: { nome: 'Produto 1', descricao: 'Desc' }
 * })
 *
 * // DEPOIS:
 * const empresaId = await getCurrentEmpresaId()
 * const userId = await getCurrentUserId()
 *
 * await prisma.produto.create({
 *   data: { nome: 'Produto 1', descricao: 'Desc', empresaId, userId }
 * })
 * ```
 *
 * 3. Para FIND operations:
 * ```typescript
 * // ANTES:
 * await prisma.produto.findMany({ where: { nome: { contains: search } } })
 *
 * // DEPOIS:
 * const empresaId = await getCurrentEmpresaId()
 * await prisma.produto.findMany({ where: { nome: { contains: search }, empresaId } })
 * ```
 *
 * 4. Para UPDATE/DELETE operations:
 * ```typescript
 * // ANTES:
 * await prisma.produto.update({ where: { id }, data: { nome: 'Novo Nome' } })
 *
 * // DEPOIS:
 * const empresaId = await getCurrentEmpresaId()
 * await prisma.produto.update({ where: { id, empresaId }, data: { nome: 'Novo Nome' } })
 * ```
 */

// Lista de arquivos que precisam ser atualizados
export const FILES_TO_UPDATE = [
  'src/app/api/caixa/route.ts',
  'src/app/api/caixa/fechar/route.ts',
  'src/app/api/contas-financeiras/route.ts',
  'src/app/api/contas-financeiras/transferir/route.ts',
  'src/app/api/despesas-fixas/route.ts',
  'src/app/api/fichas-tecnicas/route.ts',
  'src/app/api/fluxo-caixa/metas/route.ts',
  'src/app/api/fluxo-caixa/sincronizar/route.ts',
  'src/app/api/fluxo-caixa/sincronizar-insumos/route.ts',
  'src/app/api/fechamento-mensal/calcular/route.ts',
  'src/app/api/fechamento-mensal/fechar/route.ts',
  'src/app/api/fechamento-mensal/reabrir/route.ts',
  // ... adicionar mais arquivos conforme necessário
]

// Modelos que precisam de empresaId
export const EMPRESA_MODELS = [
  'planejamentoConfig',
  'planejamentoFaturamento',
  'planejamentoAcompanhamento',
  'despesaFixa',
  'despesaVariavel',
  'funcionario',
  'provisaoFuncionario',
  'metaFluxoCaixa',
  'fluxoCaixaDiario',
  'planoContas',
  'fechamentoMensal',
  'dreResultado',
  'contaFinanceira',
  'notaFiscal',
  'produto',
  'pagamento',
  'livroDiario',
  'categoria',
  'boletos',
  'caixaAbertura',
  'venda',
  'produtoVenda',
  'vendaManual',
  'retirada',
  'caixaFechamento',
  'fichaTecnica',
]