// src/app/(dashboard)/fichas-tecnicas/hooks/useFichasTecnicas.ts
"use client"

import { useState, useEffect, useCallback } from "react"

interface Ingrediente {
  id: string
  produtoId: number
  nome: string
  quantidade: number
  unidade: string
  valorUnitario: number
  custo: number
  isProdutoAcabado: boolean
}

interface FichaTecnica {
  id: string
  nome: string
  categoria: string
  precoVenda: number
  custoTotal: number
  custoPorPorcao: number
  margem: number
  rendimentoPorcoes: number
  ingredientes: Ingrediente[]
  modoPreparo: string
  createdAt: string
  updatedAt: string
}

interface UseFichasTecnicasReturn {
  fichas: FichaTecnica[]
  loading: boolean
  error: string | null
  total: number
  carregarFichas: () => Promise<void>
  criarFicha: (data: Partial<FichaTecnica>) => Promise<FichaTecnica | null>
  atualizarFicha: (id: string, data: Partial<FichaTecnica>) => Promise<FichaTecnica | null>
  excluirFicha: (id: string) => Promise<boolean>
  calcularCustos: (ingredientes: Ingrediente[], rendimento: number) => {
    custoTotal: number
    custoPorPorcao: number
    margem: number
  }
}

export function useFichasTecnicas(): UseFichasTecnicasReturn {
  const [fichas, setFichas] = useState<FichaTecnica[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  const carregarFichas = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/fichas-tecnicas")
      const data = await response.json()
      
      if (data.success) {
        setFichas(data.data)
        setTotal(data.total || data.data.length)
      } else {
        setError(data.error || "Erro ao carregar fichas")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar fichas")
      console.error("Erro ao carregar fichas:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  const criarFicha = useCallback(async (data: Partial<FichaTecnica>): Promise<FichaTecnica | null> => {
    try {
      const response = await fetch("/api/fichas-tecnicas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })
      
      const result = await response.json()
      
      if (result.success) {
        await carregarFichas()
        return result.data
      } else {
        setError(result.error || "Erro ao criar ficha")
        return null
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar ficha")
      console.error("Erro ao criar ficha:", err)
      return null
    }
  }, [carregarFichas])

  const atualizarFicha = useCallback(async (id: string, data: Partial<FichaTecnica>): Promise<FichaTecnica | null> => {
    try {
      const response = await fetch(`/api/fichas-tecnicas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })
      
      const result = await response.json()
      
      if (result.success) {
        await carregarFichas()
        return result.data
      } else {
        setError(result.error || "Erro ao atualizar ficha")
        return null
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar ficha")
      console.error("Erro ao atualizar ficha:", err)
      return null
    }
  }, [carregarFichas])

  const excluirFicha = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/fichas-tecnicas/${id}`, {
        method: "DELETE"
      })
      
      const result = await response.json()
      
      if (result.success) {
        await carregarFichas()
        return true
      } else {
        setError(result.error || "Erro ao excluir ficha")
        return false
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir ficha")
      console.error("Erro ao excluir ficha:", err)
      return false
    }
  }, [carregarFichas])

  const calcularCustos = useCallback((ingredientes: Ingrediente[], rendimento: number) => {
    const custoTotal = ingredientes.reduce((sum, ing) => sum + ing.custo, 0)
    const custoPorPorcao = rendimento > 0 ? custoTotal / rendimento : 0
    return { custoTotal, custoPorPorcao, margem: 0 }
  }, [])

  useEffect(() => {
    carregarFichas()
  }, [carregarFichas])

  return {
    fichas,
    loading,
    error,
    total,
    carregarFichas,
    criarFicha,
    atualizarFicha,
    excluirFicha,
    calcularCustos
  }
}