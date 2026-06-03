"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Target,
  BarChart3,
  Settings,
  RefreshCw,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatCurrency, formatPercentage, formatDate } from "@/lib/utils";

interface MetaMensal {
  id: number;
  ano: number;
  mes: number;
  metaFaturamentoDiaria: number;
  metaDespesasDiaria: number;
  metaLucroPercentual: number;
  diasUteis: number;
}

interface FluxoDiario {
  data: string;
  faturamentoRealizado: number;
  despesasRealizadas: number;
  lucroRealizado: number;
}

interface ResumoMensal {
  mes: number;
  faturamentoTotal: number;
  despesasTotal: number;
  lucroTotal: number;
  metaFaturamento: number;
  metaDespesas: number;
  percentualFaturamento: number;
  percentualDespesas: number;
  percentualLucro: number;
}

export default function FluxoCaixaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hideValues, setHideValues] = useState(false);
  const [anoAtual, setAnoAtual] = useState(new Date().getFullYear());
  const [mesAtual, setMesAtual] = useState(new Date().getMonth() + 1);

  const [meta, setMeta] = useState<MetaMensal | null>(null);
  const [fluxoDiario, setFluxoDiario] = useState<FluxoDiario[]>([]);
  const [resumoMensal, setResumoMensal] = useState<ResumoMensal[]>([]);
  const [totaisAno, setTotaisAno] = useState({
    faturamento: 0,
    despesas: 0,
    lucro: 0,
  });

  useEffect(() => {
    carregarDados();
  }, [anoAtual, mesAtual]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      // Carregar meta do mês
      const metaResponse = await fetch(
        `/api/fluxo-caixa/metas?ano=${anoAtual}&mes=${mesAtual}`
      );
      const metaData = await metaResponse.json();
      if (metaData.success) {
        setMeta(metaData.data);
      }

      // Carregar fluxo diário do mês
      const fluxoResponse = await fetch(
        `/api/fluxo-caixa/diario?ano=${anoAtual}&mes=${mesAtual}`
      );
      const fluxoData = await fluxoResponse.json();
      if (fluxoData.success) {
        setFluxoDiario(fluxoData.data);
      }

      // Carregar resumo mensal do ano
      const resumoResponse = await fetch(
        `/api/fluxo-caixa/resumo-mensal?ano=${anoAtual}`
      );
      const resumoData = await resumoResponse.json();
      if (resumoData.success) {
        setResumoMensal(resumoData.data);
        
        // Calcular totais do ano
        const totais = resumoData.data.reduce(
          (acc: any, item: ResumoMensal) => ({
            faturamento: acc.faturamento + item.faturamentoTotal,
            despesas: acc.despesas + item.despesasTotal,
            lucro: acc.lucro + item.lucroTotal,
          }),
          { faturamento: 0, despesas: 0, lucro: 0 }
        );
        setTotaisAno(totais);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const sincronizarDados = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/fluxo-caixa/sincronizar?ano=${anoAtual}&mes=${mesAtual}`,
        { method: "POST" }
      );
      const data = await response.json();
      if (data.success) {
        alert("✅ Dados sincronizados com sucesso!");
        carregarDados();
      } else {
        alert("❌ Erro ao sincronizar dados");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("❌ Erro ao sincronizar dados");
    } finally {
      setLoading(false);
    }
  };

  const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];

  const diasDoMes = Array.from({ length: meta?.diasUteis || 30 }, (_, i) => i + 1);
  
  const metaFaturamentoMensal = (meta?.metaFaturamentoDiaria || 0) * (meta?.diasUteis || 30);
  const metaDespesasMensal = (meta?.metaDespesasDiaria || 0) * (meta?.diasUteis || 30);
  
  const faturamentoAtual = fluxoDiario.reduce((sum, d) => sum + d.faturamentoRealizado, 0);
  const despesasAtual = fluxoDiario.reduce((sum, d) => sum + d.despesasRealizadas, 0);
  const lucroAtual = faturamentoAtual - despesasAtual;
  
  const percentualFaturamento = metaFaturamentoMensal > 0 ? (faturamentoAtual / metaFaturamentoMensal) * 100 : 0;
  const percentualDespesas = metaDespesasMensal > 0 ? (despesasAtual / metaDespesasMensal) * 100 : 0;
  
  const diasRealizados = fluxoDiario.length;
  const diasRestantes = (meta?.diasUteis || 30) - diasRealizados;
  
  const projecaoFaturamento = diasRestantes > 0
    ? faturamentoAtual + (faturamentoAtual / diasRealizados) * diasRestantes
    : faturamentoAtual;
  
  const metaLucro = (metaFaturamentoMensal * (meta?.metaLucroPercentual || 20)) / 100;
  const lucroProjetado = projecaoFaturamento - despesasAtual;

  const cardsResumo = [
    {
      title: "Faturamento Mensal",
      value: formatCurrency(faturamentoAtual),
      meta: formatCurrency(metaFaturamentoMensal),
      percentual: percentualFaturamento,
      icon: TrendingUp,
      gradient: "from-emerald-500 to-emerald-600",
      detail: `Meta: ${formatCurrency(metaFaturamentoMensal)}`,
    },
    {
      title: "Despesas Mensais",
      value: formatCurrency(despesasAtual),
      meta: formatCurrency(metaDespesasMensal),
      percentual: percentualDespesas,
      icon: TrendingDown,
      gradient: "from-red-500 to-red-600",
      detail: `Meta: ${formatCurrency(metaDespesasMensal)}`,
    },
    {
      title: "Lucro Realizado",
      value: formatCurrency(lucroAtual),
      meta: formatCurrency(metaLucro),
      percentual: metaLucro > 0 ? (lucroAtual / metaLucro) * 100 : 0,
      icon: DollarSign,
      gradient: lucroAtual >= 0 ? "from-blue-500 to-blue-600" : "from-orange-500 to-orange-600",
      detail: `Meta Lucro: ${formatCurrency(metaLucro)}`,
    },
    {
      title: "Projeção Anual",
      value: formatCurrency(totaisAno.faturamento),
      icon: BarChart3,
      gradient: "from-purple-500 to-purple-600",
      detail: `Lucro: ${formatCurrency(totaisAno.lucro)}`,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 ml-6 mr-6 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Fluxo de Caixa</h1>
          <p className="text-sm text-gray-500">
            Acompanhamento de metas e performance financeira
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
            onClick={sincronizarDados}
            className="rounded-full border-gray-200"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Sincronizar
          </Button>
          <Button
            onClick={() => router.push("/fluxo-caixa/configuracoes")}
            className="bg-[#de4838] hover:bg-[#c73d2e] text-white rounded-full"
          >
            <Settings className="mr-2 h-4 w-4" />
            Configurar Metas
          </Button>
        </div>
      </div>

      <div className="container mx-auto p-6 max-w-7xl">
        {/* Seletor de Mês/Ano */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <select
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm"
              value={mesAtual}
              onChange={(e) => setMesAtual(parseInt(e.target.value))}
            >
              {meses.map((mes, idx) => (
                <option key={idx} value={idx + 1}>
                  {mes}
                </option>
              ))}
            </select>
            <select
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm"
              value={anoAtual}
              onChange={(e) => setAnoAtual(parseInt(e.target.value))}
            >
              <option value={2024}>2024</option>
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
            </select>
            <Badge variant="outline" className="bg-gray-100">
              {diasRealizados} de {meta?.diasUteis || 30} dias úteis
            </Badge>
          </div>
          {diasRestantes > 0 && (
            <div className="text-sm text-gray-500">
              ⚡ Projeção: {formatCurrency(projecaoFaturamento)} até fim do mês
            </div>
          )}
        </div>

        {/* Cards de Resumo */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cardsResumo.map((card, idx) => (
            <Card
              key={idx}
              className={`relative overflow-hidden bg-gradient-to-r ${card.gradient} text-white`}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium opacity-90">{card.title}</p>
                  <card.icon className="h-5 w-5 opacity-80" />
                </div>
                <div className="mt-2 text-2xl font-bold">
                  {hideValues && card.title !== "Projeção Anual" ? "••••••" : card.value}
                </div>
                <p className="mt-1 text-xs opacity-80">{card.detail}</p>
                {card.percentual !== undefined && (
                  <div className="mt-3">
                    <Progress value={Math.min(card.percentual, 100)} className="h-1.5 bg-white/30" />
                    <p className="mt-1 text-xs opacity-80">
                      {formatPercentage(Math.min(card.percentual, 100))} da meta
                    </p>
                  </div>
                )}
              </CardContent>
              <div className="absolute -bottom-4 -right-4 opacity-10">
                <card.icon className="h-20 w-20" />
              </div>
            </Card>
          ))}
        </div>

        {/* Alertas */}
        {percentualFaturamento < 50 && diasRealizados > 10 && (
          <Alert className="mt-6 bg-amber-50 border-amber-200 rounded-xl">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-sm text-amber-700">
              Atenção! O faturamento está abaixo de 50% da meta com {diasRestantes} dias restantes.
              É necessário intensificar as vendas para alcançar a meta.
            </AlertDescription>
          </Alert>
        )}

        {lucroAtual < 0 && (
          <Alert className="mt-6 bg-red-50 border-red-200 rounded-xl">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-sm text-red-700">
              Atenção! Você está operando com prejuízo neste mês. Revise seus custos e despesas.
            </AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs defaultValue="diario" className="mt-8">
          <TabsList className="bg-white border border-gray-200 rounded-xl p-1">
            <TabsTrigger value="diario" className="rounded-lg data-[state=active]:bg-[#de4838] data-[state=active]:text-white">
              Acompanhamento Diário
            </TabsTrigger>
            <TabsTrigger value="mensal" className="rounded-lg data-[state=active]:bg-[#de4838] data-[state=active]:text-white">
              Comparativo Mensal
            </TabsTrigger>
            <TabsTrigger value="analise" className="rounded-lg data-[state=active]:bg-[#de4838] data-[state=active]:text-white">
              Análise Vertical/Horizontal
            </TabsTrigger>
          </TabsList>

          {/* Tab - Acompanhamento Diário */}
          <TabsContent value="diario" className="mt-6">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-gray-50 p-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-[#de4838]" />
                  <h3 className="font-semibold text-gray-800">
                    Acompanhamento Diário - {meses[mesAtual - 1]}/{anoAtual}
                  </h3>
                </div>
              </div>
              <div className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Dia</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Faturamento</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Meta Dia</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Diferença</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">% Meta</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Despesas</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Lucro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center">
                          <div className="flex justify-center items-center gap-2">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#de4838] border-t-transparent" />
                            <span className="text-sm text-gray-500">Carregando...</span>
                          </div>
                        </td>
                      </tr>
                    ) : fluxoDiario.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-gray-500">
                          Nenhum dado disponível para este período.
                          <Button
                            variant="link"
                            onClick={sincronizarDados}
                            className="text-[#de4838]"
                          >
                            Clique aqui para sincronizar
                          </Button>
                        </td>
                      </tr>
                    ) : (
                      fluxoDiario.map((dia, idx) => {
                        const metaDia = meta?.metaFaturamentoDiaria || 0;
                        const diferenca = dia.faturamentoRealizado - metaDia;
                        const percentualMeta = metaDia > 0 ? (dia.faturamentoRealizado / metaDia) * 100 : 0;
                        const isMetaAlcancada = dia.faturamentoRealizado >= metaDia;
                        const corDiferenca = diferenca >= 0 ? "text-emerald-600" : "text-red-500";
                        
                        return (
                          <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium">
                              {formatDate(dia.data).split("/")[0]}
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-gray-800">
                              {hideValues ? "••••••" : formatCurrency(dia.faturamentoRealizado)}
                            </td>
                            <td className="px-4 py-3 text-right text-gray-500">
                              {formatCurrency(metaDia)}
                            </td>
                            <td className={`px-4 py-3 text-right font-medium ${corDiferenca}`}>
                              {hideValues ? "••••••" : `${diferenca >= 0 ? "+" : ""}${formatCurrency(diferenca)}`}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Badge
                                className={
                                  percentualMeta >= 100
                                    ? "bg-emerald-100 text-emerald-700"
                                    : percentualMeta >= 70
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-red-100 text-red-700"
                                }
                              >
                                {formatPercentage(percentualMeta)}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-right text-red-500">
                              {hideValues ? "••••••" : formatCurrency(dia.despesasRealizadas)}
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-emerald-600">
                              {hideValues ? "••••••" : formatCurrency(dia.lucroRealizado)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {!loading && fluxoDiario.length > 0 && (
                    <tfoot className="border-t-2 border-gray-200 bg-gray-50 font-bold">
                      <tr>
                        <td className="px-4 py-3">TOTAIS</td>
                        <td className="px-4 py-3 text-right text-emerald-600">
                          {hideValues ? "••••••" : formatCurrency(faturamentoAtual)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-500">
                          {formatCurrency(metaFaturamentoMensal)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={faturamentoAtual - metaFaturamentoMensal >= 0 ? "text-emerald-600" : "text-red-500"}>
                            {hideValues ? "••••••" : formatCurrency(faturamentoAtual - metaFaturamentoMensal)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge className={percentualFaturamento >= 100 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>
                            {formatPercentage(percentualFaturamento)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right text-red-500">
                          {hideValues ? "••••••" : formatCurrency(despesasAtual)}
                        </td>
                        <td className="px-4 py-3 text-right text-emerald-600">
                          {hideValues ? "••••••" : formatCurrency(lucroAtual)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Tab - Comparativo Mensal */}
          <TabsContent value="mensal" className="mt-6">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-gray-50 p-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-[#de4838]" />
                  <h3 className="font-semibold text-gray-800">
                    Comparativo Mensal - {anoAtual}
                  </h3>
                </div>
              </div>
              <div className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Mês</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Faturamento</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Meta</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">% Meta</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Despesas</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Lucro</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Margem %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resumoMensal.map((item, idx) => {
                      const metaFaturamento = (meta?.metaFaturamentoDiaria || 0) * (meta?.diasUteis || 30);
                      const percentualMeta = metaFaturamento > 0 ? (item.faturamentoTotal / metaFaturamento) * 100 : 0;
                      const margem = item.faturamentoTotal > 0 ? (item.lucroTotal / item.faturamentoTotal) * 100 : 0;
                      
                      return (
                        <tr
                          key={idx}
                          className={`border-b border-gray-100 hover:bg-gray-50 ${
                            item.mes === mesAtual ? "bg-[#de4838]/5" : ""
                          }`}
                        >
                          <td className="px-4 py-3 font-medium">{meses[item.mes - 1]}</td>
                          <td className="px-4 py-3 text-right font-medium text-gray-800">
                            {hideValues ? "••••••" : formatCurrency(item.faturamentoTotal)}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-500">
                            {formatCurrency(metaFaturamento)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Badge
                              className={
                                percentualMeta >= 100
                                  ? "bg-emerald-100 text-emerald-700"
                                  : percentualMeta >= 70
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-red-100 text-red-700"
                              }
                            >
                              {formatPercentage(percentualMeta)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right text-red-500">
                            {hideValues ? "••••••" : formatCurrency(item.despesasTotal)}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-emerald-600">
                            {hideValues ? "••••••" : formatCurrency(item.lucroTotal)}
                          </td>
                          <td className="px-4 py-3 text-right font-medium">
                            <span className={margem >= 20 ? "text-emerald-600" : margem >= 10 ? "text-amber-600" : "text-red-600"}>
                              {formatPercentage(margem)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="border-t-2 border-gray-200 bg-gray-50 font-bold">
                    <tr>
                      <td className="px-4 py-3">TOTAL</td>
                      <td className="px-4 py-3 text-right text-emerald-600">
                        {hideValues ? "••••••" : formatCurrency(totaisAno.faturamento)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500">
                        {formatCurrency(metaFaturamentoMensal * 12)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Badge className={totaisAno.faturamento >= metaFaturamentoMensal * 12 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>
                          {formatPercentage((totaisAno.faturamento / (metaFaturamentoMensal * 12)) * 100)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right text-red-500">
                        {hideValues ? "••••••" : formatCurrency(totaisAno.despesas)}
                      </td>
                      <td className="px-4 py-3 text-right text-emerald-600">
                        {hideValues ? "••••••" : formatCurrency(totaisAno.lucro)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={totaisAno.lucro >= 0 ? "text-emerald-600" : "text-red-600"}>
                          {formatPercentage(totaisAno.faturamento > 0 ? (totaisAno.lucro / totaisAno.faturamento) * 100 : 0)}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Tab - Análise Vertical e Horizontal */}
          <TabsContent value="analise" className="mt-6">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-gray-50 p-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-[#de4838]" />
                  <h3 className="font-semibold text-gray-800">
                    Análise Vertical e Horizontal - {anoAtual}
                  </h3>
                </div>
              </div>
              <div className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Mês</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Faturamento</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">A.V. (%)</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">A.H. Fat.</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Despesas</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">A.V. (%)</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">A.H. Desp.</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Lucro</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">A.H. Lucro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resumoMensal.map((item, idx) => {
                      const totalAnoFat = totaisAno.faturamento;
                      const totalAnoDesp = totaisAno.despesas;
                      const avFaturamento = totalAnoFat > 0 ? (item.faturamentoTotal / totalAnoFat) * 100 : 0;
                      const avDespesas = totalAnoDesp > 0 ? (item.despesasTotal / totalAnoDesp) * 100 : 0;
                      
                      const mesAnterior = idx > 0 ? resumoMensal[idx - 1] : null;
                      const ahFaturamento = mesAnterior && mesAnterior.faturamentoTotal > 0
                        ? ((item.faturamentoTotal - mesAnterior.faturamentoTotal) / mesAnterior.faturamentoTotal) * 100
                        : 0;
                      const ahDespesas = mesAnterior && mesAnterior.despesasTotal > 0
                        ? ((item.despesasTotal - mesAnterior.despesasTotal) / mesAnterior.despesasTotal) * 100
                        : 0;
                      const ahLucro = mesAnterior && mesAnterior.lucroTotal !== 0
                        ? ((item.lucroTotal - mesAnterior.lucroTotal) / Math.abs(mesAnterior.lucroTotal)) * 100
                        : 0;
                      
                      return (
                        <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{meses[item.mes - 1]}</td>
                          <td className="px-4 py-3 text-right font-medium text-gray-800">
                            {hideValues ? "••••••" : formatCurrency(item.faturamentoTotal)}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-500">{formatPercentage(avFaturamento)}</td>
                          <td className={`px-4 py-3 text-right font-medium ${ahFaturamento >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                            {idx === 0 ? "-" : `${ahFaturamento >= 0 ? "+" : ""}${formatPercentage(ahFaturamento)}`}
                          </td>
                          <td className="px-4 py-3 text-right text-red-500">
                            {hideValues ? "••••••" : formatCurrency(item.despesasTotal)}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-500">{formatPercentage(avDespesas)}</td>
                          <td className={`px-4 py-3 text-right font-medium ${ahDespesas >= 0 ? "text-red-500" : "text-emerald-600"}`}>
                            {idx === 0 ? "-" : `${ahDespesas >= 0 ? "+" : ""}${formatPercentage(ahDespesas)}`}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-emerald-600">
                            {hideValues ? "••••••" : formatCurrency(item.lucroTotal)}
                          </td>
                          <td className={`px-4 py-3 text-right font-medium ${ahLucro >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                            {idx === 0 ? "-" : `${ahLucro >= 0 ? "+" : ""}${formatPercentage(ahLucro)}`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Dica de interpretação */}
            <div className="mt-4 rounded-xl bg-blue-50 p-4 border border-blue-200">
              <p className="text-sm font-medium text-blue-800">📊 Entendendo as análises:</p>
              <div className="mt-2 grid gap-2 text-xs text-blue-700 sm:grid-cols-3">
                <div>
                  <span className="font-semibold">A.V. (Análise Vertical)</span>
                  <p>Percentual do mês em relação ao total do ano.</p>
                </div>
                <div>
                  <span className="font-semibold">A.H. (Análise Horizontal)</span>
                  <p>Variação percentual em relação ao mês anterior.</p>
                </div>
                <div>
                  <span className="font-semibold">Meta de Margem</span>
                  <p>Ideal: acima de 20% para restaurantes.</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}