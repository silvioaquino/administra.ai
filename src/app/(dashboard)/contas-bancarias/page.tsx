"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Building2, Wallet, TrendingUp, Edit2, Trash2, MoreHorizontal, ArrowRightLeft } from "lucide-react";
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
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";

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

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      carregarContas();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, []);

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
        return <Building2 className="h-5 w-5 text-info" />;
      case "CARTEIRA":
        return <Wallet className="h-5 w-5 text-success" />;
      case "APLICACAO":
        return <TrendingUp className="h-5 w-5 text-primary/80" />;
      case "CONTA_IFOOD":
        return <Building2 className="h-5 w-5 text-warning" />;
      default:
        return <Building2 className="h-5 w-5 text-muted-foreground" />;
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
    <div className="min-h-screen bg-background">
      <PageContainer>
        <PageHeader
          title="Contas Financeiras"
          subtitle="Gerencie suas contas e rastreie movimentações"
          backHref="/gerenciamento"
        >
          <Button onClick={() => setTransferModalOpen(true)} variant="outline" className="rounded-full">
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            Transferir
          </Button>
          <Button onClick={() => router.push("/contas-bancarias/nova")} className="bg-primary hover:bg-primary/90 text-white rounded-full">
            <Plus className="mr-2 h-4 w-4" />
            Nova Conta
          </Button>
        </PageHeader>
        {/* Cards de Resumo */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-r from-info to-info text-white h-full min-h-[92px] sm:min-h-[105px]">
            <CardContent className="p-3 sm:p-4">
              <p className="text-[11px] sm:text-sm opacity-90 leading-tight">Saldo Total</p>
              <p className="text-sm sm:text-xl font-bold mt-1 leading-tight">{formatCurrency(saldoTotal)}</p>
              <p className="text-[10px] sm:text-xs opacity-80 mt-0.5">em todas as contas</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-success to-success text-white h-full min-h-[92px] sm:min-h-[105px]">
            <CardContent className="p-3 sm:p-4">
              <p className="text-[11px] sm:text-sm opacity-90 leading-tight">Total de Contas</p>
              <p className="text-sm sm:text-xl font-bold mt-1 leading-tight">{contas.length}</p>
              <p className="text-[10px] sm:text-xs opacity-80 mt-0.5">cadastradas</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-primary to-primary text-white h-full min-h-[92px] sm:min-h-[105px]">
            <CardContent className="p-3 sm:p-4">
              <p className="text-[11px] sm:text-sm opacity-90 leading-tight">Maior Saldo</p>
              {contas.length > 0 ? (
                <>
                  <p className="text-sm sm:text-xl font-bold mt-1 leading-tight">{formatCurrency(Math.max(...contas.map(c => c.saldoAtual)))}</p>
                  <p className="text-[10px] sm:text-xs opacity-80 mt-0.5">{contas.find(c => c.saldoAtual === Math.max(...contas.map(c => c.saldoAtual)))?.nome}</p>
                </>
              ) : (
                <p className="text-sm mt-1">Nenhuma conta</p>
              )}
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-warning to-warning text-white h-full min-h-[92px] sm:min-h-[105px]">
            <CardContent className="p-3 sm:p-4">
              <p className="text-[11px] sm:text-sm opacity-90 leading-tight">Média por Conta</p>
              <p className="text-sm sm:text-xl font-bold mt-1 leading-tight">{formatCurrency(contas.length > 0 ? saldoTotal / contas.length : 0)}</p>
              <p className="text-[10px] sm:text-xs opacity-80 mt-0.5">saldo médio</p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Contas */}
        <div className="mt-8 bg-surface rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-surface-2 p-4 border-b border-border">
            <h3 className="font-semibold text-white">Suas Contas</h3>
            <p className="text-xs text-muted-foreground mt-1">Clique em uma conta para ver suas movimentações</p>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Conta</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Instituição</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Saldo Inicial</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Saldo Atual</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <div className="flex justify-center items-center gap-2">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        <span className="text-sm text-muted-foreground">Carregando contas...</span>
                      </div>
                    </td>
                  </tr>
                ) : contas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <p className="text-muted-foreground">Nenhuma conta cadastrada.</p>
                      <Button onClick={() => router.push("/contas-bancarias/nova")} className="mt-4 bg-primary hover:bg-primary/90">
                        Criar primeira conta
                      </Button>
                    </td>
                  </tr>
                ) : (
                  contas.map((conta) => (
                    <tr 
                      key={conta.id} 
                      className="border-b border-border hover:bg-surface-2 transition-colors cursor-pointer"
                      onClick={() => router.push(`/contas-bancarias/${conta.id}/movimentacoes`)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {getIcon(conta.tipo)}
                          <span className="font-medium text-white">{conta.nome}</span>
                        </div>
                       </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="bg-surface-2 text-white rounded-full">
                          {getTipoLabel(conta.tipo)}
                        </Badge>
                       </td>
                      <td className="px-4 py-3 text-muted-foreground">{conta.instituicao || "-"}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{formatCurrency(conta.saldoInicial)}</td>
                      <td className="px-4 py-3 text-right font-bold text-white">{formatCurrency(conta.saldoAtual)}</td>
                      <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="h-8 w-8 p-0 rounded-full bg-transparent text-muted-foreground hover:bg-surface-2 hover:text-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/contas-bancarias/${conta.id}/editar`)}>
                              <Edit2 className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(conta.id)} className="text-destructive">
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
                <tfoot className="border-t-2 border-border bg-surface-2 font-bold">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-right">SALDO TOTAL:</td>
                    <td className="px-4 py-3 text-right text-primary text-lg">{formatCurrency(saldoTotal)}</td>
                    <td className="px-4 py-3"></td>
                  </tr>
                </tfoot>
              )}
             </table>
          </div>
        </div>

        {/* Diálogo de Transferência */}
        <Dialog open={transferModalOpen} onOpenChange={setTransferModalOpen}>
          <DialogContent className="max-w-md bg-surface rounded-2xl p-0">
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
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
      </PageContainer>
    </div>
  );
}