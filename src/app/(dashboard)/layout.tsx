// src/app/(dashboard)/layout.tsx
"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useEmpresa } from "@/hooks/useEmpresa"
import {
  Menu,
  X,
  Store,
  CreditCard,
  Shield,
  HelpCircle,
  LogOut,
  LayoutDashboard,
  Calculator,
  Receipt,
  TrendingUp,
  ShoppingBag,
  Ticket,
  Truck,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { CommandPalette } from "@/components/command/CommandPalette"
import { NotificationsBell } from "@/components/layout/NotificationsBell"


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Nome da empresa via cache compartilhado (TanStack Query)
  const { data: empresaData } = useEmpresa(Boolean(session))
  const empresaNome =
    empresaData?.empresa?.nome || session?.user?.establishment || "SeuGerente"


  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/", badge: null },
    { icon: TrendingUp, label: "Planejamento", href: "/planejamento", badge: null },
    { icon: ShoppingBag, label: "Lançamentos", href: "/nfe", badge: null },
    { icon: Calculator, label: "Precificação", href: "/precificacao", badge: null },
    { icon: Receipt, label: "Gerenciamento", href: "/gerenciamento", badge: null },
    { icon: CreditCard, label: "Abrir/Fechar Caixa Diário", href: "/caixa", badge: null },
  ]

  const configItems = [
    { icon: Store, label: "Minha loja", href: "/config/loja", badge: null },
    { icon: Store, label: "Gerenciamento de Planos", href: "/config/planos", badge: null },
  ]

  const isAdmin = session?.user?.role === "ADMIN"
  const adminItems = isAdmin
    ? [{ icon: Shield, label: "Administração", href: "/admin", badge: "Admin" as string | null }]
    : []

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  const isInTrial = session?.user?.isInTrial
  const trialEndsAt = session?.user?.trialEndsAt ? new Date(session.user.trialEndsAt) : null
  const daysLeft = trialEndsAt
    ? Math.ceil((trialEndsAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0
  const trialProgress = Math.max(0, Math.min(100, (daysLeft / 7) * 100))

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname?.startsWith(href)
  }

  const reopenOnboarding = () => {
    localStorage.removeItem("onboarding_completed")
    window.location.reload()
  }

  const iniciais =
    session.user?.name?.charAt(0).toUpperCase() ||
    session.user?.email?.charAt(0).toUpperCase() ||
    "U"

  const tituloAtual =
    [...menuItems, ...adminItems, ...configItems].find((item) =>
      item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href)
    )?.label || "SeuGerente"

  const NavLink = ({
    item,
    onNavigate,
  }: {
    item: { icon: React.ElementType; label: string; href: string; badge: string | null }
    onNavigate?: () => void
  }) => {
    const active = isActive(item.href)
    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={cn(
          "group relative flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm transition-all",
          active
            ? "border border-primary/40 bg-primary/10 text-white font-semibold shadow-[0_0_0_1px_rgba(79,70,229,0.15)]"
            : "border border-transparent text-muted-foreground hover:bg-surface hover:text-white"
        )}
      >
        {active && (
          <span
            aria-hidden="true"
            className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary shadow-[0_0_10px_rgba(79,70,229,0.8)]"
          />
        )}
        <div className="flex min-w-0 items-center gap-3">
          <item.icon
            className={cn(
              "h-5 w-5 shrink-0",
              active ? "text-primary" : "text-muted-foreground group-hover:text-white"
            )}
          />
          <span className="truncate">{item.label}</span>
        </div>
        {item.badge && (
          <Badge className="shrink-0 border-border bg-surface-2 px-1.5 text-[9px] text-primary">
            {item.badge}
          </Badge>
        )}
      </Link>
    )
  }


  const SidebarBody = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      {/* Logo */}
      <div className="p-8 pb-6">
        <Link href="/" onClick={onNavigate} className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-card shadow-lg shadow-primary/20">
            <Image
              src="/logo1.png"
              alt="SeuGerente"
              width={36}
              height={36}
              className="h-7 w-7 object-contain"
              priority
            />
          </div>
          <div className="min-w-0">
            <p className="panel-title truncate text-lg leading-tight">SeuGerente</p>
            <p className="truncate text-[11px] text-muted-foreground">{empresaNome}</p>
          </div>
        </Link>
      </div>

      {/* Navegação */}
      <nav className="flex-1 space-y-8 overflow-y-auto px-4">
        <div>
          <p className="eyebrow mb-4 px-4">Menu Principal</p>
          <div className="space-y-1">
            {menuItems.map((item, idx) => (
              <NavLink key={idx} item={item} onNavigate={onNavigate} />
            ))}
          </div>
        </div>

        {adminItems.length > 0 && (
          <div>
            <p className="eyebrow mb-4 px-4">Administração</p>
            <div className="space-y-1">
              {adminItems.map((item, idx) => (
                <NavLink key={idx} item={item} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="eyebrow mb-4 px-4">Configurações</p>
          <div className="space-y-1">
            {configItems.map((item, idx) => (
              <NavLink key={idx} item={item} onNavigate={onNavigate} />
            ))}
          </div>
        </div>
      </nav>

      {/* Rodapé */}
      <div className="space-y-4 p-6">
        {isInTrial && (
          <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4">
            <p className="mb-2 text-xs font-semibold text-primary">
              Teste grátis: {daysLeft} dias restantes
            </p>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full bg-primary shadow-[0_0_8px_rgba(79,70,229,0.6)]"
                style={{ width: `${trialProgress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 border-t border-border pt-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-sm font-bold text-white">
            {iniciais}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {session.user?.name || session.user?.email?.split("@")[0]}
            </p>
            <p className="truncate text-[10px] text-muted-foreground">{session.user?.email}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={reopenOnboarding}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border px-2 py-2 text-[11px] text-muted-foreground transition-all hover:bg-surface hover:text-white"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            Ajuda
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border px-2 py-2 text-[11px] text-muted-foreground transition-all hover:bg-surface hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sair
          </button>
        </div>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar Desktop */}
       <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <SidebarBody />
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
           className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
           aria-hidden="true"
        />
      )}

      {/* Sidebar Mobile */}
      <div
        className={cn(
           "fixed inset-y-0 left-0 z-[60] flex w-[min(18rem,calc(100vw-3.5rem))] transform flex-col border-r border-sidebar-border bg-sidebar shadow-2xl transition-transform duration-300 lg:hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
         role="dialog"
         aria-modal="true"
         aria-label="Menu de navegação"
      >
         <Button
           type="button"
           variant="ghost"
           size="icon"
          onClick={() => setSidebarOpen(false)}
           aria-label="Fechar menu de navegação"
           className="absolute right-4 top-6 z-10 text-muted-foreground hover:bg-surface hover:text-foreground"
        >
          <X className="h-4 w-4" />
         </Button>
        <SidebarBody onNavigate={() => setSidebarOpen(false)} />
      </div>

      {/* Conteúdo */}
      <div className="lg:pl-72">
         <header className="sticky top-0 z-30 grid h-16 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur lg:grid-cols-[minmax(0,1fr)_auto] lg:px-8">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menu de navegação"
            className="lg:hidden"
          >
            <Menu className="size-5" />
          </Button>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white lg:hidden">{tituloAtual}</p>
            <button
              onClick={() => window.dispatchEvent(new Event("open-command-palette"))}
              className="hidden h-9 min-w-0 max-w-md items-center gap-2 rounded-xl border border-border bg-surface/60 px-3 text-sm text-muted-foreground transition-colors hover:bg-surface hover:text-foreground lg:flex"
            >
              <Search className="h-4 w-4 shrink-0" />
              <span className="truncate">Buscar ou executar uma ação...</span>
              <kbd className="ml-auto rounded-md border border-border px-1.5 py-0.5 text-[10px]">
                ⌘K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => window.dispatchEvent(new Event("open-command-palette"))}
              aria-label="Buscar"
              className="lg:hidden"
            >
              <Search className="size-5" />
            </Button>
            <NotificationsBell />
          </div>
        </header>
        <main className="min-h-[calc(100vh-4rem)] bg-background pb-20 lg:pb-0">
          {children}
        </main>

      </div>

      {/* Barra de navegação inferior (celulares e tablets) */}
      <nav
        aria-label="Navegação rápida"
        className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        {menuItems.slice(0, 4).map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-1 px-1 py-2 text-[10px] transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              {active && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-primary shadow-[0_0_8px_rgba(79,70,229,0.8)]"
                />
              )}
              <item.icon className="size-5" />
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          )
        })}
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          aria-label="Abrir menu completo"
          className="flex flex-1 flex-col items-center gap-1 px-1 py-2 text-[10px] text-muted-foreground"
        >
          <Menu className="size-5" />
          <span>Menu</span>
        </button>
      </nav>


      <CommandPalette />
    </div>
  )
}
