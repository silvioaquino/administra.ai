"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface ContaParaEditar {
  id: number;
  nome: string;
  saldoInicial: number;
  tipo?: string;
}

export function ModalEditarConta({
  conta,
  open,
  onClose,
  onSave,
}: {
  conta: ContaParaEditar | null;
  open: boolean;
  onClose: () => void;
  onSave: (id: number, dados: { nome: string; saldoInicial: number; tipo: string }) => Promise<void>;
}) {
  const [nome, setNome] = useState("");
  const [saldoInicial, setSaldoInicial] = useState(0);
  const [tipo, setTipo] = useState("CONTA_CORRENTE");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (conta) {
      setNome(conta.nome);
      setSaldoInicial(Number(conta.saldoInicial) || 0);
      setTipo(conta.tipo || "CONTA_CORRENTE");
    }
  }, [conta]);

  const salvar = async () => {
    if (!conta || !nome.trim()) return;
    setSalvando(true);
    try {
      await onSave(conta.id, {
        nome: nome.trim(),
        saldoInicial: Number(saldoInicial),
        tipo,
      });
      onClose();
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Conta</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Nome da conta</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Banco X" />
          </div>
          <div>
            <Label>Saldo inicial (R$)</Label>
            <Input
              type="number"
              step="0.01"
              value={saldoInicial}
              onChange={(e) => setSaldoInicial(Number(e.target.value))}
            />
            <p className="text-xs text-gray-400 mt-1">
              O saldo atual é calculado a partir do saldo inicial + movimentações.
            </p>
          </div>
          <div>
            <Label>Tipo</Label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#de4838]"
            >
              <option value="CONTA_CORRENTE">Conta Corrente</option>
              <option value="POUPANCA">Poupança</option>
              <option value="CAIXA">Caixa</option>
              <option value="INVESTIMENTO">Investimento</option>
              <option value="OUTRO">Outro</option>
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={salvar} disabled={salvando} className="bg-[#de4838] hover:bg-[#c73d2e]">
            {salvando ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
