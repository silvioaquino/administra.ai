// src/app/(dashboard)/layout.tsx - Layout atualizado
"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { 
  Menu, 
  X, 
  Home, 
  ShoppingBag, 
  Package, 
  Users, 
  BarChart3, 
  Store, 
  Settings,
  Wallet,
  CreditCard,
  Clock,
  Truck,
  Ticket,
  QrCode,
  Plug,
  HelpCircle,
  MessageCircle,
  Star
} from "lucide-react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const menuItems = [
    { icon: Home, label: "Dashboard", href: "/" },
    { icon: ShoppingBag, label: "Registros NFEs", href: "/nfe", badge: "3" },
    { icon: Package, label: "Fichas Tecnicas", href: "/produtos" },
    { icon: MessageCircle, label: "Livro Diario", href: "/whatsapp", connected: true },
    { icon: Users, label: "Clientes", href: "/simples" },
    /*{ icon: BarChart3, label: "Dashboard", href: "/relatorios" }*/
    { icon: Store, label: "Minha loja", href: "/config/loja" },
    { icon: Clock, label: "Planejamentos", href: "/planejamento" },
    { icon: CreditCard, label: "Fechamento Mensal", href: "/config/pagamento" },
    { icon: Truck, label: "Contas bancarias", href: "/config/entrega" },
    { icon: Ticket, label: "Fluxo de Caixa", href: "/config/cupons", badge: "Novo!" },
  ]

  const configItems = [
    
    { icon: QrCode, label: "QR Code", href: "/config/qrcode" },
    { icon: Plug, label: "Integrações", href: "/config/integracoes" },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar Desktop */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col bg-white shadow-lg lg:flex">
        {/* Logo / Topbar */}
        <div className="flex h-16 items-center gap-2 px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
            <Store className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-semibold">Minha Loja</span>
        </div>

        {/* Menu Principal */}
        <nav className="flex-1 overflow-y-auto px-2 py-4">
          <p className="mb-2 px-3 text-x font-semibold uppercase text-gray-400">Menu</p>
          {menuItems.map((item, idx) => (
            <a
              key={idx}
              href={item.href}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-gray-700 transition hover:bg-gray-100"
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-5 w-5" />
                <span className="text-s">{item.label}</span>
              </div>
              {item.badge && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                  {item.badge}
                </span>
              )}
              {item.connected && (
                <span className="text-xs text-green-600">Conectado</span>
              )}
            </a>
          ))}

          <p className="mb-2 mt-4 px-3 text-x font-semibold uppercase text-gray-400">
            Configurações
          </p>
          {configItems.map((item, idx) => (
            <a
              key={idx}
              href={item.href}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-gray-700 transition hover:bg-gray-100"
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-5 w-5" />
                <span className="text-s">{item.label}</span>
              </div>
              {item.badge && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                  {item.badge}
                </span>
              )}
            </a>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-400 p-14">
          <a href="#" className="mb-2 block text-s text-gray-500 hover:text-primary">
            Enviar sugestões
          </a>
          <a href="#" className="block text-s text-gray-500 hover:text-primary">
            Sair da conta
          </a>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-64 transform bg-white shadow-xl transition-transform duration-300 lg:hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
              <Store className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold">Minha Loja</span>
          </div>
          <button onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>
        {/* Mobile menu items (same as desktop) */}
        <div className="overflow-y-auto p-2">
          {menuItems.map((item, idx) => (
            <a
              key={idx}
              href={item.href}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-gray-700"
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between bg-white px-4 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 hover:bg-gray-100 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-4">
            <button className="rounded-full p-2 hover:bg-gray-100">
              <HelpCircle className="h-5 w-5 text-gray-500" />
            </button>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
              <span className="text-sm font-medium">AD</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}