// src/app/(auth)/register/page.tsx
"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  Store, 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle,
  ChevronDown,
  Search,
  MapPin,
  Home,
  Building2,
  MapPinned,
  Zap,
  TrendingUp,
  Users,
  CreditCard,
  ArrowRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card } from "@/components/ui/card"

// Lista de segmentos disponíveis
const SEGMENTOS = [
  "Açaiteria", "Açougue", "Bar", "Cafeteria", "Casa de ração", 
  "Choperia", "Churrascaria", "Comida Japonesa", "Confeitaria", 
  "Distribuidora de bebidas", "Doceria", "Empreendedores individuais", 
  "Floricultura", "Gás e água", "Hamburguerias", "Hotel", 
  "Lanchonete", "Marmitex", "Mercearia", "Padaria", 
  "Pastelaria", "Pizzaria", "Restaurante", "Sorveteria", "Outros"
]

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [segmentoOpen, setSegmentoOpen] = useState(false)
  const [segmentoSearch, setSegmentoSearch] = useState("")
  const [showAddress, setShowAddress] = useState(false)
  const [buscandoCep, setBuscandoCep] = useState(false)
  
  const cepTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const [formData, setFormData] = useState({
    name: "",
    establishment: "",
    whatsapp: "",
    segmento: "",
    email: "",
    password: "",
    confirmPassword: "",
    cep: "",
    address: "",
    number: "",
    district: "",
    city: "",
    state: ""
  })

  // Limpar timeout quando o componente desmontar
  useEffect(() => {
    return () => {
      if (cepTimeoutRef.current) {
        clearTimeout(cepTimeoutRef.current)
      }
    }
  }, [])

  // Filtrar segmentos
  const segmentosFiltrados = SEGMENTOS.filter(s => 
    s.toLowerCase().includes(segmentoSearch.toLowerCase())
  )

  // Função para buscar CEP com debounce
  const buscarCep = (cep: string) => {
    const cepClean = cep.replace(/\D/g, '')
    
    // Limpa o timeout anterior
    if (cepTimeoutRef.current) {
      clearTimeout(cepTimeoutRef.current)
    }
    
    // Só busca se tiver 8 dígitos
    if (cepClean.length === 8) {
      setBuscandoCep(true)
      
      // Adiciona um pequeno delay para evitar buscas desnecessárias
      cepTimeoutRef.current = setTimeout(async () => {
        try {
          const response = await fetch(`https://viacep.com.br/ws/${cepClean}/json/`)
          const data = await response.json()
          
          if (!data.erro) {
            setFormData(prev => ({
              ...prev,
              address: data.logradouro || "",
              district: data.bairro || "",
              city: data.localidade || "",
              state: data.uf || ""
            }))
          } else {
            setError("CEP não encontrado")
            setTimeout(() => setError(null), 3000)
          }
        } catch (error) {
          console.error("Erro ao buscar CEP:", error)
          setError("Erro ao buscar CEP. Tente novamente.")
          setTimeout(() => setError(null), 3000)
        } finally {
          setBuscandoCep(false)
        }
      }, 500) // Aguarda 500ms após o usuário parar de digitar
    } else {
      setBuscandoCep(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (!formData.establishment || !formData.whatsapp || !formData.segmento || !formData.email || !formData.password) {
      setError("Preencha todos os campos obrigatórios")
      setLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("As senhas não coincidem")
      setLoading(false)
      return
    }

    if (formData.password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres")
      setLoading(false)
      return
    }

    // Validar WhatsApp (formato brasileiro)
    const whatsappClean = formData.whatsapp.replace(/\D/g, '')
    if (whatsappClean.length < 10 || whatsappClean.length > 11) {
      setError("WhatsApp inválido. Use o formato (00) 00000-0000")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          establishment: formData.establishment,
          whatsapp: formData.whatsapp,
          segmento: formData.segmento,
          address: showAddress ? {
            cep: formData.cep,
            street: formData.address,
            number: formData.number,
            district: formData.district,
            city: formData.city,
            state: formData.state
          } : null
        })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess("Conta criada com sucesso! Redirecionando para o login...")
        setTimeout(() => {
          router.push("/login")
        }, 2000)
      } else {
        setError(data.error || "Erro ao criar conta")
      }
    } catch (error) {
      setError("Erro ao criar conta. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const planos = [
    { nome: "PDV Básico", preco: "49,90", descricao: "Organize seus pedidos de entrega, retirada, mesa e balcão." },
    { nome: "PDV Profissional", preco: "99,90", descricao: "Todas as funções + relatórios avançados e múltiplos usuários.", destaque: true }
  ]

  const beneficios = [
    "Sem comissão", "Pedidos ilimitados", "Cardápio QR Code",
    "App garçom", "Relatórios completos", "Suporte prioritário"
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Coluna Esquerda - Showcase */}
          <div className="hidden lg:block">
            <div className="sticky top-8 space-y-6">
              {/* Logo */}
              <div className="flex justify-center">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#de4838] to-[#de4838]/80 flex items-center justify-center shadow-md">
                    <Store className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xl font-bold text-[#de4838]">Emporio do Sabor</span>
                </div>
              </div>

              {/* Card de Destaque - Dashboard Preview */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-[#de4838]/10 via-transparent to-[#de4838]/5 p-6">
                  <div className="w-full max-w-md mx-auto">
                    <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-12 w-12 rounded-xl bg-[#de4838]/10 flex items-center justify-center">
                          <Store className="h-6 w-6 text-[#de4838]" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">Sua Loja</p>
                          <p className="text-sm text-gray-500">Cardápio Digital</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Pedidos hoje</span>
                          <span>R$ 2.450,00</span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full">
                          <div className="h-2 w-3/4 bg-[#de4838] rounded-full" />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mb-1 mt-2">
                          <span>Meta mensal</span>
                          <span>R$ 32.500,00</span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full">
                          <div className="h-2 w-1/2 bg-[#de4838] rounded-full" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Planos */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Planos disponíveis</h3>
                {planos.map((plano, idx) => (
                  <div 
                    key={idx} 
                    className={`bg-white rounded-xl p-4 shadow-sm border ${plano.destaque ? 'border-[#de4838]/20 bg-gradient-to-r from-white to-[#de4838]/5' : 'border-gray-100'}`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-gray-800">{plano.nome}</span>
                      <div className="text-right">
                        <span className="text-xl font-bold text-[#de4838]">R$ {plano.preco}</span>
                        <span className="text-sm text-gray-400">/mês</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">{plano.descricao}</p>
                    {plano.destaque && (
                      <div className="mt-2 inline-block px-2 py-0.5 bg-[#de4838]/10 rounded-full text-xs text-[#de4838]">
                        Mais popular
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Benefícios */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <p className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-[#de4838]" />
                  Benefícios
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {beneficios.map((beneficio, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      <span className="text-gray-600">{beneficio}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Direita - Formulário */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 md:p-8">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Teste 100% grátis</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Não exigimos cartão para o teste. Todas as funções por 7 dias!
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-700 rounded-xl">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="bg-emerald-50 border-emerald-200 rounded-xl">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    <AlertDescription className="text-emerald-700">{success}</AlertDescription>
                  </Alert>
                )}

                {/* Nome da loja */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Nome da loja <span className="text-[#de4838]">*</span>
                  </Label>
                  <div className="relative">
                    <Store className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Digite o nome da sua loja"
                      className="pl-9 rounded-lg border-gray-200 focus:ring-[#de4838] focus:border-[#de4838]"
                      value={formData.establishment}
                      onChange={(e) => setFormData({ ...formData, establishment: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* WhatsApp e Segmento */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                      WhatsApp da loja <span className="text-[#de4838]">*</span>
                    </Label>
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.032 2.001c-5.514 0-9.996 4.48-9.996 9.991 0 1.76.458 3.483 1.324 4.98L2.09 21.262l4.481-1.283c1.457.795 3.115 1.213 4.824 1.213 5.514 0 9.996-4.48 9.996-9.99 0-5.51-4.482-9.991-9.996-9.991zm0 18.416c-1.504 0-2.978-.405-4.247-1.165l-.306-.182-2.667.764.71-2.59-.19-.312c-.825-1.315-1.26-2.828-1.26-4.396 0-4.641 3.778-8.417 8.42-8.417 4.64 0 8.418 3.776 8.418 8.417s-3.778 8.417-8.418 8.417zm4.617-6.294c-.254-.127-1.502-.742-1.735-.827-.233-.084-.402-.127-.572.127-.17.254-.658.827-.806.997-.148.17-.297.191-.55.064-.254-.127-1.07-.394-2.038-1.257-.754-.675-1.263-1.507-1.41-1.762-.148-.255-.016-.393.111-.52.114-.114.254-.297.381-.446.127-.149.17-.255.254-.425.085-.17.043-.319-.021-.447-.064-.127-.572-1.377-.783-1.886-.206-.496-.416-.429-.572-.437-.148-.008-.318-.008-.488-.008-.17 0-.446.064-.68.319-.234.255-.892.871-.892 2.124 0 1.253.913 2.464 1.04 2.635.127.17 1.794 2.738 4.346 3.839 2.552 1.101 2.552.734 3.013.688.461-.046 1.486-.607 1.695-1.194.209-.587.209-1.089.146-1.194-.063-.105-.233-.17-.487-.297z"/>
                      </svg>
                      <Input
                        placeholder="(00) 00000-0000"
                        className="pl-9 rounded-lg border-gray-200 focus:ring-[#de4838]"
                        value={formData.whatsapp}
                        onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Segmento <span className="text-[#de4838]">*</span>
                    </Label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setSegmentoOpen(!segmentoOpen)}
                        className="w-full flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#de4838]"
                      >
                        <span className={formData.segmento ? "text-gray-800" : "text-gray-400"}>
                          {formData.segmento || "Selecione o segmento"}
                        </span>
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      </button>
                      
                      {segmentoOpen && (
                        <div className="absolute z-10 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg">
                          <div className="p-2 border-b border-gray-100">
                            <div className="relative">
                              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                              <input
                                type="text"
                                placeholder="Pesquisar segmento"
                                className="w-full rounded-lg border border-gray-200 pl-8 pr-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#de4838]"
                                value={segmentoSearch}
                                onChange={(e) => setSegmentoSearch(e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="max-h-48 overflow-y-auto">
                            {segmentosFiltrados.map((seg) => (
                              <button
                                key={seg}
                                type="button"
                                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                onClick={() => {
                                  setFormData({ ...formData, segmento: seg })
                                  setSegmentoOpen(false)
                                  setSegmentoSearch("")
                                }}
                              >
                                {seg}
                              </button>
                            ))}
                            {segmentosFiltrados.length === 0 && (
                              <div className="px-3 py-2 text-sm text-gray-400 text-center">
                                Nenhum segmento encontrado
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Nome do responsável */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Seu nome</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Seu nome completo"
                      className="pl-9 rounded-lg border-gray-200 focus:ring-[#de4838]"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                </div>

                {/* Email e Senha */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                      E-mail <span className="text-[#de4838]">*</span>
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        type="email"
                        placeholder="seu@email.com"
                        className="pl-9 rounded-lg border-gray-200 focus:ring-[#de4838]"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Senha <span className="text-[#de4838]">*</span>
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-9 pr-9 rounded-lg border-gray-200 focus:ring-[#de4838]"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Mínimo 8 caracteres</p>
                  </div>
                </div>

                {/* Confirmar senha */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Confirmar senha <span className="text-[#de4838]">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-9 pr-9 rounded-lg border-gray-200 focus:ring-[#de4838]"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Endereço (opcional) */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowAddress(!showAddress)}
                    className="text-sm text-[#de4838] hover:underline flex items-center gap-1"
                  >
                    <MapPin className="h-4 w-4" />
                    {showAddress ? "Ocultar endereço" : "Adicionar endereço da loja (opcional)"}
                  </button>
                </div>

                {showAddress && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-600">CEP</Label>
                        <div className="relative">
                          <Input
                            placeholder="00000-000"
                            className="rounded-lg border-gray-200"
                            value={formData.cep}
                            onChange={(e) => {
                              const newCep = e.target.value
                              setFormData({ ...formData, cep: newCep })
                              buscarCep(newCep)
                            }}
                          />
                          {buscandoCep && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-[#de4838]"></div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-600">Número</Label>
                        <Input
                          placeholder="Número"
                          className="rounded-lg border-gray-200"
                          value={formData.number}
                          onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-gray-600">Endereço</Label>
                      <Input
                        placeholder="Rua, Avenida..."
                        className="rounded-lg border-gray-200"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-600">Bairro</Label>
                        <Input
                          placeholder="Bairro"
                          className="rounded-lg border-gray-200"
                          value={formData.district}
                          onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-600">Cidade</Label>
                        <Input
                          placeholder="Cidade"
                          className="rounded-lg border-gray-200"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-[#de4838] hover:bg-[#c73d2e] text-white rounded-lg py-2.5" 
                  disabled={loading} 
                  size="lg"
                >
                  {loading ? "Criando conta..." : "Criar conta grátis"}
                </Button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-2 text-gray-400">ou</span>
                  </div>
                </div>

                <p className="text-center text-xs text-gray-400">
                  Ao prosseguir você concorda com os{" "}
                  <Link href="/termos" className="text-[#de4838] hover:underline">
                    termos de uso
                  </Link>{" "}
                  e{" "}
                  <Link href="/privacidade" className="text-[#de4838] hover:underline">
                    política de privacidade
                  </Link>
                  .
                </p>

                <p className="text-center text-sm text-gray-600">
                  Já tem uma conta?{" "}
                  <Link href="/login" className="text-[#de4838] font-medium hover:underline">
                    Faça login
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}