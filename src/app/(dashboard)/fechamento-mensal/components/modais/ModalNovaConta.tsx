"use client";

import { useState } from "react";
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

export function ModalNovaConta({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (dados: { nome: string; saldoInicial: number; tipo: string }) => Promise<void>;
}) {
  const [nome, setNome] = useState("");
  const [saldoInicial, setSaldoInicial] = useState(0);
  const [tipo, setTipo] = useState("CONTA_CORRENTE");
  const [salvando, setSalvando] = useState(false);

  const salvar = async () => {
    if (!nome.trim()) return;
    setSalvando(true);
    try {
      await onSave({
        nome: nome.trim(),
        saldoInicial: Number(saldoInicial),
        tipo,
      });
      setNome("");
      setSaldoInicial(0);
      setTipo("CONTA_CORRENTE");
      onClose();
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Conta</DialogTitle>
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
          </div>
          <div>
            <Label>Tipo</Label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
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
          <Button onClick={salvar} disabled={salvando} className="bg-primary hover:bg-primary/90">
            {salvando ? "Salvando..." : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
