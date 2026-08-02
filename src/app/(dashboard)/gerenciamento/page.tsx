// src/app/(dashboard)/gerenciamento/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  Zap,
  BookOpen,
  Banknote,
  TrendingUp,
  CalendarCheck,
  Filter,
} from "lucide-react"
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { PageContainer } from "@/components/layout/PageContainer"
import { PageHeader } from "@/components/layout/PageHeader"

const quickActions = [
  {
    icon: BookOpen,
    label: "Livro Diário",
    desc: "Movimentações financeiras",
    route: "/livro-diario",
    color: "from-info to-info",
  },
  {
    icon: Banknote,
    label: "Conta Bancária",
    desc: "Contas e transferências",
    route: "/contas-bancarias",
    color: "from-success to-success",
  },
  {
    icon: TrendingUp,
    label: "Fluxo de Caixa",
    desc: "Fluxo de Caixa / DRE",
    route: "/fluxo-caixa",
    color: "from-primary to-primary",
  },
  {
    icon: CalendarCheck,
    label: "Fechamento Mensal",
    desc: "Encerramento do período",
    route: "/fechamento-mensal",
    color: "from-warning to-warning",
  },
]

interface ProdutividadeMes {
  mes: number
  ano: number
  mesNome: string
  faturamento: number
  cmv: number
  taxasCartao: number
  custosVariaveisTotais: number
  funcionarios: number
  produtividade: number
}

export default function GerenciamentoPage() {
  const router = useRouter()
  const anoAtual = new Date().getFullYear()

  const [ano, setAno] = useState(anoAtual)
  const [modo, setModo] = useState<"ano" | "mes" | "periodo">("ano")
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [mesInicio, setMesInicio] = useState(1)
  const [mesFim, setMesFim] = useState(12)
  const [dados, setDados] = useState<ProdutividadeMes[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let ativo = true
    setLoading(true)
    setErro(null)
    fetch(`/api/dashboard/produtividade/mensal?ano=${ano}`)
      .then((r) => r.json())
      .then((json) => {
        if (!ativo) return
        if (json.success) setDados(json.data)
        else setErro("Não foi possível carregar os dados")
      })
      .catch(() => ativo && setErro("Não foi possível carregar os dados"))
      .finally(() => ativo && setLoading(false))
    return () => {
      ativo = false
    }
  }, [ano])

  const dadosFiltrados = dados.filter((d) => {
    if (modo === "mes") return d.mes === mes
    if (modo === "periodo") return d.mes >= Math.min(mesInicio, mesFim) && d.mes <= Math.max(mesInicio, mesFim)
    return true
  })

  const anos = Array.from({ length: 5 }, (_, i) => anoAtual - i)
  const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ]

  const selectClass =
    "rounded-lg border border-border bg-surface px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"

  return (
    <div className="min-h-screen bg-background">
      <PageContainer>
        <PageHeader
          title="Gerenciamento"
          subtitle="Controle financeiro, contas e fechamento do período"
        />

        {/* Ações Rápidas */}
        <div className="mt-8 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Ações Rápidas</h2>
            <Zap className="h-4 w-4 text-white" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action, index) => (
              <div
                key={index}
                className="group relative bg-surface rounded-2xl shadow-sm cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-1 overflow-hidden h-full min-h-[160px] sm:min-h-[180px]"
                onClick={() => router.push(action.route)}
              >
                <div className={`absolute top-0 right-0 h-24 w-24 -translate-y-8 translate-x-8 rounded-full bg-gradient-to-br ${action.color} opacity-10 group-hover:opacity-20 transition-opacity`} />
                <div className="p-3 sm:p-5">
                  <div className={`mb-3 sm:mb-4 inline-flex rounded-xl bg-gradient-to-br ${action.color} p-2.5 sm:p-3 text-white shadow-lg`}>
                    <action.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <h3 className="text-[11px] sm:text-sm font-semibold text-white mb-1 leading-tight">{action.label}</h3>
                  <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">{action.desc}</p>
                  <div className="mt-3 sm:mt-4 flex items-center text-[10px] sm:text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    Acessar
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gráfico de Produtividade */}
        <div className="mt-8 bg-surface rounded-2xl shadow-sm overflow-hidden">
          <div className="border-b border-border p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-white">Produtividade</h2>
                <p className="text-xs text-muted-foreground">
                  Faturamento, custos variáveis e resultado por funcionário
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Filter className="h-4 w-4 text-primary" />

                <select
                  value={modo}
                  onChange={(e) => setModo(e.target.value as "ano" | "mes" | "periodo")}
                  className={selectClass}
                  aria-label="Tipo de filtro"
                >
                  <option value="ano">Ano inteiro</option>
                  <option value="mes">Mês</option>
                  <option value="periodo">Período específico</option>
                </select>

                <select
                  value={ano}
                  onChange={(e) => setAno(Number(e.target.value))}
                  className={selectClass}
                  aria-label="Ano"
                >
                  {anos.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>

                {modo === "mes" && (
                  <select
                    value={mes}
                    onChange={(e) => setMes(Number(e.target.value))}
                    className={selectClass}
                    aria-label="Mês"
                  >
                    {meses.map((m, i) => (
                      <option key={m} value={i + 1}>{m}</option>
                    ))}
                  </select>
                )}

                {modo === "periodo" && (
                  <>
                    <select
                      value={mesInicio}
                      onChange={(e) => setMesInicio(Number(e.target.value))}
                      className={selectClass}
                      aria-label="Mês inicial"
                    >
                      {meses.map((m, i) => (
                        <option key={m} value={i + 1}>{m}</option>
                      ))}
                    </select>
                    <span className="text-xs text-muted-foreground">até</span>
                    <select
                      value={mesFim}
                      onChange={(e) => setMesFim(Number(e.target.value))}
                      className={selectClass}
                      aria-label="Mês final"
                    >
                      {meses.map((m, i) => (
                        <option key={m} value={i + 1}>{m}</option>
                      ))}
                    </select>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="p-5">
            {loading ? (
              <div className="flex h-[360px] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : erro ? (
              <div className="flex h-[360px] items-center justify-center text-sm text-destructive">{erro}</div>
            ) : dadosFiltrados.length === 0 ? (
              <div className="flex h-[360px] items-center justify-center text-sm text-muted-foreground">
                Nenhum dado disponível para o período selecionado.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={380}>
                <ComposedChart data={dadosFiltrados} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="mesNome" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => `R$ ${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }}
                    formatter={((value: unknown, name: unknown) => [
                      `R$ ${Number(value ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                      String(name ?? ""),
                    ]) as never}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="faturamento" name="Faturamento" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cmv" name="CMV (Insumos)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="taxasCartao" name="Taxas Cartão" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  <Line
                    type="monotone"
                    dataKey="produtividade"
                    name="Produtividade"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </PageContainer>
    </div>
  )
}
