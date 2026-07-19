// src/app/api/admin/dashboard/route.ts
// Retorna métricas do SaaS, lista de clientes/empresas e planos.
// Apenas ADMIN. Usa adminPrisma (sem filtro de multi-tenant).

import { NextResponse } from "next/server"
import { adminPrisma } from "@/lib/prisma-admin"
import { getServerAdminOrNull } from "@/lib/admin"

export async function GET() {
  const session = await getServerAdminOrNull()
  if (!session) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  const now = new Date()
  const trintaDiasAtras = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [users, plans, subscriptionsAtivas] = await Promise.all([
    adminPrisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        empresas: true,
        subscription: { include: { plan: true } },
      },
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

  const clientes = users.map((u) => {
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
      createdAt: u.createdAt,
      trialEndsAt: u.trialEndsAt,
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

  return NextResponse.json({
    metrics: {
      totalClientes,
      trialsAtivos,
      assinaturasAtivas,
      receitaMRR,
      novosUltimos30Dias,
    },
    clientes,
    planos: plans,
  })
}
