// src/components/layout/Sidebar.tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Receipt,
  BookOpen,
  TrendingUp,
  Banknote,
  Calendar,
  Target,
  ChefHat,
  Archive,
  Settings,
  LogOut,
} from "lucide-react"
import { signOut } from "next-auth/react"

const menuItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Notas Fiscais", href: "/nfe", icon: Receipt },
  { title: "Livro Diário", href: "/livro-diario", icon: BookOpen },
  { title: "Planejamento", href: "/planejamento", icon: Target },
  { title: "Fichas Técnicas", href: "/fichas-tecnicas", icon: ChefHat },
  { title: "Contas Bancárias", href: "/contas-bancarias", icon: Banknote },
  { title: "Fluxo de Caixa", href: "/fluxo-caixa", icon: TrendingUp },
  { title: "Fechamento Mensal", href: "/fechamento-mensal", icon: Calendar },
  { title: "Notas Processadas", href: "/notas-processadas", icon: Archive },
  { title: "Configurações", href: "/configuracoes", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-white border-r shadow-sm">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-center border-b px-4">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Emporio do Sabor
          </h1>
        </div>

        {/* Menu */}
        <nav className="flex-1 space-y-1 p-4">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.title}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="border-t p-4">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-accent-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </div>
    </aside>
  )
}