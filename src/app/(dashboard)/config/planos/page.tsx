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

type PlanWithDetails = Plan & {
  features: string[] | Json;
  popular?: boolean;
};

type Json = string | number | boolean | null | Json[] | { [key: string]: Json }

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#de4838] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-gray-800">Gerenciamento de Plano</h1>
          <p className="text-sm text-gray-500">Gerencie sua assinatura e escolha o melhor plano para o seu negócio.</p>
        </div>

        {/* Alertas de Trial/Assinatura */}
        {isInTrial && (
          <Alert className="mb-6 bg-orange-50 border-orange-200 rounded-xl">
            <Crown className="h-5 w-5 text-orange-600" />
            <AlertTitle className="text-orange-700 font-semibold">Período de Teste Grátis</AlertTitle>
            <AlertDescription className="text-orange-600">
              Seu teste gratuito termina em <strong>{trialDaysLeft} dias</strong>. Aproveite todos os recursos!
              Ao assinar qualquer plano, o tempo restante do teste é somado à sua assinatura.
            </AlertDescription>
          </Alert>
        )}

        {isSubscriptionActive && currentPlan && subscriptionEndDate && (
          <Alert className="mb-6 bg-emerald-50 border-emerald-200 rounded-xl">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <AlertTitle className="text-emerald-700 font-semibold">Assinatura Ativa</AlertTitle>
            <AlertDescription className="text-emerald-700">
              Seu plano <strong>{currentPlan.name}</strong> está ativo até{" "}
              {format(subscriptionEndDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}.
            </AlertDescription>
          </Alert>
        )}

        {!isSubscriptionActive && !isInTrial && (
          <Alert className="mb-6 bg-red-50 border-red-200 rounded-xl">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <AlertTitle className="text-red-700 font-semibold">Assinatura Expirada ou Cancelada</AlertTitle>
            <AlertDescription className="text-red-600">
              Seu plano expirou. Para continuar usando o sistema, renove sua assinatura abaixo.
            </AlertDescription>
          </Alert>
        )}

        {/* Seletor de Período */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="inline-flex rounded-xl bg-gray-100 p-1">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={cn(
                "rounded-lg px-5 py-2 text-sm font-medium transition-all",
                billingPeriod === "monthly"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:bg-gray-200"
              )}
            >
              Mensal
            </button>
            <button
              onClick={() => setBillingPeriod("semiannual")}
              className={cn(
                "rounded-lg px-5 py-2 text-sm font-medium transition-all",
                billingPeriod === "semiannual"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:bg-gray-200"
              )}
            >
              Semestral <span className="ml-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-xs text-emerald-700">-10%</span>
            </button>
            <button
              onClick={() => setBillingPeriod("annual")}
              className={cn(
                "rounded-lg px-5 py-2 text-sm font-medium transition-all",
                billingPeriod === "annual"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:bg-gray-200"
              )}
            >
              Anual <span className="ml-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-xs text-emerald-700">-15%</span>
            </button>
          </div>
          <p className="text-xs text-gray-500">Planos com desconto para períodos mais longos.</p>
        </div>

        {/* Grid de Planos */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-10">
          {plans.map((plan) => {
            const isCurrentPlan = currentPlan?.id === plan.id;
            const periodPrice = getPriceForPeriod(plan);
            const originalPrice = getOriginalPriceForPeriod(plan);
            const hasDiscount = billingPeriod !== "monthly";

            return (
              <div
                key={plan.id}
                className={cn(
                  "relative bg-white rounded-2xl shadow-sm overflow-hidden transition-all duration-200 flex flex-col",
                  isCurrentPlan ? "ring-2 ring-[#de4838] shadow-md" : "hover:shadow-md",
                  plan.popular && !isCurrentPlan && "border-2 border-[#de4838]/20"
                )}
              >
                {plan.popular && !isCurrentPlan && (
                  <div className="absolute top-0 right-6 rounded-b-lg bg-[#de4838] px-3 py-1 text-xs font-medium text-white">
                    Mais Popular
                  </div>
                )}
                {isCurrentPlan && (
                  <div className="absolute top-0 right-6 rounded-b-lg bg-emerald-600 px-3 py-1 text-xs font-medium text-white">
                    Plano Atual
                  </div>
                )}
                
                {/* Header com gradiente */}
                <div className={cn(
                  "p-5 border-b border-gray-100",
                  plan.popular && !isCurrentPlan ? "bg-gradient-to-r from-[#de4838]/5 to-transparent" : ""
                )}>
                  <h3 className="text-xl font-bold text-gray-800">{plan.name}</h3>
                  <p className="text-sm text-gray-500 mt-1 min-h-[40px]">
                    {plan.name === "PDV Básico" && "Venda para entrega, retirada, balcão, mesa e agendado."}
                    {plan.name === "PDV+Robô" && "Tudo do PDV + Robô de pedidos e acesso ao pagamento online."}
                    {plan.name === "PDV Integrado" && "O plano mais completo. Integração com iFood + Robô de pedidos."}
                  </p>
                  <div className="mt-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-gray-800">{formatCurrency(periodPrice)}</span>
                      <span className="text-sm text-gray-500">/{getPeriodLabel()}</span>
                    </div>
                    {hasDiscount && (
                      <p className="mt-1 text-xs text-gray-500">
                        <span className="line-through">{formatCurrency(originalPrice)}</span>
                        <span className="ml-2 font-medium text-emerald-600">
                          Economize {formatCurrency(originalPrice - periodPrice)}
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Features */}
                <div className="flex-1 p-5">
                  <ul className="space-y-2">
                    {(plan.features as string[]).slice(0, 8).map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                    {(plan.features as string[]).length > 8 && (
                      <li className="text-xs text-gray-400 pt-2">+{(plan.features as string[]).length - 8} outros recursos</li>
                    )}
                  </ul>
                </div>

                {/* Footer */}
                <div className="p-5 pt-0 border-t border-gray-100 mt-4">
                  <Button
                    className="w-full rounded-lg"
                    variant={isCurrentPlan ? "outline" : "default"}
                    disabled={isCurrentPlan || loading}
                    onClick={() => handleSubscribe(plan.id)}
                  >
                    {isCurrentPlan ? "Plano Atual" : `Assinar ${plan.name}`}
                  </Button>
                  <p className="text-center text-xs text-gray-400 mt-3">Sem fidelidade, cancele quando quiser.</p>
                </div>
              </div>
            );
          })}
        </div>

        <Separator className="bg-gray-200 my-8" />

        {/* Método de Pagamento */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-800">Método de Pagamento</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Cartão de Crédito */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-gray-50 p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-800">Cartão de Crédito</h3>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => alert("Redirecionar para cadastro de cartão")}
                    className="rounded-lg border-gray-200"
                  >
                    Cadastrar
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mt-1">Cadastre seu cartão para pagamentos recorrentes. Cancele quando quiser.</p>
              </div>
              {false && (
                <div className="p-5">
                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-sm font-medium text-gray-800">**** **** **** 4242</p>
                    <p className="text-xs text-gray-500 mt-1">Vencimento: 12/2028</p>
                  </div>
                  <Button variant="link" className="mt-2 h-auto p-0 text-red-500">
                    Remover cartão
                  </Button>
                </div>
              )}
            </div>

            {/* Pix */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-gray-50 p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-emerald-600" />
                    <h3 className="font-semibold text-gray-800">Pix</h3>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={handleGeneratePix}
                    className="rounded-lg border-gray-200"
                  >
                    Gerar código Pix
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mt-1">Renove sua assinatura usando QR Code ou Pix copia e cola.</p>
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
            <div className="relative max-w-md w-full rounded-2xl bg-white shadow-xl animate-in fade-in zoom-in duration-200">
              <button
                onClick={() => setShowPixModal(false)}
                className="absolute right-4 top-4 rounded-full p-1 hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
              <div className="p-6 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="rounded-2xl bg-gray-100 p-4">
                    <div className="flex h-32 w-32 items-center justify-center bg-white rounded-xl">
                      <div className="h-28 w-28 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 opacity-20" />
                    </div>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Pague com Pix</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Escaneie o QR Code com o celular ou copie o código Pix
                </p>
                <p className="mt-4 text-2xl font-bold text-emerald-600">
                  {formatCurrency(isSubscriptionActive ? currentPlan?.price || 49.9 : 49.9)}
                </p>
                <Button
                  onClick={handleCopyPixCode}
                  className="mt-4 w-full gap-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg"
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
                <p className="mt-4 text-xs text-gray-400">
                  Após a confirmação, o pagamento pode levar até 1 minuto para ser processado.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}