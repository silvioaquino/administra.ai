"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, CheckCircle } from "lucide-react";
import { despesaSchema } from "@/lib/validations/fechamento";
import type { DespesaFechamento } from "@/types/fechamento";

interface ContaSimples {
  id: number;
  nome: string;
}

interface DespesasTabProps {
  despesas: DespesaFechamento[];
  contas: ContaSimples[];
  onRecarregar: () => void;
}

export function DespesasTab({ despesas, contas, onRecarregar }: DespesasTabProps) {
  const [novaDespesa, setNovaDespesa] = useState<Partial<DespesaFechamento>>({
    nome: "",
    valor: 0,
    dataVencimento: "",
    status: "PENDENTE",
  });
  const [salvando, setSalvando] = useState(false);

  const adicionarDespesa = async () => {
    const valid = despesaSchema.safeParse(novaDespesa);
    if (!valid.success) return;

    setSalvando(true);
    try {
      const res = await fetch("/api/despesas-fixas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: valid.data.nome,
          valor: valid.data.valor,
          vencimento: valid.data.dataVencimento,
          contaId: valid.data.contaId || null,
          status: "PENDENTE",
        }),
      });
      const json = await res.json();
      if (json.success) {
        setNovaDespesa({ nome: "", valor: 0, dataVencimento: "", status: "PENDENTE" });
        onRecarregar();
      } else {
        alert(json.error || "Erro ao adicionar despesa");
      }
    } finally {
      setSalvando(false);
    }
  };

  const marcarPago = async (d: DespesaFechamento) => {
    try {
      if (d.origem === "FIXA") {
        await fetch(`/api/despesas-fixas/${Number(d.id)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "PAGO" }),
        });
      } else {
        await fetch(`/api/livro-diario/${Number(d.id)}/pagar`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dataPagamento: new Date().toISOString() }),
        });
      }
      onRecarregar();
    } catch {
      alert("Erro ao marcar como pago");
    }
  };

  const atualizarStatus = async (d: DespesaFechamento, status: string) => {
    if (status === "PAGO") {
      await marcarPago(d);
      return;
    }
    // Para outros status, apenas reflete localmente (reenvio recarrega a lista)
    onRecarregar();
  };

  const totalDespesas = despesas.reduce((sum, d) => sum + d.valor, 0);
  const despesasPendentes = despesas.filter((d) => d.status === "PENDENTE").reduce((sum, d) => sum + d.valor, 0);
  const despesasPagas = despesas.filter((d) => d.status === "PAGO").reduce((sum, d) => sum + d.valor, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAGO":
        return "text-emerald-600 bg-emerald-100";
      case "VENCIDO":
        return "text-red-600 bg-red-100";
      default:
        return "text-amber-600 bg-amber-100";
    }
  };

  return (
    <div className="space-y-4">
      {/* Formulário de adição */}
      <div className="border rounded-lg p-4 bg-gray-100">
        <h4 className="font-semibold mb-3">Adicionar Despesa / Lançamento</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <Label>Nome</Label>
            <Input
              value={novaDespesa.nome || ""}
              onChange={(e) => setNovaDespesa({ ...novaDespesa, nome: e.target.value })}
              placeholder="Ex: Aluguel"
            />
          </div>
          <div>
            <Label>Valor (R$)</Label>
            <Input
              type="number"
              value={novaDespesa.valor || 0}
              onChange={(e) => setNovaDespesa({ ...novaDespesa, valor: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label>Vencimento</Label>
            <Input
              type="date"
              value={novaDespesa.dataVencimento || ""}
              onChange={(e) => setNovaDespesa({ ...novaDespesa, dataVencimento: e.target.value })}
            />
          </div>
          <div>
            <Label>Conta</Label>
            <Select
              value={novaDespesa.contaId?.toString() || ""}
              onValueChange={(v) => setNovaDespesa({ ...novaDespesa, contaId: parseInt(v as string) })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {contas.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={adicionarDespesa} disabled={salvando} className="mt-3 bg-[#de4838] hover:bg-[#c73d2e]">
          <Plus className="mr-2 h-4 w-4" />
          {salvando ? "Salvando..." : "Adicionar"}
        </Button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-100 rounded-lg p-3 text-center">
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
            <TableHead>Conta</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-center">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {despesas.length === 0 ? (
            <TableRow>
              <td colSpan={6} className="text-center text-gray-500 py-8">
                Nenhuma despesa para este mês.
              </td>
            </TableRow>
          ) : (
            despesas.map((d) => (
              <TableRow key={`${d.origem}-${d.id}`}>
                <TableCell className="font-medium">{d.nome}</TableCell>
                <TableCell className="text-right">R$ {d.valor.toFixed(2)}</TableCell>
                <TableCell>{new Date(d.dataVencimento).toLocaleDateString()}</TableCell>
                <TableCell className="text-xs text-gray-600">{d.contaNome || "—"}</TableCell>
                <TableCell>
                  <Select value={d.status} onValueChange={(v) => atualizarStatus(d, v as string)}>
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
                  {d.status !== "PAGO" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => marcarPago(d)}
                      className="text-emerald-600 hover:text-emerald-700"
                      title="Marcar como pago"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  ) : (
                    <CheckCircle className="h-4 w-4 text-emerald-500 mx-auto" />
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
