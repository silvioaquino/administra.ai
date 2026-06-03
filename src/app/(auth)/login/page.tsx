// src/app/(auth)/login/page.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import { Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!formData.email || !formData.password) {
      setError("Preencha todos os campos")
      setLoading(false)
      return
    }

    try {
      console.log("Tentando login com:", formData.email)
      
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
        callbackUrl: "/"
      })

      console.log("Resultado do login:", result)

      if (result?.error) {
        console.error("Erro no login:", result.error)
        setError("Email ou senha inválidos")
      } else if (result?.ok) {
        console.log("Login bem-sucedido, redirecionando...")
        router.push("/")
        router.refresh()
      } else {
        setError("Erro ao fazer login. Tente novamente.")
      }
    } catch (error) {
      console.error("Erro inesperado:", error)
      setError("Erro ao fazer login. Tente novamente.")
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
            <div className="h-22 w-22 rounded-2xl bg-gradient-to-br  flex items-center justify-center shadow-lg overflow-hidden">
              <Image
                src="/logo1.png"
                alt="Logo KaiUp.ai"
                width={80}
                height={80}
                className="object-contain rounded-2xl"
                priority
              />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">KaiUp-Administrator.ai</h1>
          <p className="text-sm text-gray-500 mt-2">
            Faça login para acessar o sistema
          </p>
        </div>

        {/* Formulário */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <Alert className="bg-red-50 border-red-200 rounded-xl">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-sm text-red-700">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    className="pl-9 rounded-lg border-gray-200 focus:ring-[#de4838] focus:border-[#de4838]"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Senha</Label>
                  <Link 
                    href="/forgot-password" 
                    className="text-xs text-[#de4838] hover:text-[#c73d2e] transition-colors"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>
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
              </div>

              <Button 
                type="submit" 
                className="w-full bg-[#de4838] hover:bg-[#c73d2e] text-white rounded-lg py-2.5" 
                disabled={loading} 
                size="lg"
              >
                {loading ? "Entrando..." : "Entrar"}
              </Button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-2 text-gray-400">ou</span>
                </div>
              </div>

              <p className="text-center text-sm text-gray-600">
                Não tem uma conta?{" "}
                <Link href="/register" className="text-[#de4838] font-medium hover:underline">
                  Cadastre-se grátis
                </Link>
              </p>

              <div className="bg-orange-50 rounded-xl p-3 text-center">
                <p className="text-xs text-orange-700">
                  🎉 Teste grátis por 7 dias. Não exige cartão de crédito.
                </p>
              </div>
            </form>
          </div>
        </div>

        {/* Termos */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            Ao fazer login, você concorda com os{" "}
            <Link href="/termos" className="text-[#de4838] hover:underline">
              termos de uso
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}