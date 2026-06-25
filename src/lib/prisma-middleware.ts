// src/lib/prisma-middleware.ts
// Middleware de isolamento de dados por empresa
//
// NOTA: Para operações administrativas que precisam acessar dados de múltiplas empresas,
// use o cliente admin: import { adminPrisma } from '@/lib/prisma-admin'

import { PrismaClient, Prisma } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Modelos que NÃO devem ter filtro de empresa aplicado
// (pertencem diretamente ao usuário ou são de sistema)
const SKIP_EMPRESA_MODELS = new Set([
  'User',
  'Subscription',
  'Plan',
  'Session',
  'Account',
  'VerificationToken',
  'ResetToken',
  'Empresa', // Modelo de empresa - usa userId, não empresaId
])

// Modelos que já possuem userId (para auditoria)
const MODELS_WITH_USER_ID = new Set([
  'ContaFinanceira',
  'NotaFiscal',
  'Produto',
  'Pagamento',
  'LivroDiario',
  'PlanejamentoConfig',
  'PlanejamentoFaturamento',
  'PlanejamentoAcompanhamento',
  'FichaTecnica',
  'FichaItem',
  'DespesaFixa',
  'DespesaVariavel',
  'Funcionario',
  'TaxasCartaoConfig',
  'ProvisaoFuncionario',
  'MetaFluxoCaixa',
  'FluxoCaixaDiario',
  'PlanoContas',
  'FechamentoMensal',
  'DreResultado',
  'Boleto',
  'Categoria',
  'CaixaAbertura',
  'Venda',
  'ProdutoVenda',
  'VendaManual',
  'Retirada',
  'CaixaFechamento',
])

interface SessionUser {
  id: string
  email?: string | null
  name?: string | null
  image?: string | null
  empresaId?: string
}

interface Session {
  user?: SessionUser
}

/**
 * Obtém o ID da empresa do contexto da sessão
 * Deve ser chamado dentro do contexto da requisição
 */
export async function getCurrentEmpresaId(): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions) as Session | null
    return session?.user?.empresaId ?? null
  } catch (error) {
    console.error('Erro ao obter empresaId da sessão:', error)
    return null
  }
}

/**
 * Middleware que garante o isolamento de dados por empresa
 * Aplica filtros automáticos em todas as queries
 */
export function securityMiddleware(prisma: PrismaClient): PrismaClient {
  prisma.$use(async (params: Prisma.MiddlewareParams, next: (params: Prisma.MiddlewareParams) => Promise<any>) => {
    // Pular se não temos contexto de modelo
    if (!params.model) {
      return next(params)
    }

    // Pular modelos que não devem ter filtro de empresa
    if (SKIP_EMPRESA_MODELS.has(params.model)) {
      return next(params)
    }

    // Obter empresaId do contexto (pode vir de headers, sessão, etc.)
    const empresaId = await getCurrentEmpresaId()

    // Se não houver empresaId, não aplicar filtro
    // Isso permite operações administrativas
    if (!empresaId) {
      return next(params)
    }

    // Aplicar filtro de empresa baseado na ação
    if (params.action === 'findMany' || params.action === 'findFirst') {
      params.args.where = {
        ...params.args.where,
        empresaId: empresaId,
      }
    }

    // Para createMany, adicionar empresaId em todos os registros
    if (params.action === 'createMany') {
      params.args.data = params.args.data.map((item: any) => ({
        ...item,
        empresaId: empresaId,
      }))
    }

    // Para create (single), adicionar empresaId
    if (params.action === 'create') {
      params.args.data = {
        ...params.args.data,
        empresaId: empresaId,
      }
    }

    // Para updateMany e deleteMany, adicionar filtro de empresa
    if (params.action === 'updateMany' || params.action === 'deleteMany') {
      params.args.where = {
        ...params.args.where,
        empresaId: empresaId,
      }
    }

    // Para upsert, adicionar empresaId
    if (params.action === 'upsert') {
      params.args.create = {
        ...params.args.create,
        empresaId: empresaId,
      }
      params.args.update = {
        ...params.args.update,
        empresaId: empresaId,
      }
    }

    // Para count, aplicar filtro
    if (params.action === 'count') {
      params.args.where = {
        ...params.args.where,
        empresaId: empresaId,
      }
    }

    // Para aggregate, aplicar filtro
    if (params.action === 'aggregate') {
      params.args.where = {
        ...params.args.where,
        empresaId: empresaId,
      }
    }

    return next(params)
  })

  return prisma
}