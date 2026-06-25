"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit } from "lucide-react";
import type { ContaSaldo, DespesaFechamento } from "@/types/fechamento";

interface SaldosContasTabProps {
  contas: ContaSaldo[];
  despesas?: DespesaFechamento[];
  onChange: (contas: ContaSaldo[]) => void;
}

export function SaldosContasTab({ contas, despesas = [], onChange }: SaldosContasTabProps) {
  const [editandoId, setEditandoId] = useState<number | null>(null);

  const atualizarSaldo = (id: number, saldo: number) => {
    onChange(contas.map(c => c.id === id ? { ...c, saldoAtual: saldo } : c));
  };

  const calcularSobra = (conta: ContaSaldo) => {
    return conta.saldoAtual - conta.despesas;
  };

  const totalSaldo = contas.reduce((sum, c) => sum + c.saldoAtual, 0);
  const totalSobra = contas.reduce((sum, c) => sum + calcularSobra(c), 0);
  const totalDespesas = despesas.reduce((sum, d) => sum + d.valor, 0);

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-blue-600">Saldo Total</p>
          <p className="text-2xl font-bold text-blue-700">R$ {totalSaldo.toFixed(2)}</p>
        </div>
        <div className="bg-emerald-50 rounded-lg p-4">
          <p className="text-sm text-emerald-600">Total Sobra</p>
          <p className="text-2xl font-bold text-emerald-700">R$ {totalSobra.toFixed(2)}</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <p className="text-sm text-purple-600">Despesas do Mês</p>
          <p className="text-2xl font-bold text-purple-700">R$ {totalDespesas.toFixed(2)}</p>
        </div>
      </div>

      {/* Tabela de contas */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-2">Conta</th>
              <th className="text-right py-3 px-2">Saldo Atual</th>
              <th className="text-right py-3 px-2">Despesas</th>
              <th className="text-right py-3 px-2">Sobra</th>
              <th className="text-center py-3 px-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {contas.map((conta) => (
              <tr key={conta.id} className="border-b border-gray-100">
                <td className="py-2 px-2 font-medium">{conta.nome}</td>
                <td className="py-2 px-2 text-right">
                  {editandoId === conta.id ? (
                    <Input
                      type="number"
                      value={conta.saldoAtual}
                      onChange={(e) => atualizarSaldo(conta.id, Number(e.target.value))}
                      onBlur={() => setEditandoId(null)}
                      className="text-right"
                    />
                  ) : (
                    <span className="cursor-pointer" onClick={() => setEditandoId(conta.id)}>
                      R$ {conta.saldoAtual.toFixed(2)}
                    </span>
                  )}
                </td>
                <td className="py-2 px-2 text-right text-gray-500">
                  R$ {conta.despesas.toFixed(2)}
                </td>
                <td className="py-2 px-2 text-right font-medium">
                  R$ {calcularSobra(conta).toFixed(2)}
                </td>
                <td className="py-2 px-2 text-center">
                  <Edit className="h-4 w-4 text-gray-400" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}