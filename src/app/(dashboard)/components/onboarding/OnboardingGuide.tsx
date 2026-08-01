// src/components/onboarding/OnboardingGuide.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { 
  ChevronRight, 
  ChevronLeft, 
  X,
  Store,
  Package,
  Calculator,
  TrendingUp,
  DollarSign,
  Users,
  Target,
  Rocket,
  Sparkles,
  Percent,
  CheckCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"

export interface Step {
  id: number
  title: string
  description: string
  icon: React.ElementType
  action: {
    label: string
    href: string
    fieldSelector?: string
  }
  tips?: string[]
  checklist?: string[]
}

const steps: Step[] = [
  {
    id: 1,
    title: "Revise a Configuração da sua Loja",
    description: "Verifique os dados básicos do seu estabelecimento.",
    icon: Store,
    action: {
      label: "Configurar Loja",
      href: "/config/loja",
      fieldSelector: "form, .config-form, input, select"
    },
    tips: ["Nome da loja", "WhatsApp comercial", "Segmento do negócio", "Endereço completo"],
    checklist: ["Nome da loja", "WhatsApp comercial", "Segmento do negócio", "Endereço completo"]
  },
  {
    id: 2,
    title: "Defina Despesas Fixas",
    description: "Configure os custos mensais do seu negócio.",
    icon: DollarSign,
    action: {
      label: "Configurar Despesas Fixas",
      href: "/planejamento/editar/despesas-fixas",
      fieldSelector: "table, .despesas-table, input"
    },
    tips: ["Aluguel, energia, água, internet", "Salários", "Software e sistemas"],
    checklist: ["Aluguel", "Contas de água, luz, internet", "Folha salarial", "Impostos"]
  },
  {
    id: 3,
    title: "Defina Despesas Variáveis",
    description: "Configure as taxas de suas maquininhas.",
    icon: Percent,
    action: {
      label: "Configurar Despesas Variáveis",
      href: "/planejamento/editar/despesas-variaveis",
      fieldSelector: "form, input, select"
    },
    tips: ["Taxa de Débito e Crédito", "Taxa de Voucher", "Aluguel das Maquininhas"],
    checklist: ["Taxa de Débito", "Taxa de Crédito", "Taxa de Voucher", "Aluguel das Maquininhas"]
  },
  {
    id: 4,
    title: "Configure seus Funcionários",
    description: "Cadastre seus colaboradores.",
    icon: Users,
    action: {
      label: "Cadastrar Funcionários",
      href: "/planejamento/editar/funcionarios",
      fieldSelector: "table, input"
    },
    tips: ["Nome do funcionário", "Salário bruto mensal"],
    checklist: ["Todos os funcionários cadastrados", "Salários corretos", "Provisões configuradas"]
  },
  {
    id: 5,
    title: "Defina Metas e Taxas",
    description: "Configure metas de faturamento.",
    icon: TrendingUp,
    action: {
      label: "Configurar Metas",
      href: "/planejamento/editar/metas-mensais",
      fieldSelector: "table, input"
    },
    tips: ["Meta diária de faturamento", "Dias trabalhados", "Lucro desejado"],
    checklist: ["Metas mensais definidas", "Taxas de cartão configuradas", "Lucro desejado definido"]
  },
  {
    id: 6,
    title: "Cadastre seus Produtos",
    description: "Adicione os produtos que você vende.",
    icon: Package,
    action: {
      label: "Cadastrar Produtos",
      href: "/nfe/produtos/novo",
      fieldSelector: "form, input"
    },
    tips: ["Nome do produto", "Preço de venda", "Unidade de medida"],
    checklist: ["Nome e preço", "Unidade de medida", "Fornecedor", "Estoque inicial"]
  },
  {
    id: 7,
    title: "Crie suas Fichas Técnicas",
    description: "Monte as receitas com os ingredientes.",
    icon: Calculator,
    action: {
      label: "Criar Ficha Técnica",
      href: "/fichas-tecnicas/nova",
      fieldSelector: "form, input, select"
    },
    tips: ["Liste todos os ingredientes", "Informe as quantidades corretas"],
    checklist: ["Nome do prato", "Ingredientes", "Preço de venda", "Rendimento"]
  },
  {
    id: 8,
    title: "Comece a Usar!",
    description: "Tudo pronto! Agora você pode começar.",
    icon: Rocket,
    action: {
      label: "Ir para Dashboard",
      href: "/"
    }
  }
]

interface OnboardingGuideProps {
  onComplete?: () => void
  onSkip?: () => void
}

export function OnboardingGuide({ onComplete, onSkip }: OnboardingGuideProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(true)
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [isNavigating, setIsNavigating] = useState(false)
  const [returnStepId, setReturnStepId] = useState<number | null>(null)
  const [elementPosition, setElementPosition] = useState<DOMRect | null>(null)
  const [elementFound, setElementFound] = useState(false)
  const [showHighlight, setShowHighlight] = useState(false)

  const step = steps[currentStep]
  const progress = ((currentStep + 1) / steps.length) * 100
  const isLastStep = currentStep === steps.length - 1

  // Função para encontrar e destacar o elemento
  const updateElementPosition = useCallback(() => {
    if (!step?.action?.fieldSelector || !isOpen) {
      setElementFound(false)
      setElementPosition(null)
      return
    }

    const element = document.querySelector(step.action.fieldSelector)
    
    if (element) {
      const rect = element.getBoundingClientRect()
      setElementPosition(rect)
      setElementFound(true)
      setShowHighlight(true)
      element.scrollIntoView({ behavior: "smooth", block: "center" })
    } else {
      setElementFound(false)
      setElementPosition(null)
    }
  }, [step, isOpen])

  // Atualizar posição quando a página mudar
  useEffect(() => {
    if (!isOpen || !step) return

    const timer = setTimeout(updateElementPosition, 500)
    
    window.addEventListener("resize", updateElementPosition)
    window.addEventListener("scroll", updateElementPosition)
    
    return () => {
      clearTimeout(timer)
      window.removeEventListener("resize", updateElementPosition)
      window.removeEventListener("scroll", updateElementPosition)
    }
  }, [updateElementPosition, isOpen, step])

  // Detectar quando volta da configuração (apenas para o passo atual)
  useEffect(() => {
    // Se está aguardando retorno e voltou para o dashboard
    if (isNavigating && pathname === "/" && returnStepId === step.id) {
      // Pequeno delay para garantir que a página carregou
      const timer = setTimeout(() => {
        // Marcar passo como completado
        if (!completedSteps.includes(step.id)) {
          setCompletedSteps([...completedSteps, step.id])
        }
        
        // Avançar para o próximo passo
        if (currentStep < steps.length - 1) {
          setCurrentStep(currentStep + 1)
        } else {
          // Finalizar onboarding se for o último passo
          localStorage.setItem("onboarding_completed", "true")
          setIsOpen(false)
          onComplete?.()
        }
        
        setIsNavigating(false)
        setReturnStepId(null)
        setShowHighlight(false)
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [pathname, isNavigating, currentStep, completedSteps, step.id, onComplete, steps.length])

  const handleNext = () => {
    if (isLastStep) {
      localStorage.setItem("onboarding_completed", "true")
      setIsOpen(false)
      onComplete?.()
      router.push(step.action.href)
    } else if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
      setShowHighlight(false)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      setShowHighlight(false)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handleAction = () => {
    // Marcar como navegando
    setIsNavigating(true)
    setReturnStepId(step.id)
    
    // Navegar para a página de configuração
    router.push(step.action.href)
  }

  const skipOnboarding = () => {
    localStorage.setItem("onboarding_completed", "true")
    setIsOpen(false)
    onSkip?.()
    onComplete?.()
  }

  // Resetar highlight quando o passo mudar
  useEffect(() => {
    setShowHighlight(false)
    setElementFound(false)
  }, [currentStep])

  if (!isOpen) return null

  const IconComponent = step.icon
  const isStepCompleted = completedSteps.includes(step.id)

  return (
    <>
      {/* Overlay escuro apenas quando há highlight */}
      {(showHighlight && elementFound) && (
        <div className="fixed inset-0 z-40 bg-black/70" />
      )}

      {/* Highlight do elemento */}
      {(showHighlight && elementFound && elementPosition) && (
        <div
          className="fixed z-50 rounded-lg ring-4 ring-[#de4838] ring-offset-2 transition-all duration-300 pointer-events-none"
          style={{
            top: elementPosition.top - 8,
            left: elementPosition.left - 8,
            width: elementPosition.width + 16,
            height: elementPosition.height + 16,
          }}
        />
      )}

      {/* Modal de Onboarding */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto pointer-events-none">
        <div className="w-full max-w-2xl mx-auto shadow-2xl animate-fade-in pointer-events-auto">
          <Card className="relative">
            {/* Header */}
            <div className="p-4 border-b bg-gradient-to-r from-white to-gray-50 sticky top-0 bg-surface z-10 rounded-t-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#de4838] to-[#de4838]/80 shadow-sm">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <h2 className="text-lg font-semibold text-white">Guia de Configuração</h2>
                </div>
                <button
                  onClick={skipOnboarding}
                  className="rounded-full p-1 hover:bg-surface-2 transition-colors"
                >
                  <X className="h-4 w-4 text-muted-foreground/70" />
                </button>
              </div>
              
              {/* Progresso */}
              <div className="flex items-center gap-3">
                <Progress value={progress} className="h-1.5 flex-1" />
                <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Passo {currentStep + 1} de {steps.length}
              </p>
            </div>

            {/* Conteúdo */}
            <CardContent className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
              {/* Ícone e título */}
              <div className="text-center space-y-3">
                <div className="flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#de4838]/10 to-[#de4838]/5">
                    <IconComponent className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <h3 className="text-xl font-bold text-white">{step.title}</h3>
                  {isStepCompleted && (
                    <CheckCircle className="h-5 w-5 text-success" />
                  )}
                </div>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </div>

              {/* Dicas */}
              {step.tips && step.tips.length > 0 && (
                <div className="bg-info/5 rounded-xl p-4 border border-blue-100">
                  <p className="text-sm font-medium text-blue-800 mb-2">💡 Dicas importantes:</p>
                  <ul className="space-y-1">
                    {step.tips.map((tip, idx) => (
                      <li key={idx} className="text-xs text-info flex items-start gap-2">
                        <span className="text-info">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Checklist */}
              {step.checklist && (
                <div className="bg-success/5 rounded-xl p-4 border border-emerald-100">
                  <p className="text-sm font-medium text-success mb-2">✓ Checklist:</p>
                  <ul className="space-y-1">
                    {step.checklist.map((item, idx) => (
                      <li key={idx} className="text-xs text-success flex items-start gap-2">
                        <span className="text-success">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Instrução do Highlight */}
              {step.action.fieldSelector && (
                <div className="bg-warning/5 rounded-xl p-3 border border-amber-100">
                  <p className="text-xs text-warning flex items-center gap-2">
                    <Target className="h-3 w-3" />
                    Ao clicar no botão abaixo, o campo que você precisa editar será destacado em vermelho.
                  </p>
                </div>
              )}

              {/* Botões de ação */}
              <div className="flex gap-3 pt-4">
                {currentStep > 0 && (
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    className="flex-1 rounded-xl border-border hover:border-primary h-11"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Voltar
                  </Button>
                )}
                <Button
                  onClick={handleAction}
                  className="flex-1 bg-primary hover:bg-primary/90 rounded-xl h-11 text-white"
                >
                  {step.action.label}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={handleNext}
                  className="flex-1 rounded-xl border-border hover:border-primary h-11"
                >
                  {isLastStep ? "Finalizar" : "Pular"}
                  {!isLastStep && <ChevronRight className="ml-2 h-4 w-4" />}
                </Button>
              </div>

              {/* Skip */}
              <div className="text-center">
                <button
                  onClick={skipOnboarding}
                  className="text-xs text-muted-foreground/70 hover:text-muted-foreground transition-colors"
                >
                  Pular tutorial e configurar depois
                </button>
              </div>
            </CardContent>

            {/* Footer */}
            <div className="p-4 border-t bg-surface-2 rounded-b-xl">
              <div className="flex justify-center gap-1.5">
                {steps.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentStep(idx)
                      setShowHighlight(false)
                      window.scrollTo({ top: 0, behavior: "smooth" })
                    }}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === currentStep
                        ? "w-6 bg-primary"
                        : idx < currentStep
                        ? "w-1.5 bg-primary/50"
                        : "w-1.5 bg-surface-2"
                    }`}
                  />
                ))}
              </div>
              <p className="text-center text-xs text-muted-foreground/70 mt-3">
                Complete cada etapa para configurar seu sistema
              </p>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}