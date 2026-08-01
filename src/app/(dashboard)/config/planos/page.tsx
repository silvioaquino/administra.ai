// src/app/(dashboard)/config/planos/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CreditCard,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Crown,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  X,
  Loader2,
  ArrowRight,
  Shield,
  Smartphone,
  Globe,
  Headphones,
  Sparkles
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatCurrency } from "@/lib/utils";
import { Plan, Subscription } from "@prisma/client";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";

type PlanWithDetails = Plan & {
  features: string[] | Json;
  popular?: boolean;
};

type Json = string | number | boolean | null | Json[] | { [key: string]: Json }

// Lista de módulos do menu do sistema (mesma lista da Sidebar)
const menuOptions = [
  "Dashboard",
  "Notas Fiscais",
  "Livro Diário",
  "Planejamento",
  "Fichas Técnicas",
  "Contas Bancárias",
  "Fluxo de Caixa",
  "Fechamento Mensal",
  "Notas Processadas",
  "Abertura/Fechamento Caixa Diário",
  "Integração com o Cardapio.ai",
];

// Dados mockados para desenvolvimento (substituir pela API real)
const mockPlans: PlanWithDetails[] = [
  {
    id: "plan_basico",
    name: "PDV Básico",
    price: 49.9,
    features: [
      "Integração iFood",
      "Pedidos ilimitados",
      "Gestor de pedidos",
      "Impressão automática",
      "Cardápio QR - Mesa",
      "Criador de cupons",
    ],
    isActive: true,
    stripePriceId: "price_basico",
    createdAt: new Date(),
    popular: false,
  },
  {
    id: "plan_robot",
    name: "PDV+Robô",
    price: 64.9,
    features: [
      "Integração iFood",
      "Robô próprio no WhatsApp",
      "Pagamento online",
      "Pix Estático",
      "Gestor de pedidos",
      "Pedidos ilimitados",
      "Central de alertas",
      "Impressão automática",
      "Cardápio QR - Mesa",
      "Criador de cupons",
      "Facebook Pixel",
      "Google Tag Manager",
      "Produtos ilimitados",
      "Recado no carrinho",
      "Conexão de domínio",
      "Agendamento",
      "Gestor de área de entrega",
    ],
    isActive: true,
    stripePriceId: "price_robot",
    createdAt: new Date(),
    popular: true,
  },
  {
    id: "plan_integrado",
    name: "PDV Integrado",
    price: 99.9,
    features: [
      "Integração iFood",
      "Robô próprio no WhatsApp",
      "Pagamento online",
      "Pix Estático",
      "Gestor de pedidos",
      "Pedidos ilimitados",
      "Central de alertas",
      "Impressão automática",
      "Cardápio QR - Mesa",
      "Criador de cupons",
      "Facebook Pixel",
      "Google Tag Manager",
      "Produtos ilimitados",
      "Recado no carrinho",
      "Conexão de domínio",
      "Agendamento",
      "Gestor de área de entrega",
      "Suporte prioritário",
      "Múltiplos usuários",
    ],
    isActive: true,
    stripePriceId: "price_integrado",
    createdAt: new Date(),
    popular: false,
  },
];

// Dados mockados da assinatura do usuário
const mockSubscription: Subscription & { plan: Plan } = {
  id: "sub_123",
  userId: "user_123",
  planId: "plan_robot",
  status: "active",
  startDate: new Date("2025-01-01"),
  endDate: new Date("2026-01-01"),
  createdAt: new Date(),
  updatedAt: new Date(),
  plan: mockPlans.find((p) => p.id === "plan_robot")!,
};

export default function PlanosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "semiannual" | "annual">("monthly");
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<PlanWithDetails[]>([]);
  const [subscription, setSubscription] = useState<(Subscription & { plan: Plan }) | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);
  const [showPixModal, setShowPixModal] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      setPlans(mockPlans);
      setSubscription(mockSubscription);
    }
  }, [session]);

  // Exibe apenas o plano PDV+Robô na tela; os demais planos permanecem no array (mockPlans) para uso futuro
  const activePlanId = "plan_robot";
  const visiblePlans = plans.filter((p) => p.id === activePlanId);

  const isInTrial = session?.user?.isInTrial;
  const trialEndsAt = session?.user?.trialEndsAt ? new Date(session.user.trialEndsAt) : null;
  const trialDaysLeft = trialEndsAt ? differenceInDays(trialEndsAt, new Date()) : 0;
  const isSubscriptionActive = subscription?.status === "active";
  const currentPlan = subscription?.plan;
  const subscriptionEndDate = subscription?.endDate ? new Date(subscription.endDate) : null;

  const getPriceForPeriod = (plan: PlanWithDetails) => {
    if (billingPeriod === "monthly") return plan.price;
    if (billingPeriod === "semiannual") return plan.price * 6 * 0.9;
    return plan.price * 12 * 0.85;
  };

  const getOriginalPriceForPeriod = (plan: PlanWithDetails) => {
    if (billingPeriod === "monthly") return plan.price;
    if (billingPeriod === "semiannual") return plan.price * 6;
    return plan.price * 12;
  };

  const getPeriodLabel = () => {
    if (billingPeriod === "monthly") return "mês";
    if (billingPeriod === "semiannual") return "6 meses";
    return "12 meses";
  };

  const handleSubscribe = async (planId: string) => {
    setLoading(true);
    console.log("Assinar plano:", planId, billingPeriod);
    alert(`Redirecionando para checkout do plano ${planId} (${billingPeriod})`);
    setLoading(false);
  };

  const handleGeneratePix = () => {
    setShowPixModal(true);
    setCopiedPix(false);
  };

  const handleCopyPixCode = () => {
    navigator.clipboard.writeText("00020126360014br.gov.bcb.pix0114+556198425966352040000530398654060.005802BR5913Empório Sabor6009SAO PAULO62070503***6304E2D3");
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 3000);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-surface-2 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageContainer>
        <PageHeader
          title="Gerenciamento de Plano"
          subtitle="Gerencie sua assinatura e escolha o melhor plano para o seu negócio."
        />

        {/* Alertas de Trial/Assinatura */}
        {isInTrial && (
          <Alert className="mb-6 bg-warning/5 border-orange-200 rounded-xl">
            <Crown className="h-5 w-5 text-warning" />
            <AlertTitle className="text-warning font-semibold">Período de Teste Grátis</AlertTitle>
            <AlertDescription className="text-warning">
              Seu teste gratuito termina em <strong>{trialDaysLeft} dias</strong>. Aproveite todos os recursos!
              Ao assinar qualquer plano, o tempo restante do teste é somado à sua assinatura.
            </AlertDescription>
          </Alert>
        )}

        {isSubscriptionActive && currentPlan && subscriptionEndDate && (
          <Alert className="mb-6 bg-success/5 border-success/30 rounded-xl">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <AlertTitle className="text-success font-semibold">Assinatura Ativa</AlertTitle>
            <AlertDescription className="text-success">
              Seu plano <strong>{currentPlan.name}</strong> está ativo até{" "}
              {format(subscriptionEndDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}.
            </AlertDescription>
          </Alert>
        )}

        {!isSubscriptionActive && !isInTrial && (
          <Alert className="mb-6 bg-destructive/5 border-destructive/30 rounded-xl">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <AlertTitle className="text-destructive font-semibold">Assinatura Expirada ou Cancelada</AlertTitle>
            <AlertDescription className="text-destructive">
              Seu plano expirou. Para continuar usando o sistema, renove sua assinatura abaixo.
            </AlertDescription>
          </Alert>
        )}

        {/* Seletor de Período */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="inline-flex rounded-xl bg-surface-2 p-1">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={cn(
                "rounded-lg px-5 py-2 text-sm font-medium transition-all",
                billingPeriod === "monthly"
                  ? "bg-surface text-gray-900 shadow-sm"
                  : "text-muted-foreground hover:bg-surface-2"
              )}
            >
              Mensal
            </button>
            <button
              onClick={() => setBillingPeriod("semiannual")}
              className={cn(
                "rounded-lg px-5 py-2 text-sm font-medium transition-all",
                billingPeriod === "semiannual"
                  ? "bg-surface text-gray-900 shadow-sm"
                  : "text-muted-foreground hover:bg-surface-2"
              )}
            >
              Semestral <span className="ml-1 rounded-full bg-success/10 px-1.5 py-0.5 text-xs text-success">-10%</span>
            </button>
            <button
              onClick={() => setBillingPeriod("annual")}
              className={cn(
                "rounded-lg px-5 py-2 text-sm font-medium transition-all",
                billingPeriod === "annual"
                  ? "bg-surface text-gray-900 shadow-sm"
                  : "text-muted-foreground hover:bg-surface-2"
              )}
            >
              Anual <span className="ml-1 rounded-full bg-success/10 px-1.5 py-0.5 text-xs text-success">-15%</span>
            </button>
          </div>
          <p className="text-xs text-muted-foreground">Planos com desconto para períodos mais longos.</p>
        </div>

        {/* Grid de Planos */}
        <div className="flex justify-center mb-10">
          {visiblePlans.map((plan) => {
            const isCurrentPlan = currentPlan?.id === plan.id;
            const periodPrice = getPriceForPeriod(plan);
            const originalPrice = getOriginalPriceForPeriod(plan);
            const hasDiscount = billingPeriod !== "monthly";

            return (
              <div
                key={plan.id}
                className={cn(
                  "relative w-full max-w-xl bg-surface rounded-2xl shadow-sm overflow-hidden transition-all duration-200 flex flex-col",
                  isCurrentPlan ? "ring-2 ring-[#de4838] shadow-md" : "hover:shadow-md",
                  plan.popular && !isCurrentPlan && "border-2 border-primary/20"
                )}
              >
                {plan.popular && !isCurrentPlan && (
                  <div className="absolute top-0 right-6 rounded-b-lg bg-primary px-3 py-1 text-xs font-medium text-white">
                    Mais Popular
                  </div>
                )}
                {isCurrentPlan && (
                  <div className="absolute top-0 right-6 rounded-b-lg bg-success px-3 py-1 text-xs font-medium text-white">
                    Plano Atual
                  </div>
                )}
                
                {/* Header com gradiente */}
                <div className={cn(
                  "p-5 border-b border-border",
                  plan.popular && !isCurrentPlan ? "bg-gradient-to-r from-[#de4838]/5 to-transparent" : ""
                )}>
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1 min-h-[40px]">
                    {plan.name === "Plano Básico" && "Venda para entrega, retirada, balcão, mesa e agendado."}
                    {plan.name === "Plano Robô" && "Tudo do PDV + Robô de pedidos e acesso ao pagamento online."}
                  </p>
                  <div className="mt-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-white">{formatCurrency(periodPrice)}</span>
                      <span className="text-sm text-muted-foreground">/{getPeriodLabel()}</span>
                    </div>
                    {hasDiscount && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        <span className="line-through">{formatCurrency(originalPrice)}</span>
                        <span className="ml-2 font-medium text-success">
                          Economize {formatCurrency(originalPrice - periodPrice)}
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Features */}
                <div className="flex-1 p-5">
                  <ul className="space-y-2">
                    {menuOptions.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Footer */}
                <div className="p-5 pt-0 border-t border-border mt-4">
                  <Button
                    className="w-full rounded-lg"
                    variant={isCurrentPlan ? "outline" : "default"}
                    disabled={isCurrentPlan || loading}
                    onClick={() => handleSubscribe(plan.id)}
                  >
                    {isCurrentPlan ? "Plano Atual" : `Assinar ${plan.name}`}
                  </Button>
                  <p className="text-center text-xs text-muted-foreground/70 mt-3">Sem fidelidade, cancele quando quiser.</p>
                </div>
              </div>
            );
          })}
        </div>

        <Separator className="bg-surface-2 my-8" />

        {/* Método de Pagamento */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-white">Método de Pagamento</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Cartão de Crédito */}
            <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-surface-2 p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-info" />
                    <h3 className="font-semibold text-white">Cartão de Crédito</h3>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => alert("Redirecionar para cadastro de cartão")}
                    className="rounded-lg border-border"
                  >
                    Cadastrar
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Cadastre seu cartão para pagamentos recorrentes. Cancele quando quiser.</p>
              </div>
              {false && (
                <div className="p-5">
                  <div className="rounded-xl bg-surface-2 p-3">
                    <p className="text-sm font-medium text-white">**** **** **** 4242</p>
                    <p className="text-xs text-muted-foreground mt-1">Vencimento: 12/2028</p>
                  </div>
                  <Button variant="link" className="mt-2 h-auto p-0 text-destructive">
                    Remover cartão
                  </Button>
                </div>
              )}
            </div>

            {/* Pix */}
            <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-surface-2 p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-success" />
                    <h3 className="font-semibold text-white">Pix</h3>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={handleGeneratePix}
                    className="rounded-lg border-border"
                  >
                    Gerar código Pix
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Renove sua assinatura usando QR Code ou Pix copia e cola.</p>
              </div>
            </div>
          </div>

          {/* Botão Cancelar Assinatura */}
          {isSubscriptionActive && (
            <div className="flex justify-end mt-4">
              <Button
                variant="destructive"
                onClick={() => {
                  if (confirm("Tem certeza que deseja cancelar sua assinatura?")) {
                    alert("Assinatura cancelada");
                  }
                }}
                className="rounded-lg"
              >
                Cancelar assinatura
              </Button>
            </div>
          )}
        </div>

        {/* Modal Pix */}
        {showPixModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="relative max-w-md w-full rounded-2xl bg-surface shadow-xl animate-in fade-in zoom-in duration-200">
              <button
                onClick={() => setShowPixModal(false)}
                className="absolute right-4 top-4 rounded-full p-1 hover:bg-surface-2 transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground/70" />
              </button>
              <div className="p-6 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="rounded-2xl bg-surface-2 p-4">
                    <div className="flex h-32 w-32 items-center justify-center bg-surface rounded-xl">
                      <div className="h-28 w-28 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 opacity-20" />
                    </div>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-white">Pague com Pix</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Escaneie o QR Code com o celular ou copie o código Pix
                </p>
                <p className="mt-4 text-2xl font-bold text-success">
                  {formatCurrency(isSubscriptionActive ? currentPlan?.price || 49.9 : 49.9)}
                </p>
                <Button
                  onClick={handleCopyPixCode}
                  className="mt-4 w-full gap-2 bg-success hover:bg-success/90 rounded-lg"
                >
                  {copiedPix ? (
                    <>
                      <Check className="h-4 w-4" /> Código copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" /> Copiar código Pix
                    </>
                  )}
                </Button>
                <p className="mt-4 text-xs text-muted-foreground/70">
                  Após a confirmação, o pagamento pode levar até 1 minuto para ser processado.
                </p>
              </div>
            </div>
          </div>
        )}
      </PageContainer>
    </div>
  );
}