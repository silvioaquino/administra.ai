"use client"

import { useEffect } from "react"

export interface AparenciaSistema {
  corDestaque: string
  tema: "claro" | "escuro"
  nomeExibicao: string
  logoUrl: string
  densidade: "confortavel" | "compacta"
  bordas: "suave" | "arredondada" | "reta"
  reduzirAnimacoes: boolean
}

const STORAGE_KEY = "seugerente:aparencia"

const RAIOS: Record<AparenciaSistema["bordas"], string> = {
  reta: "0.25rem",
  suave: "0.5rem",
  arredondada: "0.875rem",
}

function mix(hex: string, target: string, weight: number) {
  const parse = (h: string) => {
    const v = h.replace("#", "")
    const full = v.length === 3 ? v.split("").map((c) => c + c).join("") : v
    return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) || 0)
  }
  const a = parse(hex)
  const b = parse(target)
  const out = a.map((c, i) => Math.round(c + (b[i] - c) * weight))
  return `#${out.map((c) => c.toString(16).padStart(2, "0")).join("")}`
}

/** Aplica a personalização do sistema nas variáveis CSS globais. */
export function aplicarAparencia(config: Partial<AparenciaSistema>) {
  if (typeof document === "undefined") return
  const root = document.documentElement

  if (config.corDestaque && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(config.corDestaque)) {
    const cor = config.corDestaque
    root.style.setProperty("--primary", cor)
    root.style.setProperty("--primary-hover", mix(cor, "#000000", 0.18))
    root.style.setProperty("--primary-soft", mix(cor, "#000000", 0.55))
    root.style.setProperty("--primary-glow", mix(cor, "#ffffff", 0.35))
    root.style.setProperty("--sidebar-primary", cor)
    root.style.setProperty("--ring", cor)
  }

  if (config.bordas) {
    root.style.setProperty("--radius", RAIOS[config.bordas])
  }

  if (config.densidade) {
    root.dataset.densidade = config.densidade
  }

  {
    const tema = config.tema === "claro" ? "claro" : "escuro"
    root.dataset.tema = tema
    root.classList.toggle("light", tema === "claro")
    root.classList.toggle("dark", tema === "escuro")
    root.style.colorScheme = tema === "claro" ? "light" : "dark"
  }

  if (typeof config.reduzirAnimacoes === "boolean") {
    root.dataset.reduzirAnimacoes = config.reduzirAnimacoes ? "true" : "false"
  }
}

export function salvarAparenciaLocal(config: Partial<AparenciaSistema>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch {
    /* ignore */
  }
}

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 1) aplica cache local imediatamente (evita "piscar")
    try {
      const cached = localStorage.getItem(STORAGE_KEY)
      if (cached) aplicarAparencia(JSON.parse(cached))
    } catch {
      /* ignore */
    }

    // 2) busca a configuração salva no servidor
    let ativo = true
    fetch("/api/config/personalizacao")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!ativo || !data?.success || !data.dados) return
        aplicarAparencia(data.dados)
        salvarAparenciaLocal(data.dados)
      })
      .catch(() => {})

    return () => {
      ativo = false
    }
  }, [])

  return <>{children}</>
}
