// src/components/onboarding/OnboardingButton.tsx
"use client"

import { useState } from "react"
import { HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { OnboardingGuide } from "./OnboardingGuide"

export function OnboardingButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="text-xs text-muted-foreground"
      >
        <HelpCircle className="mr-1 h-3 w-3" />
        Ajuda de configuração
      </Button>
      
      {isOpen && (
        <OnboardingGuide onComplete={() => setIsOpen(false)} />
      )}
    </>
  )
}