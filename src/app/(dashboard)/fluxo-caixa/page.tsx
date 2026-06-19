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
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { DreItem, DreResponse, DreMeses } from '@/types/dre';
import { Input } from '@/components/ui/input';

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
  valor: number;
  dataCompra: string;
  origem: string;
  valoresPorMes: Record<number, number>;
}

// Categorias do DRE (simplificadas - apenas CUSTOS COM PRODUTOS/INSUMOS)
const CATEGORIAS_DESPESAS = [
  // RECEITA
  { codigo: '3.1', nome: 'RECEITA / FATURAMENTO', grupo: 'RECEITA', isHeader: true, nivel: 0 },
  { codigo: '3.1', nome: 'Receita de Vendas', grupo: 'RECEITA', nivel: 1 },
  { codigo: '3.1.1', nome: 'Receita com Cash - Diaria', grupo: 'RECEITA_DETALHE', nivel: 2 },
  { codigo: '3.1.2', nome: 'Receita com Cartão (Caixa)', grupo: 'RECEITA_DETALHE', nivel: 2 },
  { codigo: '3.1.3', nome: 'Receita Ifood', grupo: 'RECEITA_DETALHE', nivel: 2 },
  { codigo: '3.1.4', nome: 'Receita com Cartão - (Infinity Emp)', grupo: 'RECEITA_DETALHE', nivel: 2 },
  { codigo: '3.1.5', nome: 'Receita com Cartão - (Infinity Sil)', grupo: 'RECEITA_DETALHE', nivel: 2 },
  { codigo: '3.1.10', nome: 'Acerto', grupo: 'RECEITA_DETALHE', nivel: 2 },

  // CUSTOS VARIÁVEIS
  { codigo: '4.1', nome: 'DESPESAS/CUSTOS VARIÁVEIS', grupo: 'DESPESA', isHeader: true, nivel: 0 },
  { codigo: '4.1.1', nome: 'Simples Federal', grupo: 'DESPESA_DETALHE', nivel: 1 },
  { codigo: '4.1.2', nome: 'Mercantil', grupo: 'DESPESA_DETALHE', nivel: 1 },
  { codigo: '4.1.3', nome: 'IPTU', grupo: 'DESPESA_DETALHE', nivel: 1 },
  { codigo: '4.1.4', nome: 'FGTS', grupo: 'DESPESA_DETALHE', nivel: 1 },
  { codigo: '4.1.5', nome: 'INSS', grupo: 'DESPESA_DETALHE', nivel: 1 },
  { codigo: '4.1.6', nome: 'Parcelamento Imposto', grupo: 'DESPESA_DETALHE', nivel: 1 },

  // INSUMOS (única categoria de produtos)
  { codigo: '4.2', nome: 'CUSTOS COM PRODUTOS/INSUMOS', grupo: 'DESPESA', isHeader: true, nivel: 0 },

  { codigo: 'ACERTO_DESP', nome: 'ACERTO DESPESAS', grupo: 'DESPESA', isHeader: true, nivel: 0 },

  // DESPESAS FIXAS
  { codigo: '5.1', nome: 'DESPESAS FIXAS', grupo: 'DESPESA_FIXA', isHeader: true, nivel: 0 },
  { codigo: '5.1.1', nome: 'Tarifas Bancárias', grupo: 'DESPESA_FIXA_DETALHE', nivel: 1 },
  { codigo: '5.1.2', nome: 'Aluguel e tarifas Operadora Cartão', grupo: 'DESPESA_FIXA_DETALHE', nivel: 1 },
  { codigo: '5.1.5', nome: 'Emprestimos', grupo: 'DESPESA_FIXA_DETALHE', nivel: 1 },
  { codigo: '5.1.6', nome: 'Imposto Bombeiros', grupo: 'DESPESA_FIXA_DETALHE', nivel: 1 },
  { codigo: '5.2', nome: 'Despesas Administrativas', grupo: 'DESPESA_FIXA', isHeader: true, nivel: 0 },
  { codigo: '5.2.1', nome: 'Telefones', grupo: 'DESPESA_FIXA_DETALHE', nivel: 1 },
  { codigo: '5.2.2', nome: 'Celular', grupo: 'DESPESA_FIXA_DETALHE', nivel: 1 },
  { codigo: '5.2.3', nome: 'Energia Elétrica (CELPE)', grupo: 'DESPESA_FIXA_DETALHE', nivel: 1 },
  { codigo: '5.2.4', nome: 'Aluguel', grupo: 'DESPESA_FIXA_DETALHE', nivel: 1 },
  { codigo: '5.2.5', nome: 'Água(COMPESA)', grupo: 'DESPESA_FIXA_DETALHE', nivel: 1 },
  { codigo: '5.2.6', nome: 'Gasolina / Estacionamento / Táxi', grupo: 'DESPESA_FIXA_DETALHE', nivel: 1 },
  { codigo: '5.2.7', nome: 'Taxa Antecipação Ifood', grupo: 'DESPESA_FIXA_DETALHE', nivel: 1 },
  { codigo: '5.2.9', nome: 'Carro', grupo: 'DESPESA_FIXA_DETALHE', nivel: 1 },
  { codigo: '5.2.10', nome: 'Outras despesas administrativas', grupo: 'DESPESA_FIXA_DETALHE', nivel: 1 },
  { codigo: '5.2.11', nome: 'Internet', grupo: 'DESPESA_FIXA_DETALHE', nivel: 1 },
  { codigo: '5.2.12', nome: 'IPVA', grupo: 'DESPESA_FIXA_DETALHE', nivel: 1 },
  { codigo: '5.2.13', nome: 'Botijão de gás', grupo: 'DESPESA_FIXA_DETALHE', nivel: 1 },
  { codigo: '5.3', nome: 'Despesas com Pessoal', grupo: 'DESPESA_FIXA', isHeader: true, nivel: 0 },
  { codigo: '5.3.1', nome: 'Salário de Funcionários', grupo: 'DESPESA_FIXA_DETALHE', nivel: 1 },
  { codigo: '5.3.2', nome: 'Bolsa de Estágio', grupo: 'DESPESA_FIXA_DETALHE', nivel: 1 },
  { codigo: '5.3.3', nome: 'Vale Transporte (Passagem)', grupo: 'DESPESA_FIXA_DETALHE', nivel: 1 },
  { codigo: '5.3.4', nome: 'Rescisão', grupo: 'DESPESA_FIXA_DETALHE', nivel: 1 },
  { codigo: '5.3.5', nome: 'Pro-Labores', grupo: 'DESPESA_FIXA_DETALHE', nivel: 1 },
  { codigo: '5.3.6', nome: 'Adiantamento Salarios', grupo: 'DESPESA_FIXA_DETALHE', nivel: 1 },
  { codigo: '5.3.7', nome: 'Outras despesas com pessoal', grupo: 'DESPESA_FIXA_DETALHE', nivel: 1 },
  { codigo: '5.3.8', nome: 'Ferias Funcionarios', grupo: 'DESPESA_FIXA_DETALHE', nivel: 1 },
  { codigo: '5.4', nome: 'Despesas com Serviços de Terceiros', grupo: 'DESPESA_FIXA', isHeader: true, nivel: 0 },
  { codigo: '5.4.1', nome: 'Contador', grupo: 'DESPESA_FIXA_DETALHE', nivel: 1 },
  { codigo: '5.4.2', nome: 'TI', grupo: 'DESPESA_FIXA_DETALHE', nivel: 1 },
  { codigo: '5.4.3', nome: 'Outras Despesas', grupo: 'DESPESA_FIXA_DETALHE', nivel: 1 },
  { codigo: '5.5', nome: 'Despesas com Materiais e Equipamentos', grupo: 'DESPESA_FIXA', isHeader: true, nivel: 0 },
  { codigo: '5.5.1', nome: 'Manutenção Equipamentos Informática', grupo: 'DESPESA_FIXA_DETALHE', nivel: 1 },
  { codigo: '5.5.2', nome: 'Softwares', grupo: 'DESPESA_FIXA_DETALHE', nivel: 1 },
  { codigo: '5.5.3', nome: 'Materiais de Expediente/Manutenção/Limpeza', grupo: 'DESPESA_FIXA_DETALHE', nivel: 1 },
  { codigo: '5.5.4', nome: 'Manutenção Veículo', grupo: 'DESPESA_FIXA_DETALHE', nivel: 1 },
  { codigo: '5.6', nome: 'OUTROS FORNECEDORES', grupo: 'DESPESA_FIXA', isHeader: true, nivel: 0 },
  { codigo: '5.6.1', nome: 'Karne Keijo', grupo: 'DESPESA_FIXA_DETALHE', nivel: 1 },
  { codigo: '5.6.2', nome: 'Natto', grupo: 'DESPESA_FIXA_DETALHE', nivel: 1 },
  { codigo: '5.6.3', nome: 'Coca-Cola', grupo: 'DESPESA_FIXA_DETALHE', nivel: 1 },

  { codigo: 'LUCRO_ANTE', nome: 'LUCRO OPERACIONAL ANTES DOS INVESTIMENTOS', grupo: 'CALCULO', isHeader: true, nivel: 0 },

  { codigo: '6.1', nome: 'INVESTIMENTOS', grupo: 'INVESTIMENTO', isHeader: true, nivel: 0 },
  { codigo: '6.1.1', nome: 'Investimentos em Marketing', grupo: 'INVESTIMENTO_DETALHE', nivel: 1 },
  { codigo: '6.2', nome: 'Investimentos em Bens Materiais', grupo: 'INVESTIMENTO_DETALHE', nivel: 1 },
  { codigo: '6.3', nome: 'Investimentos em Desenvolvimento Empresarial', grupo: 'INVESTIMENTO_DETALHE', nivel: 1 },
  { codigo: '6.4', nome: 'Outros', grupo: 'INVESTIMENTO_DETALHE', nivel: 1 },

  { codigo: 'DESP_ANT', nome: 'DESPESA OPERACIONAL TOTAL', grupo: 'CALCULO', isHeader: true, nivel: 0 },

  { codigo: 'LUCRO_OP', nome: 'LUCRO OPERACIONAL', grupo: 'CALCULO', isHeader: true, nivel: 0 },

  { codigo: '7.1', nome: 'ENTRADAS E SAÍDAS NÃO OPERACIONAIS', grupo: 'NAO_OPERACIONAL', isHeader: true, nivel: 0 },
  { codigo: '7.2', nome: 'Saídas não operacionais', grupo: 'NAO_OPERACIONAL_DETALHE', nivel: 1 },

  { codigo: 'RESULTADO', nome: 'RESULTADO LÍQUIDO', grupo: 'CALCULO', isHeader: true, nivel: 0 },
];

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

  const [meta, setMeta] = useState<MetaMensal | null>(null);
  const [dreMensal, setDreMensal] = useState<DreMensal[]>([]);
  const [totaisAno, setTotaisAno] = useState({
    previsao: 0,
    realizado: 0,
  });
  const [produtosPorMes, setProdutosPorMes] = useState<Record<number, ProdutoInsumo[]>>({});

  useEffect(() => {
    carregarDados();
  }, [anoAtual]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const metaResponse = await fetch(`/api/fluxo-caixa/metas?ano=${anoAtual}&mes=${mesAtual}`);
      const metaData = await metaResponse.json();
      if (metaData.success) {
        setMeta(metaData.data);
      }

      const dreResponse = await fetch(`/api/fluxo-caixa/dre-mensal?ano=${anoAtual}`);
      const dreData = await dreResponse.json();
      if (dreData.success) {
        setDreMensal(dreData.data);
        setTotaisAno(dreData.totaisAno);
        setProdutosPorMes(dreData.produtosPorMes || {});
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados da nova API DRE
  const carregarDRE = async () => {
    try {
      const response = await fetch(`/api/dre?ano=${anoAtual}`);
      const result: DreResponse = await response.json();
      if (result.success) {
        setDREData(result.data);
      }
    } catch (error) {
      console.error('Erro ao carregar DRE:', error);
    }
  };

  useEffect(() => {
    carregarDRE();
  }, [anoAtual]);

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 ml-6 mr-6 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Fluxo de Caixa / DRE</h1>
          <p className="text-sm text-gray-500">
            Demonstrativo de Resultados do Exercício (DRE) - {anoAtual}
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
            {hideValues ? 'Mostrar' : 'Ocultar'}
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
            variant="outline"
            onClick={exportCSV}
            className="rounded-full border-gray-200"
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button
            onClick={() => router.push('/fluxo-caixa/configuracoes')}
            className="bg-[#de4838] hover:bg-[#c73d2e] text-white rounded-full"
          >
            <Settings className="mr-2 h-4 w-4" />
            Configurar Metas
          </Button>
        </div>
      </div>

      <div className="container mx-auto p-6 max-w-7xl">
        {/* Seletor de Ano */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
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
              Ano de Referência
            </Badge>
          </div>
          <div className="text-sm text-gray-500">
            Total Previsão: {hideValues ? '••••••••' : formatCurrency(totaisAno.previsao)}
          </div>
        </div>

        {/* Cards de Resumo Anual */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card className="relative overflow-hidden bg-gradient-to-r from-emerald-500 to-emerald-600 text-white h-full min-h-[132px]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium opacity-90">Previsão Anual</p>
                <Target className="h-5 w-5 opacity-80" />
              </div>
              <div className="mt-2 text-2xl font-bold">
                {hideValues ? '••••••••' : formatCurrency(totaisAno.previsao)}
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-r from-blue-500 to-blue-600 text-white h-full min-h-[132px]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium opacity-90">Realizado Anual</p>
                <BarChart3 className="h-5 w-5 opacity-80" />
              </div>
              <div className="mt-2 text-2xl font-bold">
                {hideValues ? '••••••••' : formatCurrency(totaisAno.realizado)}
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-r from-purple-500 to-purple-600 text-white h-full min-h-[132px]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium opacity-90">Diferença</p>
                <TrendingUp className="h-5 w-5 opacity-80" />
              </div>
              <div className="mt-2 text-2xl font-bold">
                {hideValues ? '••••••••' : formatCurrency(totaisAno.realizado - totaisAno.previsao)}
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-r from-orange-500 to-orange-600 text-white h-full min-h-[132px]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium opacity-90">Acurácia</p>
                <Percent className="h-5 w-5 opacity-80" />
              </div>
              <div className="mt-2 text-2xl font-bold">
                {hideValues ? '••••••••' : formatPercentage(totaisAno.previsao > 0 ? (totaisAno.realizado / totaisAno.previsao) * 100 : 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela DRE Interativa - Nova estrutura */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
          <div className="bg-gray-50 p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[#de4838]" />
                <h3 className="font-semibold text-gray-800">Demonstrativo de Resultados - {anoAtual}</h3>
              </div>
              <div className="text-xs text-gray-500">
                <Filter className="h-4 w-4 inline mr-1" />
                <span>Filtros: Ano {anoAtual}</span>
              </div>
            </div>
          </div>

          <ScrollArea className="h-[700px]">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[280px]">DESPESAS</th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase">PREVISÃO</th>
                  {meses.map((mes, idx) => (
                    <th key={idx} className={`px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase ${idx === mesAtual - 1 ? 'bg-[#de4838]/10 text-[#de4838]' : ''}`}>
                      {mes.substring(0, 3)}
                    </th>
                  ))}
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase">A.V.%</th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase">A.H.%</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={16} className="py-12 text-center">
                      <div className="flex justify-center items-center gap-2">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#de4838] border-t-transparent" />
                        <span className="text-sm text-gray-500">Carregando DRE...</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  dreData.map((item) => {
                    const isHeader = item.nivel === 0 && (item.tipo === 'receita' || item.tipo === 'despesa');
                    const isSubtotal = item.isSubtotal;
                    const isTotal = item.tipo === 'total';

                    // Cores baseadas no tipo
                    const rowClass = isTotal
                      ? 'bg-gray-900 text-white border-b border-gray-200'
                      : isSubtotal
                        ? 'bg-blue-50 font-semibold border-b border-gray-200 hover:bg-blue-100'
                        : item.tipo === 'receita'
                          ? 'bg-green-50/50 border-b border-gray-100 hover:bg-gray-100'
                          : item.tipo === 'despesa'
                            ? 'bg-red-50/50 border-b border-gray-100 hover:bg-gray-100'
                            : 'border-b border-gray-100 hover:bg-gray-100';

                    // Handler para edição
                    const handleDoubleClick = (id: string) => {
                      setEditing({ itemId: id, field: 'previsao', value: item.previsao });
                    };

                    const handleSave = () => {
                      if (!editing) return;
                      // Aqui seria feita a chamada API para salvar
                      setEditing(null);
                    };

                    return (
                      <tr key={item.id} className={`${rowClass} transition-colors cursor-pointer`}>
                        <td className="px-4 py-2 text-sm">
                          <span className={isHeader || isSubtotal ? 'font-semibold' : 'font-medium'}>
                            {item.nome}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-sm text-center">
                          {isTotal ? (
                            <span className="font-bold">R$ 0,00</span>
                          ) : editing?.itemId === item.id ? (
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
                              className="cursor-pointer hover:bg-gray-200/50 rounded px-1"
                            >
                              {formatCurrency(item.previsao)}
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
                            <td key={idx} className={`px-2 py-2 text-sm text-center ${isMesAtual ? 'bg-red-50' : ''}`}>
                              {isTotal ? (
                                <span className="font-bold text-white">R$ 0,00</span>
                              ) : hideValues ? (
                                <span>••••••</span>
                              ) : (
                                formatCurrency(valor)
                              )}
                            </td>
                          );
                        })}
                        <td className="px-2 py-2 text-sm text-center">
                          {isTotal ? '-' : hideValues ? '••••' : `${item.av.toFixed(2)}%`}
                        </td>
                        <td className="px-2 py-2 text-sm text-center">
                          {isTotal ? '-' : hideValues ? '••••' : `${item.ah.toFixed(2)}%`}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </ScrollArea>
        </div>

        {/* Legenda */}
        <div className="mt-4 rounded-xl bg-blue-50 p-4 border border-blue-200">
          <p className="text-sm font-medium text-blue-800">📊 Como ler o DRE:</p>
          <div className="mt-2 grid gap-2 text-xs text-blue-700 sm:grid-cols-3">
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
      </div>
    </div>
  );
}