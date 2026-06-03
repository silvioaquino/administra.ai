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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[#de4838] to-[#de4838]/80 flex items-center justify-center shadow-lg">
              <Store className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Recuperar Senha</h1>
          <p className="text-sm text-gray-500 mt-2">
            Enviaremos um link para redefinir sua senha
          </p>
        </div>

        {/* Formulário */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 md:p-8">
            {success ? (
              <div className="space-y-4">
                <Alert className="bg-green-50 border-green-200 rounded-xl">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-sm text-green-700">
                    Enviamos um link de recuperação para <strong>{email}</strong>. 
                    Verifique sua caixa de entrada e spam.
                  </AlertDescription>
                </Alert>
                <Button
                  type="button"
                  onClick={() => window.location.href = "/login"}
                  className="w-full bg-[#de4838] hover:bg-[#c73d2e] text-white rounded-lg py-2.5"
                >
                  Voltar para o login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <Alert className="bg-red-50 border-red-200 rounded-xl">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-sm text-red-700">{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                    E-mail cadastrado
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      type="email"
                      placeholder="seu@email.com"
                      className="pl-9 rounded-lg border-gray-200 focus:ring-[#de4838] focus:border-[#de4838]"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-[#de4838] hover:bg-[#c73d2e] text-white rounded-lg py-2.5" 
                  disabled={loading}
                  size="lg"
                >
                  {loading ? "Enviando..." : "Enviar link de recuperação"}
                </Button>

                <div className="text-center">
                  <Link 
                    href="/login" 
                    className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#de4838] transition-colors"
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