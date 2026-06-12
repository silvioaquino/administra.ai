"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, TrendingUp, TrendingDown, Calendar, Filter, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [filtros, setFiltros] = useState({
    dataInicio: "",
    dataFim: "",
    tipo: "",
  });

  useEffect(() => {
    carregarDados();
  }, [contaId, filtros]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      // Carregar dados da conta
      const contaResponse = await fetch(`/api/contas-financeiras/${contaId}`);
      const contaData = await contaResponse.json();
      if (contaData.success) {
        setConta(contaData.data);
      }

      // Carregar movimentações filtrando pelo nome da conta no campo origemDestino
      let url = `/api/livro-diario?origem_destino=${encodeURIComponent(contaData.data?.nome || "")}`;
      if (filtros.dataInicio) url += `&data_inicio=${filtros.dataInicio}`;
      if (filtros.dataFim) url += `&data_fim=${filtros.dataFim}`;
      if (filtros.tipo) url += `&tipo=${filtros.tipo}`;
      url += `&limit=500`;

      const movResponse = await fetch(url);
      const movData = await movResponse.json();
      if (movData.success) {
        setMovimentacoes(movData.data);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalEntradas = movimentacoes.filter(m => m.entrada > 0).reduce((sum, m) => sum + m.entrada, 0);
  const totalSaidas = movimentacoes.filter(m => m.saida > 0).reduce((sum, m) => sum + m.saida, 0);
  const saldoPeriodo = totalEntradas - totalSaidas;

  const exportarCSV = () => {
    const cabecalho = ["Data", "Descrição", "Conta", "Cliente/Fornecedor", "Entrada", "Saída", "Tipo"];
    const linhas = movimentacoes.map(m => [
      formatDate(m.data),
      m.descricao,
      m.conta,
      m.clienteFornecedor || "",
      m.entrada.toString(),
      m.saida.toString(),
      m.tipo,
    ]);
    const csv = [cabecalho, ...linhas].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute("download", `movimentacoes_${conta?.nome}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#de4838] border-t-transparent" />
      </div>
    );
  }

  if (!conta) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Conta não encontrada.</p>
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
            <h1 className="text-xl font-semibold text-gray-800">Movimentações - {conta.nome}</h1>
            <p className="text-sm text-gray-500">Histórico de entradas e saídas</p>
          </div>
        </div>
        <Button variant="outline" onClick={exportarCSV} className="rounded-full">
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      <div className="container mx-auto p-6 max-w-7xl">
        {/* Cards de Resumo */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white h-full min-h-[132px] sm:min-h-[150px]">
            <CardContent className="p-6">
              <p className="text-sm opacity-90">Saldo Atual</p>
              <p className="text-2xl font-bold mt-2">{formatCurrency(conta.saldoAtual)}</p>
              <p className="text-xs opacity-80 mt-1">na conta</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white h-full min-h-[132px] sm:min-h-[150px]">
            <CardContent className="p-6">
              <p className="text-sm opacity-90">Total Entradas</p>
              <p className="text-2xl font-bold mt-2">{formatCurrency(totalEntradas)}</p>
              <p className="text-xs opacity-80 mt-1">no período</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-red-600 to-red-700 text-white h-full min-h-[132px] sm:min-h-[150px]">
            <CardContent className="p-6">
              <p className="text-sm opacity-90">Total Saídas</p>
              <p className="text-2xl font-bold mt-2">{formatCurrency(totalSaidas)}</p>
              <p className="text-xs opacity-80 mt-1">no período</p>
            </CardContent>
          </Card>
          <Card className={`bg-gradient-to-r ${saldoPeriodo >= 0 ? 'from-purple-600 to-purple-700' : 'from-orange-600 to-orange-700'} text-white h-full min-h-[132px] sm:min-h-[150px]`}>
            <CardContent className="p-6">
              <p className="text-sm opacity-90">Saldo no Período</p>
              <p className="text-2xl font-bold mt-2">{formatCurrency(saldoPeriodo)}</p>
              <p className="text-xs opacity-80 mt-1">{saldoPeriodo >= 0 ? 'superávit' : 'déficit'}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-gray-50 p-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-[#de4838]" />
              <h3 className="font-semibold text-gray-800">Filtros</h3>
            </div>
          </div>
          <div className="p-5">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-600">Data Início</Label>
                <Input
                  type="date"
                  value={filtros.dataInicio}
                  onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-600">Data Fim</Label>
                <Input
                  type="date"
                  value={filtros.dataFim}
                  onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-600">Tipo</Label>
                <select
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm"
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
              <div className="flex items-end">
                <Button onClick={carregarDados} className="w-full bg-[#de4838] hover:bg-[#c73d2e] rounded-lg">
                  Filtrar
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabela de Movimentações */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-gray-50 p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Histórico de Transações</h3>
            <p className="text-xs text-gray-500 mt-1">{movimentacoes.length} movimentações encontradas</p>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conta Contábil</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente/Fornecedor</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Entrada</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Saída</th>
                </tr>
              </thead>
              <tbody>
                {movimentacoes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-500">
                      Nenhuma movimentação encontrada para esta conta no período selecionado.
                    </td>
                  </tr>
                ) : (
                  movimentacoes.map((mov) => (
                    <tr key={mov.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">{formatDate(mov.data)}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{mov.descricao}</td>
                      <td className="px-4 py-3 text-gray-600">{mov.conta}</td>
                      <td className="px-4 py-3 text-gray-500">{mov.clienteFornecedor || "-"}</td>
                      <td className="px-4 py-3 text-right font-medium text-emerald-600">
                        {mov.entrada > 0 ? formatCurrency(mov.entrada) : "-"}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-red-500">
                        {mov.saida > 0 ? formatCurrency(mov.saida) : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {movimentacoes.length > 0 && (
                <tfoot className="border-t-2 border-gray-200 bg-gray-50 font-bold">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-right">TOTAIS NO PERÍODO:</td>
                    <td className="px-4 py-3 text-right text-emerald-600">{formatCurrency(totalEntradas)}</td>
                    <td className="px-4 py-3 text-right text-red-500">{formatCurrency(totalSaidas)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}