"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import {
  Search,
  LayoutDashboard,
  TrendingUp,
  ShoppingBag,
  Calculator,
  Receipt,
  Ticket,
  CreditCard,
  Store,
  Plus,
  CornerDownLeft,
  Loader2,
} from "lucide-react"
import { apiFetch } from "@/lib/api-client"
import { useDebounce } from "@/hooks/useDebounce"
import { cn } from "@/lib/utils"

type SearchResult = {
  id: string
  tipo: "FICHA" | "PRODUTO" | "LANCAMENTO"
  titulo: string
  subtitulo: string
  href: string
}

type Command = {
  id: string
  titulo: string
  subtitulo: string
  href: string
  grupo: string
  icon: React.ElementType
}

const NAV_COMMANDS: Command[] = [
  { id: "nav-dashboard", titulo: "Dashboard", subtitulo: "Visão geral do negócio", href: "/", grupo: "Navegação", icon: LayoutDashboard },
  { id: "nav-planejamento", titulo: "Planejamento", subtitulo: "Metas e indicadores", href: "/planejamento", grupo: "Navegação", icon: TrendingUp },
  { id: "nav-nfe", titulo: "Registros NFEs", subtitulo: "Notas e produtos", href: "/nfe", grupo: "Navegação", icon: ShoppingBag },
  { id: "nav-fichas", titulo: "Fichas Técnicas", subtitulo: "Custos e margens", href: "/fichas-tecnicas", grupo: "Navegação", icon: Calculator },
  { id: "nav-livro", titulo: "Livro Diário", subtitulo: "Lançamentos financeiros", href: "/livro-diario", grupo: "Navegação", icon: Receipt },
  { id: "nav-fluxo", titulo: "Fluxo de Caixa / DRE", subtitulo: "Resultado do período", href: "/fluxo-caixa", grupo: "Navegação", icon: Ticket },
  { id: "nav-contas", titulo: "Contas bancárias", subtitulo: "Saldos e transferências", href: "/contas-bancarias", grupo: "Navegação", icon: CreditCard },
  { id: "nav-caixa", titulo: "Abrir/Fechar Caixa", subtitulo: "Operação diária", href: "/caixa", grupo: "Navegação", icon: CreditCard },
  { id: "nav-fechamento", titulo: "Fechamento Mensal", subtitulo: "Consolidação do mês", href: "/fechamento-mensal", grupo: "Navegação", icon: CreditCard },
  { id: "nav-loja", titulo: "Minha loja", subtitulo: "Dados da empresa", href: "/config/loja", grupo: "Navegação", icon: Store },
]

const ACTION_COMMANDS: Command[] = [
  { id: "act-ficha", titulo: "Nova ficha técnica", subtitulo: "Cadastrar receita e custos", href: "/fichas-tecnicas/nova", grupo: "Ações rápidas", icon: Plus },
  { id: "act-conta", titulo: "Nova conta bancária", subtitulo: "Adicionar conta financeira", href: "/contas-bancarias/nova", grupo: "Ações rápidas", icon: Plus },
  { id: "act-nfe", titulo: "Lançar NFE", subtitulo: "Importar nota fiscal", href: "/nfe/lancamento", grupo: "Ações rápidas", icon: Plus },
  { id: "act-produto", titulo: "Novo produto", subtitulo: "Cadastrar insumo", href: "/nfe/produtos/novo", grupo: "Ações rápidas", icon: Plus },
]

const TIPO_LABEL: Record<SearchResult["tipo"], string> = {
  FICHA: "Fichas técnicas",
  PRODUTO: "Produtos",
  LANCAMENTO: "Livro diário",
}

const TIPO_ICON: Record<SearchResult["tipo"], React.ElementType> = {
  FICHA: Calculator,
  PRODUTO: ShoppingBag,
  LANCAMENTO: Receipt,
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
}

export function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const debounced = useDebounce(query, 250)

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setOpen((prev) => !prev)
      }
      if (event.key === "Escape") setOpen(false)
    }
    const openHandler = () => setOpen(true)
    window.addEventListener("keydown", handler)
    window.addEventListener("open-command-palette", openHandler)
    return () => {
      window.removeEventListener("keydown", handler)
      window.removeEventListener("open-command-palette", openHandler)
    }
  }, [])

  useEffect(() => {
    if (open) {
      setQuery("")
      setActiveIndex(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  const { data: results = [], isFetching } = useQuery({
    queryKey: ["command-search", debounced],
    queryFn: () =>
      apiFetch<{ data: SearchResult[] }>(
        `/api/search?q=${encodeURIComponent(debounced)}`
      ).then((res) => res.data),
    enabled: open && debounced.trim().length >= 2,
    staleTime: 30_000,
  })

  const items = useMemo(() => {
    const term = normalize(query.trim())
    const statics = [...ACTION_COMMANDS, ...NAV_COMMANDS].filter((cmd) =>
      term ? normalize(`${cmd.titulo} ${cmd.subtitulo}`).includes(term) : true
    )

    const dynamic: Command[] = results.map((res) => ({
      id: res.id,
      titulo: res.titulo,
      subtitulo: res.subtitulo,
      href: res.href,
      grupo: TIPO_LABEL[res.tipo],
      icon: TIPO_ICON[res.tipo],
    }))

    return [...statics, ...dynamic]
  }, [query, results])

  useEffect(() => {
    setActiveIndex(0)
  }, [query, results])

  const select = (item: Command) => {
    setOpen(false)
    router.push(item.href)
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      setActiveIndex((i) => (items.length ? (i + 1) % items.length : 0))
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      setActiveIndex((i) => (items.length ? (i - 1 + items.length) % items.length : 0))
    } else if (event.key === "Enter") {
      event.preventDefault()
      const item = items[activeIndex]
      if (item) select(item)
    }
  }

  useEffect(() => {
    const node = listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
    node?.scrollIntoView({ block: "nearest" })
  }, [activeIndex])

  if (!open) return null

  let renderedGroup: string | null = null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/70 p-4 pt-[12vh] backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Busca global"
      >
        <div className="flex items-center gap-3 border-b border-border px-4">
          {isFetching ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
          ) : (
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Buscar páginas, fichas, produtos, lançamentos..."
            className="h-14 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded-md border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
            ESC
          </kbd>
        </div>

        <div ref={listRef} className="max-h-[55vh] overflow-y-auto p-2">
          {items.length === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">
              Nenhum resultado para “{query}”.
            </p>
          )}

          {items.map((item, index) => {
            const showGroup = item.grupo !== renderedGroup
            renderedGroup = item.grupo
            const active = index === activeIndex
            return (
              <div key={item.id}>
                {showGroup && (
                  <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {item.grupo}
                  </p>
                )}
                <button
                  data-index={index}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => select(item)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                    active ? "bg-surface text-white" : "text-muted-foreground hover:bg-surface/60"
                  )}
                >
                  <item.icon
                    className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-muted-foreground")}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-white">{item.titulo}</span>
                    <span className="block truncate text-xs text-muted-foreground">{item.subtitulo}</span>
                  </span>
                  {active && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                </button>
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-between border-t border-border px-4 py-2 text-[10px] text-muted-foreground">
          <span>↑ ↓ navegar · Enter abrir</span>
          <span>Ctrl / ⌘ + K</span>
        </div>
      </div>
    </div>
  )
}
