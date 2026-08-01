// src/app/(dashboard)/precificacao/page.tsx
"use client"

import { useRouter } from "next/navigation"
import { ArrowRight, Calculator, Package, ShoppingBag, Zap } from "lucide-react"
import { PageContainer } from "@/components/layout/PageContainer"
import { PageHeader } from "@/components/layout/PageHeader"

const quickActions = [
  {
    icon: Calculator,
    label: "Ficha Técnica",
    desc: "Receitas, custos e margens",
    route: "/fichas-tecnicas",
    color: "from-blue-500 to-blue-600",
  },
  {
    icon: Package,
    label: "Produtos/Insumos",
    desc: "Catálogo de insumos e estoque",
    route: "/nfe/produtos",
    color: "from-amber-500 to-amber-600",
  },
  {
    icon: ShoppingBag,
    label: "Produtos para Vendas",
    desc: "Itens precificados para venda",
    route: "/precificacao/produtos-venda",
    color: "from-emerald-500 to-emerald-600",
  },
]

export default function PrecificacaoPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background">
      <PageContainer>
        <PageHeader
          title="Precificação"
          subtitle="Fichas técnicas, insumos e produtos para venda"
        />

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
      </PageContainer>
    </div>
  )
}
