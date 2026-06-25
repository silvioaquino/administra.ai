"use client";

import React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Download,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  BarChart3,
  PieChart,
  AlertCircle,
  Edit,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DespesasTab } from "./components/tabs/DespesasTab";
import { FolhaPagamentoTab } from "./components/tabs/FolhaPagamentoTab";
import { SaldosContasTab } from "./components/tabs/SaldosContasTab";
import { formatCurrency, formatPercentage, formatDate } from "@/lib/utils";
import type { FuncionarioFechamento, DespesaFechamento, ContaSaldo } from "@/types/fechamento";

interface DreLinha {
  id: string;
  descricao: string;
  valor: number;
  percentual: number;
  contas?: string[];
  isGroup?: boolean;
  children?: DreLinha[];
}

interface FechamentoInfo {
  id: number;
  ano: number;
  mes: number;
  status: string;
  dataFechamento: string | null;
  observacao: string | null;
}

export default function FechamentoMensalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hideValues, setHideValues] = useState(false);
  const [anoAtual, setAnoAtual] = useState(new Date().getFullYear());
  const [mesAtual, setMesAtual] = useState(new Date().getMonth() + 1);
  const [fechamento, setFechamento] = useState<FechamentoInfo | null>(null);
  const [dre, setDre] = useState<DreLinha[]>([]);
  const [acumuladoAno, setAcumuladoAno] = useState<DreLinha[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["RECEITA_BRUTA", "LUCRO_BRUTO"]));
  const [contas, setContas] = useState<ContaSaldo[]>([]);
  const [despesas, setDespesas] = useState<DespesaFechamento[]>([]);
  const [funcionarios, setFuncionarios] = useState<FuncionarioFechamento[]>([]);
  const [despesasFixas, setDespesasFixas] = useState<any[]>([]);

  const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];

  useEffect(() => {
    carregarDados();
  }, [anoAtual, mesAtual]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      // Carregar DRE do mês
      const dreResponse = await fetch(`/api/fechamento-mensal/dre?ano=${anoAtual}&mes=${mesAtual}`);
      const dreData = await dreResponse.json();
      if (dreData.success) {
        setDre(dreData.data);
      }

      // Carregar DRE acumulado do ano
      const acumuladoResponse = await fetch(`/api/fechamento-mensal/dre?ano=${anoAtual}&acumulado=true`);
      const acumuladoData = await acumuladoResponse.json();
      if (acumuladoData.success) {
        setAcumuladoAno(acumuladoData.data);
      }

      // Carregar informações de fechamento
      const fechamentoResponse = await fetch(`/api/fechamento-mensal/status?ano=${anoAtual}&mes=${mesAtual}`);
      const fechamentoData = await fechamentoResponse.json();
      if (fechamentoData.success) {
        setFechamento(fechamentoData.data);
      }

      // Carregar contas financeiras
      const contasResponse = await fetch(`/api/contas-financeiras?userId=current-user`);
      const contasData = await contasResponse.json();
      if (contasData.success) {
        setContas(contasData.data.map((c: any) => ({
          id: c.id,
          nome: c.nome,
          saldoAtual: Number(c.saldoAtual || 0),
          saldoAnterior: Number(c.saldoAnterior || c.saldoAtual || 0),
          despesas: 0,
          sobra: Number(c.saldoAtual || 0),
        })));
      }

      // Carregar despesas do mês
      const despesasResponse = await fetch(`/api/livro-diario?ano=${anoAtual}&mes=${mesAtual}&tipo=DESPESA`);
      const despesasData = await despesasResponse.json();
      if (despesasData.success) {
        setDespesas(despesasData.data || []);
      }

      // Carregar despesas fixas
      const despesasFixasResponse = await fetch(`/api/despesas-fixas`);
      const despesasFixasData = await despesasFixasResponse.json();
      if (despesasFixasData.success) {
        setDespesasFixas(despesasFixasData.data || []);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const gerarRelatorio = async () => {
    try {
      const response = await fetch(`/api/fechamento-mensal/gerar-pdf?ano=${anoAtual}&mes=${mesAtual}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `DRE_${meses[mesAtual - 1]}_${anoAtual}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Erro ao gerar relatório PDF");
    }
  };

  const exportarExcel = async () => {
    try {
      const response = await fetch(`/api/fechamento-mensal/exportar-excel?ano=${anoAtual}&mes=${mesAtual}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `DRE_${meses[mesAtual - 1]}_${anoAtual}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro ao exportar Excel:", error);
      alert("Erro ao exportar Excel");
    }
  };

  const realizarFechamento = async () => {
    if (confirm("Tem certeza que deseja fechar este mês? Após fechado, não será possível alterar lançamentos deste período.")) {
      try {
        const response = await fetch("/api/fechamento-mensal/fechar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ano: anoAtual, mes: mesAtual }),
        });
        const data = await response.json();
        if (data.success) {
          alert("✅ Mês fechado com sucesso!");
          carregarDados();
        } else {
          alert("❌ Erro ao fechar mês");
        }
      } catch (error) {
        console.error("Erro:", error);
        alert("❌ Erro ao fechar mês");
      }
    }
  };

  const reabrirFechamento = async () => {
    if (confirm("Tem certeza que deseja reabrir este mês? Você poderá alterar lançamentos novamente.")) {
      try {
        const response = await fetch("/api/fechamento-mensal/reabrir", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ano: anoAtual, mes: mesAtual }),
        });
        const data = await response.json();
        if (data.success) {
          alert("✅ Mês reaberto com sucesso!");
          carregarDados();
        } else {
          alert("❌ Erro ao reabrir mês");
        }
      } catch (error) {
        console.error("Erro:", error);
        alert("❌ Erro ao reabrir mês");
      }
    }
  };

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const renderDreLinha = (linha: DreLinha, nivel: number = 0, isAcumulado: boolean = false) => {
    const isExpanded = expandedGroups.has(linha.id);
    const hasChildren = linha.children && linha.children.length > 0;
    const valorFormatado = formatCurrency(linha.valor);

    // Determinar cor baseada no tipo de linha
    let valorClass = "text-gray-800";
    let bgClass = "";

    if (linha.id === "RECEITA_BRUTA") {
      valorClass = "text-emerald-600 font-bold";
      bgClass = "bg-emerald-50/50";
    } else if (linha.id === "LUCRO_BRUTO" || linha.id === "LUCRO_LIQUIDO") {
      valorClass = linha.valor >= 0 ? "text-emerald-600 font-bold" : "text-red-600 font-bold";
      bgClass = linha.valor >= 0 ? "bg-emerald-50/50" : "bg-red-50/50";
    } else if (linha.id === "CMV" || linha.id === "DESPESAS_OPERACIONAIS") {
      valorClass = "text-red-500";
    }

    return (
      <React.Fragment key={linha.id}>
        <tr className={`border-b border-gray-100 ${bgClass} hover:bg-gray-50 transition-colors`}>
          <td className="px-4 py-3" style={{ paddingLeft: `${20 + nivel * 16}px` }}>
            <div className="flex items-center gap-2">
              {hasChildren && (
                <button
                  onClick={() => toggleGroup(linha.id)}
                  className="p-0.5 hover:bg-gray-200 rounded"
                >
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              )}
              <span className={`text-sm ${linha.isGroup ? "font-semibold" : "text-gray-600"}`}>
                {linha.descricao}
              </span>
            </div>
          </td>
          <td className="px-4 py-3 text-right font-medium">
            {hideValues ? "••••••" : valorFormatado}
          </td>
          <td className="px-4 py-3 text-right text-gray-500">
            {formatPercentage(linha.percentual)}
           </td>
          {!isAcumulado && (
            <td className="px-4 py-3 text-center">
              {linha.contas && linha.contas.length > 0 && (
                <Badge variant="outline" className="text-[10px]">
                  {linha.contas.length} conta(s)
                </Badge>
              )}
             </td>
          )}
        </tr>
        {hasChildren && isExpanded && (
          linha.children!.map(child => renderDreLinha(child, nivel + 1, isAcumulado))
        )}
      </React.Fragment>
    );
  };

  const receitaBruta = dre.find(l => l.id === "RECEITA_BRUTA")?.valor || 0;
  const lucroLiquidoDRE = dre.find(l => l.id === "LUCRO_LIQUIDO")?.valor || 0;
  const margemLiquida = receitaBruta > 0 ? (lucroLiquidoDRE / receitaBruta) * 100 : 0;

  const isFechado = fechamento?.status === "FECHADO";

  // Cálculos do fechamento
  const saldoTotal = contas.reduce((sum, c) => sum + (c.saldoAtual || 0), 0);
  const totalDespesas = despesas.reduce((sum, d) => sum + Number(d.valor || 0), 0);
  const saldoRestante = saldoTotal - totalDespesas;

  // Distribuição de lucros
  const capitalGiro = saldoRestante * 0.10;
  const fundoInvestimento = saldoRestante * 0.10;
  const provisoes = Math.max(1000, saldoRestante * 0.05);
  const lucroLiquido = saldoRestante - capitalGiro - fundoInvestimento - provisoes;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Fechamento Mensal</h1>
          <p className="text-sm text-gray-500">
            Demonstrativo de Resultados do Exercício (DRE)
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setHideValues(!hideValues)}
            className="gap-2 rounded-full border-gray-200"
          >
            {hideValues ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {hideValues ? "Mostrar" : "Ocultar"}
          </Button>
          <Button
            variant="outline"
            onClick={gerarRelatorio}
            className="rounded-full border-gray-200"
          >
            <Download className="mr-2 h-4 w-4" />
            PDF
          </Button>
          <Button
            variant="outline"
            onClick={exportarExcel}
            className="rounded-full border-gray-200"
          >
            <FileText className="mr-2 h-4 w-4" />
            Excel
          </Button>
          {isFechado ? (
            <Button
              variant="outline"
              onClick={reabrirFechamento}
              className="rounded-full border-amber-500 text-amber-600"
            >
              <Unlock className="mr-2 h-4 w-4" />
              Reabrir Mês
            </Button>
          ) : (
            <Button
              onClick={realizarFechamento}
              className="bg-[#de4838] hover:bg-[#c73d2e] text-white rounded-full"
            >
              <Lock className="mr-2 h-4 w-4" />
              Fechar Mês
            </Button>
          )}
        </div>
      </div>

      <div className="container mx-auto p-6 max-w-7xl">
        {/* Seletor de Mês/Ano */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
              <select
                className="rounded-lg bg-transparent px-4 py-2 text-sm focus:outline-none"
                value={mesAtual}
                onChange={(e) => setMesAtual(parseInt(e.target.value))}
                disabled={isFechado && fechamento?.mes === mesAtual && fechamento?.ano === anoAtual}
              >
                {meses.map((mes, idx) => (
                  <option key={idx} value={idx + 1}>
                    {mes}
                  </option>
                ))}
              </select>
              <span className="text-gray-300">|</span>
              <select
                className="rounded-lg bg-transparent px-4 py-2 text-sm focus:outline-none"
                value={anoAtual}
                onChange={(e) => setAnoAtual(parseInt(e.target.value))}
                disabled={isFechado && fechamento?.mes === mesAtual && fechamento?.ano === anoAtual}
              >
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
              </select>
            </div>
            {fechamento && (
              <Badge className={isFechado ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}>
                {isFechado ? (
                  <>
                    <Lock className="mr-1 h-3 w-3" />
                    Fechado em {fechamento.dataFechamento ? formatDate(fechamento.dataFechamento) : "-"}
                  </>
                ) : (
                  <>
                    <Unlock className="mr-1 h-3 w-3" />
                    Aberto
                  </>
                )}
              </Badge>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Margem Líquida</p>
            <p className={`text-xl font-bold ${margemLiquida >= 20 ? "text-emerald-600" : margemLiquida >= 10 ? "text-amber-600" : "text-red-600"}`}>
              {formatPercentage(margemLiquida)}
            </p>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm opacity-90 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Receita Bruta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {hideValues ? "••••••" : formatCurrency(receitaBruta)}
              </p>
              <p className="text-xs opacity-80 mt-1">Total de vendas no período</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-red-600 to-red-700 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm opacity-90 flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                CMV
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {hideValues ? "••••••" : formatCurrency(dre.find(l => l.id === "CMV")?.valor || 0)}
              </p>
              <p className="text-xs opacity-80 mt-1">Custo da Mercadoria Vendida</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm opacity-90 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Despesas Operacionais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {hideValues ? "••••••" : formatCurrency(dre.find(l => l.id === "DESPESAS_OPERACIONAIS")?.valor || 0)}
              </p>
              <p className="text-xs opacity-80 mt-1">Despesas administrativas e financeiras</p>
            </CardContent>
          </Card>

          <Card className={`bg-gradient-to-r ${lucroLiquido >= 0 ? "from-purple-600 to-purple-700" : "from-orange-600 to-orange-700"} text-white`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm opacity-90 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Lucro Líquido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {hideValues ? "••••••" : formatCurrency(lucroLiquido)}
              </p>
              <p className="text-xs opacity-80 mt-1">Resultado final do período</p>
            </CardContent>
          </Card>
        </div>

        {/* Card de Saldos das Contas */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-[#de4838]" />
              Saldos das Contas - {meses[mesAtual - 1]}/{anoAtual}
            </CardTitle>
            <p className="text-xs text-gray-500 mt-1">
              Adicione os saldos finais das contas para realizar o fechamento
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Lista de contas existentes */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {contas.map((conta) => (
                  <div key={conta.id} className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{conta.nome}</p>
                        <p className="text-xs text-gray-500">Saldo atual</p>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <p className="text-lg font-bold text-gray-800">
                          {hideValues ? "••••••" : formatCurrency(conta.saldoAtual)}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1 h-6 w-6"
                          onClick={() => {
                            const novoSaldo = prompt("Digite o novo saldo:", conta.saldoAtual.toString());
                            if (novoSaldo !== null) {
                              const saldo = parseFloat(novoSaldo);
                              if (!isNaN(saldo)) {
                                setContas(contas.map(c => c.id === conta.id ? { ...c, saldoAtual: saldo } : c));
                              }
                            }
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Conta Dinheiro */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 bg-white hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => {
                  const nome = prompt("Nome da nova conta:");
                  if (nome) {
                    const novoSaldo = parseFloat(prompt("Saldo inicial?", "0") || "0");
                    if (!isNaN(novoSaldo)) {
                      setContas([...contas, {
                        id: Date.now(),
                        nome,
                        saldoAtual: novoSaldo,
                        saldoAnterior: novoSaldo,
                        despesas: 0,
                        sobra: novoSaldo,
                      }]);
                    }
                  }
                }}>
                  <div className="flex items-center justify-center flex-col gap-2">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Plus className="h-5 w-5 text-emerald-600" />
                    </div>
                    <p className="font-medium text-gray-700">Nova Conta</p>
                    <p className="text-xs text-gray-500">Adicionar conta</p>
                  </div>
                </div>
              </div>

              {/* Total */}
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between items-center">
                  <p className="font-semibold text-lg text-gray-800">Total em Contas</p>
                  <p className="text-2xl font-bold text-[#de4838]">
                    {hideValues ? "••••••" : formatCurrency(saldoTotal)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card de Despesas Fixas */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-[#de4838]" />
              Despesas Fixas do Mês
            </CardTitle>
            <p className="text-xs text-gray-500 mt-1">
              Controle de despesas recorrentes que precisam ser pagas
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Lista de despesas fixas */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Despesa</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Valor</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Venc.</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Conta</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Pago</th>
                    </tr>
                  </thead>
                  <tbody>
                    {despesasFixas.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-500">
                          Nenhuma despesa fixa cadastrada.
                        </td>
                      </tr>
                    ) : (
                      despesasFixas.map((despesa) => (
                        <tr key={despesa.id} className="border-b border-gray-100">
                          <td className="px-3 py-2 font-medium text-gray-800">{despesa.nome}</td>
                          <td className="px-3 py-2 text-right text-gray-700">
                            {hideValues ? "••••••" : formatCurrency(despesa.valor)}
                          </td>
                          <td className="px-3 py-2 text-center text-gray-600">
                            {new Date(despesa.vencimento).toLocaleDateString()}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {despesa.contaId ? (
                              <span className="text-sm text-gray-600">
                                {contas.find(c => c.id === despesa.contaId)?.nome || "Conta " + despesa.contaId}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">Não definida</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={despesa.status === "PAGO"}
                              onChange={(e) => {
                                setDespesasFixas(prev => prev.map(d =>
                                  d.id === despesa.id
                                    ? { ...d, status: e.target.checked ? "PAGO" : "PENDENTE" }
                                    : d
                                ));
                              }}
                              className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <p className="font-semibold text-lg text-gray-800">Total Despesas Fixas</p>
                  <p className="text-xl font-bold text-red-600">
                    {hideValues ? "••••••" : formatCurrency(despesasFixas.reduce((sum, d) => sum + d.valor, 0))}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alertas */}
        {lucroLiquido < 0 && (
          <Alert className="mb-6 bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-sm text-red-700">
              Atenção! Você está operando com prejuízo neste período. Analise seus custos e despesas para identificar oportunidades de redução.
            </AlertDescription>
          </Alert>
        )}

        {margemLiquida < 10 && margemLiquida > 0 && (
          <Alert className="mb-6 bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-sm text-amber-700">
              Sua margem líquida está abaixo de 10%. Considere revisar preços ou reduzir custos operacionais.
            </AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs defaultValue="mensal" className="mt-6">
          <TabsList className="bg-white border border-gray-200 rounded-xl p-1 w-full justify-start overflow-x-auto">
            <TabsTrigger value="mensal" className="rounded-lg data-[state=active]:bg-[#de4838] data-[state=active]:text-white px-4">
              DRE do Mês
            </TabsTrigger>
            <TabsTrigger value="despesas" className="rounded-lg data-[state=active]:bg-[#de4838] data-[state=active]:text-white px-4">
              Despesas
            </TabsTrigger>
            <TabsTrigger value="folha" className="rounded-lg data-[state=active]:bg-[#de4838] data-[state=active]:text-white px-4">
              Folha de Pagamento
            </TabsTrigger>
            <TabsTrigger value="saldos" className="rounded-lg data-[state=active]:bg-[#de4838] data-[state=active]:text-white px-4">
              Saldos de Contas
            </TabsTrigger>
            <TabsTrigger value="acumulado" className="rounded-lg data-[state=active]:bg-[#de4838] data-[state=active]:text-white px-4">
              DRE Acumulado
            </TabsTrigger>
            <TabsTrigger value="comparativo" className="rounded-lg data-[state=active]:bg-[#de4838] data-[state=active]:text-white px-4">
              Comparativo
            </TabsTrigger>
            <TabsTrigger value="fechamento" className="rounded-lg data-[state=active]:bg-[#de4838] data-[state=active]:text-white px-4">
              Distribuição
            </TabsTrigger>
          </TabsList>

          {/* Tab - DRE do Mês */}
          <TabsContent value="mensal" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#de4838]" />
                  Demonstrativo de Resultados - {meses[mesAtual - 1]}/{anoAtual}
                </CardTitle>
                <p className="text-xs text-gray-500 mt-1">
                  Valores em R$ e percentuais de participação sobre a Receita Bruta
                </p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Descrição
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Valor (R$)
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          % Receita
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contas
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr className="border-b border-gray-100">
                          <td colSpan={4} className="py-12 text-center">
                            <div className="flex justify-center items-center gap-2">
                              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#de4838] border-t-transparent" />
                              <span className="text-sm text-gray-500">Carregando DRE...</span>
                            </div>
                          </td>
                        </tr>
                      ) : dre.length === 0 ? (
                        <tr className="border-b border-gray-100">
                          <td colSpan={4} className="py-12 text-center text-gray-500">
                            Nenhum dado disponível para este período.
                            <Button
                              variant="link"
                              onClick={() => carregarDados()}
                              className="text-[#de4838] ml-2"
                            >
                              Clique aqui para atualizar
                            </Button>
                          </td>
                        </tr>
                      ) : (
                        dre.map(linha => renderDreLinha(linha, 0, false))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab - Despesas */}
          <TabsContent value="despesas" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-[#de4838]" />
                  Gestão de Despesas
                </CardTitle>
                <p className="text-xs text-gray-500 mt-1">
                  Controle de despesas fixas e variáveis do mês
                </p>
              </CardHeader>
              <CardContent>
                <DespesasTab
                  despesas={despesas}
                  onChange={setDespesas}
                  contasIds={contas.map(c => c.id)}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab - Folha de Pagamento */}
          <TabsContent value="folha" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#de4838]" />
                  Folha de Pagamento
                </CardTitle>
                <p className="text-xs text-gray-500 mt-1">
                  Controle de salários e encargos trabalhistas
                </p>
              </CardHeader>
              <CardContent>
                <FolhaPagamentoTab
                  funcionarios={funcionarios}
                  onChange={setFuncionarios}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab - Saldos de Contas */}
          <TabsContent value="saldos" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-[#de4838]" />
                  Saldos de Contas
                </CardTitle>
                <p className="text-xs text-gray-500 mt-1">
                  Controle de saldos bancários e fluxo de caixa
                </p>
              </CardHeader>
              <CardContent>
                <SaldosContasTab
                  contas={contas}
                  despesas={despesas}
                  onChange={setContas}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab - DRE Acumulado */}
          <TabsContent value="acumulado" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-[#de4838]" />
                  DRE Acumulado - {anoAtual}
                </CardTitle>
                <p className="text-xs text-gray-500 mt-1">
                  Resultados acumulados de Janeiro a {meses[mesAtual - 1]}
                </p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Descrição
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Valor Acumulado (R$)
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          % Receita
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr className="border-b border-gray-100">
                          <td colSpan={3} className="py-12 text-center">
                            <div className="flex justify-center items-center gap-2">
                              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#de4838] border-t-transparent" />
                              <span className="text-sm text-gray-500">Carregando DRE Acumulado...</span>
                            </div>
                          </td>
                        </tr>
                      ) : acumuladoAno.length === 0 ? (
                        <tr className="border-b border-gray-100">
                          <td colSpan={3} className="py-12 text-center text-gray-500">
                            Nenhum dado disponível para o acumulado do ano.
                          </td>
                        </tr>
                      ) : (
                        acumuladoAno.map(linha => renderDreLinha(linha, 0, true))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab - Comparativo Mensal */}
          <TabsContent value="comparativo" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-[#de4838]" />
                  Comparativo Mensal - {anoAtual}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Mês</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Receita Bruta</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">CMV</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Lucro Bruto</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Despesas OP</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Lucro Líquido</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Margem %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr className="border-b border-gray-100">
                          <td colSpan={7} className="py-12 text-center">
                            <div className="flex justify-center items-center gap-2">
                              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#de4838] border-t-transparent" />
                              <span className="text-sm text-gray-500">Carregando...</span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        <tr className="border-b border-gray-100">
                          <td colSpan={7} className="py-12 text-center text-gray-500">
                            Funcionalidade em desenvolvimento. Em breve você poderá comparar todos os meses do ano.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab - Distribuição de Lucros */}
          <TabsContent value="fechamento" className="mt-6">
            <div className="grid gap-6">
              {/* Resultados do Fechamento */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                  <CardContent className="p-4">
                    <p className="text-xs opacity-90">Saldo Total</p>
                    <p className="text-lg font-bold mt-1">
                      {hideValues ? "••••••" : formatCurrency(saldoTotal)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
                  <CardContent className="p-4">
                    <p className="text-xs opacity-90">Capital Giro (10%)</p>
                    <p className="text-lg font-bold mt-1">
                      {hideValues ? "••••••" : formatCurrency(capitalGiro)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                  <CardContent className="p-4">
                    <p className="text-xs opacity-90">Fundo Investimento (10%)</p>
                    <p className="text-lg font-bold mt-1">
                      {hideValues ? "••••••" : formatCurrency(fundoInvestimento)}
                    </p>
                  </CardContent>
                </Card>
                <Card className={`bg-gradient-to-r ${lucroLiquido >= 0 ? "from-indigo-500 to-indigo-600" : "from-orange-500 to-orange-600"} text-white`}>
                  <CardContent className="p-4">
                    <p className="text-xs opacity-90">Lucro Líquido</p>
                    <p className="text-lg font-bold mt-1">
                      {hideValues ? "••••••" : formatCurrency(lucroLiquido)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Distribuição de Lucros */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição de Lucros</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-800">Capital de Giro</p>
                          <p className="text-sm text-gray-500">10% do saldo restante</p>
                        </div>
                        <p className="font-bold text-blue-600">{formatCurrency(capitalGiro)}</p>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-800">Fundo de Investimento</p>
                          <p className="text-sm text-gray-500">10% do saldo restante</p>
                        </div>
                        <p className="font-bold text-purple-600">{formatCurrency(fundoInvestimento)}</p>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-800">Provisões</p>
                          <p className="text-sm text-gray-500">Mínimo R$ 1.000 ou 5%</p>
                        </div>
                        <p className="font-bold text-amber-600">{formatCurrency(provisoes)}</p>
                      </div>
                    </div>
                    <div className="border-t pt-4 mt-4">
                      <div className="flex justify-between items-center">
                        <p className="font-semibold text-lg text-gray-800">Lucro Líquido Distribuído</p>
                        <p className={`text-2xl font-bold ${lucroLiquido >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                          {formatCurrency(lucroLiquido)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Observações do Fechamento */}
        {fechamento?.observacao && (
          <div className="mt-6 bg-gray-50 rounded-xl p-4 border border-gray-200">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Observações do Fechamento</p>
            <p className="text-sm text-gray-700 mt-1">{fechamento.observacao}</p>
          </div>
        )}
      </div>
    </div>
  );
}