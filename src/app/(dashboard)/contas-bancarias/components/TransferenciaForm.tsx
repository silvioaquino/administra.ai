"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatCurrency } from "@/lib/utils";

interface ContaFinanceira {
  id: number;
  nome: string;
  tipo: string;
  saldoInicial: number;
  saldoAtual: number;
  instituicao: string | null;
}

interface TransferenciaFormProps {
  contas: ContaFinanceira[];
  onSuccess: () => void;
}

export function TransferenciaForm({ contas, onSuccess }: TransferenciaFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    contaOrigemId: "",
    contaDestinoId: "",
    valor: 0,
    descricao: "",
    data: new Date().toISOString().split("T")[0],
  });

  const origemSelecionada = contas.find(c => c.id === parseInt(formData.contaOrigemId));
  const destinoSelecionado = contas.find(c => c.id === parseInt(formData.contaDestinoId));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.contaOrigemId || !formData.contaDestinoId) {
      setError("Selecione a conta de origem e destino.");
      return;
    }
    if (formData.contaOrigemId === formData.contaDestinoId) {
      setError("As contas de origem e destino devem ser diferentes.");
      return;
    }
    if (formData.valor <= 0) {
      setError("Informe um valor válido para a transferência.");
      return;
    }
    if (origemSelecionada && origemSelecionada.saldoAtual < formData.valor) {
      setError(`Saldo insuficiente em ${origemSelecionada.nome}. Saldo atual: ${formatCurrency(origemSelecionada.saldoAtual)}`);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/contas-financeiras/transferir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        alert("Transferência realizada com sucesso!");
        onSuccess();
      } else {
        setError(data.error || "Erro ao realizar transferência.");
      }
    } catch (error) {
      console.error("Erro:", error);
      setError("Erro ao realizar transferência.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-700">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1">
        <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Conta de Origem *</Label>
        <select
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#de4838]"
          value={formData.contaOrigemId}
          onChange={(e) => setFormData({ ...formData, contaOrigemId: e.target.value })}
          required
        >
          <option value="">Selecione a conta de origem</option>
          {contas.map(conta => (
            <option key={conta.id} value={conta.id}>
              {conta.nome} - {formatCurrency(conta.saldoAtual)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Conta de Destino *</Label>
        <select
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#de4838]"
          value={formData.contaDestinoId}
          onChange={(e) => setFormData({ ...formData, contaDestinoId: e.target.value })}
          required
        >
          <option value="">Selecione a conta de destino</option>
          {contas.map(conta => (
            <option key={conta.id} value={conta.id}>
              {conta.nome} - {formatCurrency(conta.saldoAtual)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Valor *</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">R$</span>
          <Input
            type="number"
            step="0.01"
            placeholder="0,00"
            value={formData.valor}
            onChange={(e) => setFormData({ ...formData, valor: parseFloat(e.target.value) || 0 })}
            className="pl-8 rounded-lg border-gray-300"
            required
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Data</Label>
        <Input
          type="date"
          value={formData.data}
          onChange={(e) => setFormData({ ...formData, data: e.target.value })}
          className="rounded-lg border-gray-300"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Descrição (Opcional)</Label>
        <Input
          placeholder="Ex: Retirada de lucro, Pagamento de fornecedor..."
          value={formData.descricao}
          onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
          className="rounded-lg border-gray-300"
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full bg-[#de4838] hover:bg-[#c73d2e] rounded-lg">
        {loading ? "Processando..." : "Confirmar Transferência"}
      </Button>
    </form>
  );
}