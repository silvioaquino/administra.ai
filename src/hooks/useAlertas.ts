"use client"

import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api-client"
import type { Alerta, CategoriaAlerta } from "@/lib/alertas/tipos"

export type { Alerta, CategoriaAlerta }

/**
 * Fonte única de alertas no client. Todos os componentes (sino de
 * notificações, painel do dashboard e cards de indicadores) consomem
 * este hook para permanecerem sincronizados.
 */
export function useAlertas() {
  return useQuery({
    queryKey: ["alertas"],
    queryFn: () => apiFetch<{ data: Alerta[] }>("/api/alertas").then(res => res.data),
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  })
}
