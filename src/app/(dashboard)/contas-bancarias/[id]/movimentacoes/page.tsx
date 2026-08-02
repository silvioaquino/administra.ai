// src/app/(dashboard)/contas-bancarias/[id]/movimentacoes/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Filter, 
  Download, 
  Loader2, 
  Building2, 
  Wallet, 
  CreditCard,
  Banknote,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Lancamento {
  id: number;
  data: string;
  conta: string;
  descricao: string;
  clienteFornecedor: string | null;
  entrada: number;
  saida: number;
  tipo: string;
  origemDestino: string | null;
  notaFiscalId: number | null;
}

interface ContaFinanceira {
  id: number;
  nome: string;
  tipo: string;
  saldoInicial: number;
  saldoAtual: number;
  instituicao: string | null;
}

export default function MovimentacoesContaPage() {
  const router = useRouter();
  const params = useParams();
  const contaId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [conta, setConta] = useState<ContaFinanceira | null>(null);
  const [movimentacoes, setMovimentacoes] = useState<Lancamento[]>([]);
  const [totalEntradas, setTotalEntradas] = useState(0);
  const [totalSaidas, setTotalSaidas] = useState(0);
  const [filtros, setFiltros] = useState({
    dataInicio: "",
    dataFim: "",
    tipo: "",
  });

  const carregarDados = useCallback(async () => {
    setLoading(true);
    try {
      // Carregar dados da conta
      const contaResponse = await fetch(`/api/contas-financeiras/${contaId}`);
      const contaData = await contaResponse.json();
      
      if (!contaData.success) {
        throw new Error("Erro ao carregar conta");
      }
      
      setConta(contaData.data);

      // Carregar movimentações filtrando pelo nome da conta no campo origemDestino
      let url = `/api/livro-diario?origem_destino=${encodeURIComponent(contaData.data.nome)}`;
      
      if (filtros.dataInicio) {
        url += `&data_inicio=${filtros.dataInicio}`;
      }
      if (filtros.dataFim) {
        url += `&data_fim=${filtros.dataFim}`;
      }
      if (filtros.tipo) {
        url += `&tipo=${filtros.tipo}`;
      }
      url += `&limit=500`;

      const movResponse = await fetch(url);
      const movData = await movResponse.json();
      
      if (movData.success) {
        const movs = movData.data || [];
        setMovimentacoes(movs);
        
        // Calcular totais
        const entradas = movs.filter((m: Lancamento) => m.entrada > 0).reduce((sum: number, m: Lancamento) => sum + m.entrada, 0);
        const saidas = movs.filter((m: Lancamento) => m.saida > 0).reduce((sum: number, m: Lancamento) => sum + m.saida, 0);
        setTotalEntradas(entradas);
        setTotalSaidas(saidas);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  }, [contaId, filtros]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const saldoPeriodo = totalEntradas - totalSaidas;

  const exportarCSV = () => {
    if (movimentacoes.length === 0) {
      alert("Não há movimentações para exportar.");
      return;
    }

    const cabecalho = ["Data", "Descrição", "Conta Contábil", "Cliente/Fornecedor", "Entrada", "Saída", "Tipo"];
    const linhas = movimentacoes.map(m => [
      formatDate(m.data),
      m.descricao,
      m.conta,
      m.clienteFornecedor || "",
      m.entrada.toString().replace('.', ','),
      m.saida.toString().replace('.', ','),
      m.tipo,
    ]);
    
    const csv = [cabecalho, ...linhas].map(row => row.join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute("download", `movimentacoes_${conta?.nome}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case "CONTA_CORRENTE":
        return <Building2 className="h-5 w-5 text-info" />;
      case "CARTEIRA":
        return <Wallet className="h-5 w-5 text-success" />;
      case "APLICACAO":
        return <TrendingUp className="h-5 w-5 text-primary/80" />;
      case "CONTA_IFOOD":
        return <CreditCard className="h-5 w-5 text-warning" />;
      default:
        return <Banknote className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getTipoLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      VENDA: "Venda",
      COMPRA: "Compra",
      DESPESA: "Despesa",
      RECEITA: "Receita",
      TRANSFERENCIA: "Transferência",
    };
    return tipos[tipo] || tipo;
  };

  const getTipoBadge = (tipo: string) => {
    const colors: Record<string, string> = {
      VENDA: "bg-success/10 text-success border-success/30",
      COMPRA: "bg-warning/10 text-warning border-warning/30",
      DESPESA: "bg-destructive/10 text-destructive border-destructive/30",
      RECEITA: "bg-info/10 text-info border-info/30",
      TRANSFERENCIA: "bg-primary/10 text-white border-primary/30",
    };
    return colors[tipo] || "bg-surface-2 text-white border-border";
  };

  // Função para limpar filtros
  const limparFiltros = () => {
    setFiltros({ dataInicio: "", dataFim: "", tipo: "" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-2 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando movimentações...</p>
        </div>
      </div>
    );
  }

  if (!conta) {
    return (
      <div className="min-h-screen bg-surface-2 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-muted-foreground/70 mx-auto mb-4" />
          <p className="text-muted-foreground mb-2">Conta não encontrada.</p>
          <Button onClick={() => router.back()} variant="outline">
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-surface border-b border-border px-6 py-4 flex items-center justify-between shadow-sm flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.back()} 
            className="rounded-full hover:bg-surface-2"
          >
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-surface-2 rounded-full">
              {getIcon(conta.tipo)}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">{conta.nome}</h1>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <span>Movimentações</span>
                {conta.instituicao && (
                  <>
                    <span className="text-muted-foreground/70">•</span>
                    <span>{conta.instituicao}</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={exportarCSV} 
            className="rounded-full border-border hover:bg-surface-2"
            disabled={movimentacoes.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button
            variant="outline"
            onClick={carregarDados}
            className="rounded-full border-border hover:bg-surface-2"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </div>

      <div className="container mx-auto p-6 max-w-7xl">
        {/* Cards de Resumo */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-r from-info to-info text-white h-full min-h-[92px] sm:min-h-[105px]">
            <CardContent className="p-3 sm:p-4">
              <p className="text-[11px] sm:text-sm opacity-90 leading-tight">Saldo Atual</p>
              <p className="text-sm sm:text-xl font-bold mt-1 leading-tight">{formatCurrency(conta.saldoAtual)}</p>
              <p className="text-[10px] sm:text-xs opacity-80 mt-0.5">na conta</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-success to-success text-white h-full min-h-[92px] sm:min-h-[105px]">
            <CardContent className="p-3 sm:p-4">
              <p className="text-[11px] sm:text-sm opacity-90 leading-tight">Total Entradas</p>
              <p className="text-sm sm:text-xl font-bold mt-1 leading-tight">{formatCurrency(totalEntradas)}</p>
              <p className="text-[10px] sm:text-xs opacity-80 mt-0.5">no período</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-destructive to-destructive text-white h-full min-h-[92px] sm:min-h-[105px]">
            <CardContent className="p-3 sm:p-4">
              <p className="text-[11px] sm:text-sm opacity-90 leading-tight">Total Saídas</p>
              <p className="text-sm sm:text-xl font-bold mt-1 leading-tight">{formatCurrency(totalSaidas)}</p>
              <p className="text-[10px] sm:text-xs opacity-80 mt-0.5">no período</p>
            </CardContent>
          </Card>
          <Card className={`bg-gradient-to-r ${saldoPeriodo >= 0 ? 'from-primary to-primary' : 'from-warning to-warning'} text-white h-full min-h-[92px] sm:min-h-[105px]`}>
            <CardContent className="p-3 sm:p-4">
              <p className="text-[11px] sm:text-sm opacity-90 leading-tight">Saldo no Período</p>
              <p className="text-sm sm:text-xl font-bold mt-1 leading-tight">{formatCurrency(saldoPeriodo)}</p>
              <p className="text-[10px] sm:text-xs opacity-80 mt-0.5">{saldoPeriodo >= 0 ? 'Superávit' : 'Déficit'}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <div className="mt-6 bg-surface rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-surface-2 p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-white">Filtros</h3>
            </div>
          </div>
          <div className="p-5">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">Data Início</Label>
                <Input
                  type="date"
                  value={filtros.dataInicio}
                  onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">Data Fim</Label>
                <Input
                  type="date"
                  value={filtros.dataFim}
                  onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">Tipo</Label>
                <select
                  className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none"
                  value={filtros.tipo}
                  onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
                >
                  <option value="">Todos</option>
                  <option value="VENDA">Venda</option>
                  <option value="COMPRA">Compra</option>
                  <option value="DESPESA">Despesa</option>
                  <option value="RECEITA">Receita</option>
                  <option value="TRANSFERENCIA">Transferência</option>
                </select>
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={carregarDados} className="flex-1 bg-primary hover:bg-primary/90 rounded-lg">
                  Filtrar
                </Button>
                <Button 
                  variant="outline" 
                  onClick={limparFiltros}
                  className="rounded-lg"
                >
                  Limpar
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabela de Movimentações */}
        <div className="mt-6 bg-surface rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-surface-2 p-4 border-b border-border flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="font-semibold text-white">Histórico de Transações</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {movimentacoes.length} movimentação(ões) encontrada(s)
              </p>
            </div>
            {movimentacoes.length > 0 && (
              <Badge variant="outline" className="bg-surface-2 text-white">
                {new Date().toLocaleDateString('pt-BR')}
              </Badge>
            )}
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Descrição</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Conta Contábil</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Cliente/Fornecedor</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Tipo</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Entrada</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Saída</th>
                </tr>
              </thead>
              <tbody>
                {movimentacoes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 bg-surface-2 rounded-full flex items-center justify-center">
                          <Calendar className="h-6 w-6 text-muted-foreground/70" />
                        </div>
                        <p className="text-muted-foreground font-medium">Nenhuma movimentação encontrada</p>
                        <p className="text-xs text-muted-foreground/70">
                          {filtros.dataInicio || filtros.dataFim 
                            ? "Tente ajustar os filtros de data" 
                            : "Esta conta ainda não possui movimentações"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  movimentacoes.map((mov) => (
                    <tr key={mov.id} className="border-b border-border hover:bg-surface-2 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDate(mov.data)}</td>
                      <td className="px-4 py-3 font-medium text-white max-w-[200px] truncate" title={mov.descricao}>
                        {mov.descricao}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[150px] truncate" title={mov.conta}>
                        {mov.conta}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[150px] truncate" title={mov.clienteFornecedor || ""}>
                        {mov.clienteFornecedor || "-"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge className={`${getTipoBadge(mov.tipo)} rounded-full border`}>
                          {getTipoLabel(mov.tipo)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-success">
                        {mov.entrada > 0 ? formatCurrency(mov.entrada) : "-"}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-destructive">
                        {mov.saida > 0 ? formatCurrency(mov.saida) : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {movimentacoes.length > 0 && (
                <tfoot className="border-t-2 border-border bg-surface-2 font-bold">
                  <tr>
                    <td colSpan={5} className="px-4 py-3 text-right">TOTAIS NO PERÍODO:</td>
                    <td className="px-4 py-3 text-right text-success">{formatCurrency(totalEntradas)}</td>
                    <td className="px-4 py-3 text-right text-destructive">{formatCurrency(totalSaidas)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Resumo adicional */}
        {movimentacoes.length > 0 && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-r from-success to-success border-success/30">
              <CardContent className="p-4">
                <p className="text-xs text-success font-medium">Média de Entrada</p>
                <p className="text-lg font-bold text-success">
                  {formatCurrency(totalEntradas / (movimentacoes.filter(m => m.entrada > 0).length || 1))}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-destructive to-destructive border-destructive/30">
              <CardContent className="p-4">
                <p className="text-xs text-destructive font-medium">Média de Saída</p>
                <p className="text-lg font-bold text-destructive">
                  {formatCurrency(totalSaidas / (movimentacoes.filter(m => m.saida > 0).length || 1))}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-primary to-primary border-primary/30">
              <CardContent className="p-4">
                <p className="text-xs text-white font-medium">Total de Transações</p>
                <p className="text-lg font-bold text-white">{movimentacoes.length}</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}