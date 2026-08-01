// Virada de mês do Planejamento.
// Quando um novo mês começa, as configurações do último mês preenchido são
// copiadas para o mês corrente, evitando que o planejamento fique vazio.
import { prisma } from "@/lib/prisma"

function mesAnterior(ano: number, mes: number): { ano: number; mes: number } {
  return mes === 1 ? { ano: ano - 1, mes: 12 } : { ano, mes: mes - 1 }
}

/**
 * Copia as despesas fixas do último mês preenchido (até 12 meses atrás)
 * para o mês informado, quando este ainda não possui lançamentos.
 */
export async function garantirDespesasFixasMes(
  empresaId: string,
  userId: string,
  ano: number,
  mes: number,
): Promise<void> {
  const jaExiste = await prisma.planejamentoDespesaFixaNovo.count({
    where: { empresaId, userId, ano, mes },
  })
  if (jaExiste > 0) return

  let cursor = mesAnterior(ano, mes)
  for (let i = 0; i < 12; i++) {
    const anteriores = await prisma.planejamentoDespesaFixaNovo.findMany({
      where: { empresaId, userId, ano: cursor.ano, mes: cursor.mes },
      orderBy: { nome: "asc" },
    })

    if (anteriores.length > 0) {
      await prisma.planejamentoDespesaFixaNovo.createMany({
        data: anteriores.map((d) => ({
          empresaId,
          userId,
          ano,
          mes,
          nome: d.nome,
          valor: d.valor,
          status: "PENDENTE",
          // Mantém o dia de vencimento, deslocado para o novo mês.
          dataVencimento: d.dataVencimento
            ? new Date(Date.UTC(ano, mes - 1, d.dataVencimento.getUTCDate()))
            : null,
          dataPagamento: null,
          contaFinanceira: d.contaFinanceira,
        })),
      })
      return
    }

    cursor = mesAnterior(cursor.ano, cursor.mes)
  }
}

/**
 * Copia a configuração de despesas variáveis (percentuais, taxas) do último
 * mês preenchido para o mês informado, quando este ainda não existe.
 */
export async function garantirDespesasVariaveisMes(
  empresaId: string,
  userId: string,
  ano: number,
  mes: number,
): Promise<void> {
  const jaExiste = await prisma.planejamentoDespesaVariavelNovo.findFirst({
    where: { empresaId, userId, ano, mes },
    select: { id: true },
  })
  if (jaExiste) return

  let cursor = mesAnterior(ano, mes)
  for (let i = 0; i < 12; i++) {
    const anterior = await prisma.planejamentoDespesaVariavelNovo.findFirst({
      where: { empresaId, userId, ano: cursor.ano, mes: cursor.mes },
    })

    if (anterior) {
      await prisma.planejamentoDespesaVariavelNovo.create({
        data: {
          empresaId,
          userId,
          ano,
          mes,
          percentualTotal: anterior.percentualTotal,
          // Faturamento e impacto são recalculados a partir das metas do mês.
          faturamentoBase: 0,
          impactoMensal: 0,
          config: (anterior.config as any) ?? {},
          resultados: {},
        },
      })
      return
    }

    cursor = mesAnterior(cursor.ano, cursor.mes)
  }
}
