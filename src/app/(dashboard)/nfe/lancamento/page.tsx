"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Package, AlertCircle, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatCurrency } from "@/lib/utils";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { useContasFinanceiras } from "@/hooks/useContasFinanceiras";

interface Produto {
  id: number;
  descricao: string;
  preco_venda: number;
  quantidade: number;
  unidade: string;
}

export default function LancamentoManualPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [formData, setFormData] = useState({
    tipoLancamento: "VENDA",
    produtoId: "",
    quantidade: 1,
    valorUnitario: 0,
    clienteFornecedor: "",
    formaPagamento: "DINHEIRO",
    contaDestino: "Dinheiro Físico",
    contaDespesa: "",
    origemDestino: "", // NOVO CAMPO
    data: new Date().toISOString().split("T")[0],
  });

  // Usar hook reutilizável para carregar contas
  const { contas, loading: loadingContas } = useContasFinanceiras();

  useEffect(() => {
    carregarProdutos();
  }, []);

  // Definir a primeira conta como padrão quando carregar
  useEffect(() => {
    if (contas.length > 0 && !formData.contaDespesa) {
      setFormData(prev => ({ ...prev, contaDespesa: contas[0].id.toString() }));
    }
  }, [contas, formData.contaDespesa]);

  async function carregarProdutos() {
    try {
      const response = await fetch("/api/produtos?limit=500");
      const data = await response.json();
      if (data.success) {
        setProdutos(data.data);
      }
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
    }
  }

  const produtoSelecionado = produtos.find(p => p.id === Number(formData.produtoId));
  const valorTotal = formData.quantidade * (produtoSelecionado?.preco_venda || formData.valorUnitario);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.produtoId) {
      alert("Selecione um produto");
      return;
    }

    if (!produtoSelecionado) {
      alert("Produto não encontrado");
      return;
    }

    if (formData.tipoLancamento === "COMPRA" && !formData.contaDespesa) {
      alert("Cadastre e selecione uma Conta Financeira antes de salvar.\n\nAcesse o menu 'Contas Bancárias' e adicione uma conta para este cliente.");
      return;
    }

    setLoading(true);

    try {
      // Registrar no livro diário
      const response = await fetch("/api/livro-diario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: formData.data,
          conta:
            formData.tipoLancamento === "VENDA"
              ? getContaVenda(formData.formaPagamento)
              : formData.contaDespesa,
          descricao: `${
            formData.tipoLancamento === "VENDA" ? "Venda" : "Compra"
          }: ${produtoSelecionado.descricao} - ${formData.quantidade} ${
            produtoSelecionado.unidade
          }`,
          cliente_fornecedor:
            formData.clienteFornecedor ||
            (formData.tipoLancamento === "VENDA" ? "Consumidor" : "Fornecedor"),
          entrada: formData.tipoLancamento === "VENDA" ? valorTotal : 0,
          saida: formData.tipoLancamento === "COMPRA" ? valorTotal : 0,
          tipo: formData.tipoLancamento,
          origemDestino: formData.origemDestino || null, // NOVO CAMPO
          formaPagamento: formData.formaPagamento
        }),
      });

      if (!response.ok) throw new Error("Erro ao registrar");

      // Atualizar estoque
      const novoEstoque =
        formData.tipoLancamento === "VENDA"
          ? Math.max(0, produtoSelecionado.quantidade - formData.quantidade)
          : produtoSelecionado.quantidade + formData.quantidade;

      await fetch(`/api/produtos/${produtoSelecionado.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...produtoSelecionado,
          quantidade: novoEstoque,
        }),
      });

      const mensagem =
        formData.tipoLancamento === "VENDA"
          ? `✅ Venda registrada! Entrada: ${formatCurrency(valorTotal)}`
          : `✅ Compra registrada! Saída: ${formatCurrency(valorTotal)}`;

      alert(mensagem);

      // Resetar formulário
      setFormData({
        ...formData,
        produtoId: "",
        quantidade: 1,
        clienteFornecedor: "",
        origemDestino: "",
      });
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao realizar lançamento");
    } finally {
      setLoading(false);
    }
  }

  function getContaVenda(formaPagamento: string): string {
    const contas: Record<string, string> = {
      DINHEIRO: "3.1.1 Receita com Cash",
      CARTAO_CREDITO: "3.1.2 Receita com Cartão de Crédito",
      CARTAO_DEBITO: "3.1.2 Receita com Cartão de Débito",
      PIX: "3.1.4 Receita com PIX",
      IFOOD: "3.1.3 Receita Ifood",
    };
    return contas[formaPagamento] || "3.1.1 Receita com Vendas";
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <PageContainer>
        <PageHeader
          title="Lançamento Manual"
          subtitle="Registre vendas e compras manualmente"
          onBack={() => router.back()}
        >
          <Button
            type="submit"
            form="lancamento-form"
            disabled={loading || !formData.produtoId}
            className="bg-primary hover:bg-primary/90 text-white px-6 rounded-full shadow-sm"
          >
            <Save className="mr-2 h-4 w-4" />
            {loading
              ? "Processando..."
              : formData.tipoLancamento === "VENDA"
              ? "Lançar Venda"
              : "Lançar Compra"}
          </Button>
        </PageHeader>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Form Fields */}
          <div className="space-y-6">
            <form id="lancamento-form" onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-6">
                {/* Tipo and Date Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Tipo
                    </Label>
                    <div className="relative">
                      <select
                        className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none"
                        value={formData.tipoLancamento}
                        onChange={e =>
                          setFormData({ ...formData, tipoLancamento: e.target.value })
                        }
                      >
                        <option value="VENDA">💰 Venda (Entrada - Receita)</option>
                        <option value="COMPRA">📦 Compra (Saída - Despesa)</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
                        <svg
                          className="fill-current h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Data
                    </Label>
                    <Input
                      type="date"
                      value={formData.data}
                      onChange={e => setFormData({ ...formData, data: e.target.value })}
                      className="rounded-lg border-border focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>

                {/* Forma de Pagamento */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Forma de Pagamento
                  </Label>
                  <div className="relative">
                    <select
                      className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none"
                      value={formData.formaPagamento}
                      onChange={e =>
                        setFormData({ ...formData, formaPagamento: e.target.value })
                      }
                    >
                      <option value="DINHEIRO">💰 Dinheiro</option>
                      <option value="CARTAO_CREDITO">💳 Cartão de Crédito</option>
                      <option value="CARTAO_DEBITO">💳 Cartão de Débito</option>
                      <option value="PIX">📱 PIX</option>
                      <option value="IFOOD">🍔 iFood</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
                      <svg
                        className="fill-current h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Origem/Destino - NOVO CAMPO */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Origem/Destino (Conta Financeira)
                  </Label>
                  <div className="relative">
                    <select
                      className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none"
                      value={formData.origemDestino}
                      onChange={e =>
                        setFormData({ ...formData, origemDestino: e.target.value })
                      }
                    >
                      <option value="">Selecione a conta (opcional)</option>
                      {contas.map(conta => (
                        <option key={conta.id} value={conta.nome}>
                          {conta.nome}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
                      <Building2 className="h-4 w-4 text-muted-foreground/70" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Indique de onde veio o dinheiro (venda) ou para onde foi
                    (compra/despesa).
                  </p>
                </div>

                {/* Produto */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Produto
                  </Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <select
                        className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none"
                        value={formData.produtoId}
                        onChange={e => {
                          const produto = produtos.find(p => p.id === Number(e.target.value));
                          setFormData({
                            ...formData,
                            produtoId: e.target.value,
                            valorUnitario: produto?.preco_venda || 0,
                          });
                        }}
                      >
                        <option value="">Selecione um produto</option>
                        {produtos.map(prod => (
                          <option key={prod.id} value={prod.id}>
                            {prod.descricao} - {formatCurrency(prod.preco_venda)}/{prod.unidade} (Estoque: {prod.quantidade})
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
                        <svg
                          className="fill-current h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                        </svg>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push("/nfe/produtos/novo")}
                      className="border-border rounded-lg hover:bg-surface-2"
                    >
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>

                {/* Quantidade e Valor */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Quantidade
                    </Label>
                    <Input
                      type="number"
                      step="1"
                      min="1"
                      value={formData.quantidade}
                      onChange={e =>
                        setFormData({ ...formData, quantidade: Number(e.target.value) })
                      }
                      className="rounded-lg border-border focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Valor Unitário (R$)
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.valorUnitario}
                      onChange={e =>
                        setFormData({ ...formData, valorUnitario: Number(e.target.value) })
                      }
                      className="rounded-lg border-border focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Cliente/Fornecedor */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {formData.tipoLancamento === "VENDA" ? "Cliente" : "Fornecedor"}
                  </Label>
                  <Input
                    placeholder={
                      formData.tipoLancamento === "VENDA"
                        ? "Nome do cliente"
                        : "Nome do fornecedor"
                    }
                    value={formData.clienteFornecedor}
                    onChange={e =>
                      setFormData({ ...formData, clienteFornecedor: e.target.value })
                    }
                    className="rounded-lg border-border focus:ring-primary"
                  />
                </div>

                {/* Conta para COMPRA */}
                {formData.tipoLancamento === "COMPRA" && (
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Conta de Despesa
                    </Label>
                    <div className="relative">
                      <select
                        className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none"
                        value={formData.contaDespesa}
                        onChange={e =>
                          setFormData({ ...formData, contaDespesa: e.target.value })
                        }
                        disabled={loadingContas || contas.length === 0}
                      >
                        {loadingContas ? (
                          <option value="">Carregando contas...</option>
                        ) : contas.length === 0 ? (
                          <option value="">Nenhuma conta disponível</option>
                        ) : (
                          contas.map((conta) => (
                            <option key={conta.id} value={conta.id.toString()}>
                              {conta.nome}
                            </option>
                          ))
                        )}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
                        <svg
                          className="fill-current h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                )}

                {/* Conta para VENDA */}
                {formData.tipoLancamento === "VENDA" && (
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Conta de Destino
                    </Label>
                    <div className="relative">
                      <select
                        className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none"
                        value={formData.contaDestino}
                        onChange={e =>
                          setFormData({ ...formData, contaDestino: e.target.value })
                        }
                      >
                        <option value="Dinheiro Físico">💰 Dinheiro Físico</option>
                        <option value="Caixa Econômica">🏦 Caixa Econômica</option>
                        <option value="iFood">🍔 iFood</option>
                        <option value="Infinity Empório">🏪 Infinity Empório</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
                        <svg
                          className="fill-current h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                )}

                {/* Alerta informativo */}
                <Alert variant="default" className="bg-primary/10 border-primary/20 rounded-xl">
                  <AlertCircle className="h-4 w-4 text-primary" />
                  <AlertDescription className="text-sm text-white">
                    {formData.tipoLancamento === "VENDA"
                      ? "💰 Venda: O valor será registrado como RECEITA (Entrada no caixa)"
                      : "📦 Compra: O valor será registrado como DESPESA (Saída do caixa)"}
                  </AlertDescription>
                </Alert>

                {/* Total */}
                <div className="pt-4 border-t border-border">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">Valor Total:</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatCurrency(valorTotal)}
                    </span>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Right Column - Preview Card */}
          <div className="lg:sticky lg:top-24 h-fit">
            <Card className="overflow-hidden border-0 shadow-lg rounded-2xl bg-surface">
              <div className="bg-surface-2 p-4 border-b border-border">
                <h3 className="font-semibold text-white">Pré-visualização do lançamento</h3>
                <p className="text-xs text-muted-foreground">Confira os detalhes antes de salvar</p>
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <span className="text-sm text-muted-foreground">Tipo:</span>
                  <span
                    className={`text-sm font-medium px-2 py-1 rounded-full ${
                      formData.tipoLancamento === "VENDA"
                        ? "bg-success/10 text-success"
                        : "bg-warning/10 text-warning"
                    }`}
                  >
                    {formData.tipoLancamento === "VENDA" ? "Venda (Entrada)" : "Compra (Saída)"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Produto:</span>
                  <span className="font-medium text-white text-right">
                    {produtoSelecionado?.descricao || "—"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Quantidade:</span>
                  <span className="font-medium text-white">
                    {formData.quantidade} {produtoSelecionado?.unidade || ""}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Valor Unitário:</span>
                  <span className="font-medium text-white">
                    {formatCurrency(produtoSelecionado?.preco_venda || formData.valorUnitario)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Forma de Pagto:</span>
                  <span className="font-medium text-white capitalize">
                    {formData.formaPagamento.toLowerCase().replace("_", " ")}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {formData.tipoLancamento === "VENDA" ? "Cliente" : "Fornecedor"}:
                  </span>
                  <span className="font-medium text-white">
                    {formData.clienteFornecedor || "—"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Origem/Destino:</span>
                  <span className="font-medium text-white">
                    {formData.origemDestino || "—"}
                  </span>
                </div>
                <div className="pt-4 mt-2 border-t border-dashed border-border">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-white">
                      Total a {formData.tipoLancamento === "VENDA" ? "receber" : "pagar"}:
                    </span>
                    <span className="text-xl font-bold text-primary">
                      {formatCurrency(valorTotal)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}