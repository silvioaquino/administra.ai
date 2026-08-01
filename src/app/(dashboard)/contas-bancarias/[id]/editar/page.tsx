"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ContaFinanceira {
  id: number;
  nome: string;
  tipo: string;
  saldoInicial: number;
  instituicao: string | null;
}

export default function EditarContaPage() {
  const router = useRouter();
  const params = useParams();
  const contaId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    tipo: "CONTA_CORRENTE",
    instituicao: "",
  });

  useEffect(() => {
    carregarConta();
  }, [contaId]);

  async function carregarConta() {
    setLoading(true);
    try {
      const response = await fetch(`/api/contas-financeiras/${contaId}`);
      const data = await response.json();
      if (data.success) {
        setFormData({
          nome: data.data.nome,
          tipo: data.data.tipo,
          instituicao: data.data.instituicao || "",
        });
      } else {
        setError(data.error || "Erro ao carregar conta");
      }
    } catch (error) {
      console.error("Erro:", error);
      setError("Erro ao carregar conta");
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.nome.trim()) {
      setError("Nome da conta é obrigatório.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/contas-financeiras/${contaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        alert("Conta atualizada com sucesso!");
        router.push("/contas-bancarias");
      } else {
        setError(data.error || "Erro ao atualizar conta.");
      }
    } catch (error) {
      console.error("Erro:", error);
      setError("Erro ao atualizar conta.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-2 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-surface border-b border-border px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-white">Editar Conta</h1>
            <p className="text-sm text-muted-foreground">Atualize as informações da conta</p>
          </div>
        </div>
        <Button
          type="submit"
          form="editar-conta-form"
          disabled={saving}
          className="bg-primary hover:bg-primary/90 text-white rounded-full"
        >
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>

      <div className="container mx-auto p-6 max-w-3xl">
        <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-surface-2 p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-white">Dados da Conta</h3>
            </div>
          </div>
          <div className="p-6">
            {error && (
              <Alert variant="destructive" className="mb-6 bg-destructive/5 border-destructive/30">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <form id="editar-conta-form" onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Nome da Conta *
                </Label>
                <Input
                  placeholder="Ex: Caixa Econômica, Dinheiro Físico, Conta iFood..."
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="rounded-lg border-border"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Tipo
                  </Label>
                  <select
                    className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm"
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  >
                    <option value="CONTA_CORRENTE">Conta Corrente</option>
                    <option value="CARTEIRA">Carteira (Dinheiro Físico)</option>
                    <option value="APLICACAO">Aplicação / Investimento</option>
                    <option value="CONTA_IFOOD">Conta iFood</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Instituição
                  </Label>
                  <Input
                    placeholder="Ex: Banco do Brasil, Nubank, Caixa..."
                    value={formData.instituicao}
                    onChange={(e) => setFormData({ ...formData, instituicao: e.target.value })}
                    className="rounded-lg border-border"
                  />
                </div>
              </div>

              <Alert variant="default" className="bg-info/5 border-info/30">
                <AlertDescription className="text-sm text-info">
                  ℹ️ O saldo inicial não pode ser alterado após a criação da conta.
                  Para ajustar o saldo, utilize a funcionalidade de transferência.
                </AlertDescription>
              </Alert>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}