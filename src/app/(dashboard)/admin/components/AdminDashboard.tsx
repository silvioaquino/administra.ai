// src/app/(dashboard)/admin/components/AdminDashboard.tsx
// Componente client da área de administração do SaaS.
// Recebe os dados iniciais do server component e gerencia o CRUD de planos.

"use client"

import { useState } from "react"
import { formatCurrency } from "@/lib/utils"
import {
  Shield,
  Users,
  Crown,
  CreditCard,
  TrendingUp,
  Plus,
  Pencil,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  X,
  Loader2,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

export type MetricsAdmin = {
  totalClientes: number
  trialsAtivos: number
  assinaturasAtivas: number
  receitaMRR: number
  novosUltimos30Dias: number
}

export type ClienteAdmin = {
  id: string
  nome: string
  email: string
  segmento: string | null
  cidade: string | null
  estado: string | null
  createdAt: string
  trialEndsAt: string | null
  isInTrial: boolean
  diasTrial: number
  subscription: { status: string; plan: { name: string; price: number } | null } | null
}

export type PlanoAdmin = {
  id: string
  name: string
  price: number
  features: string[]
  isActive: boolean
  stripePriceId: string | null
  createdAt: string
}

function formatarData(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("pt-BR")
  } catch {
    return "—"
  }
}

function normalizePlano(p: {
  id: string
  name: string
  price: number
  features: unknown
  isActive: boolean
  stripePriceId: string | null
  createdAt: string
}): PlanoAdmin {
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    features: Array.isArray(p.features) ? (p.features as string[]) : [],
    isActive: p.isActive,
    stripePriceId: p.stripePriceId,
    createdAt: p.createdAt,
  }
}

export default function AdminDashboard({
  initialMetrics,
  initialClientes,
  initialPlanos,
}: {
  initialMetrics: MetricsAdmin
  initialClientes: ClienteAdmin[]
  initialPlanos: PlanoAdmin[]
}) {
  const [metrics] = useState<MetricsAdmin>(initialMetrics)
  const [clientes] = useState<ClienteAdmin[]>(initialClientes)
  const [planos, setPlanos] = useState<PlanoAdmin[]>(initialPlanos)
  const [aba, setAba] = useState<"clientes" | "planos">("clientes")
  const [formOpen, setFormOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null)
  const [form, setForm] = useState({
    name: "",
    price: "",
    features: "",
    isActive: true,
    stripePriceId: "",
  })

  const cards = [
    { label: "Total de clientes", value: metrics.totalClientes, icon: Users, cor: "text-info bg-info/50/10" },
    { label: "Trials ativos", value: metrics.trialsAtivos, icon: Crown, cor: "text-warning bg-warning/50/10" },
    { label: "Assinaturas ativas", value: metrics.assinaturasAtivas, icon: CheckCircle2, cor: "text-success bg-success/50/10" },
    { label: "MRR estimado", value: formatCurrency(metrics.receitaMRR), icon: TrendingUp, cor: "text-primary bg-primary/10" },
    { label: "Novos (30 dias)", value: metrics.novosUltimos30Dias, icon: Calendar, cor: "text-primary bg-primary/80/10" },
  ]

  const abrirNovo = () => {
    setEditId(null)
    setForm({ name: "", price: "", features: "", isActive: true, stripePriceId: "" })
    setMsg(null)
    setFormOpen(true)
  }

  const abrirEditar = (p: PlanoAdmin) => {
    setEditId(p.id)
    setForm({
      name: p.name,
      price: String(p.price),
      features: (p.features || []).join("\n"),
      isActive: p.isActive,
      stripePriceId: p.stripePriceId || "",
    })
    setMsg(null)
    setFormOpen(true)
  }

  const salvar = async () => {
    setSaving(true)
    setMsg(null)
    try {
      const payload = {
        name: form.name,
        price: Number(form.price),
        features: form.features.split("\n").map((s) => s.trim()).filter(Boolean),
        isActive: form.isActive,
        stripePriceId: form.stripePriceId || null,
      }
      const res = editId
        ? await fetch(`/api/admin/planos/${editId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch(`/api/admin/planos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
      const data = await res.json()
      if (!res.ok) {
        setMsg({ tipo: "erro", texto: data.error || "Erro ao salvar" })
        return
      }
      const p = normalizePlano(data.plano)
      setPlanos((prev) =>
        editId ? prev.map((x) => (x.id === p.id ? p : x)) : [p, ...prev]
      )
      setMsg({ tipo: "ok", texto: editId ? "Plano atualizado" : "Plano criado" })
      setFormOpen(false)
    } catch {
      setMsg({ tipo: "erro", texto: "Erro de conexão" })
    } finally {
      setSaving(false)
    }
  }

  const toggleAtivo = async (p: PlanoAdmin) => {
    try {
      const res = await fetch(`/api/admin/planos/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !p.isActive }),
      })
      const data = await res.json()
      if (res.ok) {
        setPlanos((prev) => prev.map((x) => (x.id === p.id ? normalizePlano(data.plano) : x)))
      }
    } catch {
      // silencioso: falha de rede no toggle
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Administração do SaaS</h1>
          <p className="text-sm text-muted-foreground/70">Visão geral de clientes, assinaturas e planos.</p>
        </div>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-border bg-surface/60 p-4">
            <div className={cn("mb-3 flex h-9 w-9 items-center justify-center rounded-lg", c.cor)}>
              <c.icon className="h-4 w-4" />
            </div>
            <p className="text-lg font-bold text-white">{c.value}</p>
            <p className="text-[11px] text-muted-foreground/70">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Abas */}
      <div className="flex gap-1 border-b border-border">
        {[
          { id: "clientes", label: "Clientes", icon: Users },
          { id: "planos", label: "Planos", icon: CreditCard },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setAba(t.id as "clientes" | "planos")}
            className={cn(
              "flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-all",
              aba === t.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground/70 hover:text-white"
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Mensagem de feedback */}
      {msg && (
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
            msg.tipo === "ok"
              ? "border-success/30 bg-success/50/10 text-success"
              : "border-destructive/30 bg-destructive/50/10 text-destructive"
          )}
        >
          {msg.tipo === "ok" ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {msg.texto}
        </div>
      )}

      {/* Clientes */}
      {aba === "clientes" && (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface/80 text-left text-[11px] uppercase tracking-wider text-muted-foreground/70">
              <tr>
                <th className="px-3 py-2.5">Cliente</th>
                <th className="px-3 py-2.5">Segmento</th>
                <th className="px-3 py-2.5">Cidade</th>
                <th className="px-3 py-2.5">Cadastro</th>
                <th className="px-3 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {clientes.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                    Nenhum cliente cadastrado.
                  </td>
                </tr>
              )}
              {clientes.map((c) => {
                const ativo = c.subscription?.status === "active"
                const status = ativo
                  ? { texto: "Assinatura ativa", cor: "border-success/30 bg-success/50/10 text-success", icon: CheckCircle2 }
                  : c.isInTrial
                  ? { texto: `Trial · ${c.diasTrial}d`, cor: "border-warning/30 bg-warning/50/10 text-warning", icon: Crown }
                  : { texto: "Expirado", cor: "border-border/30 bg-surface/30 text-muted-foreground/70", icon: AlertTriangle }
                return (
                  <tr key={c.id} className="border-t border-border hover:bg-surface/40">
                    <td className="px-3 py-3">
                      <p className="font-medium text-white">{c.nome}</p>
                      <p className="text-xs text-muted-foreground">{c.email}</p>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground/70">{c.segmento || "—"}</td>
                    <td className="px-3 py-3 text-muted-foreground/70">
                      {c.cidade ? `${c.cidade}${c.estado ? `/${c.estado}` : ""}` : "—"}
                    </td>
                    <td className="px-3 py-3 text-muted-foreground/70">{formatarData(c.createdAt)}</td>
                    <td className="px-3 py-3">
                      <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs", status.cor)}>
                        <status.icon className="h-3 w-3" />
                        {status.texto}
                      </span>
                      {ativo && c.subscription?.plan && (
                        <p className="mt-1 text-[11px] text-muted-foreground">{c.subscription.plan.name}</p>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Planos */}
      {aba === "planos" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={abrirNovo}
              className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition-all hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" /> Novo plano
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {planos.map((p) => (
              <div key={p.id} className="flex flex-col rounded-xl border border-border bg-surface/60 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-white">{p.name}</h3>
                    <p className="mt-1 text-lg font-bold text-white">
                      {formatCurrency(p.price)}
                      <span className="text-xs font-normal text-muted-foreground/70">/mês</span>
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-xs",
                      p.isActive
                        ? "border-success/30 bg-success/50/10 text-success"
                        : "border-border/30 bg-surface/30 text-muted-foreground/70"
                    )}
                  >
                    {p.isActive ? "Ativo" : "Inativo"}
                  </span>
                </div>

                <ul className="mt-3 flex-1 space-y-1">
                  {p.features.slice(0, 6).map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground/70">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                      {f}
                    </li>
                  ))}
                  {p.features.length > 6 && (
                    <li className="text-xs text-muted-foreground">+{p.features.length - 6} outros recursos</li>
                  )}
                </ul>

                <div className="mt-4 flex gap-2 border-t border-border pt-3">
                  <button
                    onClick={() => abrirEditar(p)}
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-border px-2 py-1.5 text-xs text-muted-foreground/70 transition-all hover:bg-surface/50"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </button>
                  <button
                    onClick={() => toggleAtivo(p)}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-all",
                      p.isActive
                        ? "bg-surface/50 text-muted-foreground/70 hover:bg-surface"
                        : "bg-success/20 text-success hover:bg-success/30"
                    )}
                  >
                    {p.isActive ? "Inativar" : "Ativar"}
                  </button>
                </div>
              </div>
            ))}
            {planos.length === 0 && (
              <p className="col-span-full rounded-xl border border-border bg-surface/60 p-6 text-center text-muted-foreground">
                Nenhum plano cadastrado.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Formulário de plano (overlay) */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">
                {editId ? "Editar plano" : "Novo plano"}
              </h3>
              <button
                onClick={() => setFormOpen(false)}
                className="rounded-lg p-1 text-muted-foreground/70 hover:bg-surface hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground/70">Nome</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-white outline-none focus:border-primary"
                  placeholder="Ex: PDV Básico"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-muted-foreground/70">Preço (R$/mês)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-white outline-none focus:border-primary"
                  placeholder="49.90"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-muted-foreground/70">
                  Recursos (um por linha)
                </label>
                <textarea
                  value={form.features}
                  onChange={(e) => setForm({ ...form, features: e.target.value })}
                  rows={4}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-white outline-none focus:border-primary"
                  placeholder={"Integração iFood\nPedidos ilimitados"}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-muted-foreground/70">Stripe Price ID</label>
                <input
                  value={form.stripePriceId}
                  onChange={(e) => setForm({ ...form, stripePriceId: e.target.value })}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-white outline-none focus:border-primary"
                  placeholder="price_..."
                />
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground/70">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="h-4 w-4 accent-primary"
                />
                Plano ativo
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setFormOpen(false)}
                className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground/70 hover:bg-surface"
              >
                Cancelar
              </button>
              <button
                onClick={salvar}
                disabled={saving}
                className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
