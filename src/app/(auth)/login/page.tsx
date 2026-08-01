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
    <div className="relative min-h-screen bg-background flex items-center justify-center p-4 overflow-hidden">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-5">
            <div className="h-20 w-20 rounded-2xl border border-border bg-card flex items-center justify-center shadow-lg overflow-hidden">
              <Image
                src="/logo1.png"
                alt="Logo SeuGerente"
                width={72}
                height={72}
                className="object-contain rounded-xl"
                priority
              />
            </div>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">SeuGerente.ai</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Faça login para acessar o sistema
          </p>
        </div>

        {/* Formulário */}
        <div className="surface-card rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
          <div className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <Alert variant="destructive" className="rounded-xl">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-1.5">
                <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-[0.12em]">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    className="pl-9 h-11 rounded-lg bg-background"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-[0.12em]">Senha</Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-primary hover:underline transition-colors"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-9 pr-9 h-11 rounded-lg bg-background"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 rounded-lg"
                disabled={loading}
                size="lg"
              >
                {loading ? "Entrando..." : "Entrar"}
              </Button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-2 text-muted-foreground">ou</span>
                </div>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                Não tem uma conta?{" "}
                <Link href="/register" className="text-primary font-medium hover:underline">
                  Cadastre-se grátis
                </Link>
              </p>

              <div className="rounded-xl border border-border bg-muted/40 p-3 text-center">
                <p className="text-xs text-muted-foreground">
                  Teste grátis por 7 dias. Não exige cartão de crédito.
                </p>
              </div>
            </form>
          </div>
        </div>

        {/* Termos */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Ao fazer login, você concorda com os{" "}
            <Link href="/termos" className="text-primary hover:underline">
              termos de uso
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
