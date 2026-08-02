"use client"

import { Toaster as SonnerToaster } from "sonner"

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        classNames: {
          toast:
            "!bg-surface !text-foreground !border !border-border !rounded-[var(--radius)] !shadow-lg",
          description: "!text-muted-foreground",
          actionButton: "!bg-primary !text-primary-foreground",
          cancelButton: "!bg-surface-2 !text-muted-foreground",
        },
      }}
    />
  )
}
