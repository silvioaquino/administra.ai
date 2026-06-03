// src/app/(dashboard)/layout.tsx
"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { 
  Menu, 
  X, 
  Home, 
  ShoppingBag, 
  Package, 
  Users, 
  Store, 
  Clock,
  CreditCard,
  Truck,
  Ticket,
  QrCode,
  Plug,
  HelpCircle,
  LogOut,
  ChevronRight,
  LayoutDashboard,
  Calculator,
  Receipt,
  TrendingUp
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [empresaNome, setEmpresaNome] = useState<string>("Administra.ai")

  // Buscar nome da empresa no banco de dados
  useEffect(() => {
    async function buscarEmpresa() {
      try {
        const response = await fetch("/api/empresa")
        const data = await response.json()
        if (data.success && data.empresa?.nome) {
          setEmpresaNome(data.empresa.nome)
        } else if (session?.user?.establishment) {
          setEmpresaNome(session.user.establishment)
        }
      } catch (error) {
        console.error("Erro ao buscar nome da empresa:", error)
        if (session?.user?.establishment) {
          setEmpresaNome(session.user.establishment)
        }
      }
    }
    
    if (session) {
      buscarEmpresa()
    }
  }, [session])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/", badge: null },
    { icon: ShoppingBag, label: "Registros NFEs", href: "/nfe", badge: null },
    { icon: Calculator, label: "Fichas Técnicas", href: "/fichas-tecnicas", badge: null },
    { icon: TrendingUp, label: "Planejamento", href: "/planejamento", badge: null },
    { icon: Receipt, label: "Livro Diário", href: "/livro-diario", badge: null },
    { icon: Ticket, label: "Fluxo de Caixa", href: "/fluxo-caixa", badge: null },
    { icon: Truck, label: "Contas bancárias", href: "/contas-bancarias", badge: null },
    { icon: CreditCard, label: "Fechamento Mensal", href: "/fechamento-mensal", badge: null },
  ]

  const configItems = [
    { icon: Store, label: "Minha loja", href: "/config/loja", badge: null },
    { icon: Store, label: "Gerenciamento de Planos", href: "/config/planos", badge: null },
    { icon: Plug, label: "Integrações", href: "/config/integracoes", badge: null },
  ]

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#de4838] border-t-transparent" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  const isInTrial = session?.user?.isInTrial
  const trialEndsAt = session?.user?.trialEndsAt ? new Date(session.user.trialEndsAt) : null
  const daysLeft = trialEndsAt ? Math.ceil((trialEndsAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0

  // Função para verificar se o link está ativo
  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname?.startsWith(href)
  }

  // Função para reabrir o guia de onboarding
  const reopenOnboarding = () => {
    localStorage.removeItem("onboarding_completed")
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar Desktop - Largura w-52 (208px) */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-58 flex-col bg-white shadow-sm lg:flex">
        {/* Logo */}
        <div className="flex h-16 items-center px-3 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#de4838] to-[#de4838]/80 shadow-sm">
              <Store className="h-5 w-5 text-white" />
            </div>
            <span className="text-base font-semibold text-gray-800 truncate max-w-[200px]">{empresaNome}</span>
          </Link>
        </div>

        {/* Menu Principal - USANDO Link DO Next.js */}
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <p className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Menu</p>
          {menuItems.map((item, idx) => {
            const active = isActive(item.href)
            return (
              <Link
                key={idx}
                href={item.href}
                className={cn(
                  "flex items-center justify-between rounded-lg px-2 py-1.5 text-[15px] transition-all mb-0.5",
                  active 
                    ? "bg-[#de4838]/10 text-[#de4838] font-medium" 
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <div className="flex items-center gap-2">
                  <item.icon className={cn("h-3.5 w-3.5", active ? "text-[#de4838]" : "text-gray-400")} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <Badge className="bg-amber-100 text-amber-700 text-[9px] px-1">{item.badge}</Badge>
                )}
                {active && <ChevronRight className="h-2.5 w-2.5 text-[#de4838]" />}
              </Link>
            )
          })}

          <p className="mb-1.5 mt-4 px-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Configurações
          </p>
          {configItems.map((item, idx) => {
            const active = isActive(item.href)
            return (
              <Link
                key={idx}
                href={item.href}
                className={cn(
                  "flex items-center justify-between rounded-lg px-2 py-1.5 text-[14px] transition-all mb-0.5",
                  active 
                    ? "bg-[#de4838]/10 text-[#de4838] font-medium" 
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <div className="flex items-center gap-2">
                  <item.icon className={cn("h-3.5 w-3.5", active ? "text-[#de4838]" : "text-gray-400")} />
                  <span className="truncate">{item.label}</span>
                </div>
                {active && <ChevronRight className="h-2.5 w-2.5 text-[#de4838]" />}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-200 p-2">
          {isInTrial && (
            <div className="mb-2 rounded-lg bg-orange-50 p-1.5 text-center">
              <p className="text-[12px] font-medium text-orange-700">Teste grátis</p>
              <p className="text-[10px] text-orange-600">{daysLeft} dias</p>
            </div>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[15px] text-gray-600 transition-all hover:bg-gray-100"
          >
            <LogOut className="h-5 w-5 text-gray-400" />
            Sair
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar - USANDO Link DO Next.js */}
      <div
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-64 transform bg-white shadow-xl transition-transform duration-300 lg:hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-gray-100 px-3">
          <Link href="/" onClick={() => setSidebarOpen(false)} className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-[#de4838] to-[#de4838]/80 shadow-md">
              <Store className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-semibold text-gray-800 text-sm truncate max-w-[180px]">{empresaNome}</span>
          </Link>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1 hover:bg-gray-100"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>
        <div className="overflow-y-auto p-2">
          {menuItems.map((item, idx) => (
            <Link
              key={idx}
              href={item.href}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-100"
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="h-3.5 w-3.5 text-gray-400" />
              <span>{item.label}</span>
            </Link>
          ))}
          <div className="my-2 border-t border-gray-100 pt-2">
            {configItems.map((item, idx) => (
              <Link
                key={idx}
                href={item.href}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-100"
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="h-3.5 w-3.5 text-gray-400" />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
          <div className="border-t border-gray-100 pt-2">
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-100"
            >
              <LogOut className="h-3.5 w-3.5 text-gray-400" />
              Sair
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-52">
        {/* Topbar - Desktop e Mobile */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between bg-white px-4 shadow-sm border-b border-gray-100">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-1 hover:bg-gray-100 lg:hidden"
          >
            <Menu className="h-4 w-4 text-gray-500" />
          </button>
          
          <div className="hidden lg:block w-10" />
          
          {/* Logo centralizado - clicável e volta para dashboard sem refresh */}
          <div className="flex-1 flex justify-center lg:flex-none lg:absolute lg:left-1/2 lg:transform lg:-translate-x-1/2">
            <Link href="/" className="flex items-center gap-1.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-[#de4838] to-[#de4838]/80 shadow-sm lg:hidden">
                <Store className="h-3 w-3 text-white" />
              </div>
              <span className="text-base font-semibold text-gray-800">KaiUp-Administrator.ai</span>
            </Link>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={reopenOnboarding}
              className="rounded-full p-1 hover:bg-gray-100 transition-colors"
              title="Abrir guia de configuração"
            >
              <HelpCircle className="h-5 w-5 text-gray-400" />
            </button>
            <div className="flex items-center gap-1.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#de4838] to-[#de4838]/80 text-white text-[15px] font-medium shadow-sm">
                {session.user?.name?.charAt(0).toUpperCase() || session.user?.email?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="hidden sm:block">
                <p className="text-[15px] font-medium text-gray-700">
                  {session.user?.name || session.user?.email?.split("@")[0]}
                </p>
                {isInTrial && (
                  <p className="text-[11px] text-orange-500">{daysLeft} dias</p>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4">{children}</main>
      </div>
    </div>
  )
}