// src/app/(dashboard)/admin/page.tsx
// Página de administração do SaaS (somente ADMIN).
// Server component: protege o acesso e busca os dados iniciais via adminPrisma.

import { redirect } from "next/navigation"
import { getServerAdminOrNull } from "@/lib/admin"
import { adminPrisma } from "@/lib/prisma-admin"
import AdminDashboard, { type ClienteAdmin, type PlanoAdmin, type MetricsAdmin } from "./components/AdminDashboard"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  const session = await getServerAdminOrNull()
  if (!session) redirect("/")

  const now = new Date()
  const trintaDiasAtras = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [users, plans, subscriptionsAtivas] = await Promise.all([
    adminPrisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: { empresas: true, subscription: { include: { plan: true } } },
    }),
    adminPrisma.plan.findMany({ orderBy: { createdAt: "desc" } }),
    adminPrisma.subscription.findMany({
      where: { status: "active" },
      include: { plan: true },
    }),
  ])

  const totalClientes = users.length
  const assinaturasAtivas = subscriptionsAtivas.length
  const trialsAtivos = users.filter(
    (u) => u.trialEndsAt && u.trialEndsAt > now && (!u.subscription || u.subscription.status !== "active")
  ).length
  const novosUltimos30Dias = users.filter((u) => u.createdAt >= trintaDiasAtras).length
  const receitaMRR = subscriptionsAtivas.reduce((acc, s) => acc + (s.plan?.price || 0), 0)

  const clientes: ClienteAdmin[] = users.map((u) => {
    const empresa = u.empresas?.[0]
    const isInTrial = !!u.trialEndsAt && u.trialEndsAt > now
    const diasTrial = u.trialEndsAt
      ? Math.ceil((u.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0
    return {
      id: u.id,
      nome: empresa?.nome || u.name || "—",
      email: u.email,
      segmento: empresa?.segmento || null,
      cidade: empresa?.cidade || null,
      estado: empresa?.estado || null,
      createdAt: u.createdAt.toISOString(),
      trialEndsAt: u.trialEndsAt?.toISOString() || null,
      isInTrial,
      diasTrial,
      subscription: u.subscription
        ? {
            status: u.subscription.status,
            plan: u.subscription.plan
              ? { name: u.subscription.plan.name, price: u.subscription.plan.price }
              : null,
          }
        : null,
    }
  })

  const metrics: MetricsAdmin = {
    totalClientes,
    trialsAtivos,
    assinaturasAtivas,
    receitaMRR,
    novosUltimos30Dias,
  }

  const planos: PlanoAdmin[] = plans.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    features: Array.isArray(p.features) ? (p.features as string[]) : [],
    isActive: p.isActive,
    stripePriceId: p.stripePriceId,
    createdAt: p.createdAt.toISOString(),
  }))

  return (
    <AdminDashboard initialMetrics={metrics} initialClientes={clientes} initialPlanos={planos} />
  )
}
