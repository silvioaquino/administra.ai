"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Store,
  Building2,
  Phone,
  MapPin,
  Clock,
  CreditCard,
  QrCode,
  Link2,
  Users,
  Plug,
  Ticket,
  Settings,
  Save,
  Camera,
  X,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  Plus,
  Edit2,
  ToggleLeft,
  ToggleRight,
  Map,
  Truck,
  Package,
  DollarSign,
  Percent,
  Calendar,
  MessageCircle,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, cn } from "@/lib/utils";

// Tipos
interface EmpresaData {
  id: string;
  nome: string;
  whatsapp: string;
  segmento: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
}

interface HorarioFuncionamento {
  id: string;
  nome: string;
  dias: string[];
  inicio: string;
  fim: string;
  ativo: boolean;
}

interface FormaPagamento {
  id: string;
  nome: string;
  tipo: string;
  ativo: boolean;
  taxaExtra: number;
  taxaTipo: "FIXO" | "PERCENTUAL";
  entrega: boolean;
  retirada: boolean;
}

interface BandeiraCartao {
  id: string;
  nome: string;
  tipo: string;
  ativo: boolean;
}

interface UsuarioAcesso {
  id: string;
  email: string;
  nome: string;
  perfil: string;
  createdAt: string;
}

interface LinkCustomizado {
  id: string;
  titulo: string;
  url: string;
  ativo: boolean;
}

export default function ConfigLojaPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("informacoes");
  const [hideValues, setHideValues] = useState(false);

  // Dados da empresa
  const [empresa, setEmpresa] = useState<EmpresaData>({
    id: "",
    nome: "",
    whatsapp: "",
    segmento: "",
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
  });

  // Horários de funcionamento
  const [horarios, setHorarios] = useState<HorarioFuncionamento[]>([
    { id: "1", nome: "ALMOÇO", dias: ["SEG", "TER", "QUA", "QUI", "SEX"], inicio: "09:30", fim: "15:00", ativo: true },
    { id: "2", nome: "JANTA", dias: ["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"], inicio: "16:30", fim: "20:00", ativo: true },
  ]);
  const [novoHorarioOpen, setNovoHorarioOpen] = useState(false);
  const [editandoHorario, setEditandoHorario] = useState<HorarioFuncionamento | null>(null);

  // Formas de pagamento
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([
    { id: "1", nome: "Dinheiro", tipo: "DINHEIRO", ativo: true, taxaExtra: 0, taxaTipo: "PERCENTUAL", entrega: true, retirada: true },
    { id: "2", nome: "Pix", tipo: "PIX", ativo: true, taxaExtra: 0, taxaTipo: "PERCENTUAL", entrega: true, retirada: true },
    { id: "3", nome: "Crédito", tipo: "CARTAO_CREDITO", ativo: true, taxaExtra: 2.99, taxaTipo: "PERCENTUAL", entrega: true, retirada: true },
    { id: "4", nome: "Débito", tipo: "CARTAO_DEBITO", ativo: true, taxaExtra: 0, taxaTipo: "PERCENTUAL", entrega: true, retirada: true },
    { id: "5", nome: "Vale Refeição", tipo: "VR", ativo: true, taxaExtra: 0, taxaTipo: "PERCENTUAL", entrega: true, retirada: true },
    { id: "6", nome: "Vale Alimentação", tipo: "VA", ativo: false, taxaExtra: 0, taxaTipo: "PERCENTUAL", entrega: true, retirada: true },
  ]);

  // Bandeiras de cartão
  const [bandeiras, setBandeiras] = useState<BandeiraCartao[]>([
    { id: "1", nome: "Visa", tipo: "CARTAO_CREDITO", ativo: true },
    { id: "2", nome: "Mastercard", tipo: "CARTAO_CREDITO", ativo: true },
    { id: "3", nome: "Elo", tipo: "CARTAO_CREDITO", ativo: true },
    { id: "4", nome: "Hipercard", tipo: "CARTAO_CREDITO", ativo: true },
    { id: "5", nome: "American Express", tipo: "CARTAO_CREDITO", ativo: false },
  ]);
  const [novaBandeiraOpen, setNovaBandeiraOpen] = useState(false);
  const [novaBandeiraForm, setNovaBandeiraForm] = useState({ nome: "", tipo: "CARTAO_CREDITO" });

  // Usuários de acesso
  const [usuarios, setUsuarios] = useState<UsuarioAcesso[]>([
    { id: "1", email: "emporiodsabor72@gmail.com", nome: "Administrador", perfil: "ADMIN", createdAt: "2024-01-01" },
    { id: "2", email: "meiry@restaurante-emporio-do-sabor", nome: "Meiry", perfil: "OPERADOR", createdAt: "2025-10-27" },
    { id: "3", email: "silvio@restaurante-emporio-do-sabor", nome: "Silvio", perfil: "OPERADOR", createdAt: "2025-11-11" },
  ]);
  const [novoUsuarioOpen, setNovoUsuarioOpen] = useState(false);
  const [novoUsuarioForm, setNovoUsuarioForm] = useState({ email: "", nome: "", perfil: "OPERADOR", senha: "" });

  // Links personalizados
  const [linksCustomizados, setLinksCustomizados] = useState<LinkCustomizado[]>([
    { id: "1", titulo: "WhatsApp", url: "https://wa.me/5581984259663", ativo: true },
  ]);
  const [novoLinkOpen, setNovoLinkOpen] = useState(false);
  const [novoLinkForm, setNovoLinkForm] = useState({ titulo: "", url: "", ativo: true });

  // Configurações de entrega
  const [configEntrega, setConfigEntrega] = useState({
    tempoPreparo: 45,
    freteGratisValor: 0,
    raioMaximo: 30,
    raioBase: 5,
    taxaBase: 0,
    taxaKmAdicional: 1.5,
    modoFrete: "kmradius" as "kmradius" | "district" | "radius",
  });

  // Configurações do cardápio
  const [configCardapio, setConfigCardapio] = useState({
    pedidoMinimo: 0,
    exigirCep: false,
    itensIndisponiveis: "ocultar" as "ocultar" | "esgotados",
    fusoHorario: "America/Sao_Paulo",
  });

  // Estado para upload de imagem
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estado para cópia de links
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // URLs da loja
  const storeSlug = "restaurante-emporio-do-sabor";
  const storeLinks = {
    cardapio: `https://cardapio.ai/${storeSlug}`,
    online: `https://cardapio.ai/online/${storeSlug}`,
    mesa: `https://cardapio.ai/mesa/${storeSlug}`,
    gestor: `https://cardapio.ai/gestor/${storeSlug}`,
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/empresa");
      const data = await response.json();
      if (data.success && data.empresa) {
        setEmpresa(data.empresa);
      } else if (session?.user?.establishment) {
        setEmpresa(prev => ({ ...prev, nome: session.user.establishment || "" }));
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const salvarInformacoes = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/empresa", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(empresa),
      });
      if (response.ok) {
        alert("Informações salvas com sucesso!");
      } else {
        alert("Erro ao salvar informações");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao salvar informações");
    } finally {
      setSaving(false);
    }
  };

  const salvarHorarios = async () => {
    try {
      const response = await fetch("/api/config/horarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ horarios }),
      });
      if (response.ok) {
        alert("Horários salvos com sucesso!");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao salvar horários");
    }
  };

  const salvarFormasPagamento = async () => {
    try {
      const response = await fetch("/api/config/pagamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formasPagamento, bandeiras }),
      });
      if (response.ok) {
        alert("Formas de pagamento salvas com sucesso!");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao salvar formas de pagamento");
    }
  };

  const salvarConfigEntrega = async () => {
    try {
      const response = await fetch("/api/config/entrega", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(configEntrega),
      });
      if (response.ok) {
        alert("Configurações de entrega salvas com sucesso!");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao salvar configurações de entrega");
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const copiarLink = async (url: string, tipo: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedLink(tipo);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const adicionarHorario = () => {
    if (editandoHorario) {
      setHorarios(horarios.map(h => h.id === editandoHorario.id ? editandoHorario : h));
      setEditandoHorario(null);
    } else {
      const novoId = Date.now().toString();
      setHorarios([...horarios, { ...editandoHorario!, id: novoId }]);
    }
    setNovoHorarioOpen(false);
    salvarHorarios();
  };

  const removerHorario = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este horário?")) {
      setHorarios(horarios.filter(h => h.id !== id));
      salvarHorarios();
    }
  };

  const adicionarBandeira = () => {
    if (novaBandeiraForm.nome) {
      const novoId = Date.now().toString();
      setBandeiras([...bandeiras, { ...novaBandeiraForm, id: novoId, ativo: true }]);
      setNovaBandeiraOpen(false);
      setNovaBandeiraForm({ nome: "", tipo: "CARTAO_CREDITO" });
      salvarFormasPagamento();
    }
  };

  const removerBandeira = (id: string) => {
    setBandeiras(bandeiras.filter(b => b.id !== id));
    salvarFormasPagamento();
  };

  const adicionarUsuario = async () => {
    if (novoUsuarioForm.email && novoUsuarioForm.nome) {
      try {
        const response = await fetch("/api/auth/register-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(novoUsuarioForm),
        });
        if (response.ok) {
          const data = await response.json();
          setUsuarios([...usuarios, data.user]);
          setNovoUsuarioOpen(false);
          setNovoUsuarioForm({ email: "", nome: "", perfil: "OPERADOR", senha: "" });
          alert("Usuário criado com sucesso!");
        } else {
          alert("Erro ao criar usuário");
        }
      } catch (error) {
        console.error("Erro:", error);
        alert("Erro ao criar usuário");
      }
    }
  };

  const removerUsuario = async (id: string) => {
    if (confirm("Tem certeza que deseja remover este usuário?")) {
      try {
        const response = await fetch(`/api/auth/users/${id}`, { method: "DELETE" });
        if (response.ok) {
          setUsuarios(usuarios.filter(u => u.id !== id));
          alert("Usuário removido com sucesso!");
        } else {
          alert("Erro ao remover usuário");
        }
      } catch (error) {
        console.error("Erro:", error);
        alert("Erro ao remover usuário");
      }
    }
  };

  const adicionarLink = () => {
    if (novoLinkForm.titulo && novoLinkForm.url) {
      const novoId = Date.now().toString();
      setLinksCustomizados([...linksCustomizados, { ...novoLinkForm, id: novoId }]);
      setNovoLinkOpen(false);
      setNovoLinkForm({ titulo: "", url: "", ativo: true });
    }
  };

  const removerLink = (id: string) => {
    setLinksCustomizados(linksCustomizados.filter(l => l.id !== id));
  };

  const diasDaSemana = ["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"];
  const diasExtenso: Record<string, string> = {
    SEG: "Segunda", TER: "Terça", QUA: "Quarta", QUI: "Quinta", SEX: "Sexta", SAB: "Sábado", DOM: "Domingo"
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#de4838] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 ml-6 mr-6 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Minha Loja</h1>
          <p className="text-sm text-gray-500">Gerencie as informações e configurações do seu estabelecimento</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setHideValues(!hideValues)}
            className="rounded-full border-gray-200"
          >
            {hideValues ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {hideValues ? "Mostrar" : "Ocultar"}
          </Button>
          <Button
            onClick={salvarInformacoes}
            disabled={saving}
            className="bg-[#de4838] hover:bg-[#c73d2e] text-white rounded-full"
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Salvando..." : "Salvar Tudo"}
          </Button>
        </div>
      </div>

      <div className="container mx-auto p-6 max-w-7xl">
        {/* Menu Horizontal - Botões acima dos cards */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex gap-1 min-w-max border-b border-gray-200">
            <button
              onClick={() => setActiveTab("informacoes")}
              className={cn(
                "px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap border-b-2",
                activeTab === "informacoes"
                  ? "border-[#de4838] text-[#de4838]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              Informações
            </button>
            <button
              onClick={() => setActiveTab("personalizacao")}
              className={cn(
                "px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap border-b-2",
                activeTab === "personalizacao"
                  ? "border-[#de4838] text-[#de4838]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              Personalização
            </button>
            <button
              onClick={() => setActiveTab("horarios")}
              className={cn(
                "px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap border-b-2",
                activeTab === "horarios"
                  ? "border-[#de4838] text-[#de4838]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              Horários
            </button>
            <button
              onClick={() => setActiveTab("entrega")}
              className={cn(
                "px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap border-b-2",
                activeTab === "entrega"
                  ? "border-[#de4838] text-[#de4838]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              Entrega
            </button>
            <button
              onClick={() => setActiveTab("pagamento")}
              className={cn(
                "px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap border-b-2",
                activeTab === "pagamento"
                  ? "border-[#de4838] text-[#de4838]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              Pagamento
            </button>
            <button
              onClick={() => setActiveTab("links")}
              className={cn(
                "px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap border-b-2",
                activeTab === "links"
                  ? "border-[#de4838] text-[#de4838]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              Meus Links
            </button>
            <button
              onClick={() => setActiveTab("acessos")}
              className={cn(
                "px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap border-b-2",
                activeTab === "acessos"
                  ? "border-[#de4838] text-[#de4838]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              Controle de Acessos
            </button>
          </div>
        </div>

        {/* Conteúdo das Tabs */}
        {activeTab === "informacoes" && (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Logo e Nome */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-gray-50 p-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Store className="h-5 w-5 text-[#de4838]" />
                    <h3 className="font-semibold text-gray-800">Identificação</h3>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-start gap-6">
                    <div className="relative">
                      <div className="h-24 w-24 rounded-2xl bg-gray-100 overflow-hidden">
                        {logoPreview ? (
                          <img src={logoPreview} alt="Logo" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Store className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 rounded-full bg-[#de4838] p-1.5 text-white shadow-md hover:bg-[#c73d2e] transition-colors"
                      >
                        <Camera className="h-3.5 w-3.5" />
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </div>
                    <div className="flex-1 space-y-4">
                      <div>
                        <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Nome da Loja *
                        </Label>
                        <Input
                          value={empresa.nome}
                          onChange={(e) => setEmpresa({ ...empresa, nome: e.target.value })}
                          className="mt-1 rounded-lg"
                          placeholder="Ex: Restaurante Empório do Sabor"
                        />
                        <p className="text-xs text-gray-500 mt-1">Customize o nome exibido. O link permanece o mesmo.</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                          WhatsApp *
                        </Label>
                        <div className="relative mt-1">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            value={empresa.whatsapp}
                            onChange={(e) => setEmpresa({ ...empresa, whatsapp: e.target.value })}
                            className="pl-9 rounded-lg"
                            placeholder="(81) 98425-9663"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Número para receber pedidos e notificações.</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Segmento
                        </Label>
                        <Select
                          value={empresa.segmento}
                          onValueChange={(value) => setEmpresa({ ...empresa, segmento: value || '' })}
                        >
                          <SelectTrigger className="rounded-lg">
                            <SelectValue placeholder="Selecione o segmento" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Restaurante">Restaurante</SelectItem>
                            <SelectItem value="Pizzaria">Pizzaria</SelectItem>
                            <SelectItem value="Lanchonete">Lanchonete</SelectItem>
                            <SelectItem value="Cafeteria">Cafeteria</SelectItem>
                            <SelectItem value="Sorveteria">Sorveteria</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Documentos */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-gray-50 p-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-[#de4838]" />
                    <h3 className="font-semibold text-gray-800">Dados Fiscais</h3>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">CNPJ ou CPF</Label>
                    <Input
                      placeholder="00.000.000/0001-00"
                      className="mt-1 rounded-lg"
                      value="30.569.448/0001-91"
                    />
                    <p className="text-xs text-gray-500 mt-1">Documento usado para processar pagamentos da sua assinatura</p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Pedido Mínimo</Label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">R$</span>
                      <Input
                        type="number"
                        step="0.01"
                        value={configCardapio.pedidoMinimo}
                        onChange={(e) => setConfigCardapio({ ...configCardapio, pedidoMinimo: parseFloat(e.target.value) || 0 })}
                        className="pl-8 rounded-lg"
                        placeholder="0,00"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Total mínimo para compras</p>
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden lg:col-span-2">
                <div className="bg-gray-50 p-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-[#de4838]" />
                    <h3 className="font-semibold text-gray-800">Endereço</h3>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <Label className="text-xs font-medium text-gray-600">CEP</Label>
                      <Input
                        value={empresa.cep}
                        onChange={(e) => setEmpresa({ ...empresa, cep: e.target.value })}
                        className="mt-1 rounded-lg"
                        placeholder="53415-520"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label className="text-xs font-medium text-gray-600">Endereço</Label>
                      <Input
                        value={empresa.logradouro}
                        onChange={(e) => setEmpresa({ ...empresa, logradouro: e.target.value })}
                        className="mt-1 rounded-lg"
                        placeholder="Rua Vertentes"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-600">Número</Label>
                      <Input
                        value={empresa.numero}
                        onChange={(e) => setEmpresa({ ...empresa, numero: e.target.value })}
                        className="mt-1 rounded-lg"
                        placeholder="72"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-600">Bairro</Label>
                      <Input
                        value={empresa.bairro}
                        onChange={(e) => setEmpresa({ ...empresa, bairro: e.target.value })}
                        className="mt-1 rounded-lg"
                        placeholder="Artur Lundgren I"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-600">Cidade</Label>
                      <Input
                        value={empresa.cidade}
                        onChange={(e) => setEmpresa({ ...empresa, cidade: e.target.value })}
                        className="mt-1 rounded-lg"
                        placeholder="Paulista"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-600">UF</Label>
                      <Input
                        value={empresa.estado}
                        onChange={(e) => setEmpresa({ ...empresa, estado: e.target.value })}
                        className="mt-1 rounded-lg"
                        placeholder="PE"
                      />
                    </div>
                  </div>
                  <div className="mt-4 rounded-xl bg-gray-100 p-4 text-center text-sm text-gray-500">
                    <Map className="h-5 w-5 mx-auto mb-2 text-gray-400" />
                    Rua Vertentes, 72 - Artur Lundgren I - Paulista, PE - 53415-520
                  </div>
                </div>
              </div>

              {/* Configurações do Cardápio */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden lg:col-span-2">
                <div className="bg-gray-50 p-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-[#de4838]" />
                    <h3 className="font-semibold text-gray-800">Configurações do Cardápio</h3>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">Pedidos para entrega</p>
                      <p className="text-sm text-gray-500">Entrega dos pedidos no endereço dos clientes.</p>
                    </div>
                    <Switch checked={true} />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">Retirada de pedidos</p>
                      <p className="text-sm text-gray-500">Defina retirada de pedidos no local.</p>
                    </div>
                    <Switch checked={true} />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">Pedidos agendados</p>
                      <p className="text-sm text-gray-500">Agendamento de pedidos dentro de seu horário de funcionamento.</p>
                    </div>
                    <Switch />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">Exigir CEP</p>
                      <p className="text-sm text-gray-500">Ao desativar, o campo de CEP é ocultado da tela de endereço.</p>
                    </div>
                    <Switch />
                  </div>
                  <Separator />
                  <div>
                    <Label className="text-xs font-medium text-gray-600">Itens indisponíveis</Label>
                    <Select
                      value={configCardapio.itensIndisponiveis}
                      onValueChange={(value: any) => setConfigCardapio({ ...configCardapio, itensIndisponiveis: value })}
                    >
                      <SelectTrigger className="mt-1 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ocultar">Ocultar do cardápio</SelectItem>
                        <SelectItem value="esgotados">Exibir como esgotados</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "personalizacao" && (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Cores */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-gray-50 p-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-800">Cor de destaque</h3>
                </div>
                <div className="p-6">
                  <div className="flex flex-wrap gap-3">
                    {["#32805c", "#de4838", "#f49433", "#eeefea", "#a0c3b5", "#79ae94", "#ecae80", "#ec8c74", "#e9aea6", "#f4dcbc"].map((color) => (
                      <button
                        key={color}
                        className="h-10 w-10 rounded-full border-2 border-transparent hover:border-gray-400 transition-all"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <Button className="mt-6 w-full bg-[#de4838] hover:bg-[#c73d2e] text-white rounded-lg">
                    Salvar alterações
                  </Button>
                </div>
              </div>

              {/* Preview do Cardápio */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-gray-50 p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800">Visualização ao vivo</h3>
                    <Button variant="link" className="text-[#de4838]" onClick={() => window.open(storeLinks.cardapio, "_blank")}>
                      Visualizar cardápio ao vivo ↗
                    </Button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="rounded-xl bg-gradient-to-b from-gray-200 to-gray-100 p-4">
                    <div className="bg-white rounded-lg overflow-hidden shadow-lg max-w-sm mx-auto">
                      <div className="h-32 bg-gradient-to-r from-[#de4838] to-[#c73d2e] flex items-center justify-center">
                        <Store className="h-12 w-12 text-white opacity-50" />
                      </div>
                      <div className="p-4 text-center">
                        <p className="font-semibold text-gray-800">{empresa.nome || "Sua Loja"}</p>
                        <div className="mt-4 space-y-2">
                          <div className="rounded-lg bg-gray-100 p-2 text-sm">Ver cardápio</div>
                          <div className="rounded-lg bg-gray-100 p-2 text-sm">Pedir na mesa</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-4 text-center">
                    Personalize a imagem de capa do seu cardápio! Tamanho recomendado de 1920x1280 ↔ 3:2.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "horarios" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-gray-50 p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-[#de4838]" />
                    <h3 className="font-semibold text-gray-800">Horários de Funcionamento</h3>
                  </div>
                  <Button
                    onClick={() => {
                      setEditandoHorario(null);
                      setNovoHorarioOpen(true);
                    }}
                    className="bg-[#de4838] hover:bg-[#c73d2e] text-white rounded-full"
                    size="sm"
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Novo período
                  </Button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {horarios.map((horario) => (
                  <div key={horario.id} className="rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-800">{horario.nome}</p>
                        <p className="text-sm text-gray-500">
                          {horario.dias.map(d => diasExtenso[d]).join(", ")} • {horario.inicio} às {horario.fim}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditandoHorario(horario);
                            setNovoHorarioOpen(true);
                          }}
                          className="rounded-full"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removerHorario(horario.id)}
                          className="rounded-full text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal de Horário */}
            <Dialog open={novoHorarioOpen} onOpenChange={setNovoHorarioOpen}>
              <DialogContent className="max-w-md bg-white rounded-2xl">
                <DialogHeader>
                  <DialogTitle>{editandoHorario ? "Editar Período" : "Novo Período"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label className="text-xs font-medium text-gray-600">Nome do período</Label>
                    <Input
                      value={editandoHorario?.nome || ""}
                      onChange={(e) => setEditandoHorario({ ...editandoHorario!, nome: e.target.value })}
                      placeholder="Ex: ALMOÇO, JANTA"
                      className="mt-1 rounded-lg"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-600">Dias da semana</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {diasDaSemana.map((dia) => (
                        <button
                          key={dia}
                          type="button"
                          onClick={() => {
                            const dias = editandoHorario?.dias || [];
                            if (dias.includes(dia)) {
                              setEditandoHorario({ ...editandoHorario!, dias: dias.filter(d => d !== dia) });
                            } else {
                              setEditandoHorario({ ...editandoHorario!, dias: [...dias, dia] });
                            }
                          }}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-sm transition-colors",
                            editandoHorario?.dias.includes(dia)
                              ? "bg-[#de4838] text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          )}
                        >
                          {diasExtenso[dia]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-medium text-gray-600">Início</Label>
                      <Input
                        type="time"
                        value={editandoHorario?.inicio || "09:00"}
                        onChange={(e) => setEditandoHorario({ ...editandoHorario!, inicio: e.target.value })}
                        className="mt-1 rounded-lg"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-600">Fim</Label>
                      <Input
                        type="time"
                        value={editandoHorario?.fim || "18:00"}
                        onChange={(e) => setEditandoHorario({ ...editandoHorario!, fim: e.target.value })}
                        className="mt-1 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setNovoHorarioOpen(false)}>Cancelar</Button>
                  <Button onClick={adicionarHorario} className="bg-[#de4838] hover:bg-[#c73d2e]">Salvar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {activeTab === "entrega" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-gray-50 p-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-[#de4838]" />
                  <h3 className="font-semibold text-gray-800">Configurações de Entrega</h3>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <Label className="text-xs font-medium text-gray-600">Tempo de preparo (minutos)</Label>
                    <Input
                      type="number"
                      value={configEntrega.tempoPreparo}
                      onChange={(e) => setConfigEntrega({ ...configEntrega, tempoPreparo: parseInt(e.target.value) || 0 })}
                      className="mt-1 rounded-lg"
                    />
                    <p className="text-xs text-gray-500 mt-1">Será somado ao tempo de transporte.</p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-600">Frete grátis acima de</Label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">R$</span>
                      <Input
                        type="number"
                        step="0.01"
                        value={configEntrega.freteGratisValor}
                        onChange={(e) => setConfigEntrega({ ...configEntrega, freteGratisValor: parseFloat(e.target.value) || 0 })}
                        className="pl-8 rounded-lg"
                        placeholder="0,00"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-xs font-medium text-gray-600">Modalidade de frete</Label>
                  <Select
                    value={configEntrega.modoFrete}
                    onValueChange={(value: any) => setConfigEntrega({ ...configEntrega, modoFrete: value })}
                  >
                    <SelectTrigger className="mt-1 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kmradius">Faixas de entrega - Km</SelectItem>
                      <SelectItem value="radius">Raio de entrega - Km</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {configEntrega.modoFrete === "radius" && (
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <Label className="text-xs font-medium text-gray-600">Raio máximo de entrega (Km)</Label>
                      <Input
                        type="number"
                        value={configEntrega.raioMaximo}
                        onChange={(e) => setConfigEntrega({ ...configEntrega, raioMaximo: parseInt(e.target.value) || 0 })}
                        className="mt-1 rounded-lg"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-600">Raio base de entrega (Km)</Label>
                      <Input
                        type="number"
                        value={configEntrega.raioBase}
                        onChange={(e) => setConfigEntrega({ ...configEntrega, raioBase: parseInt(e.target.value) || 0 })}
                        className="mt-1 rounded-lg"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-600">Taxa base de entrega</Label>
                      <div className="relative mt-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">R$</span>
                        <Input
                          type="number"
                          step="0.01"
                          value={configEntrega.taxaBase}
                          onChange={(e) => setConfigEntrega({ ...configEntrega, taxaBase: parseFloat(e.target.value) || 0 })}
                          className="pl-8 rounded-lg"
                          placeholder="0,00"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-600">Taxa por Km adicional</Label>
                      <div className="relative mt-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">R$</span>
                        <Input
                          type="number"
                          step="0.01"
                          value={configEntrega.taxaKmAdicional}
                          onChange={(e) => setConfigEntrega({ ...configEntrega, taxaKmAdicional: parseFloat(e.target.value) || 0 })}
                          className="pl-8 rounded-lg"
                          placeholder="1,50"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <Button onClick={salvarConfigEntrega} className="w-full bg-[#de4838] hover:bg-[#c73d2e] text-white rounded-lg">
                  <Save className="mr-2 h-4 w-4" />
                  Salvar configurações
                </Button>
              </div>
            </div>

            {/* Mapa de áreas de entrega */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-gray-50 p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800">Áreas de Entrega</h3>
              </div>
              <div className="p-6">
                <div className="rounded-xl bg-gray-100 p-8 text-center">
                  <Map className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">Configure as áreas de entrega no mapa</p>
                  <Button variant="outline" className="mt-3 rounded-lg">Configurar áreas</Button>
                </div>
                <p className="text-xs text-gray-500 mt-4 text-center">
                  Importante: nosso sistema mede a distância do trajeto real, não em linha reta do ponto A ao B.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "pagamento" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-gray-50 p-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-[#de4838]" />
                  <h3 className="font-semibold text-gray-800">Formas de Pagamento Presencial</h3>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {formasPagamento.map((forma) => (
                  <div key={forma.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-800">{forma.nome}</p>
                      {forma.taxaExtra > 0 && (
                        <p className="text-xs text-gray-500">
                          Taxa extra: {forma.taxaTipo === "PERCENTUAL" ? `${forma.taxaExtra}%` : formatCurrency(forma.taxaExtra)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex gap-2">
                        <Badge variant={forma.entrega ? "default" : "outline"} className={forma.entrega ? "bg-emerald-100 text-emerald-700" : ""}>
                          Entrega
                        </Badge>
                        <Badge variant={forma.retirada ? "default" : "outline"} className={forma.retirada ? "bg-emerald-100 text-emerald-700" : ""}>
                          Retirada
                        </Badge>
                      </div>
                      <Switch checked={forma.ativo} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bandeiras de Cartão */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-gray-50 p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-[#de4838]" />
                    <h3 className="font-semibold text-gray-800">Bandeiras Aceitas</h3>
                  </div>
                  <Button onClick={() => setNovaBandeiraOpen(true)} variant="outline" size="sm" className="rounded-full">
                    <Plus className="mr-1 h-4 w-4" />
                    Adicionar bandeira
                  </Button>
                </div>
              </div>
              <div className="p-6">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {bandeiras.map((bandeira) => (
                    <div key={bandeira.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-12 bg-gray-100 rounded flex items-center justify-center text-xs">
                          {bandeira.nome.substring(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{bandeira.nome}</p>
                          <p className="text-xs text-gray-500">{bandeira.tipo === "CARTAO_CREDITO" ? "Crédito" : "Débito"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={bandeira.ativo} />
                        <Button variant="ghost" size="sm" onClick={() => removerBandeira(bandeira.id)} className="text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Nova Bandeira */}
            <Dialog open={novaBandeiraOpen} onOpenChange={setNovaBandeiraOpen}>
              <DialogContent className="max-w-md bg-white rounded-2xl">
                <DialogHeader>
                  <DialogTitle>Nova bandeira</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label className="text-xs font-medium text-gray-600">Bandeira do cartão</Label>
                    <Input
                      value={novaBandeiraForm.nome}
                      onChange={(e) => setNovaBandeiraForm({ ...novaBandeiraForm, nome: e.target.value })}
                      placeholder="Ex: Visa, Mastercard"
                      className="mt-1 rounded-lg"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-600">Categoria</Label>
                    <Select
                      value={novaBandeiraForm.tipo}
                      onValueChange={(value) => setNovaBandeiraForm({ ...novaBandeiraForm, tipo: value || "CARTAO_CREDITO" })}
                    >
                      <SelectTrigger className="rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CARTAO_CREDITO">Crédito</SelectItem>
                        <SelectItem value="CARTAO_DEBITO">Débito</SelectItem>
                        <SelectItem value="VA">VA - Vale Alimentação</SelectItem>
                        <SelectItem value="VR">VR - Vale Refeição</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setNovaBandeiraOpen(false)}>Cancelar</Button>
                  <Button onClick={adicionarBandeira} className="bg-[#de4838] hover:bg-[#c73d2e]">Salvar bandeira</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {activeTab === "links" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-gray-50 p-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Link2 className="h-5 w-5 text-[#de4838]" />
                  <h3 className="font-semibold text-gray-800">Links Pré-definidos</h3>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {Object.entries(storeLinks).map(([key, url]) => (
                  <div key={key} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-800 capitalize">{key === "cardapio" ? "Ver cardápio" : key === "online" ? "Pedidos Online" : key === "mesa" ? "Pedidos na Mesa" : "WebApp Garçom"}</p>
                      <p className="text-sm text-gray-500 font-mono">{url}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => copiarLink(url, key)} className="rounded-full">
                        {copiedLink === key ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      <Switch checked={true} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-gray-50 p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Link2 className="h-5 w-5 text-[#de4838]" />
                    <h3 className="font-semibold text-gray-800">Links Personalizados</h3>
                  </div>
                  <Button onClick={() => setNovoLinkOpen(true)} variant="outline" size="sm" className="rounded-full">
                    <Plus className="mr-1 h-4 w-4" />
                    Adicionar link
                  </Button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {linksCustomizados.map((link) => (
                  <div key={link.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-800">{link.titulo}</p>
                      <p className="text-sm text-gray-500 font-mono truncate max-w-[300px]">{link.url}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => window.open(link.url, "_blank")} className="rounded-full">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => removerLink(link.id)} className="rounded-full text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Switch checked={link.ativo} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Novo Link */}
            <Dialog open={novoLinkOpen} onOpenChange={setNovoLinkOpen}>
              <DialogContent className="max-w-md bg-white rounded-2xl">
                <DialogHeader>
                  <DialogTitle>Adicionar Link Personalizado</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label className="text-xs font-medium text-gray-600">Título do botão</Label>
                    <Input
                      value={novoLinkForm.titulo}
                      onChange={(e) => setNovoLinkForm({ ...novoLinkForm, titulo: e.target.value })}
                      placeholder="Ex: Instagram, Cardápio PDF"
                      className="mt-1 rounded-lg"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-600">URL do link</Label>
                    <Input
                      value={novoLinkForm.url}
                      onChange={(e) => setNovoLinkForm({ ...novoLinkForm, url: e.target.value })}
                      placeholder="https://..."
                      className="mt-1 rounded-lg"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setNovoLinkOpen(false)}>Cancelar</Button>
                  <Button onClick={adicionarLink} className="bg-[#de4838] hover:bg-[#c73d2e]">Adicionar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {activeTab === "acessos" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-gray-50 p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-[#de4838]" />
                    <h3 className="font-semibold text-gray-800">Usuários</h3>
                  </div>
                  <Button onClick={() => setNovoUsuarioOpen(true)} variant="outline" size="sm" className="rounded-full">
                    <Plus className="mr-1 h-4 w-4" />
                    Novo usuário
                  </Button>
                </div>
              </div>
              <div className="p-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {usuarios.map((usuario) => (
                    <div key={usuario.id} className="border border-gray-100 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#de4838] to-[#c73d2e] flex items-center justify-center text-white font-semibold">
                          {usuario.nome.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{usuario.nome}</p>
                          <p className="text-xs text-gray-500">{usuario.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant={usuario.perfil === "ADMIN" ? "default" : "outline"} className={usuario.perfil === "ADMIN" ? "bg-purple-100 text-purple-700" : ""}>
                          {usuario.perfil === "ADMIN" ? "Administrador" : "Operador"}
                        </Badge>
                        {usuario.perfil !== "ADMIN" && (
                          <Button variant="ghost" size="sm" onClick={() => removerUsuario(usuario.id)} className="text-red-500">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Novo Usuário */}
            <Dialog open={novoUsuarioOpen} onOpenChange={setNovoUsuarioOpen}>
              <DialogContent className="max-w-md bg-white rounded-2xl">
                <DialogHeader>
                  <DialogTitle>Novo usuário</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label className="text-xs font-medium text-gray-600">Nome</Label>
                    <Input
                      value={novoUsuarioForm.nome}
                      onChange={(e) => setNovoUsuarioForm({ ...novoUsuarioForm, nome: e.target.value })}
                      placeholder="Nome do usuário"
                      className="mt-1 rounded-lg"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-600">E-mail</Label>
                    <Input
                      type="email"
                      value={novoUsuarioForm.email}
                      onChange={(e) => setNovoUsuarioForm({ ...novoUsuarioForm, email: e.target.value })}
                      placeholder="usuario@email.com"
                      className="mt-1 rounded-lg"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-600">Perfil</Label>
                    <Select
                      value={novoUsuarioForm.perfil}
                      onValueChange={(value) => setNovoUsuarioForm({ ...novoUsuarioForm, perfil: value || "OPERADOR" })}
                    >
                      <SelectTrigger className="rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OPERADOR">Operador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-600">Senha temporária</Label>
                    <Input
                      type="password"
                      value={novoUsuarioForm.senha}
                      onChange={(e) => setNovoUsuarioForm({ ...novoUsuarioForm, senha: e.target.value })}
                      placeholder="********"
                      className="mt-1 rounded-lg"
                    />
                    <p className="text-xs text-gray-500 mt-1">Será enviada para o e-mail do usuário.</p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setNovoUsuarioOpen(false)}>Cancelar</Button>
                  <Button onClick={adicionarUsuario} className="bg-[#de4838] hover:bg-[#c73d2e]">Criar usuário</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </div>
  );
}