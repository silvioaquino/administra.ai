"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import type { FuncionarioFechamento } from "@/types/fechamento";

interface FolhaPagamentoTabProps {
  funcionarios: FuncionarioFechamento[];
  onChange: (funcionarios: FuncionarioFechamento[]) => void;
}

export function FolhaPagamentoTab({ funcionarios, onChange }: FolhaPagamentoTabProps) {
  const [novoFuncionario, setNovoFuncionario] = useState<Partial<FuncionarioFechamento>>({
    nome: "",
    salario: 0,
    adiantamento: 0,
    desconto15: 0,
    desconto30: 0,
    inss: 0,
  });

  // Calcular INSS automaticamente (7.5% a 9% dependendo do salário)
  const calcularInss = (salario: number) => {
    if (salario <= 1500) return salario * 0.075;
    if (salario <= 2000) return salario * 0.08;
    return salario * 0.09;
  };

  // Calcular total do funcionário
  const calcularTotal = (f: FuncionarioFechamento) => {
    const inssCalculado = f.inss || calcularInss(f.salario);
    const salubridade = f.salario * 0.20;
    const dia15 = (f.salario / 2) - f.desconto15;
    const dia30 = (f.salario / 2) + salubridade - f.desconto30 - inssCalculado;
    return dia15 + dia30;
  };

  const adicionarFuncionario = () => {
    if (!novoFuncionario.nome || !novoFuncionario.salario) return;

    const funcionario: FuncionarioFechamento = {
      id: Date.now().toString(),
      nome: novoFuncionario.nome || "",
      salario: novoFuncionario.salario || 0,
      adiantamento: novoFuncionario.adiantamento || 0,
      desconto15: novoFuncionario.desconto15 || 0,
      desconto30: novoFuncionario.desconto30 || 0,
      inss: novoFuncionario.inss || calcularInss(novoFuncionario.salario || 0),
      total: 0,
    };
    funcionario.total = calcularTotal(funcionario);

    onChange([...funcionarios, funcionario]);
    setNovoFuncionario({ nome: "", salario: 0, adiantamento: 0, desconto15: 0, desconto30: 0, inss: 0 });
  };

  const removerFuncionario = (id: string) => {
    onChange(funcionarios.filter(f => f.id !== id));
  };

  const atualizarFuncionario = (id: string, campo: keyof FuncionarioFechamento, valor: any) => {
    onChange(funcionarios.map(f => {
      if (f.id === id) {
        const atualizado = { ...f, [campo]: valor };
        if (campo === 'salario' || campo === 'inss') {
          atualizado.inss = campo === 'inss' ? valor : calcularInss(atualizado.salario);
        }
        atualizado.total = calcularTotal(atualizado);
        return atualizado;
      }
      return f;
    }));
  };

  const totalGeral = funcionarios.reduce((sum, f) => sum + f.total, 0);

  return (
    <div className="space-y-4">
      {/* Formulário de adição */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <h4 className="font-semibold mb-3">Adicionar Funcionário</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label>Nome</Label>
            <Input
              value={novoFuncionario.nome || ""}
              onChange={(e) => setNovoFuncionario({...novoFuncionario, nome: e.target.value})}
              placeholder="Ex: Meiry"
            />
          </div>
          <div>
            <Label>Salário (R$)</Label>
            <Input
              type="number"
              value={novoFuncionario.salario || 0}
              onChange={(e) => setNovoFuncionario({...novoFuncionario, salario: Number(e.target.value)})}
            />
          </div>
          <div>
            <Label>INSS (%)</Label>
            <Input
              type="number"
              step="0.01"
              value={novoFuncionario.inss || 0}
              onChange={(e) => setNovoFuncionario({...novoFuncionario, inss: Number(e.target.value)})}
            />
          </div>
        </div>
        <Button onClick={adicionarFuncionario} className="mt-3 bg-[#de4838] hover:bg-[#c73d2e]">
          <Plus className="mr-2 h-4 w-4" />
          Adicionar
        </Button>
      </div>

      {/* Tabela de funcionários */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-2">Funcionário</th>
              <th className="text-right py-3 px-2">Salário</th>
              <th className="text-right py-3 px-2">INSS</th>
              <th className="text-right py-3 px-2">Dia 15</th>
              <th className="text-right py-3 px-2">Dia 30</th>
              <th className="text-right py-3 px-2">Total</th>
              <th className="text-center py-3 px-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {funcionarios.map((f) => (
              <tr key={f.id} className="border-b border-gray-100">
                <td className="py-2 px-2">
                  <Input value={f.nome} onChange={(e) => atualizarFuncionario(f.id, 'nome', e.target.value)} />
                </td>
                <td className="py-2 px-2 text-right">
                  <Input type="number" value={f.salario} onChange={(e) => atualizarFuncionario(f.id, 'salario', Number(e.target.value))} className="text-right" />
                </td>
                <td className="py-2 px-2 text-right">
                  <Input type="number" step="0.01" value={f.inss} onChange={(e) => atualizarFuncionario(f.id, 'inss', Number(e.target.value))} className="text-right" />
                </td>
                <td className="py-2 px-2 text-right">
                  <Input type="number" value={f.desconto15} onChange={(e) => atualizarFuncionario(f.id, 'desconto15', Number(e.target.value))} className="text-right" />
                </td>
                <td className="py-2 px-2 text-right">
                  <Input type="number" value={f.desconto30} onChange={(e) => atualizarFuncionario(f.id, 'desconto30', Number(e.target.value))} className="text-right" />
                </td>
                <td className="py-2 px-2 text-right font-bold">R$ {f.total.toFixed(2)}</td>
                <td className="py-2 px-2 text-center">
                  <Button variant="ghost" onClick={() => removerFuncionario(f.id)} className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totalizador */}
      <div className="border-t pt-4 mt-4">
        <div className="flex justify-between items-center text-lg font-bold">
          <span>Total da Folha:</span>
          <span className="text-[#de4838]">R$ {totalGeral.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}