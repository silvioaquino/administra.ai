// src/components/layout/PageContainer.tsx
"use client"

import type { ReactNode } from "react"

type MaxWidth = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl"

interface PageContainerProps {
  maxWidth?: MaxWidth
  children: ReactNode
}

/**
 * Wrapper de conteúdo de página que replica o layout da página
 * `src/app/(dashboard)/page.tsx`.
 *
 * - `container mx-auto` centraliza e limita a largura
 * - `p-8` padding consistente (igual ao dashboard)
 * - `space-y-8` espaçamento vertical entre seções
 * - `max-w-7xl` largura máxima padrão (igual ao dashboard)
 *
 * Formulários podem passar `maxWidth` mais estreito (3xl, 4xl, …).
 */
export function PageContainer({ maxWidth = "7xl", children }: PageContainerProps) {
  return (
    <div className={`container mx-auto p-8 max-w-${maxWidth} space-y-8`}>
      {children}
    </div>
  )
}
