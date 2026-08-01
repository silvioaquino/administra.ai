"use client"

import { useEffect, useState } from "react"
import { X, ArrowUpCircle, ArrowDownCircle, Loader2, FileSpreadsheet } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { apiFetch } from "@/lib/api-client"
import { exportDashboardExcel } from "@/lib/export/dashboard-export"

export type DrilldownItem = {
  id: number
  data: string
  descricao: string
  conta: string
  clienteFornecedor: string
  entrada: number
  saida: number
  status: string
}

type Resumo = { totalEntrada: number; totalSaida: number; saldo: number; quantidade: number }

export type DrilldownFilter = {
  titulo: string
  inicio: string
  fim: string
  tipo: "todos" | "receitas" | "despesas"
}

export function DrilldownModal({
  filter,
  onClose,
}: {
  filter: DrilldownFilter | null
  onClose: () => void
}) {
  const [items, setItems] = useState<DrilldownItem[]>([])
  const [resumo, setResumo] = useState<Resumo | null>(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!filter) return
    let cancelled = false
    setLoading(true)
    setErro(null)

    const params = new URLSearchParams({
      inicio: filter.inicio,
      fim: filter.fim,
      tipo: filter.tipo,
    })

    apiFetch<{ data: DrilldownItem[]; resumo: Resumo }>(`/api/dashboard/drilldown?${params}`)
      .then((res) => {
        if (cancelled) return
        setItems(res.data)
        setResumo(res.resumo)
      })
      .catch((error: Error) => {
        if (!cancelled) setErro(error.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [filter])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  if (!filter) return null

  const exportar = () => {
    exportDashboardExcel({
      periodoTexto: filter.titulo,
      stats: {
        totalReceitas: resumo?.totalEntrada ?? 0,
        totalDespesas: resumo?.totalSaida ?? 0,
        saldo: resumo?.saldo ?? 0,
        margem:
          resumo && resumo.totalEntrada > 0 ? (resumo.saldo / resumo.totalEntrada) * 100 : 0,
      },
      chartData: [],
      lancamentos: items,
    })
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-white">{filter.titulo}</h2>
            <p className="text-xs text-muted-foreground">
              {resumo ? `${resumo.quantidade} lançamento(s) no período` : "Carregando lançamentos..."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportar}
              disabled={items.length === 0}
              className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-surface hover:text-white disabled:opacity-40"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Excel
            </button>
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-surface hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {resumo && (
          <div className="grid grid-cols-3 gap-px border-b border-border bg-border">
            <div className="bg-card px-6 py-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Entradas</p>
              <p className="text-sm font-semibold text-success">{formatCurrency(resumo.totalEntrada)}</p>
            </div>
            <div className="bg-card px-6 py-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Saídas</p>
              <p className="text-sm font-semibold text-destructive">{formatCurrency(resumo.totalSaida)}</p>
            </div>
            <div className="bg-card px-6 py-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Saldo</p>
              <p className="text-sm font-semibold text-white">{formatCurrency(resumo.saldo)}</p>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
            </div>
          )}

          {!loading && erro && (
            <p className="py-16 text-center text-sm text-destructive">{erro}</p>
          )}

          {!loading && !erro && items.length === 0 && (
            <p className="py-16 text-center text-sm text-muted-foreground">
              Nenhum lançamento encontrado neste recorte.
            </p>
          )}

          {!loading && items.length > 0 && (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-surface/95 backdrop-blur">
                <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-2 font-medium">Data</th>
                  <th className="px-3 py-2 font-medium">Descrição</th>
                  <th className="px-3 py-2 font-medium">Conta</th>
                  <th className="px-6 py-2 text-right font-medium">Valor</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const entrada = item.entrada > 0
                  return (
                    <tr key={item.id} className="border-t border-border/60 hover:bg-surface/50">
                      <td className="whitespace-nowrap px-6 py-2.5 text-xs text-muted-foreground">
                        {new Date(item.data).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="block text-white">{item.descricao}</span>
                        {item.clienteFornecedor && (
                          <span className="block text-xs text-muted-foreground">
                            {item.clienteFornecedor}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">{item.conta}</td>
                      <td className="whitespace-nowrap px-6 py-2.5 text-right">
                        <span
                          className={`inline-flex items-center gap-1 font-medium ${
                            entrada ? "text-success" : "text-destructive"
                          }`}
                        >
                          {entrada ? (
                            <ArrowUpCircle className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowDownCircle className="h-3.5 w-3.5" />
                          )}
                          {formatCurrency(entrada ? item.entrada : item.saida)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
