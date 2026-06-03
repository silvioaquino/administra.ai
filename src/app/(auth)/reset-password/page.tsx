// src/app/(auth)/reset-password/page.tsx
"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Store, Lock, Eye, EyeOff, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Componente interno que usa useSearchParams
function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: ""
  })

  useEffect(() => {
    if (!token) {
      setError("Link inválido ou expirado. Solicite uma nova redefinição de senha.")
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!formData.password || !formData.confirmPassword) {
      setError("Preencha todos os campos")
      setLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("As senhas não coincidem")
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: formData.password })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          router.push("/login")
        }, 3000)
      } else {
        setError(data.message || "Erro ao redefinir a senha")
      }
    } catch (error) {
      console.error("Erro:", error)
      setError("Erro ao redefinir a senha. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  // Se não tem token e não está em sucesso, mostra erro
  if (!token && !success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden p-6 md:p-8">
            <Alert className="bg-red-50 border-red-200 rounded-xl mb-4">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-sm text-red-700">
                Link inválido ou expirado. Solicite uma nova redefinição de senha.
              </AlertDescription>
            </Alert>
            <Button
              onClick={() => router.push("/forgot-password")}
              className="w-full bg-[#de4838] hover:bg-[#c73d2e] text-white rounded-lg"
            >
              Solicitar novo link
            </Button>
            <div className="text-center mt-4">
              <Link 
                href="/login" 
                className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#de4838] transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para o login
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
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
          <h1 className="text-2xl font-bold text-gray-800">Redefinir Senha</h1>
          <p className="text-sm text-gray-500 mt-2">
            Digite sua nova senha
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
                    Senha redefinida com sucesso! Redirecionando para o login...
                  </AlertDescription>
                </Alert>
                <Button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="w-full bg-[#de4838] hover:bg-[#c73d2e] text-white rounded-lg py-2.5"
                >
                  Ir para o login
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
                    Nova senha
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-9 pr-9 rounded-lg border-gray-200 focus:ring-[#de4838] focus:border-[#de4838]"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    A senha deve ter no mínimo 6 caracteres
                  </p>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Confirmar nova senha
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-9 pr-9 rounded-lg border-gray-200 focus:ring-[#de4838] focus:border-[#de4838]"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-[#de4838] hover:bg-[#c73d2e] text-white rounded-lg py-2.5" 
                  disabled={loading}
                  size="lg"
                >
                  {loading ? "Redefinindo..." : "Redefinir senha"}
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

// Componente principal com Suspense
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden p-6 md:p-8 text-center">
            <div className="animate-pulse">
              <div className="h-8 w-32 bg-gray-200 rounded mx-auto mb-4"></div>
              <div className="h-4 w-48 bg-gray-200 rounded mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}