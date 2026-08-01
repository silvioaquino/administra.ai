// src/components/ui/modal.tsx
"use client"

import { useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export function Modal({ isOpen, onClose, title, subtitle, children, footer }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-card rounded-2xl shadow-xl w-full max-w-2xl mx-4 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-card border-b border-border px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">{title}</h2>
              {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full hover:bg-muted h-8 w-8"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}