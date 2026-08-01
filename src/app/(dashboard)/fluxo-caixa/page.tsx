"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Percent,
  Download,
  Filter,
  Plus,
  Check,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { limparTexto } from '@/lib/services/local-normalizer';
import { DreItem, DreMeses } from '@/types/dre';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';

// Interface para edição
interface EditingState {
  itemId: string;
  field: string;
  value: number;
}

// Interfaces
interface MetaMensal {
  id?: number;
  ano: number;
  mes: number;
  metaFaturamentoDiaria: number;
  metaDespesasDiaria: number;
  metaLucroPercentual: number;
  diasUteis: number;
}

// Interface para nova categoria
interface NovaCategoria {
  nome: string;
  codigo?: string;
  nivel: number;
  tipo: 'receita' | 'despesa';
  isHeader?: boolean;
  parentId?: string;
}

interface DreMensal {
  mes: number;
  nome: string;
  previsao: number;
  realizado: number;
  avPrevisao: number;
  avRealizado: number;
  ahPrevisao?: number;
  ahRealizado?: number;
}

interface ProdutoInsumo {
  id: number;
  descricao: string;
  origem: string;
  agrupado: boolean;
  valoresPorMes: Record<number, number>;
}


// Ícone Percent não existe no lucide-react
const PercentIcon = Percent;

export default function FluxoCaixaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hideValues, setHideValues] = useState(false);
  const [anoAtual, setAnoAtual] = useState(new Date().getFullYear());
  const [mesAtual, setMesAtual] = useState(new Date().getMonth() + 1);
  const [dreData, setDREData] = useState<DreItem[]>([]);
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [novaCat, setNovaCat] = useState<NovaCategoria>({ nome: '', nivel: 1, tipo: 'despesa', isHeader: false });

  const [meta, setMeta] = useState<MetaMensal | null>(null);
  const [dreMensal, setDreMensal] = useState<DreMensal[]>([]);
  const [totaisAno, setTotaisAno] = useState({
    previsao: 0,
    realizado: 0,
  });
  const [produtosPorMes, setProdutosPorMes] = useState<ProdutoInsumo[]>([]);
  const [editandoNormalizacao, setEditandoNormalizacao] = useState<number | null>(null);
  const [valorNormalizacao, setValorNormalizacao] = useState('');
  const [salvandoNormalizacao, setSalvandoNormalizacao] = useState(false);

  useEffect(() => {
    carregarDados();
  }, [anoAtual]);

  // Busca única: metas + DRE (real, de dreResultado) + DRE mensal
  // (cards + insumos). Um só gate de loading cobre tudo.
  const carregarDados = async () => {
    setLoading(true);
    try {
      const [metaResponse, dreResponse, dreMensalResponse] = await Promise.all([
        fetch(`/api/fluxo-caixa/metas?ano=${anoAtual}&mes=${mesAtual}`),
        fetch(`/api/dre?ano=${anoAtual}`),
        fetch(`/api/fluxo-caixa/dre-mensal?ano=${anoAtual}`),
      ]);

      const metaData = await metaResponse.json();
      if (metaData.success) {
        setMeta(metaData.data);
      }

      const dreData = await dreResponse.json();
      if (dreData.success) {
        setDREData(dreData.data);
      }

      const dreMensalData = await dreMensalResponse.json();
      if (dreMensalData.success) {
        setDreMensal(dreMensalData.data);
        setTotaisAno(dreMensalData.totaisAno);
        setProdutosPorMes(dreMensalData.produtosPorMes || {});
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const sincronizarDados = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/fluxo-caixa/sincronizar?ano=${anoAtual}`, {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        alert('✓ Dados sincronizados com sucesso!');
        carregarDados();
      } else {
        alert('✗ Erro ao sincronizar dados');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('✗ Erro ao sincronizar dados');
    } finally {
      setLoading(false);
    }
  };

  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];

  // Formata o valor sem o prefixo "R$" (usado nas tabelas DRE e Produtos)
  const formatValor = (value: number) => formatCurrency(value).replace(/R\$\s?/, '');

  const obterValorMes = (mesNum: number, tipo: 'previsao' | 'realizado') => {
    const mesData = dreMensal.find(m => m.mes === mesNum);
    if (!mesData) return 0;
    return tipo === 'previsao' ? mesData.previsao : mesData.realizado;
  };

  const obterAvMes = (mesNum: number, tipo: 'previsao' | 'realizado') => {
    const mesData = dreMensal.find(m => m.mes === mesNum);
    if (!mesData) return 0;
    return tipo === 'previsao' ? mesData.avPrevisao : mesData.avRealizado;
  };

  const obterAhMes = (mesNum: number, tipo: 'previsao' | 'realizado') => {
    const mesData = dreMensal.find(m => m.mes === mesNum);
    if (!mesData || !mesData.ahPrevisao) return '-';
    const valor = tipo === 'previsao' ? mesData.ahPrevisao : mesData.ahRealizado;
    return valor !== undefined ? formatPercentage(valor) : '-';
  };

  // Calcular KPIs da DRE
  const calcularKPIs = () => {
    if (!dreData || dreData.length === 0) return null;

    const receitaLiquida = dreData.find((item) => item.id === 'receita-liquida');
    const lucroOperacional = dreData.find((item) => item.id === 'lucro-operacional');
    const lucroLiquido = dreData.find((item) => item.id === 'lucro-liquido');

    const totalReceita = receitaLiquida?.meses?.jan || 0;
    const totalLucroOp = lucroOperacional?.meses?.jan || 0;
    const totalLucroLiq = lucroLiquido?.meses?.jan || 0;

    return {
      receitaLiquida: totalReceita,
      lucroOperacional: totalLucroOp,
      lucroLiquido: totalLucroLiq,
      margem: totalReceita > 0 ? (totalLucroLiq / totalReceita) * 100 : 0,
    };
  };

  const kpis = calcularKPIs();

  // Separar insumos agrupados (com nomeNormalizado) dos não agrupados
  const insumosAgrupados = produtosPorMes.filter((p) => p.agrupado);
  const insumosNaoAgrupados = produtosPorMes.filter((p) => !p.agrupado);

  const renderLinhaInsumo = (produto: ProdutoInsumo) => {
    const total = Object.values(produto.valoresPorMes || {}).reduce(
      (acc, v) => acc + v,
      0
    );
    const editando = editandoNormalizacao === produto.id;

    return (
      <tr key={produto.id} className="border-b border-border hover:bg-surface-2">
        <td className="px-4 py-2 text-xs font-medium">
          {editando ? (
            <Input
              value={valorNormalizacao}
              onChange={(e) => setValorNormalizacao(e.target.value)}
              className="h-7 text-xs"
              autoFocus
            />
          ) : (
            produto.descricao
          )}
        </td>
        <td className="px-2 py-2 text-xs text-center">
          <Badge variant="outline" className="text-[10px]">{produto.origem}</Badge>
        </td>
        {meses.map((_, idx) => {
          const mesNum = idx + 1;
          const valor = produto.valoresPorMes?.[mesNum] || 0;
          const isMesAtual = idx === mesAtual - 1;
          return (
            <td key={idx} className={`px-2 py-2 text-[9px] lg:text-[10px] text-center min-w-[60px] sm:min-w-0 ${isMesAtual ? 'bg-red-200 text-white' : ''}`}>
              {hideValues ? '••••' : formatValor(valor)}
            </td>
          );
        })}
        <td className="px-2 py-2 text-xs text-center font-semibold">
          {hideValues ? '••••' : formatValor(total)}
        </td>
        <td className="px-2 py-2 text-center">
          {editando ? (
            <div className="flex items-center justify-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => confirmarNormalizacao(produto)}
                disabled={salvandoNormalizacao || !valorNormalizacao.trim()}
                className="h-7 w-7 text-success hover:bg-green-50"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={cancelarNormalizacao}
                disabled={salvandoNormalizacao}
                className="h-7 w-7 text-muted-foreground hover:bg-surface-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => iniciarNormalizacao(produto)}
              className="rounded-lg border-border hover:bg-surface-2 text-[10px] h-7 px-1"
            >
              Normalizar
            </Button>
          )}
        </td>
      </tr>
    );
  };

  const iniciarNormalizacao = (produto: ProdutoInsumo) => {
    setEditandoNormalizacao(produto.id);
    setValorNormalizacao(limparTexto(produto.descricao) || produto.descricao);
  };

  const cancelarNormalizacao = () => {
    setEditandoNormalizacao(null);
    setValorNormalizacao('');
  };

  const confirmarNormalizacao = async (produto: ProdutoInsumo) => {
    const nome = valorNormalizacao.trim();
    if (!nome) return;
    setSalvandoNormalizacao(true);
    try {
      const response = await fetch(`/api/produtos/${produto.id}/normalizacao`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomeNormalizado: nome,
          marca: null,
          categoriaSugestao: null,
          unidadeMedida: null,
        }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Falha ao normalizar');
      setEditandoNormalizacao(null);
      setValorNormalizacao('');
      carregarDados();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao normalizar produto');
    } finally {
      setSalvandoNormalizacao(false);
    }
  };

  // Exportar para CSV
  const exportCSV = () => {
    const headers = ['Conta', 'Previsão', ...meses, 'A.V.%', 'A.H.%'];
    const csvContent = [
      headers.join(','),
      ...dreData.map((item) => {
        const valores = [
          `"${item.nome}"`,
          formatCurrency(item.previsao),
          ...meses.map((mes) => {
            const key = mes.substring(0, 3).toLowerCase();
            const mesKey = key === 'jan' ? 'janeiro' : key === 'fev' ? 'fevereiro' : key === 'mar' ? 'marco' : key === 'abr' ? 'abril' : key === 'mai' ? 'maio' : key === 'jun' ? 'junho' : key === 'jul' ? 'julho' : key === 'ago' ? 'agosto' : key === 'set' ? 'setembro' : key === 'out' ? 'outubro' : key === 'nov' ? 'novembro' : 'dezembro';
            return formatCurrency(item.meses[mesKey as keyof DreMeses] || 0);
          }),
          `${item.av}%`,
          `${item.ah}%`,
        ];
        return valores.join(',');
      }),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', `DRE_${anoAtual}.csv`);
    link.click();
  };

  // Salvar nova categoria
  const salvarCategoria = async () => {
    if (!novaCat.nome.trim()) return;

    try {
      const response = await fetch('/api/categorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigo: novaCat.codigo || `Nova-${Date.now()}`,
          nome: novaCat.nome,
          nivel: novaCat.nivel,
          tipo: novaCat.tipo,
          isHeader: novaCat.isHeader,
        }),
      });

      if (response.ok) {
        alert('Categoria adicionada com sucesso!');
        setShowModal(false);
        setNovaCat({ nome: '', nivel: 1, tipo: 'despesa', isHeader: false, parentId: undefined });
        // Recarregar dados para refletir a nova categoria
        carregarDados();
      } else {
        alert('Erro ao salvar categoria');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao salvar categoria');
    }
  };

  const resetForm = () => {
    setNovaCat({ nome: '', nivel: 1, tipo: 'despesa', isHeader: false, parentId: undefined });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <PageContainer>
        <PageHeader
          title="Fluxo de Caixa / DRE"
          subtitle={`Demonstrativo de Resultados do Exercício (DRE) - ${anoAtual}`}
          backHref="/gerenciamento"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => setHideValues(!hideValues)}
            className="gap-2 rounded-full border-border"
          >
            {hideValues ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {hideValues ? 'Mostrar' : 'Ocultar'}
          </Button>
          <Button
            variant="outline"
            onClick={sincronizarDados}
            className="rounded-full border-border"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Sincronizar
          </Button>
          <Button
            variant="outline"
            onClick={exportCSV}
            className="rounded-full border-border"
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button
            variant="outline"
            onClick={() => { resetForm(); setShowModal(true); }}
            className="rounded-full bg-primary hover:bg-primary/90 text-white px-5"
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Categoria
          </Button>
        </PageHeader>
        {/* Seletor de Ano */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <select
              className="rounded-lg border border-border bg-surface px-4 py-2 text-sm"
              value={anoAtual}
              onChange={(e) => setAnoAtual(parseInt(e.target.value))}
            >
              <option value={2024}>2024</option>
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
            </select>
            <select
              className="rounded-lg border border-border bg-surface px-4 py-2 text-sm"
              value={mesAtual}
              onChange={(e) => setMesAtual(parseInt(e.target.value))}
            >
              {meses.map((m, idx) => (
                <option key={idx} value={idx + 1}>{m}</option>
              ))}
            </select>
            <Badge variant="outline" className="bg-surface-2">
              Ano de Referência
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            Total Previsão: {hideValues ? '••••••••' : formatCurrency(totaisAno.previsao)}
          </div>
        </div>

        {/* Cards de Resumo Anual */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card className="relative overflow-hidden bg-gradient-to-r from-success to-success/80 text-white h-full min-h-[92px] sm:min-h-[105px]">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] sm:text-sm font-medium opacity-90 leading-tight">Previsão Anual</p>
                <Target className="h-4 w-4 sm:h-5 sm:w-5 opacity-80" />
              </div>
              <div className="mt-1 text-sm sm:text-xl font-bold leading-tight">
                {hideValues ? '••••••••' : formatCurrency(totaisAno.previsao)}
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-r from-info to-info/80 text-white h-full min-h-[92px] sm:min-h-[105px]">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] sm:text-sm font-medium opacity-90 leading-tight">Realizado Anual</p>
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 opacity-80" />
              </div>
              <div className="mt-1 text-sm sm:text-xl font-bold leading-tight">
                {hideValues ? '••••••••' : formatCurrency(totaisAno.realizado)}
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-r from-primary/80 to-primary/70 text-white h-full min-h-[92px] sm:min-h-[105px]">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] sm:text-sm font-medium opacity-90 leading-tight">Diferença</p>
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 opacity-80" />
              </div>
              <div className="mt-1 text-sm sm:text-xl font-bold leading-tight">
                {hideValues ? '••••••••' : formatCurrency(totaisAno.realizado - totaisAno.previsao)}
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-r from-warning to-warning/80 text-white h-full min-h-[92px] sm:min-h-[105px]">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] sm:text-sm font-medium opacity-90 leading-tight">Acurácia</p>
                <Percent className="h-4 w-4 sm:h-5 sm:w-5 opacity-80" />
              </div>
              <div className="mt-1 text-sm sm:text-xl font-bold leading-tight">
                {hideValues ? '••••••••' : formatPercentage(totaisAno.previsao > 0 ? (totaisAno.realizado / totaisAno.previsao) * 100 : 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela DRE Interativa - Nova estrutura */}
        <div className="bg-surface rounded-2xl shadow-sm overflow-hidden mb-6">
          <div className="bg-surface-150 p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-white">Demonstrativo de Resultados - {anoAtual}</h3>
              </div>
              <div className="text-xs text-muted-foreground">
                <Filter className="h-4 w-4 inline mr-1" />
                <span>Filtros: Ano {anoAtual}</span>
              </div>
            </div>
          </div>

          <ScrollArea className="h-[700px]">
            <table className="w-full table-fixed text-xs min-w-[820px] sm:min-w-0">
              <thead className="border-success/30 border-b border-border sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-white uppercase w-[13%]">DESPESAS</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-white uppercase w-[8%]">PREVISÃO</th>
                  {meses.map((mes, idx) => (
                    <th key={idx} className={`px-2 py-3 text-center text-xs font-bold text-white uppercase ${idx === mesAtual - 1 ? 'bg-red-200' : ''}`}>
                      {mes.substring(0, 3)}
                    </th>
                  ))}
                  <th className="px-2 py-3 text-center text-xs font-bold text-white uppercase w-[5%]">A.V.%</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-white uppercase w-[5%]">A.H.%</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={16} className="py-12 text-center">
                      <div className="flex justify-center items-center gap-2">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        <span className="text-sm text-muted-foreground">Carregando DRE...</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  dreData
                    .filter((item) => !item.id.startsWith('produto-'))
                    .map((item) => {
                    const isHeader = item.nivel === 0 && (item.tipo === 'receita' || item.tipo === 'despesa');
                    const isCategoryHeader = item.isHeader === true;
                    const isCalcRow = item.isCalcRow === true;
                    const isSubtotal = item.isSubtotal;
                    const isTotal = item.tipo === 'total';

                    // Cores baseadas no tipo
                    const rowClass = isTotal
                      ? 'bg-gray-900 text-white border-b border-border'
                      : isCalcRow
                        ? 'bg-yellow-100 border-b border-border hover:bg-yellow-200'
                        : isSubtotal
                          ? 'bg-info/5 font-semibold border-b border-border hover:bg-info/10'
                          : isHeader
                            ? item.tipo === 'receita'
                              ? 'border-success/30 border-b border-border hover:bg-emerald-300'
                              : 'bg-info/20 border-b border-border hover:bg-blue-300'
                            : item.tipo === 'receita'
                              ? 'bg-green-50/50 border-b border-border hover:bg-surface-2'
                              : item.tipo === 'despesa'
                                ? 'bg-destructive/5/50 border-b border-border hover:bg-surface-2'
                                : 'border-b border-border hover:bg-surface-2';

                    // Handler para edição
                    const handleDoubleClick = (id: string) => {
                      setEditing({ itemId: id, field: 'previsao', value: item.previsao });
                    };

                    const handleSave = async () => {
                      if (!editing) return;
                      const codigo = editing.itemId;
                      const valor = editing.value;
                      try {
                        const res = await fetch('/api/fluxo-caixa/dre-previsao', {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ ano: anoAtual, codigo, valor }),
                        });
                        const data = await res.json();
                        if (!data.success) throw new Error(data.error || 'Falha ao salvar');
                        // Atualiza localmente a previsão editada
                        setDREData((prev) =>
                          prev.map((it) =>
                            it.id === codigo ? { ...it, previsao: valor } : it
                          )
                        );
                      } catch (error) {
                        alert(
                          error instanceof Error
                            ? error.message
                            : 'Erro ao salvar previsão'
                        );
                      } finally {
                        setEditing(null);
                      }
                    };

                    return (
                      <tr key={item.id} className={`${rowClass} transition-colors cursor-pointer`}>
                        <td className="px-4 py-2 text-xs">
                          <span className={isHeader || isCategoryHeader || isSubtotal ? 'font-bold' : 'font-medium'}>
                            {item.nome}
                          </span>
                        </td>
                        <td className={`px-2 py-2 text-xs text-center ${isCalcRow ? 'font-semibold' : ''}`}>
                          {editing?.itemId === item.id ? (
                            <Input
                              type="number"
                              value={editing.value}
                              onChange={(e) => setEditing({ ...editing, value: Number(e.target.value) })}
                              onBlur={handleSave}
                              className="w-20 h-6 text-center"
                              autoFocus
                            />
                          ) : (
                            <span
                              onDoubleClick={() => handleDoubleClick(item.id)}
                              className={`cursor-pointer hover:bg-surface-2/50 rounded px-1 ${isCalcRow ? 'font-semibold' : ''}`}
                            >
                              {formatValor(item.previsao)}
                            </span>
                          )}
                        </td>
                        {meses.map((_, idx) => {
                          const mesKey = idx === 0 ? 'janeiro' :
                            idx === 1 ? 'fevereiro' :
                              idx === 2 ? 'marco' :
                                idx === 3 ? 'abril' :
                                  idx === 4 ? 'maio' :
                                    idx === 5 ? 'junho' :
                                      idx === 6 ? 'julho' :
                                        idx === 7 ? 'agosto' :
                                          idx === 8 ? 'setembro' :
                                            idx === 9 ? 'outubro' :
                                              idx === 10 ? 'novembro' : 'dezembro';

                          const valor = item.meses[mesKey as keyof DreMeses] || 0;
                          const isMesAtual = idx === mesAtual - 1;

                          return (
                            <td key={idx} className={`px-2 py-2 text-[9px] lg:text-[10px] text-center min-w-[60px] sm:min-w-0 ${isMesAtual ? 'bg-red-200 text-white' : ''} ${isCalcRow ? 'font-semibold' : ''}`}>
                              {hideValues ? (
                                <span>••••••</span>
                              ) : isTotal ? (
                                <span className={`font-bold ${isMesAtual ? 'text-white' : 'text-white'}`}>{formatValor(valor)}</span>
                              ) : (
                                formatValor(valor)
                              )}
                            </td>
                          );
                        })}
                        <td className="px-2 py-2 text-xs text-center">
                          {hideValues ? '••••' : `${item.av.toFixed(2)}%`}
                        </td>
                        <td className="px-2 py-2 text-xs text-center">
                          {hideValues ? '••••' : `${item.ah.toFixed(2)}%`}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </ScrollArea>
        </div>

        {/* Lista de Produtos/Insumos agrupados por nome normalizado */}
        <div className="bg-surface rounded-2xl shadow-sm overflow-hidden mb-6">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-white">Produtos / Insumos Agrupados - {anoAtual}</h3>
              </div>
              <div className="text-xs text-muted-foreground">
                <Filter className="h-4 w-4 inline mr-1" />
                <span>
                  {insumosAgrupados.length} agrupados · {insumosNaoAgrupados.length} não agrupados
                </span>
              </div>
            </div>
          </div>

          <ScrollArea className="h-[500px]">
            <table className="w-full table-fixed text-xs min-w-[900px] sm:min-w-0">
              <thead className="bg-info/20 border-b border-border sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase w-[13%]">PRODUTO / INSUMO</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-white uppercase w-[6%]">ORIGEM</th>
                  {meses.map((mes, idx) => (
                    <th key={idx} className={`px-2 py-3 text-center text-xs font-bold text-white uppercase min-w-[60px] sm:min-w-0 ${idx === mesAtual - 1 ? 'bg-red-200' : ''}`}>
                      {mes.substring(0, 3)}
                    </th>
                  ))}
                  <th className="px-2 py-3 text-center text-xs font-bold text-white uppercase w-[8%]">TOTAL</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-white uppercase w-[7%]">AÇÃO</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={16} className="py-12 text-center">
                      <div className="flex justify-center items-center gap-2">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        <span className="text-sm text-muted-foreground">Carregando...</span>
                      </div>
                    </td>
                  </tr>
                ) : produtosPorMes.length === 0 ? (
                  <tr>
                    <td colSpan={16} className="py-10 text-center text-sm text-muted-foreground">
                      Nenhum produto/insumo encontrado para {anoAtual}.
                    </td>
                  </tr>
                ) : (
                  <>
                    {insumosAgrupados.map(renderLinhaInsumo)}
                    {insumosNaoAgrupados.length > 0 && (
                      <tr>
                        <td colSpan={16} className="bg-warning/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-amber-800">
                          Não agrupados ({insumosNaoAgrupados.length})
                        </td>
                      </tr>
                    )}
                    {insumosNaoAgrupados.map(renderLinhaInsumo)}
                  </>
                )}
              </tbody>
            </table>
          </ScrollArea>
        </div>

        {/* Legenda */}
        <div className="mt-4 rounded-xl bg-info/5 p-4 border border-info/30">
          <p className="text-sm font-medium text-blue-800">📊 Como ler o DRE:</p>
          <div className="mt-2 grid gap-2 text-xs text-info sm:grid-cols-3">
            <div>
              <span className="font-semibold">Previsão:</span>
              <span> Valores planejados para o mês</span>
            </div>
            <div>
              <span className="font-semibold">Realizado:</span>
              <span> Valores efetivamente movimentados</span>
            </div>
            <div>
              <span className="font-semibold">A.V.:</span>
              <span> Análise Vertical (% do total do ano)</span>
            </div>
          </div>
        </div>

        {/* Modal Adicionar Categoria - Mesmo layout do Livro Diário */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="max-w-xl bg-surface rounded-2xl p-0 border-none shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header fixo */}
            <div className="sticky top-0 z-10 bg-surface px-6 py-5 border-b border-border rounded-t-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-white">
                  Adicionar Nova Categoria
                </DialogTitle>
              </DialogHeader>
            </div>

            {/* Conteúdo rolável */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nome da Categoria *</Label>
                  <Input
                    value={novaCat.nome}
                    onChange={(e) => setNovaCat({ ...novaCat, nome: e.target.value })}
                    placeholder="Digite o nome da categoria..."
                    className="rounded-lg border-border focus:ring-primary focus:border-primary"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tipo *</Label>
                  <div className="relative">
                    <select
                      className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                      value={novaCat.tipo}
                      onChange={(e) => setNovaCat({ ...novaCat, tipo: e.target.value as 'receita' | 'despesa' })}
                      required
                    >
                      <option value="receita">Receita</option>
                      <option value="despesa">Despesa</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Categoria Pai</Label>
                  <div className="relative">
                    <select
                      className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                      value={novaCat.parentId || ''}
                      onChange={(e) => setNovaCat({ ...novaCat, parentId: e.target.value || undefined })}
                    >
                      <option value="">Nenhuma (categoria principal)</option>
                      {dreData
                        .filter(item => item.nivel === 0 || item.isHeader)
                        .map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.nome}
                          </option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nível *</Label>
                  <div className="relative">
                    <select
                      className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                      value={novaCat.nivel}
                      onChange={(e) => setNovaCat({ ...novaCat, nivel: parseInt(e.target.value) })}
                      required
                    >
                      <option value={0}>Nível 0 (Header)</option>
                      <option value={1}>Nível 1 (Categoria)</option>
                      <option value={2}>Nível 2 (Sub-Categoria)</option>
                      <option value={3}>Nível 3 (Item)</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer fixo */}
            <div className="sticky bottom-0 z-10 bg-surface px-6 py-4 border-t border-border rounded-b-2xl">
              <DialogFooter className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-lg border-border hover:bg-surface-2"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={salvarCategoria}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-lg"
                >
                  Adicionar Categoria
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </PageContainer>
    </div>
  );
}