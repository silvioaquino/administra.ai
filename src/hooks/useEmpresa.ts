// src/hooks/useEmpresa.ts
"use client"

import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api-client"

export interface EmpresaResponse {
  success: boolean
  empresa?: { nome?: string | null } | null
}

export function useEmpresa(enabled = true) {
  return useQuery({
    queryKey: ["empresa"],
    queryFn: () => apiFetch<EmpresaResponse>("/api/empresa"),
    enabled,
    staleTime: 10 * 60_000,
  })
}
