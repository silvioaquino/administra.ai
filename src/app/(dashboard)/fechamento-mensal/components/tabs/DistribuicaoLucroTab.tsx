"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatCurrency } from "@/lib/utils";
import { CheckCircle, AlertCircle } from "lucide-react";

interface LinhaDistribuicao {
  id?: number;
  nome: string;
  percentual: number;
  valor: number;
  contaId: number | null;
  contaNome?: string | null;
  pago?: boolean;
}

interface ContaSimples {
  id: number;
  nome: string;
}

export function DistribuicaoLucroTab({
  ano,
  mes,
  contas,
}: {
  ano: number;
  mes: number;
  contas: ContaSimples[];
}) {
  const [lucroLiquido, setLucroLiquido] = useState(0);
  const [linhas, setLinhas] = useState<LinhaDistribuicao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);
  const [jaRegistrada, setJaRegistrada] = useState(false);

  const carregar = async () => {
    setCarregando(true);
    setMensagem(null);
    try {
      const res = await fetch(`/api/fechamento-mensal/distribuicao?ano=${ano}&mes=${mes}`);
      const json = await res.json();
      if (json.success) {
        setLucroLiquido(json.data.lucroLiquido);
        setLinhas(json.data.linhas);
        setJaRegistrada(json.data.jaRegistrada);
      }
    } catch {
      setMensagem({ tipo: "erro", texto: "Erro ao carregar distribuição" });
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ano, mes]);

  const atualizar = (idx: number, campo: keyof LinhaDistribuicao, valor: any) => {
    setLinhas((prev) =>
      prev.map((l, i) => {
        if (i !== idx) return l;
        const nova = { ...l, [campo]: valor };
        if (campo === "percentual") {
          nova.valor = (Number(valor) / 100) * lucroLiquido;
        }
        return nova;
      })
    );
  };

  const totalPercentual = linhas.reduce((s, l) => s + Number(l.percentual || 0), 0);
  const totalValor = linhas.reduce((s, l) => s + Number(l.valor || 0), 0);
  const percentualOk = Math.abs(totalPercentual - 100) < 0.01;

  const registrar = async () => {
    if (!percentualOk) {
      setMensagem({ tipo: "erro", texto: "A soma dos percentuais deve ser exatamente 100%." });
      return;
    }
    setSalvando(true);
    setMensagem(null);
    try {
      const res = await fetch("/api/fechamento-mensal/distribuicao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ano,
          mes,
          linhas: linhas.map((l) => ({
            nome: l.nome,
            percentual: Number(l.percentual),
            valor: Number(l.valor),
            contaId: l.contaId,
          })),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setMensagem({ tipo: "sucesso", texto: json.message });
        setJaRegistrada(true);
        await carregar();
      } else {
        setMensagem({ tipo: "erro", texto: json.error || "Erro ao registrar distribuição" });
      }
    } catch {
      setMensagem({ tipo: "erro", texto: "Erro ao registrar distribuição" });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Resultados do Fechamento */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl p-4 text-white shadow-lg shadow-emerald-500/20">
          <p className="text-xs opacity-90">Lucro Líquido (DRE)</p>
          <p className="text-lg font-bold mt-1">{formatCurrency(lucroLiquido)}</p>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl p-4 text-white shadow-lg shadow-indigo-500/20">
          <p className="text-xs opacity-90">Total Distribuído</p>
          <p className="text-lg font-bold mt-1">{formatCurrency(totalValor)}</p>
        </div>
      </div>

      {mensagem && (
        <Alert
          className={
            mensagem.tipo === "sucesso"
              ? "bg-emerald-50 border-emerald-200/80 rounded-xl"
              : "bg-red-50 border-red-200/80 rounded-xl"
          }
        >
          {mensagem.tipo === "sucesso" ? (
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={mensagem.tipo === "sucesso" ? "text-sm text-emerald-700" : "text-sm text-red-700"}>
            {mensagem.texto}
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-gray-200 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="bg-gray-50/80 border-b border-gray-100">
          <CardTitle className="text-lg">Distribuição de Lucros</CardTitle>
          <p className="text-xs text-gray-500 mt-1">
            Defina o percentual de cada destino. A soma deve fechar 100%.
          </p>
        </CardHeader>
        <CardContent className="p-4 md:p-5">
          {carregando ? (
            <p className="text-sm text-gray-500 py-6 text-center">Carregando...</p>
          ) : (
            <div className="space-y-3">
              <div className="hidden md:grid md:grid-cols-12 gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider px-2">
                <div className="col-span-4">Destino</div>
                <div className="col-span-2 text-right">% </div>
                <div className="col-span-3 text-right">Valor (R$)</div>
                <div className="col-span-3">Conta</div>
              </div>

              {linhas.map((l, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center p-3 bg-gray-50 rounded-xl border border-gray-100"
                >
                  <div className="col-span-4">
                    <Input
                      value={l.nome}
                      onChange={(e) => atualizar(idx, "nome", e.target.value)}
                      className="bg-white"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={l.percentual}
                      onChange={(e) => atualizar(idx, "percentual", Number(e.target.value))}
                      className="bg-white text-right"
                    />
                  </div>
                  <div className="col-span-3 text-right font-bold text-gray-800">
                    {formatCurrency(l.valor)}
                  </div>
                  <div className="col-span-3">
                    <select
                      value={l.contaId ?? ""}
                      onChange={(e) =>
                        atualizar(idx, "contaId", e.target.value ? parseInt(e.target.value) : null)
                      }
                      className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#de4838]"
                    >
                      <option value="">Selecione a conta...</option>
                      {contas.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}

              <div className="border-t-2 border-gray-200 pt-3 mt-2 flex justify-between items-center">
                <span className="font-semibold text-gray-800">Total</span>
                <div className="text-right">
                  <p className={`font-bold ${percentualOk ? "text-emerald-600" : "text-red-600"}`}>
                    {totalPercentual.toFixed(2)}%
                  </p>
                  <p className="text-sm text-gray-500">{formatCurrency(totalValor)}</p>
                </div>
              </div>

              <Button
                onClick={registrar}
                disabled={salvando || !percentualOk}
                className="w-full bg-[#de4838] hover:bg-[#c73d2e] text-white rounded-xl shadow-lg shadow-[#de4838]/25"
              >
                {salvando ? "Registrando..." : jaRegistrada ? "Atualizar distribuição" : "Registrar distribuição"}
              </Button>
              {!percentualOk && (
                <p className="text-xs text-red-500 text-center">
                  Ajuste os percentuais para totalizarem 100% antes de registrar.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
