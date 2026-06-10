"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Edit2, Trash2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface PlanoContas {
  id: number;
  codigo: string;
  nome: string;
  tipo: string;
  grupo: string;
  ordem: number;
  ativo: boolean;
}

export default function PlanoContasPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [contas, setContas] = useState<PlanoContas[]>([]);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    codigo: "",
    nome: "",
    tipo: "RECEITA",
    grupo: "RECEITA_BRUTA",
  });

  useEffect(() => {
    carregarPlanoContas();
  }, []);

  const carregarPlanoContas = async () => {
    try {
      const response = await fetch("/api/fechamento-mensal/plano-contas");
      const data = await response.json();
      if (data.success) {
        setContas(data.data);
      }
    } catch (error) {
      console.error("Erro ao carregar plano de contas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editandoId
        ? `/api/fechamento-mensal/plano-contas/${editandoId}`
        : "/api/fechamento-mensal/plano-contas";
      const method = editandoId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (data.success) {
        alert(editandoId ? "Conta atualizada!" : "Conta criada!");
        setEditandoId(null);
        setFormData({ codigo: "", nome: "", tipo: "RECEITA", grupo: "RECEITA_BRUTA" });
        carregarPlanoContas();
      } else {
        alert(data.error || "Erro ao salvar");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (conta: PlanoContas) => {
    setEditandoId(conta.id);
    setFormData({
      codigo: conta.codigo,
      nome: conta.nome,
      tipo: conta.tipo,
      grupo: conta.grupo,
    });
  };

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta conta?")) {
      try {
        const response = await fetch(`/api/fechamento-mensal/plano-contas/${id}`, {
          method: "DELETE",
        });
        const data = await response.json();
        if (data.success) {
          alert("Conta excluída!");
          carregarPlanoContas();
        } else {
          alert(data.error || "Erro ao excluir");
        }
      } catch (error) {
        console.error("Erro:", error);
        alert("Erro ao excluir");
      }
    }
  };

  const getTipoLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      RECEITA: "💰 Receita",
      CUSTO: "📦 Custo",
      DESPESA: "📉 Despesa",
    };
    return tipos[tipo] || tipo;
  };

  const getGrupoLabel = (grupo: string) => {
    const grupos: Record<string, string> = {
      RECEITA_BRUTA: "Receita Bruta",
      CMV: "CMV - Custos",
      DESPESAS_OPERACIONAIS: "Despesas Operacionais",
      RESULTADO: "Resultado",
    };
    return grupos[grupo] || grupo;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#de4838] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-gray-800">Plano de Contas Gerencial</h1>
            <p className="text-sm text-gray-500">Configure como as contas são agrupadas no DRE</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6 max-w-7xl">
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <AlertDescription className="text-sm text-blue-700">
            Configure quais contas do livro diário compõem cada grupo do DRE.
            Ex: Contas 3.1.x → Receita Bruta, Contas 4.2.x → CMV.
          </AlertDescription>
        </Alert>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Formulário */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden h-fit">
            <div className="bg-gray-50 p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">
                {editandoId ? "Editar Conta" : "Nova Conta"}
              </h3>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Código da Conta *
                  </Label>
                  <Input
                    placeholder="Ex: 3.1.1, 4.2.1"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Nome da Conta *
                  </Label>
                  <Input
                    placeholder="Ex: Receita com Vendas, Compras de Mercadorias"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Tipo
                    </Label>
                    <select
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm"
                      value={formData.tipo}
                      onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    >
                      <option value="RECEITA">Receita</option>
                      <option value="CUSTO">Custo</option>
                      <option value="DESPESA">Despesa</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Grupo DRE
                    </Label>
                    <select
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm"
                      value={formData.grupo}
                      onChange={(e) => setFormData({ ...formData, grupo: e.target.value })}
                    >
                      <option value="RECEITA_BRUTA">Receita Bruta</option>
                      <option value="CMV">CMV - Custos</option>
                      <option value="DESPESAS_OPERACIONAIS">Despesas Operacionais</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={saving} className="flex-1 bg-[#de4838] hover:bg-[#c73d2e]">
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? "Salvando..." : editandoId ? "Atualizar" : "Criar Conta"}
                  </Button>
                  {editandoId && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditandoId(null);
                        setFormData({ codigo: "", nome: "", tipo: "RECEITA", grupo: "RECEITA_BRUTA" });
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Lista de Contas */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gray-50 p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Contas Configuradas</h3>
              <p className="text-xs text-gray-500 mt-1">{contas.length} contas cadastradas</p>
            </div>
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Código</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Nome</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Grupo DRE</th>
                    <th className="px-4 py-3 text-center w-20">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {contas.map((conta) => (
                    <tr key={conta.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">{conta.codigo}</td>
                      <td className="px-4 py-3 text-gray-800">{conta.nome}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="outline" className="bg-gray-100">
                          {getTipoLabel(conta.tipo)}
                        </Badge>
                       </td>
                      <td className="px-4 py-3 text-gray-600">{getGrupoLabel(conta.grupo)}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => handleEdit(conta)}
                            className="p-1 text-amber-500 hover:bg-amber-100 rounded-lg transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(conta.id)}
                            className="p-1 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                       </td>
                     </tr>
                  ))}
                  {contas.length === 0 && (
                    <tr className="border-b border-gray-100">
                      <td colSpan={5} className="py-8 text-center text-gray-500">
                        Nenhuma conta cadastrada. Clique em "Criar Conta" para começar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}