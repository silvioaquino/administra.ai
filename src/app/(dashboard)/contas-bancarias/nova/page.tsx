"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";

export default function NovaContaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    tipo: "CONTA_CORRENTE",
    saldoInicial: 0,
    instituicao: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.nome.trim()) {
      setError("Nome da conta é obrigatório.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/contas-financeiras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        alert("Conta criada com sucesso!");
        router.push("/contas-bancarias");
      } else {
        setError(data.error || "Erro ao criar conta.");
      }
    } catch (error) {
      console.error("Erro:", error);
      setError("Erro ao criar conta.");
    } finally {
      setLoading(false);
    }
  };

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
            <h1 className="text-xl font-semibold text-white">Nova Conta Financeira</h1>
            <p className="text-sm text-muted-foreground">Cadastre uma nova conta para controle de fluxo</p>
          </div>
        </div>
        <Button
          type="submit"
          form="conta-form"
          disabled={loading}
          className="bg-primary hover:bg-primary/90 text-white rounded-full"
        >
          <Save className="mr-2 h-4 w-4" />
          {loading ? "Salvando..." : "Salvar Conta"}
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
            <form id="conta-form" onSubmit={handleSubmit} className="space-y-6">
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

              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Saldo Inicial
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70">R$</span>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={formData.saldoInicial}
                    onChange={(e) =>
                      setFormData({ ...formData, saldoInicial: parseFloat(e.target.value) || 0 })
                    }
                    className="pl-8 rounded-lg border-border"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Saldo que esta conta possuía antes de começar a usar o sistema.
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}