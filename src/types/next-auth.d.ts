// src/types/next-auth.d.ts
import "next-auth"

declare module "next-auth" {
  interface User {
    id: string
    establishment?: string
    whatsapp?: string
    segmento?: string
    trialEndsAt?: string
  }

  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      establishment?: string
      whatsapp?: string
      segmento?: string
      trialEndsAt?: string
      isInTrial?: boolean
    }
  }
}