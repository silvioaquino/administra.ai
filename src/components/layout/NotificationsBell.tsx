"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Bell, AlertTriangle, AlertCircle, Info, CheckCircle2 } from "lucide-react"
import { useAlertas } from "@/hooks/useAlertas"
import type { CategoriaAlerta } from "@/lib/alertas/tipos"
import { cn } from "@/lib/utils"

const SEVERITY = {
  CRITICO: { icon: AlertCircle, className: "text-destructive", label: "Crítico" },
  ATENCAO: { icon: AlertTriangle, className: "text-warning", label: "Atenção" },
  INFO: { icon: Info, className: "text-primary", label: "Info" },
  SUCCESS: { icon: CheckCircle2, className: "text-success", label: "Tudo certo" },
} as const

const CATEGORIA_LABEL: Record<CategoriaAlerta, string> = {
  financeiro: "Financeiro",
  fiscal: "Fiscal",
  estoque: "Estoque",
  operacional: "Operacional",
  produto: "Produtos",
}

const DISMISSED_KEY = "alertas_dispensados"

export function NotificationsBell() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [dismissed, setDismissed] = useState<string[]>([])
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DISMISSED_KEY)
      if (raw) setDismissed(JSON.parse(raw))
    } catch {
      // ignora storage inválido
    }
  }, [])

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const { data: alertas = [] } = useAlertas()

  // O sino mostra apenas alertas acionáveis (sem os de confirmação positiva).
  const visiveis = alertas.filter(a => !dismissed.includes(a.id) && a.severidade !== "SUCCESS")
  const criticos = visiveis.filter(a => a.severidade === "CRITICO").length

  const dispensar = (id: string) => {
    const next = [...dismissed, id]
    setDismissed(next)
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(next))
  }

  const limpar = () => {
    setDismissed([])
    localStorage.removeItem(DISMISSED_KEY)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Notificações"
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-surface hover:text-white"
      >
        <Bell className="h-4 w-4" />
        {visiveis.length > 0 && (
          <span
            className={cn(
              "absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold text-white",
              criticos > 0 ? "bg-destructive" : "bg-primary"
            )}
          >
            {visiveis.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[22rem] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-white">Alertas inteligentes</p>
            {dismissed.length > 0 && (
              <button onClick={limpar} className="text-[11px] text-primary hover:underline">
                Restaurar
              </button>
            )}
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {visiveis.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                <CheckCircle2 className="h-6 w-6 text-success" />
                <p className="text-sm text-muted-foreground">Tudo em ordem por aqui.</p>
              </div>
            ) : (
              visiveis.map((alerta) => {
                const meta = SEVERITY[alerta.severidade]
                return (
                  <div
                    key={alerta.id}
                    className="flex gap-3 border-b border-border/60 px-4 py-3 last:border-0 hover:bg-surface/50"
                  >
                    <meta.icon className={cn("mt-0.5 h-4 w-4 shrink-0", meta.className)} />
                    <div className="min-w-0 flex-1">
                      <button
                        onClick={() => {
                          setOpen(false)
                          if (alerta.href) router.push(alerta.href)
                        }}
                        className="block w-full text-left"
                      >
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          {CATEGORIA_LABEL[alerta.categoria]}
                        </span>
                        <p className="truncate text-sm font-medium text-white">{alerta.titulo}</p>
                        <p className="text-xs text-muted-foreground">{alerta.descricao}</p>
                      </button>
                      <button
                        onClick={() => dispensar(alerta.id)}
                        className="mt-1 text-[10px] text-muted-foreground hover:text-white"
                      >
                        Dispensar
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
