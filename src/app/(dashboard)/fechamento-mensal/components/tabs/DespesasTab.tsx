"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, CheckCircle, AlertCircle } from "lucide-react";
import { despesaSchema } from "@/lib/validations/fechamento";
import type { DespesaFechamento } from "@/types/fechamento";

interface DespesasTabProps {
  despesas: DespesaFechamento[];
  onChange: (despesas: DespesaFechamento[]) => void;
  contasIds: number[];
}

export function DespesasTab({ despesas, onChange, contasIds }: DespesasTabProps) {
  const [novaDespesa, setNovaDespesa] = useState<Partial<DespesaFechamento>>({
    nome: "",
    valor: 0,
    dataVencimento: "",
    status: "PENDENTE",
  });

  const adicionarDespesa = () => {
    const valid = despesaSchema.safeParse(novaDespesa);
    if (!valid.success) return;

    const despesa: DespesaFechamento = {
      id: Date.now().toString(),
      ...valid.data,
    };
    onChange([...despesas, despesa]);
    setNovaDespesa({ nome: "", valor: 0, dataVencimento: "", status: "PENDENTE" });
  };

  const removerDespesa = (id: string) => {
    onChange(despesas.filter(d => d.id !== id));
  };

  const atualizarDespesa = (id: string, campo: keyof DespesaFechamento, valor: any) => {
    onChange(despesas.map(d => d.id === id ? { ...d, [campo]: valor } : d));
  };

  const totalDespesas = despesas.reduce((sum, d) => sum + d.valor, 0);
  const despesasPendentes = despesas.filter(d => d.status === 'PENDENTE').reduce((sum, d) => sum + d.valor, 0);
  const despesasPagas = despesas.filter(d => d.status === 'PAGO').reduce((sum, d) => sum + d.valor, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAGO': return 'text-emerald-600 bg-emerald-100';
      case 'VENCIDO': return 'text-red-600 bg-red-100';
      default: return 'text-amber-600 bg-amber-100';
    }
  };

  return (
    <div className="space-y-4">
      {/* Formulário de adição */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <h4 className="font-semibold mb-3">Adicionar Despesa</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <Label>Nome</Label>
            <Input
              value={novaDespesa.nome || ""}
              onChange={(e) => setNovaDespesa({...novaDespesa, nome: e.target.value})}
              placeholder="Ex: Aluguel"
            />
          </div>
          <div>
            <Label>Valor (R$)</Label>
            <Input
              type="number"
              value={novaDespesa.valor || 0}
              onChange={(e) => setNovaDespesa({...novaDespesa, valor: Number(e.target.value)})}
            />
          </div>
          <div>
            <Label>Vencimento</Label>
            <Input
              type="date"
              value={novaDespesa.dataVencimento || ""}
              onChange={(e) => setNovaDespesa({...novaDespesa, dataVencimento: e.target.value})}
            />
          </div>
          <div>
            <Label>Conta</Label>
            <Select
              value={novaDespesa.contaId?.toString() || ""}
              onValueChange={(v) => setNovaDespesa({...novaDespesa, contaId: parseInt(v as string)})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {contasIds.map(id => (
                  <SelectItem key={id} value={id.toString()}>Conta {id}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={adicionarDespesa} className="mt-3 bg-[#de4838] hover:bg-[#c73d2e]">
          <Plus className="mr-2 h-4 w-4" />
          Adicionar
        </Button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-lg font-bold">R$ {totalDespesas.toFixed(2)}</p>
        </div>
        <div className="bg-amber-50 rounded-lg p-3 text-center">
          <p className="text-sm text-amber-500">Pendentes</p>
          <p className="text-lg font-bold text-amber-600">R$ {despesasPendentes.toFixed(2)}</p>
        </div>
        <div className="bg-emerald-50 rounded-lg p-3 text-center">
          <p className="text-sm text-emerald-500">Pagas</p>
          <p className="text-lg font-bold text-emerald-600">R$ {despesasPagas.toFixed(2)}</p>
        </div>
      </div>

      {/* Tabela de despesas */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Descrição</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead>Vencimento</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-center">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {despesas.map((d) => (
            <TableRow key={d.id}>
              <TableCell className="font-medium">{d.nome}</TableCell>
              <TableCell className="text-right">R$ {d.valor.toFixed(2)}</TableCell>
              <TableCell>{new Date(d.dataVencimento).toLocaleDateString()}</TableCell>
              <TableCell>
                <Select
                  value={d.status}
                  onValueChange={(v) => atualizarDespesa(d.id, 'status', v)}
                >
                  <SelectTrigger className={`h-7 ${getStatusColor(d.status)}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDENTE">Pendente</SelectItem>
                    <SelectItem value="PAGO">Pago</SelectItem>
                    <SelectItem value="VENCIDO">Vencido</SelectItem>
                    <SelectItem value="CANCELADO">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="text-center">
                <Button
                  variant="ghost"
                  onClick={() => removerDespesa(d.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}