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
    { icon: CreditCard, label: "Abrir/Fechar Caixa Diário", href: "/caixa", badge: null },
  ]

  const configItems = [
    { icon: Store, label: "Minha loja", href: "/config/loja", badge: null },
    { icon: Store, label: "Gerenciamento de Planos", href: "/config/planos", badge: null },
    { icon: Plug, label: "Integrações", href: "/config/integracoes", badge: null },
  ]

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
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
    <div className="min-h-screen bg-gray-900">
      {/* Sidebar Desktop - Background Preto */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-58 flex-col bg-gradient-to-b from-gray-900 to-gray-950 border-r border-gray-800 shadow-xl lg:flex">
        {/* Logo */}
        <div className="flex flex-col items-center justify-center border-b border-gray-800 py-4">
          <Link href="/" className="flex flex-col items-center gap-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#de4838] to-[#de4838]/80 shadow-lg">
              <Store className="h-5 w-5 text-white" />
            </div>
            {/* Nome do sistema */}
            <span className="text-[9px] font-medium text-gray-400 uppercase tracking-wider">
              KaiUp-Administrator.ai
            </span>
            {/* Nome da empresa */}
            <span className="text-xs font-semibold text-white truncate max-w-[180px] mt-0.5">
              {empresaNome}
            </span>
            {/* Mensagem de Trial abaixo do nome da empresa */}
            {isInTrial && (
              <div className="mt-1.5 px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20">
                <p className="text-[8px] font-medium text-orange-400">Teste grátis • {daysLeft} dias</p>
              </div>
            )}
          </Link>
        </div>

        {/* Menu Principal */}
        <nav className="flex-1 overflow-y-auto px-2 py-4">
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Menu</p>
          {menuItems.map((item, idx) => {
            const active = isActive(item.href)
            return (
              <Link
                key={idx}
                href={item.href}
                className={cn(
                  "flex items-center justify-between rounded-lg px-2 py-1.5 text-[14px] transition-all mb-0.5",
                  active 
                    ? "bg-[#de4838]/20 text-[#de4838] font-medium" 
                    : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                )}
              >
                <div className="flex items-center gap-2">
                  <item.icon className={cn("h-3.5 w-3.5", active ? "text-[#de4838]" : "text-gray-500")} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <Badge className="bg-amber-500/20 text-amber-400 text-[9px] px-1 border-amber-500/30">{item.badge}</Badge>
                )}
                {active && <ChevronRight className="h-2.5 w-2.5 text-[#de4838]" />}
              </Link>
            )
          })}

          <p className="mb-2 mt-4 px-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
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
                    ? "bg-[#de4838]/20 text-[#de4838] font-medium" 
                    : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                )}
              >
                <div className="flex items-center gap-2">
                  <item.icon className={cn("h-3.5 w-3.5", active ? "text-[#de4838]" : "text-gray-500")} />
                  <span className="truncate">{item.label}</span>
                </div>
                {active && <ChevronRight className="h-2.5 w-2.5 text-[#de4838]" />}
              </Link>
            )
          })}
        </nav>

        {/* Footer da Sidebar */}
        <div className="border-t border-gray-800 p-3 space-y-3">
          {/* Informações do usuário */}
          <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-gray-800/50">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#de4838] to-[#de4838]/80 text-white text-[11px] font-medium shadow-lg">
              {session.user?.name?.charAt(0).toUpperCase() || session.user?.email?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-gray-200 truncate">
                {session.user?.name || session.user?.email?.split("@")[0]}
              </p>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex gap-1.5">
            <button
              onClick={reopenOnboarding}
              className="flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[10px] text-gray-400 transition-all hover:text-white hover:bg-gray-800/50"
            >
              <HelpCircle className="h-3 w-3" />
              <span>Ajuda</span>
            </button>
            
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[10px] text-gray-400 transition-all hover:text-white hover:bg-gray-800/50"
            >
              <LogOut className="h-3 w-3" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar - Background Preto */}
      <div
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-64 transform bg-gradient-to-b from-gray-900 to-gray-950 shadow-xl transition-transform duration-300 lg:hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col items-center border-b border-gray-800 py-4 px-3">
          <Link href="/" onClick={() => setSidebarOpen(false)} className="flex flex-col items-center gap-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#de4838] to-[#de4838]/80 shadow-lg">
              <Store className="h-4 w-4 text-white" />
            </div>
            <span className="text-[8px] font-medium text-gray-400 uppercase tracking-wider">
              KaiUp-Administrator.ai
            </span>
            <span className="text-[11px] font-semibold text-white truncate max-w-[180px]">
              {empresaNome}
            </span>
            {isInTrial && (
              <div className="mt-1.5 px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20">
                <p className="text-[7px] font-medium text-orange-400">Teste grátis • {daysLeft} dias</p>
              </div>
            )}
          </Link>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="absolute right-3 top-3 rounded-lg p-1 hover:bg-gray-800"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>
        
        <div className="flex h-[calc(100%-140px)] flex-col overflow-y-auto">
          <div className="flex-1 p-2">
            {menuItems.map((item, idx) => (
              <Link
                key={idx}
                href={item.href}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] text-gray-400 hover:text-white hover:bg-gray-800/50"
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="h-3.5 w-3.5 text-gray-500" />
                <span>{item.label}</span>
              </Link>
            ))}
            <div className="my-2 border-t border-gray-800 pt-2">
              {configItems.map((item, idx) => (
                <Link
                  key={idx}
                  href={item.href}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] text-gray-400 hover:text-white hover:bg-gray-800/50"
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="h-3.5 w-3.5 text-gray-500" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
          
          {/* Footer do Mobile Sidebar */}
          <div className="border-t border-gray-800 p-3 space-y-2">
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-gray-800/50">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#de4838] to-[#de4838]/80 text-white text-[10px] font-medium">
                {session.user?.name?.charAt(0).toUpperCase() || session.user?.email?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium text-gray-200 truncate">
                  {session.user?.name || session.user?.email?.split("@")[0]}
                </p>
              </div>
            </div>
            
            <div className="flex gap-1.5">
              <button
                onClick={reopenOnboarding}
                className="flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1 text-[9px] text-gray-400 hover:text-white hover:bg-gray-800/50"
              >
                <HelpCircle className="h-2.5 w-2.5" />
                Ajuda
              </button>
              
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1 text-[9px] text-gray-400 hover:text-white hover:bg-gray-800/50"
              >
                <LogOut className="h-2.5 w-2.5" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Botão flutuante para abrir sidebar no mobile */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-5 left-6 z-30 rounded-full bg-[#de4838] p-3 shadow-lg hover:bg-[#de4838]/90 transition-all lg:hidden"
      >
        <Menu className="h-5 w-5 text-white" />
      </button>

      {/* Main Content */}
      <div className="lg:pl-52">
        <main className="p-4">{children}</main>
      </div>
    </div>
  )
}