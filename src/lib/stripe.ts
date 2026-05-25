// src/lib/stripe.ts
import Stripe from "stripe"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-10-28.acacia",
  appInfo: {
    name: "Emporio do Sabor",
    version: "2.0.0",
  },
})

export const PLANS = [
  {
    id: "basic",
    name: "Plano Básico",
    price: 49.90,
    priceId: process.env.STRIPE_BASIC_PRICE_ID,
    features: [
      "Até 500 produtos",
      "Até 100 fichas técnicas",
      "Relatórios básicos",
      "1 usuário",
    ],
  },
  {
    id: "professional",
    name: "Plano Profissional",
    price: 99.90,
    priceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID,
    features: [
      "Produtos ilimitados",
      "Fichas técnicas ilimitadas",
      "Relatórios avançados",
      "Até 5 usuários",
      "Suporte prioritário",
      "API de integração",
    ],
  },
]

export const TRIAL_DAYS = 14