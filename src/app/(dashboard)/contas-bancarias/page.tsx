"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Building2, Wallet, TrendingUp, TrendingDown, Edit2, Trash2, MoreHorizontal, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { TransferenciaForm } from "./components/TransferenciaForm";

interface ContaFinanceira {
  id: number;
  nome: string;
  tipo: string;
  saldoInicial: number;
  saldoAtual: number;
  instituicao: string | null;
}

export default function ContasBancariasPage() {
  const router = useRouter();
  const [contas, setContas] = useState<ContaFinanceira[]>([]);
  const [saldoTotal, setSaldoTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [transferModalOpen, setTransferModalOpen] = useState(false);

  useEffect(() => {
    carregarContas();
  }, []);

  const carregarContas = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/contas-financeiras");
      const data = await response.json();
      if (data.success) {
        setContas(data.data);
        const total = data.data.reduce((sum: number, conta: ContaFinanceira) => sum + conta.saldoAtual, 0);
        setSaldoTotal(total);
      }
    } catch (error) {
      console.error("Erro ao carregar contas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta conta?\n\nApenas contas sem movimentações podem ser excluídas.")) {
      try {
        const response = await fetch(`/api/contas-financeiras/${id}`, { method: "DELETE" });
        const data = await response.json();
        if (data.success) {
          alert(data.message);
          carregarContas();
        } else {
          alert(data.error || "Erro ao excluir conta.");
        }
      } catch (error) {
        console.error("Erro:", error);
        alert("Erro ao excluir conta.");
      }
    }
  };

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case "CONTA_CORRENTE":
        return <Building2 className="h-5 w-5 text-blue-500" />;
      case "CARTEIRA":
        return <Wallet className="h-5 w-5 text-emerald-500" />;
      case "APLICACAO":
        return <TrendingUp className="h-5 w-5 text-purple-500" />;
      case "CONTA_IFOOD":
        return <Building2 className="h-5 w-5 text-orange-500" />;
      default:
        return <Building2 className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case "CONTA_CORRENTE":
        return "Conta Corrente";
      case "CARTEIRA":
        return "Carteira (Dinheiro)";
      case "APLICACAO":
        return "Aplicação";
      case "CONTA_IFOOD":
        return "Conta iFood";
      default:
        return tipo;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 ml-6 mr-6 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Contas Financeiras</h1>
          <p className="text-sm text-gray-500">Gerencie suas contas e rastreie movimentações</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setTransferModalOpen(true)} variant="outline" className="rounded-full">
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            Transferir
          </Button>
          <Button onClick={() => router.push("/contas-bancarias/nova")} className="bg-[#de4838] hover:bg-[#c73d2e] text-white rounded-full">
            <Plus className="mr-2 h-4 w-4" />
            Nova Conta
          </Button>
        </div>
      </div>

      <div className="container mx-auto p-6 max-w-7xl">
        {/* Cards de Resumo */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <CardContent className="p-6">
              <p className="text-sm opacity-90">Saldo Total</p>
              <p className="text-2xl font-bold mt-2">{formatCurrency(saldoTotal)}</p>
              <p className="text-xs opacity-80 mt-1">em todas as contas</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
            <CardContent className="p-6">
              <p className="text-sm opacity-90">Total de Contas</p>
              <p className="text-2xl font-bold mt-2">{contas.length}</p>
              <p className="text-xs opacity-80 mt-1">cadastradas</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
            <CardContent className="p-6">
              <p className="text-sm opacity-90">Maior Saldo</p>
              {contas.length > 0 ? (
                <>
                  <p className="text-2xl font-bold mt-2">{formatCurrency(Math.max(...contas.map(c => c.saldoAtual)))}</p>
                  <p className="text-xs opacity-80 mt-1">{contas.find(c => c.saldoAtual === Math.max(...contas.map(c => c.saldoAtual)))?.nome}</p>
                </>
              ) : (
                <p className="text-sm mt-2">Nenhuma conta</p>
              )}
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-orange-600 to-orange-700 text-white">
            <CardContent className="p-6">
              <p className="text-sm opacity-90">Média por Conta</p>
              <p className="text-2xl font-bold mt-2">{formatCurrency(contas.length > 0 ? saldoTotal / contas.length : 0)}</p>
              <p className="text-xs opacity-80 mt-1">saldo médio</p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Contas */}
        <div className="mt-8 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-gray-50 p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Suas Contas</h3>
            <p className="text-xs text-gray-500 mt-1">Clique em uma conta para ver suas movimentações</p>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conta</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instituição</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Saldo Inicial</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Saldo Atual</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <div className="flex justify-center items-center gap-2">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#de4838] border-t-transparent" />
                        <span className="text-sm text-gray-500">Carregando contas...</span>
                      </div>
                    </td>
                  </tr>
                ) : contas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <p className="text-gray-500">Nenhuma conta cadastrada.</p>
                      <Button onClick={() => router.push("/contas-bancarias/nova")} className="mt-4 bg-[#de4838] hover:bg-[#c73d2e]">
                        Criar primeira conta
                      </Button>
                    </td>
                  </tr>
                ) : (
                  contas.map((conta) => (
                    <tr 
                      key={conta.id} 
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/contas-bancarias/${conta.id}/movimentacoes`)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {getIcon(conta.tipo)}
                          <span className="font-medium text-gray-800">{conta.nome}</span>
                        </div>
                       </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="bg-gray-100 text-gray-700 rounded-full">
                          {getTipoLabel(conta.tipo)}
                        </Badge>
                       </td>
                      <td className="px-4 py-3 text-gray-600">{conta.instituicao || "-"}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(conta.saldoInicial)}</td>
                      <td className="px-4 py-3 text-right font-bold text-gray-800">{formatCurrency(conta.saldoAtual)}</td>
                      <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/contas-bancarias/${conta.id}/editar`)}>
                              <Edit2 className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(conta.id)} className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                       </td>
                     </tr>
                  ))
                )}
              </tbody>
              {contas.length > 0 && (
                <tfoot className="border-t-2 border-gray-200 bg-gray-50 font-bold">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-right">SALDO TOTAL:</td>
                    <td className="px-4 py-3 text-right text-[#de4838] text-lg">{formatCurrency(saldoTotal)}</td>
                    <td className="px-4 py-3"></td>
                  </tr>
                </tfoot>
              )}
             </table>
          </div>
        </div>

        {/* Diálogo de Transferência */}
        <Dialog open={transferModalOpen} onOpenChange={setTransferModalOpen}>
          <DialogContent className="max-w-md bg-white rounded-2xl p-0">
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100">
              <DialogTitle className="text-xl font-semibold">Transferir entre Contas</DialogTitle>
            </DialogHeader>
            <div className="p-6">
              <TransferenciaForm contas={contas} onSuccess={() => {
                setTransferModalOpen(false);
                carregarContas();
              }} />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}