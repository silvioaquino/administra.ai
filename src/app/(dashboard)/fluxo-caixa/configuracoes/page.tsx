"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Target, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatCurrency } from "@/lib/utils";

interface MetaMensal {
  id?: number;
  ano: number;
  mes: number;
  metaFaturamentoDiaria: number;
  metaDespesasDiaria: number;
  metaLucroPercentual: number;
  diasUteis: number;
}

export default function ConfiguracoesFluxoCaixaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [anoAtual, setAnoAtual] = useState(new Date().getFullYear());
  const [metas, setMetas] = useState<MetaMensal[]>([]);

  const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];

  useEffect(() => {
    carregarMetas();
  }, [anoAtual]);

  const carregarMetas = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/fluxo-caixa/metas?ano=${anoAtual}`);
      const data = await response.json();
      if (data.success) {
        if (data.data.length > 0) {
          setMetas(data.data);
        } else {
          // Criar metas padrão para todos os meses
          const metasPadrao: MetaMensal[] = meses.map((_, idx) => ({
            ano: anoAtual,
            mes: idx + 1,
            metaFaturamentoDiaria: 2500,
            metaDespesasDiaria: 1700,
            metaLucroPercentual: 20,
            diasUteis: 26,
          }));
          setMetas(metasPadrao);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar metas:", error);
    } finally {
      setLoading(false);
    }
  };

  const atualizarMeta = (mes: number, campo: keyof MetaMensal, valor: number) => {
    setMetas(metas.map(m => (m.mes === mes ? { ...m, [campo]: valor } : m)));
  };

  const aplicarParaTodosMeses = () => {
    const mesAtual = new Date().getMonth() + 1;
    const metaAtual = metas.find(m => m.mes === mesAtual);
    if (metaAtual && confirm(`Aplicar valores do mês atual (${meses[mesAtual - 1]}) para todos os meses?`)) {
      setMetas(metas.map(m => ({
        ...m,
        metaFaturamentoDiaria: metaAtual.metaFaturamentoDiaria,
        metaDespesasDiaria: metaAtual.metaDespesasDiaria,
        metaLucroPercentual: metaAtual.metaLucroPercentual,
        diasUteis: metaAtual.diasUteis,
      })));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/fluxo-caixa/metas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ano: anoAtual, metas }),
      });
      const data = await response.json();
      if (data.success) {
        alert("✅ Metas salvas com sucesso!");
        router.push("/fluxo-caixa");
      } else {
        alert("❌ Erro ao salvar metas");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("❌ Erro ao salvar metas");
    } finally {
      setSaving(false);
    }
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
            <h1 className="text-xl font-semibold text-gray-800">Configuração de Metas</h1>
            <p className="text-sm text-gray-500">Defina as metas de faturamento, despesas e lucro</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={aplicarParaTodosMeses} className="rounded-full">
            Aplicar a Todos os Meses
          </Button>
          <Button
            type="submit"
            form="metas-form"
            disabled={saving}
            className="bg-[#de4838] hover:bg-[#c73d2e] text-white rounded-full"
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Salvando..." : "Salvar Metas"}
          </Button>
        </div>
      </div>

      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="h-5 w-5 text-[#de4838]" />
            <h2 className="text-lg font-semibold text-gray-800">Metas para {anoAtual}</h2>
          </div>
          <select
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm"
            value={anoAtual}
            onChange={(e) => setAnoAtual(parseInt(e.target.value))}
          >
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
          </select>
        </div>

        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <AlertDescription className="text-sm text-blue-700">
            Defina metas realistas baseadas no histórico do seu negócio. As metas diárias são multiplicadas pelos dias úteis do mês.
          </AlertDescription>
        </Alert>

        <form id="metas-form" onSubmit={handleSubmit}>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Mês</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                      Meta Faturamento Diário
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                      Meta Despesas Diária
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">
                      Dias Úteis
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">
                      Meta Lucro %
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                      Meta Mensal Fat.
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                      Meta Mensal Desp.
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {metas.map((meta) => {
                    const metaMensalFat = meta.metaFaturamentoDiaria * meta.diasUteis;
                    const metaMensalDesp = meta.metaDespesasDiaria * meta.diasUteis;
                    
                    return (
                      <tr key={meta.mes} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">
                          {meses[meta.mes - 1]}
                        </td>
                        <td className="px-4 py-3">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">R$</span>
                            <Input
                              type="number"
                              step="50"
                              value={meta.metaFaturamentoDiaria}
                              onChange={(e) =>
                                atualizarMeta(meta.mes, "metaFaturamentoDiaria", parseFloat(e.target.value) || 0)
                              }
                              className="pl-8 h-9 text-right"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">R$</span>
                            <Input
                              type="number"
                              step="50"
                              value={meta.metaDespesasDiaria}
                              onChange={(e) =>
                                atualizarMeta(meta.mes, "metaDespesasDiaria", parseFloat(e.target.value) || 0)
                              }
                              className="pl-8 h-9 text-right"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            type="number"
                            step="1"
                            min="1"
                            max="31"
                            value={meta.diasUteis}
                            onChange={(e) =>
                              atualizarMeta(meta.mes, "diasUteis", parseInt(e.target.value) || 26)
                            }
                            className="text-center h-9 w-24 mx-auto"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="relative">
                            <Input
                              type="number"
                              step="1"
                              min="0"
                              max="100"
                              value={meta.metaLucroPercentual}
                              onChange={(e) =>
                                atualizarMeta(meta.mes, "metaLucroPercentual", parseFloat(e.target.value) || 0)
                              }
                              className="text-center h-9 w-20 mx-auto"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-emerald-600">
                          {formatCurrency(metaMensalFat)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-red-500">
                          {formatCurrency(metaMensalDesp)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="border-t-2 border-gray-200 bg-gray-50 font-bold">
                  <tr>
                    <td className="px-4 py-3">TOTAIS ANUAIS</td>
                    <td className="px-4 py-3 text-right">-</td>
                    <td className="px-4 py-3 text-right">-</td>
                    <td className="px-4 py-3 text-center">-</td>
                    <td className="px-4 py-3 text-center">-</td>
                    <td className="px-4 py-3 text-right text-emerald-600">
                      {formatCurrency(metas.reduce((sum, m) => sum + m.metaFaturamentoDiaria * m.diasUteis, 0))}
                    </td>
                    <td className="px-4 py-3 text-right text-red-500">
                      {formatCurrency(metas.reduce((sum, m) => sum + m.metaDespesasDiaria * m.diasUteis, 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </form>

        {/* Cards informativos */}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-emerald-100 p-2">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Como definir a meta de faturamento?</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Baseie-se no faturamento médio dos últimos 3 meses e adicione uma margem de crescimento de 10-20%.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-red-100 p-2">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Como definir a meta de despesas?</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Analise seus custos fixos e variáveis. Mantenha as despesas abaixo de 70% do faturamento.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}