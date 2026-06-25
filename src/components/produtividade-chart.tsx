'use client';

import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  Line,
  type TooltipPayloadEntry,
} from 'recharts';
import type { ReactNode } from 'react';

interface ProdutividadeData {
  mes: number;
  ano: number;
  mesNome: string;
  faturamento: number;
  cmv: number;
  taxasCartao: number;
  outrosCustosVariaveis: number;
  custosVariaveisTotais: number;
  funcionarios: number;
  produtividade: number;
}

interface ProdutividadeChartProps {
  ano?: number;
}

export function ProdutividadeChart({ ano }: ProdutividadeChartProps) {
  const [data, setData] = useState<ProdutividadeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const anoRef = ano || new Date().getFullYear();
        const response = await fetch(`/api/dashboard/produtividade/mensal?ano=${anoRef}`);

        if (!response.ok) {
          throw new Error('Erro ao carregar dados');
        }

        const result = await response.json();
        if (result.success) {
          setData(result.data);
        }
      } catch (err) {
        setError('Erro ao carregar dados');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [ano]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      compactDisplay: 'short',
    }).format(value);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formatTooltipValue = (value: any, name: any): [string, string] => {
    if (name === 'produtividade') {
      return [`R$ ${Number(value).toFixed(2)}`, 'Produtividade (por funcionário)'];
    }
    return [`R$ ${Number(value).toLocaleString('pt-BR')}`, name];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4">
        {error}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-gray-500 p-4">
        Nenhum dado disponível para o período selecionado.
      </div>
    );
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="mesNome"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', fontSize: 12 }}
            formatter={formatTooltipValue}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="faturamento" name="Faturamento" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="cmv" name="CMV (Insumos)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          <Bar dataKey="taxasCartao" name="Taxas Cartão" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          <Line
            type="monotone"
            dataKey="produtividade"
            name="Produtividade"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}