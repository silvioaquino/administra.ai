import { useState, useEffect, useCallback } from 'react';
import { CategoriaItem, CategoriasResponse } from '@/types/categorias';

export type { CategoriaItem, CategoriasResponse } from '@/types/categorias';

export function useCategorias() {
  const [categorias, setCategorias] = useState<CategoriasResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategorias = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/categorias');
      if (!response.ok) {
        throw new Error('Erro ao buscar categorias');
      }
      const data = await response.json();
      setCategorias(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategorias();
  }, [fetchCategorias]);

  // Recarregar categorias (útil após adicionar nova categoria)
  const refresh = useCallback(() => {
    return fetchCategorias();
  }, [fetchCategorias]);

  // Obter apenas categorias de despesa (para o modal do Livro Diário)
  const getContasDespesa = useCallback(() => {
    if (!categorias?.data.despesas) return [];
    return categorias.data.despesas.filter(c => !c.isHeader);
  }, [categorias]);

  // Obter apenas categorias de receita
  const getContasReceita = useCallback(() => {
    if (!categorias?.data.receita) return [];
    return categorias.data.receita.filter(c => !c.isHeader);
  }, [categorias]);

  // Agrupar por nível para o select (para o modal do Livro Diário)
  const getContasGrouped = useCallback(() => {
    const contas = getContasDespesa();

    // Agrupar por nível
    const nivel0 = contas.filter(c => c.nivel === 0);
    const nivel1 = contas.filter(c => c.nivel === 1);
    const nivel2 = contas.filter(c => c.nivel === 2);
    const nivel3 = contas.filter(c => c.nivel === 3);

    return { nivel0, nivel1, nivel2, nivel3 };
  }, [getContasDespesa]);

  return {
    categorias,
    loading,
    error,
    refresh,
    getContasDespesa,
    getContasReceita,
    getContasGrouped,
  };
}