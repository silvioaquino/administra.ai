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
  CheckCircle,
  AlertCircle,
  Lock,
  Unlock,
  RefreshCw,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatPercentage, formatDate } from "@/lib/utils";

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
    const valorFormatado = isAcumulado ? formatCurrency(linha.valor) : formatCurrency(linha.valor);
    
    // Determinar cor baseada no tipo de linha
    let valorClass = "text-gray-800";
    let bgClass = "";
    
    if (linha.id === "RECEITA_BRUTA") {
      valorClass = "text-emerald-600 font-bold";
      bgClass = "bg-emerald-50";
    } else if (linha.id === "LUCRO_BRUTO" || linha.id === "LUCRO_LIQUIDO") {
      valorClass = linha.valor >= 0 ? "text-emerald-600 font-bold" : "text-red-600 font-bold";
      bgClass = linha.valor >= 0 ? "bg-emerald-50" : "bg-red-50";
    } else if (linha.id === "CMV" || linha.id === "DESPESAS_OPERACIONAIS") {
      valorClass = "text-red-500";
    }

    return (
      <React.Fragment key={linha.id}>
        <tr className={`border-b border-gray-100 ${bgClass} hover:bg-gray-50 transition-colors`}>
          <td className="px-4 py-3" style={{ paddingLeft: `${16 + nivel * 20}px` }}>
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
  const lucroLiquido = dre.find(l => l.id === "LUCRO_LIQUIDO")?.valor || 0;
  const margemLiquida = receitaBruta > 0 ? (lucroLiquido / receitaBruta) * 100 : 0;

  const isFechado = fechamento?.status === "FECHADO";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 ml-6 mr-6 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm opacity-90">Receita Bruta</p>
                <TrendingUp className="h-5 w-5 opacity-80" />
              </div>
              <p className="text-2xl font-bold mt-2">
                {hideValues ? "••••••" : formatCurrency(receitaBruta)}
              </p>
              <p className="text-xs opacity-80 mt-1">Total de vendas no período</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-red-600 to-red-700 text-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm opacity-90">CMV</p>
                <TrendingDown className="h-5 w-5 opacity-80" />
              </div>
              <p className="text-2xl font-bold mt-2">
                {hideValues ? "••••••" : formatCurrency(dre.find(l => l.id === "CMV")?.valor || 0)}
              </p>
              <p className="text-xs opacity-80 mt-1">Custo da Mercadoria Vendida</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm opacity-90">Despesas Operacionais</p>
                <DollarSign className="h-5 w-5 opacity-80" />
              </div>
              <p className="text-2xl font-bold mt-2">
                {hideValues ? "••••••" : formatCurrency(dre.find(l => l.id === "DESPESAS_OPERACIONAIS")?.valor || 0)}
              </p>
              <p className="text-xs opacity-80 mt-1">Despesas administrativas e financeiras</p>
            </CardContent>
          </Card>
          <Card className={`bg-gradient-to-r ${lucroLiquido >= 0 ? "from-purple-600 to-purple-700" : "from-orange-600 to-orange-700"} text-white`}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm opacity-90">Lucro Líquido</p>
                {lucroLiquido >= 0 ? <TrendingUp className="h-5 w-5 opacity-80" /> : <TrendingDown className="h-5 w-5 opacity-80" />}
              </div>
              <p className="text-2xl font-bold mt-2">
                {hideValues ? "••••••" : formatCurrency(lucroLiquido)}
              </p>
              <p className="text-xs opacity-80 mt-1">Resultado final do período</p>
            </CardContent>
          </Card>
        </div>

        {/* Dica de interpretação */}
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
          <TabsList className="bg-white border border-gray-200 rounded-xl p-1">
            <TabsTrigger value="mensal" className="rounded-lg data-[state=active]:bg-[#de4838] data-[state=active]:text-white">
              DRE do Mês
            </TabsTrigger>
            <TabsTrigger value="acumulado" className="rounded-lg data-[state=active]:bg-[#de4838] data-[state=active]:text-white">
              DRE Acumulado
            </TabsTrigger>
            <TabsTrigger value="comparativo" className="rounded-lg data-[state=active]:bg-[#de4838] data-[state=active]:text-white">
              Comparativo Mensal
            </TabsTrigger>
          </TabsList>

          {/* Tab - DRE do Mês */}
          <TabsContent value="mensal" className="mt-6">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-gray-50 p-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#de4838]" />
                  <h3 className="font-semibold text-gray-800">
                    Demonstrativo de Resultados - {meses[mesAtual - 1]}/{anoAtual}
                  </h3>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Valores em R$ e percentuais de participação sobre a Receita Bruta
                </p>
              </div>
              <div className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr className="border-b border-gray-200">
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
                            className="text-[#de4838]"
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
            </div>
          </TabsContent>

          {/* Tab - DRE Acumulado */}
          <TabsContent value="acumulado" className="mt-6">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-gray-50 p-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-[#de4838]" />
                  <h3 className="font-semibold text-gray-800">
                    DRE Acumulado - {anoAtual}
                  </h3>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Resultados acumulados de Janeiro a {meses[mesAtual - 1]}
                </p>
              </div>
              <div className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr className="border-b border-gray-200">
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
            </div>
          </TabsContent>

          {/* Tab - Comparativo Mensal */}
          <TabsContent value="comparativo" className="mt-6">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-gray-50 p-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-[#de4838]" />
                  <h3 className="font-semibold text-gray-800">
                    Comparativo Mensal - {anoAtual}
                  </h3>
                </div>
              </div>
              <div className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr className="border-b border-gray-200">
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
                      // Aqui você pode adicionar uma chamada à API para buscar comparativo mensal
                      <tr className="border-b border-gray-100">
                        <td colSpan={7} className="py-12 text-center text-gray-500">
                          Funcionalidade em desenvolvimento. Em breve você poderá comparar todos os meses do ano.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
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