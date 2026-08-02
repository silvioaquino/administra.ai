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
  ChevronRight,
  ChevronDown,
  BarChart3,
  PieChart,
  AlertCircle,
  Edit,
  Plus,
  CheckCircle,
  ChevronDown as ChevronDownIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DespesasTab } from "./components/tabs/DespesasTab";
import { FolhaPagamentoTab } from "./components/tabs/FolhaPagamentoTab";
import { SaldosContasTab } from "./components/tabs/SaldosContasTab";
import { DistribuicaoLucroTab } from "./components/tabs/DistribuicaoLucroTab";
import { ModalEditarConta, type ContaParaEditar } from "./components/modais/ModalEditarConta";
import { ModalNovaConta } from "./components/modais/ModalNovaConta";
import { formatCurrency, formatPercentage, formatDate } from "@/lib/utils";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
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
  const [mostrarPagas, setMostrarPagas] = useState(false);
  const [contaEditando, setContaEditando] = useState<ContaSaldo | null>(null);
  const [modalEditarOpen, setModalEditarOpen] = useState(false);
  const [modalNovaOpen, setModalNovaOpen] = useState(false);

  // Estados para controle de seções expansíveis
  const [sectionsExpanded, setSectionsExpanded] = useState({
    summary: true,
    accounts: true,
    fixedExpenses: true,
    alerts: true,
  });

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
      const dreResponse = await fetch(`/api/fechamento-mensal/dre?ano=${anoAtual}&mes=${mesAtual}`);
      const dreData = await dreResponse.json();
      if (dreData.success) {
        setDre(dreData.data);
      }

      const acumuladoResponse = await fetch(`/api/fechamento-mensal/dre?ano=${anoAtual}&acumulado=true`);
      const acumuladoData = await acumuladoResponse.json();
      if (acumuladoData.success) {
        setAcumuladoAno(acumuladoData.data);
      }

      const fechamentoResponse = await fetch(`/api/fechamento-mensal/status?ano=${anoAtual}&mes=${mesAtual}`);
      const fechamentoData = await fechamentoResponse.json();
      if (fechamentoData.success) {
        setFechamento(fechamentoData.data);
      }

      const contasResponse = await fetch(`/api/contas-financeiras`);
      const contasData = await contasResponse.json();
      if (contasData.success) {
        setContas(contasData.data.map((c: any) => ({
          id: c.id,
          nome: c.nome,
          saldoAtual: Number(c.saldoAtual || 0),
          saldoAnterior: Number(c.saldoInicial || 0),
          despesas: 0,
          sobra: Number(c.saldoAtual || 0),
          saldoInicial: Number(c.saldoInicial || 0),
          tipo: c.tipo || "CONTA_CORRENTE",
        })));
      }

      const despesasResponse = await fetch(`/api/fechamento-mensal/despesas-pendentes?ano=${anoAtual}&mes=${mesAtual}&incluirPagas=true`);
      const despesasData = await despesasResponse.json();
      if (despesasData.success) {
        setDespesas((despesasData.data || []).map((d: any) => ({
          id: String(d.id),
          nome: d.nome,
          valor: Number(d.valor),
          dataVencimento: d.vencimento,
          status: d.status,
          contaId: d.contaId ?? undefined,
          origem: d.origem,
          contaNome: d.contaNome,
        })));
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

  const marcarPago = async (d: DespesaFechamento) => {
    try {
      if (d.origem === "FIXA") {
        await fetch(`/api/despesas-fixas/${Number(d.id)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "PAGO" }),
        });
      } else {
        await fetch(`/api/livro-diario/${Number(d.id)}/pagar`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dataPagamento: new Date().toISOString() }),
        });
      }
      carregarDados();
    } catch {
      alert("Erro ao marcar como pago");
    }
  };

  const salvarConta = async (id: number, dados: { nome: string; saldoInicial: number; tipo: string }) => {
    await fetch(`/api/fechamento-mensal/contas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });
    carregarDados();
  };

  const criarConta = async (dados: { nome: string; saldoInicial: number; tipo: string }) => {
    await fetch(`/api/contas-financeiras`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });
    carregarDados();
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

  const toggleSection = (section: keyof typeof sectionsExpanded) => {
    setSectionsExpanded(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Componente de cabeçalho de seção
  const SectionHeader = ({ 
    title, 
    icon: Icon, 
    section, 
    badge,
    action
  }: { 
    title: string
    icon: any
    section: keyof typeof sectionsExpanded
    badge?: string
    action?: React.ReactNode
  }) => (
    <div 
      className="flex items-center justify-between p-4 cursor-pointer hover:bg-surface-2 transition-colors"
      onClick={() => toggleSection(section)}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="font-semibold text-white">{title}</h3>
        {badge && (
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            {badge}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {action}
        <ChevronDownIcon 
          className={`h-5 w-5 text-muted-foreground/70 transition-transform duration-200 ${
            sectionsExpanded[section] ? 'rotate-180' : ''
          }`}
        />
      </div>
    </div>
  );

  const renderDreLinha = (linha: DreLinha, nivel: number = 0, isAcumulado: boolean = false) => {
    const isExpanded = expandedGroups.has(linha.id);
    const hasChildren = linha.children && linha.children.length > 0;
    const valorFormatado = formatCurrency(linha.valor);

    let valorClass = "text-white";
    let bgClass = "";

    if (linha.id === "RECEITA_BRUTA") {
      valorClass = "text-success font-bold";
      bgClass = "bg-success/5/50";
    } else if (linha.id === "LUCRO_BRUTO" || linha.id === "LUCRO_LIQUIDO") {
      valorClass = linha.valor >= 0 ? "text-success font-bold" : "text-destructive font-bold";
      bgClass = linha.valor >= 0 ? "bg-success/5/50" : "bg-destructive/5/50";
    } else if (linha.id === "CMV" || linha.id === "DESPESAS_OPERACIONAIS") {
      valorClass = "text-destructive";
    }

    return (
      <React.Fragment key={linha.id}>
        <tr className={`border-b border-border ${bgClass} hover:bg-surface-2 transition-colors`}>
          <td className="px-4 py-3" style={{ paddingLeft: `${20 + nivel * 16}px` }}>
            <div className="flex items-center gap-2">
              {hasChildren && (
                <button
                  onClick={() => toggleGroup(linha.id)}
                  className="p-0.5 hover:bg-surface-2 rounded"
                >
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              )}
              <span className={`text-sm ${linha.isGroup ? "font-semibold" : "text-muted-foreground"}`}>
                {linha.descricao}
              </span>
            </div>
          </td>
          <td className="px-4 py-3 text-right font-medium">
            {hideValues ? "••••••" : valorFormatado}
          </td>
          <td className="px-4 py-3 text-right text-muted-foreground">
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

  const saldoTotal = contas.reduce((sum, c) => sum + (c.saldoAtual || 0), 0);

  const listaDespesas = mostrarPagas
    ? despesas
    : despesas.filter((d) => d.status !== "PAGO");
  const despesasPendentes = despesas.filter((d) => d.status !== "PAGO");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <PageContainer>
        <PageHeader
          title="Fechamento Mensal"
          subtitle={`${meses[mesAtual - 1]} ${anoAtual}`}
          backHref="/gerenciamento"
        >
          <div className="flex items-center gap-2 flex-wrap justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setHideValues(!hideValues)}
            className="gap-2 rounded-full border-border hover:bg-surface-2"
          >
            {hideValues ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span className="hidden sm:inline">{hideValues ? "Mostrar" : "Ocultar"}</span>
          </Button>
          <Button
            variant="outline"
            onClick={gerarRelatorio}
            className="rounded-full border-border hover:bg-surface-2"
          >
            <Download className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">PDF</span>
          </Button>
          <Button
            variant="outline"
            onClick={exportarExcel}
            className="rounded-full border-border hover:bg-surface-2"
          >
            <FileText className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Excel</span>
          </Button>
          {isFechado ? (
            <Button
              variant="outline"
              onClick={reabrirFechamento}
              className="rounded-full border-warning text-warning hover:bg-warning/5"
            >
              <Unlock className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Reabrir</span>
            </Button>
          ) : (
            <Button
              onClick={realizarFechamento}
              className="bg-primary hover:bg-primary/90 text-white rounded-full shadow-lg shadow-primary/25"
            >
              <Lock className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Fechar Mês</span>
            </Button>
          )}
        </div>
        </PageHeader>
        {/* Seletor de Mês/Ano */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-surface rounded-xl border border-border p-1 shadow-sm">
              <select
                className="rounded-lg bg-transparent px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
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
              <span className="text-muted-foreground/70">|</span>
              <select
                className="rounded-lg bg-transparent px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
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
              <Badge className={`${isFechado ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"} px-3 py-1`}>
                {isFechado ? (
                  <>
                    <Lock className="mr-1 h-3 w-3" />
                    Fechado
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
          <div className="text-right bg-surface rounded-xl px-4 py-2 border border-border shadow-sm">
            <p className="text-xs text-muted-foreground">Margem Líquida</p>
            <p className={`text-lg font-bold ${margemLiquida >= 20 ? "text-success" : margemLiquida >= 10 ? "text-warning" : "text-destructive"}`}>
              {formatPercentage(margemLiquida)}
            </p>
          </div>
        </div>

        {/* Seção: Cards de Resumo */}
        <div className="bg-surface rounded-2xl shadow-sm border border-border/50 overflow-hidden transition-all duration-200 hover:shadow-md mb-6">
          <SectionHeader 
            title="Resumo do Período" 
            icon={BarChart3} 
            section="summary"
          />
          {sectionsExpanded.summary && (
            <div className="p-4 md:p-5 pt-0 border-t border-border">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="bg-gradient-to-br from-success to-success rounded-xl p-4 text-white shadow-lg shadow-success/20">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 opacity-90" />
                    <p className="text-xs opacity-90">Receita Bruta</p>
                  </div>
                  <p className="text-xl font-bold">
                    {hideValues ? "••••••" : formatCurrency(receitaBruta)}
                  </p>
                  <p className="text-[10px] opacity-80 mt-1">Total de vendas</p>
                </div>

                <div className="bg-gradient-to-br from-destructive to-destructive rounded-xl p-4 text-white shadow-lg shadow-destructive/20">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingDown className="h-4 w-4 opacity-90" />
                    <p className="text-xs opacity-90">CMV</p>
                  </div>
                  <p className="text-xl font-bold">
                    {hideValues ? "••••••" : formatCurrency(dre.find(l => l.id === "CMV")?.valor || 0)}
                  </p>
                  <p className="text-[10px] opacity-80 mt-1">Custo da Mercadoria</p>
                </div>

                <div className="bg-gradient-to-br from-info to-info rounded-xl p-4 text-white shadow-lg shadow-info/20">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="h-4 w-4 opacity-90" />
                    <p className="text-xs opacity-90">Despesas OP</p>
                  </div>
                  <p className="text-xl font-bold">
                    {hideValues ? "••••••" : formatCurrency(dre.find(l => l.id === "DESPESAS_OPERACIONAIS")?.valor || 0)}
                  </p>
                  <p className="text-[10px] opacity-80 mt-1">Despesas operacionais</p>
                </div>

                <div className={`bg-gradient-to-br ${lucroLiquidoDRE >= 0 ? "from-primary to-primary" : "from-warning to-warning"} rounded-xl p-4 text-white shadow-lg ${lucroLiquidoDRE >= 0 ? "shadow-primary/20" : "shadow-warning/20"}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <BarChart3 className="h-4 w-4 opacity-90" />
                    <p className="text-xs opacity-90">Lucro Líquido</p>
                  </div>
                  <p className="text-xl font-bold">
                    {hideValues ? "••••••" : formatCurrency(lucroLiquidoDRE)}
                  </p>
                  <p className="text-[10px] opacity-80 mt-1">Resultado final</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Seção: Saldos das Contas */}
        <div className="bg-surface rounded-2xl shadow-sm border border-border/50 overflow-hidden transition-all duration-200 hover:shadow-md mb-6">
          <SectionHeader 
            title="Saldos das Contas" 
            icon={DollarSign} 
            section="accounts"
            badge={`${contas.length} contas`}
          />
          {sectionsExpanded.accounts && (
            <div className="p-4 md:p-5 pt-0 border-t border-border">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {contas.map((conta) => (
                  <div key={conta.id} className="border rounded-xl p-3 bg-surface-2/50 hover:bg-surface-2 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">{conta.nome}</p>
                        <p className="text-xs text-muted-foreground">Saldo atual</p>
                      </div>
                      <div className="text-right flex items-center gap-1">
                        <p className="text-lg font-bold text-white">
                          {hideValues ? "••••••" : formatCurrency(conta.saldoAtual)}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1 h-7 w-7 rounded-lg hover:bg-surface-2"
                          onClick={() => {
                            setContaEditando(conta);
                            setModalEditarOpen(true);
                          }}
                        >
                          <Edit className="h-3 w-3 text-muted-foreground/70" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                <div
                  className="border-2 border-dashed border-border rounded-xl p-4 bg-surface hover:bg-surface-2 transition-colors cursor-pointer flex items-center justify-center flex-col gap-2"
                  onClick={() => setModalNovaOpen(true)}
                >
                  <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                    <Plus className="h-5 w-5 text-success" />
                  </div>
                  <p className="font-medium text-white">Nova Conta</p>
                  <p className="text-xs text-muted-foreground">Adicionar conta</p>
                </div>
              </div>

              <div className="border-t border-border pt-4 mt-4">
                <div className="flex justify-between items-center">
                  <p className="font-semibold text-lg text-white">Total em Contas</p>
                  <p className="text-2xl font-bold text-primary">
                    {hideValues ? "••••••" : formatCurrency(saldoTotal)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Seção: Despesas Pendentes do Mês */}
        <div className="bg-surface rounded-2xl shadow-sm border border-border/50 overflow-hidden transition-all duration-200 hover:shadow-md mb-6">
          <SectionHeader
            title="Despesas Pendentes do Mês"
            icon={DollarSign}
            section="fixedExpenses"
            badge={`${despesasPendentes.length} pendentes`}
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMostrarPagas(!mostrarPagas)}
                className="rounded-full border-border hover:bg-surface-2 text-xs"
              >
                {mostrarPagas ? "Ocultar pagas" : "Mostrar pagas"}
              </Button>
            }
          />
          {sectionsExpanded.fixedExpenses && (
            <div className="p-4 md:p-5 pt-0 border-t border-border">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-surface-2/80 border-b border-border">
                    <tr>
                      <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Despesa</th>
                      <th className="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Valor</th>
                      <th className="px-3 py-2.5 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Venc.</th>
                      <th className="px-3 py-2.5 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Conta</th>
                      <th className="px-3 py-2.5 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="px-3 py-2.5 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listaDespesas.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-muted-foreground">
                          <DollarSign className="h-8 w-8 text-muted-foreground/70 mx-auto mb-2" />
                          Nenhuma despesa pendente neste mês.
                        </td>
                      </tr>
                    ) : (
                      listaDespesas.map((d) => (
                        <tr key={`${d.origem}-${d.id}`} className="border-b border-border hover:bg-surface-2 transition-colors">
                          <td className="px-3 py-2.5 font-medium text-white">{d.nome}</td>
                          <td className="px-3 py-2.5 text-right text-white font-mono">
                            {hideValues ? "••••••" : formatCurrency(d.valor)}
                          </td>
                          <td className="px-3 py-2.5 text-center text-muted-foreground hidden sm:table-cell">
                            {new Date(d.dataVencimento).toLocaleDateString()}
                          </td>
                          <td className="px-3 py-2.5 text-center hidden md:table-cell text-xs text-muted-foreground">
                            {d.contaNome || "—"}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            {d.status === "PAGO" ? (
                              <span className="inline-flex items-center rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">Pago</span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning">Pendente</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            {d.status !== "PAGO" ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => marcarPago(d)}
                                className="rounded-full border-success text-success hover:bg-success/5 text-xs"
                              >
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Pagar
                              </Button>
                            ) : (
                              <CheckCircle className="h-4 w-4 text-success mx-auto" />
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {listaDespesas.length > 0 && (
                    <tfoot className="border-t-2 border-border bg-surface-2/80">
                      <tr>
                        <td colSpan={2} className="px-3 py-3 text-right font-semibold text-white">
                          Total:
                        </td>
                        <td className="px-3 py-3 text-right font-bold text-destructive hidden sm:table-cell">
                          {hideValues ? "••••••" : formatCurrency(listaDespesas.reduce((sum, d) => sum + d.valor, 0))}
                        </td>
                        <td colSpan={4} className="px-3 py-3 text-right font-bold text-destructive">
                          {hideValues ? "••••••" : formatCurrency(listaDespesas.reduce((sum, d) => sum + d.valor, 0))}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Seção: Alertas */}
        {(lucroLiquidoDRE < 0 || (margemLiquida < 10 && margemLiquida > 0)) && (
          <div className="bg-surface rounded-2xl shadow-sm border border-border/50 overflow-hidden transition-all duration-200 hover:shadow-md mb-6">
            <SectionHeader 
              title="Alertas" 
              icon={AlertCircle} 
              section="alerts"
            />
            {sectionsExpanded.alerts && (
              <div className="p-4 md:p-5 pt-0 border-t border-border space-y-3">
                {lucroLiquidoDRE < 0 && (
                  <Alert className="bg-destructive/5 border-destructive/30/80 rounded-xl">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <AlertDescription className="text-sm text-destructive">
                      Atenção! Você está operando com prejuízo neste período. Analise seus custos e despesas para identificar oportunidades de redução.
                    </AlertDescription>
                  </Alert>
                )}

                {margemLiquida < 10 && margemLiquida > 0 && (
                  <Alert className="bg-warning/5 border-warning/80 rounded-xl">
                    <AlertCircle className="h-4 w-4 text-warning" />
                    <AlertDescription className="text-sm text-warning">
                      Sua margem líquida está abaixo de 10%. Considere revisar preços ou reduzir custos operacionais.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="mensal" className="mt-6">
          <TabsList className="bg-surface border border-border rounded-xl p-1 w-full justify-start overflow-x-auto shadow-sm">
            <TabsTrigger value="mensal" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white px-4 whitespace-nowrap">
              DRE do Mês
            </TabsTrigger>
            <TabsTrigger value="despesas" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white px-4 whitespace-nowrap">
              Despesas
            </TabsTrigger>
            <TabsTrigger value="folha" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white px-4 whitespace-nowrap">
              Folha
            </TabsTrigger>
            <TabsTrigger value="saldos" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white px-4 whitespace-nowrap">
              Saldos
            </TabsTrigger>
            <TabsTrigger value="acumulado" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white px-4 whitespace-nowrap">
              Acumulado
            </TabsTrigger>
            <TabsTrigger value="comparativo" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white px-4 whitespace-nowrap">
              Comparativo
            </TabsTrigger>
            <TabsTrigger value="fechamento" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white px-4 whitespace-nowrap">
              Distribuição
            </TabsTrigger>
          </TabsList>

          {/* Tab - DRE do Mês */}
          <TabsContent value="mensal" className="mt-6">
            <Card className="border-border shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-surface-2/80 border-b border-border">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-primary" />
                  Demonstrativo de Resultados - {meses[mesAtual - 1]}/{anoAtual}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Valores em R$ e percentuais de participação sobre a Receita Bruta
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-surface-2/80 border-b border-border">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Descrição
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Valor (R$)
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          % Receita
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Contas
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr className="border-b border-border">
                          <td colSpan={4} className="py-12 text-center">
                            <div className="flex justify-center items-center gap-2">
                              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                              <span className="text-sm text-muted-foreground">Carregando DRE...</span>
                            </div>
                          </td>
                        </tr>
                      ) : dre.length === 0 ? (
                        <tr className="border-b border-border">
                          <td colSpan={4} className="py-12 text-center text-muted-foreground">
                            Nenhum dado disponível para este período.
                            <Button
                              variant="link"
                              onClick={() => carregarDados()}
                              className="text-primary ml-2"
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
            <Card className="border-border shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-surface-2/80 border-b border-border">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Gestão de Despesas
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Controle de despesas fixas e variáveis do mês
                </p>
              </CardHeader>
              <CardContent className="p-4 md:p-5">
                <DespesasTab
                  despesas={despesas}
                  contas={contas.map(c => ({ id: c.id, nome: c.nome }))}
                  onRecarregar={carregarDados}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab - Folha de Pagamento */}
          <TabsContent value="folha" className="mt-6">
            <Card className="border-border shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-surface-2/80 border-b border-border">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-primary" />
                  Folha de Pagamento
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Controle de salários e encargos trabalhistas
                </p>
              </CardHeader>
              <CardContent className="p-4 md:p-5">
                <FolhaPagamentoTab
                  funcionarios={funcionarios}
                  onChange={setFuncionarios}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab - Saldos de Contas */}
          <TabsContent value="saldos" className="mt-6">
            <Card className="border-border shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-surface-2/80 border-b border-border">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <PieChart className="h-5 w-5 text-primary" />
                  Saldos de Contas
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Controle de saldos bancários e fluxo de caixa
                </p>
              </CardHeader>
              <CardContent className="p-4 md:p-5">
                <SaldosContasTab
                  contas={contas}
                  despesas={despesas}
                  onChange={setContas}
                  onSalvar={(id, saldoInicial) => {
                    const c = contas.find(x => x.id === id);
                    if (c) salvarConta(id, { nome: c.nome, saldoInicial, tipo: c.tipo || "CONTA_CORRENTE" });
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab - DRE Acumulado */}
          <TabsContent value="acumulado" className="mt-6">
            <Card className="border-border shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-surface-2/80 border-b border-border">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  DRE Acumulado - {anoAtual}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Resultados acumulados de Janeiro a {meses[mesAtual - 1]}
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-surface-2/80 border-b border-border">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Descrição
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Valor Acumulado (R$)
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          % Receita
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr className="border-b border-border">
                          <td colSpan={3} className="py-12 text-center">
                            <div className="flex justify-center items-center gap-2">
                              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                              <span className="text-sm text-muted-foreground">Carregando DRE Acumulado...</span>
                            </div>
                          </td>
                        </tr>
                      ) : acumuladoAno.length === 0 ? (
                        <tr className="border-b border-border">
                          <td colSpan={3} className="py-12 text-center text-muted-foreground">
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
            <Card className="border-border shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-surface-2/80 border-b border-border">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                  Comparativo Mensal - {anoAtual}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-5">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-surface-2/80 border-b border-border">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Mês</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Receita Bruta</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">CMV</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Lucro Bruto</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Despesas OP</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Lucro Líquido</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Margem %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr className="border-b border-border">
                          <td colSpan={7} className="py-12 text-center">
                            <div className="flex justify-center items-center gap-2">
                              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                              <span className="text-sm text-muted-foreground">Carregando...</span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        <tr className="border-b border-border">
                          <td colSpan={7} className="py-12 text-center text-muted-foreground">
                            <Calendar className="h-8 w-8 text-muted-foreground/70 mx-auto mb-2" />
                            Funcionalidade em desenvolvimento.
                            <p className="text-xs text-muted-foreground/70 mt-1">Em breve você poderá comparar todos os meses do ano.</p>
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
            <DistribuicaoLucroTab
              ano={anoAtual}
              mes={mesAtual}
              contas={contas.map(c => ({ id: c.id, nome: c.nome }))}
            />
          </TabsContent>
        </Tabs>

        {/* Observações do Fechamento */}
        {fechamento?.observacao && (
          <div className="mt-6 bg-surface rounded-xl p-4 border border-border shadow-sm">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <FileText className="h-3 w-3" />
              Observações do Fechamento
            </p>
            <p className="text-sm text-white mt-1">{fechamento.observacao}</p>
          </div>
        )}

        {/* Botão de ação flutuante para mobile */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-surface/95 backdrop-blur-md border-t border-border md:hidden z-10">
          {isFechado ? (
            <Button
              onClick={reabrirFechamento}
              className="w-full bg-warning/50 hover:bg-warning text-white rounded-xl shadow-lg shadow-warning/30"
            >
              <Unlock className="mr-2 h-4 w-4" />
              Reabrir Mês
            </Button>
          ) : (
            <Button
              onClick={realizarFechamento}
              className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/30"
            >
              <Lock className="mr-2 h-4 w-4" />
              Fechar Mês
            </Button>
          )}
        </div>

        {/* Modais de contas */}
        <ModalEditarConta
          conta={contaEditando as ContaParaEditar | null}
          open={modalEditarOpen}
          onClose={() => { setModalEditarOpen(false); setContaEditando(null); }}
          onSave={async (id, dados) => { await salvarConta(id, dados); }}
        />
        <ModalNovaConta
          open={modalNovaOpen}
          onClose={() => setModalNovaOpen(false)}
          onSave={async (dados) => { await criarConta(dados); }}
        />
      </PageContainer>
    </div>
  );
}