// src/lib/alertas/tipos.ts
// Tipos compartilhados do sistema unificado de alertas.

export type Severidade = "CRITICO" | "ATENCAO" | "INFO" | "SUCCESS"

export type CategoriaAlerta =
  | "financeiro"
  | "estoque"
  | "fiscal"
  | "operacional"
  | "produto"

export interface Alerta {
  id: string
  titulo: string
  descricao: string
  severidade: Severidade
  href?: string
  categoria: CategoriaAlerta
  /** Chave do indicador relacionado (usada pelo IndicadoresCard). */
  indicador?: "fixas" | "variaveis" | "cmv" | "margem" | "faturamento"
}

/** Ordem de exibição: mais grave primeiro. */
export const PESO_SEVERIDADE: Record<Severidade, number> = {
  CRITICO: 0,
  ATENCAO: 1,
  INFO: 2,
  SUCCESS: 3,
}

export function ordenarAlertas(alertas: Alerta[]): Alerta[] {
  return [...alertas].sort(
    (a, b) => PESO_SEVERIDADE[a.severidade] - PESO_SEVERIDADE[b.severidade]
  )
}
