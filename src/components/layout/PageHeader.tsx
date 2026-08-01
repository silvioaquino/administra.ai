// src/components/layout/PageHeader.tsx
"use client"

import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

interface PageHeaderProps {
  title: string
  subtitle?: string
  backHref?: string
  onBack?: () => void
  children?: ReactNode
}

/**
 * Cabeçalho de página que replica o layout da página
 * `src/app/(dashboard)/page.tsx`.
 *
 * - `flex items-center justify-between` — título à esquerda, ações à direita
 * - `text-2xl font-bold tracking-tight text-white` — título idempotente ao dashboard
 * - `backHref` (opcional) renderiza um Link de voltar com ícone ChevronLeft
 * - `onBack` (opcional) renderiza um botão de voltar com ícone ChevronLeft (para router.back())
 * - `children` (opcional) renderiza botões de ação à direita
 */
export function PageHeader({ title, subtitle, backHref, onBack, children }: PageHeaderProps) {
  const showBack = backHref || onBack

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {showBack && (
          backHref ? (
            <Link
              href={backHref}
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-2 hover:text-white transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={onBack}
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-2 hover:text-white transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      {children && (
        <div className="flex items-center gap-2">
          {children}
        </div>
      )}
    </div>
  )
}
