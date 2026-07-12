import { useState, useEffect, useCallback } from 'react';

export interface ContaFinanceira {
  id: number;
  nome: string;
  tipo: string;
  saldoInicial: number;
  saldoAtual: number;
  instituicao: string | null;
}

interface UseContasFinanceirasReturn {
  contas: ContaFinanceira[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useContasFinanceiras(): UseContasFinanceirasReturn {
  const [contas, setContas] = useState<ContaFinanceira[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContas = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/contas-financeiras');
      if (!response.ok) {
        throw new Error('Erro ao buscar contas financeiras');
      }
      const data = await response.json();
      if (data.success) {
        setContas(data.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContas();
  }, [fetchContas]);

  const refresh = useCallback(async () => {
    await fetchContas();
  }, [fetchContas]);

  return {
    contas,
    loading,
    error,
    refresh,
  };
}