// src/components/onboarding/OnboardingHighlight.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { ChevronLeft, ChevronRight, X, Check, Target } from "lucide-react"
import { Button } from "@/components/ui/button"

// Exportando a interface
export interface HighlightStep {
  id: number
  title: string
  description: string
  selector: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  tips?: string[]
}

interface OnboardingHighlightProps {
  steps: HighlightStep[]
  onComplete?: () => void
  onSkip?: () => void
}

export function OnboardingHighlight({ steps, onComplete, onSkip }: OnboardingHighlightProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const [elementPosition, setElementPosition] = useState<DOMRect | null>(null)
  const [elementFound, setElementFound] = useState(false)

  const step = steps[currentStep]
  const isLastStep = currentStep === steps.length - 1

  const updateElementPosition = useCallback(() => {
    if (!step?.selector) return

    const element = document.querySelector(step.selector)
    
    if (element) {
      const rect = element.getBoundingClientRect()
      setElementPosition(rect)
      setElementFound(true)
      element.scrollIntoView({ behavior: "smooth", block: "center" })
    } else {
      setElementFound(false)
      setElementPosition(null)
    }
  }, [step])

  useEffect(() => {
    if (!isVisible || !step) return

    const timer = setTimeout(updateElementPosition, 300)
    
    window.addEventListener("resize", updateElementPosition)
    window.addEventListener("scroll", updateElementPosition)
    
    return () => {
      clearTimeout(timer)
      window.removeEventListener("resize", updateElementPosition)
      window.removeEventListener("scroll", updateElementPosition)
    }
  }, [updateElementPosition, isVisible, step])

  useEffect(() => {
    if (step?.action?.href && pathname !== step.action.href) {
      const timer = setTimeout(updateElementPosition, 500)
      return () => clearTimeout(timer)
    }
  }, [pathname, step, updateElementPosition])

  const handleNext = () => {
    if (isLastStep) {
      localStorage.setItem("onboarding_completed", "true")
      setIsVisible(false)
      onComplete?.()
    } else if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
      setTimeout(updateElementPosition, 300)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      setTimeout(updateElementPosition, 300)
    }
  }

  const handleAction = () => {
    if (step.action?.href) {
      router.push(step.action.href)
      setTimeout(updateElementPosition, 500)
    } else if (step.action?.onClick) {
      step.action.onClick()
    }
  }

  const skipOnboarding = () => {
    localStorage.setItem("onboarding_completed", "true")
    setIsVisible(false)
    onSkip?.()
    onComplete?.()
  }

  if (!isVisible || !step || !elementFound) return null

  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <>
      {/* Overlay escuro */}
      <div className="fixed inset-0 z-50 bg-black/70" />
      
      {/* Highlight do elemento */}
      {elementPosition && (
        <div
          className="fixed z-50 rounded-lg ring-4 ring-[#de4838] ring-offset-2 transition-all duration-300"
          style={{
            top: elementPosition.top - 8,
            left: elementPosition.left - 8,
            width: elementPosition.width + 16,
            height: elementPosition.height + 16,
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className="fixed z-50 w-80 bg-white rounded-xl shadow-2xl"
        style={{
          top: elementPosition ? elementPosition.bottom + 16 : "50%",
          left: elementPosition ? elementPosition.left + elementPosition.width / 2 - 160 : "50%",
          transform: elementPosition ? "none" : "translate(-50%, -50%)",
        }}
      >
        {/* Header */}
        <div className="p-4 border-b bg-gradient-to-r from-[#de4838]/5 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-[#de4838]" />
              <span className="text-xs font-medium text-[#de4838]">
                Passo {currentStep + 1} de {steps.length}
              </span>
            </div>
            <button
              onClick={skipOnboarding}
              className="rounded-full p-1 hover:bg-gray-100 transition-colors"
            >
              <X className="h-3 w-3 text-gray-400" />
            </button>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
            <div
              className="bg-[#de4838] h-1 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-800 mb-1">{step.title}</h3>
          <p className="text-sm text-gray-500 mb-3">{step.description}</p>
          
          {step.tips && step.tips.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-2 mb-3">
              <p className="text-xs font-medium text-blue-800 mb-1">💡 Dica:</p>
              <p className="text-xs text-blue-700">{step.tips[0]}</p>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-2 mt-3">
            {currentStep > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                className="flex-1 rounded-lg"
              >
                <ChevronLeft className="mr-1 h-3 w-3" />
                Voltar
              </Button>
            )}
            {step.action && (
              <Button
                size="sm"
                onClick={handleAction}
                className="flex-1 bg-[#de4838] hover:bg-[#c73d2e] rounded-lg text-white"
              >
                {step.action.label}
                <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={handleNext}
              className="flex-1 rounded-lg"
            >
              {isLastStep ? "Finalizar" : "Pular"}
              {!isLastStep && <ChevronRight className="ml-1 h-3 w-3" />}
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-2 border-t bg-gray-100 rounded-b-xl">
          <div className="flex justify-center gap-1">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCurrentStep(idx)
                  setTimeout(updateElementPosition, 300)
                }}
                className={`h-1 rounded-full transition-all ${
                  idx === currentStep
                    ? "w-4 bg-[#de4838]"
                    : idx < currentStep
                    ? "w-1 bg-[#de4838]/50"
                    : "w-1 bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}