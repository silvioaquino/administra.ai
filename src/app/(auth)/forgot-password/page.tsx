// src/app/(auth)/forgot-password/page.tsx
"use client"

import { useState } from "react"
import Link from "next/link"
import { Store, Mail, ArrowLeft, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    if (!email) {
      setError("Digite seu e-mail")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
      } else {
        setError(data.message || "Erro ao enviar o e-mail de recuperação")
      }
    } catch (error) {
      console.error("Erro:", error)
      setError("Erro ao processar sua solicitação. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-2xl bg-linear-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
              <Store className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Recuperar Senha</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Enviaremos um link para redefinir sua senha
          </p>
        </div>

        {/* Formulário */}
        <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 md:p-8">
            {success ? (
              <div className="space-y-4">
                <Alert className="bg-success/10 border-success/30 rounded-xl">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <AlertDescription className="text-sm text-success">
                    Enviamos um link de recuperação para <strong>{email}</strong>. 
                    Verifique sua caixa de entrada e spam.
                  </AlertDescription>
                </Alert>
                <Button
                  type="button"
                  onClick={() => window.location.href = "/login"}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg py-2.5"
                >
                  Voltar para o login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <Alert className="bg-red-50 border-red-200 rounded-xl">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <AlertDescription className="text-sm text-destructive">{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    E-mail cadastrado
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="seu@email.com"
                      className="pl-9 rounded-lg border-border focus:ring-primary focus:border-primary"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg py-2.5" 
                  disabled={loading}
                  size="lg"
                >
                  {loading ? "Enviando..." : "Enviar link de recuperação"}
                </Button>

                <div className="text-center">
                  <Link 
                    href="/login" 
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar para o login
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}