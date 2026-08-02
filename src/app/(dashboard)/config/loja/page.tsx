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
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  aplicarAparencia,
  salvarAparenciaLocal,
  type AparenciaSistema,
} from "@/components/providers/AppearanceProvider";


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

  // Personalização do sistema (SaaS)
  const [personalizacao, setPersonalizacao] = useState<AparenciaSistema>({
    corDestaque: "#4F46E5",
    tema: "escuro",
    nomeExibicao: "",
    logoUrl: "",
    densidade: "confortavel",
    bordas: "arredondada",
    reduzirAnimacoes: false,
  });
  const [savingPersonalizacao, setSavingPersonalizacao] = useState(false);
  const [personalizacaoSalva, setPersonalizacaoSalva] = useState(false);



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

      const personalizacaoResponse = await fetch("/api/config/personalizacao");
      const personalizacaoData = await personalizacaoResponse.json();
      if (personalizacaoData.success && personalizacaoData.dados) {
        setPersonalizacao((prev: AparenciaSistema) => ({ ...prev, ...personalizacaoData.dados }));
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const salvarPersonalizacao = async () => {
    setSavingPersonalizacao(true);
    setPersonalizacaoSalva(false);
    try {
      const response = await fetch("/api/config/personalizacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(personalizacao),
      });
      if (response.ok) {
        aplicarAparencia(personalizacao);
        salvarAparenciaLocal(personalizacao);
        setPersonalizacaoSalva(true);
        setTimeout(() => setPersonalizacaoSalva(false), 2500);

      } else {
        alert("Erro ao salvar personalização");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao salvar personalização");
    } finally {
      setSavingPersonalizacao(false);
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
      <div className="min-h-screen bg-surface-2 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <PageContainer>
        <PageHeader
          title="Minha Loja"
          subtitle="Gerencie as informações e configurações do seu estabelecimento"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => setHideValues(!hideValues)}
            className="rounded-full border-border"
          >
            {hideValues ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {hideValues ? "Mostrar" : "Ocultar"}
          </Button>
          <Button
            onClick={salvarInformacoes}
            disabled={saving}
            className="bg-primary hover:bg-primary/90 text-white rounded-full"
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Salvando..." : "Salvar Tudo"}
          </Button>
        </PageHeader>
        {/* Menu Horizontal - Botões acima dos cards */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex gap-1 min-w-max border-b border-border">
            <button
              onClick={() => setActiveTab("informacoes")}
              className={cn(
                "px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap border-b-2",
                activeTab === "informacoes"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-white hover:border-border"
              )}
            >
              Informações
            </button>
            <button
              onClick={() => setActiveTab("personalizacao")}
              className={cn(
                "px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap border-b-2",
                activeTab === "personalizacao"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-white hover:border-border"
              )}
            >
              Personalização
            </button>
            {/*<button
              onClick={() => setActiveTab("horarios")}
              className={cn(
                "px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap border-b-2",
                activeTab === "horarios"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-white hover:border-border"
              )}
            >
              Horários
            </button>
            <button
              onClick={() => setActiveTab("entrega")}
              className={cn(
                "px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap border-b-2",
                activeTab === "entrega"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-white hover:border-border"
              )}
            >
              Entrega
            </button>
            <button
              onClick={() => setActiveTab("pagamento")}
              className={cn(
                "px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap border-b-2",
                activeTab === "pagamento"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-white hover:border-border"
              )}
            >
              Pagamento
            </button>
            <button
              onClick={() => setActiveTab("links")}
              className={cn(
                "px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap border-b-2",
                activeTab === "links"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-white hover:border-border"
              )}
            >
              Meus Links
            </button>*/}
            <button
              onClick={() => setActiveTab("acessos")}
              className={cn(
                "px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap border-b-2",
                activeTab === "acessos"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-white hover:border-border"
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
              <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-surface-2 p-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Store className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-white">Identificação</h3>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-start gap-6">
                    <div className="relative">
                      <div className="h-24 w-24 rounded-2xl bg-surface-2 overflow-hidden">
                        {logoPreview ? (
                          <img src={logoPreview} alt="Logo" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Store className="h-12 w-12 text-muted-foreground/70" />
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 rounded-full bg-primary p-1.5 text-white shadow-md hover:bg-primary/90 transition-colors"
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
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Nome da Loja *
                        </Label>
                        <Input
                          value={empresa.nome}
                          onChange={(e) => setEmpresa({ ...empresa, nome: e.target.value })}
                          className="mt-1 rounded-lg"
                          placeholder="Ex: Restaurante Empório do Sabor"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Customize o nome exibido. O link permanece o mesmo.</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          WhatsApp *
                        </Label>
                        <div className="relative mt-1">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
                          <Input
                            value={empresa.whatsapp}
                            onChange={(e) => setEmpresa({ ...empresa, whatsapp: e.target.value })}
                            className="pl-9 rounded-lg"
                            placeholder="(81) 98425-9663"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Número para receber pedidos e notificações.</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
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
              <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-surface-2 p-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-white">Dados Fiscais</h3>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">CNPJ ou CPF</Label>
                    <Input
                      placeholder="00.000.000/0001-00"
                      className="mt-1 rounded-lg"
                      value="30.569.448/0001-91"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Documento usado para processar pagamentos da sua assinatura</p>
                  </div>
                  {/*<div>
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pedido Mínimo</Label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70">R$</span>
                      <Input
                        type="number"
                        step="0.01"
                        value={configCardapio.pedidoMinimo}
                        onChange={(e) => setConfigCardapio({ ...configCardapio, pedidoMinimo: parseFloat(e.target.value) || 0 })}
                        className="pl-8 rounded-lg"
                        placeholder="0,00"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Total mínimo para compras</p>
                  </div>*/}
                </div>
              </div>

              {/* Endereço */}
              <div className="bg-surface rounded-2xl shadow-sm overflow-hidden lg:col-span-2">
                <div className="bg-surface-2 p-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-white">Endereço</h3>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">CEP</Label>
                      <Input
                        value={empresa.cep}
                        onChange={(e) => setEmpresa({ ...empresa, cep: e.target.value })}
                        className="mt-1 rounded-lg"
                        placeholder="53415-520"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label className="text-xs font-medium text-muted-foreground">Endereço</Label>
                      <Input
                        value={empresa.logradouro}
                        onChange={(e) => setEmpresa({ ...empresa, logradouro: e.target.value })}
                        className="mt-1 rounded-lg"
                        placeholder="Rua Vertentes"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Número</Label>
                      <Input
                        value={empresa.numero}
                        onChange={(e) => setEmpresa({ ...empresa, numero: e.target.value })}
                        className="mt-1 rounded-lg"
                        placeholder="72"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Bairro</Label>
                      <Input
                        value={empresa.bairro}
                        onChange={(e) => setEmpresa({ ...empresa, bairro: e.target.value })}
                        className="mt-1 rounded-lg"
                        placeholder="Artur Lundgren I"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Cidade</Label>
                      <Input
                        value={empresa.cidade}
                        onChange={(e) => setEmpresa({ ...empresa, cidade: e.target.value })}
                        className="mt-1 rounded-lg"
                        placeholder="Paulista"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">UF</Label>
                      <Input
                        value={empresa.estado}
                        onChange={(e) => setEmpresa({ ...empresa, estado: e.target.value })}
                        className="mt-1 rounded-lg"
                        placeholder="PE"
                      />
                    </div>
                  </div>
                  <div className="mt-4 rounded-xl bg-surface-2 p-4 text-center text-sm text-muted-foreground">
                    <Map className="h-5 w-5 mx-auto mb-2 text-muted-foreground/70" />
                    Rua Vertentes, 72 - Artur Lundgren I - Paulista, PE - 53415-520
                  </div>
                </div>
              </div>

              {/* Configurações do Cardápio 
              <div className="bg-surface rounded-2xl shadow-sm overflow-hidden lg:col-span-2">
                <div className="bg-surface-2 p-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-white">Configurações do Cardápio</h3>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">Pedidos para entrega</p>
                      <p className="text-sm text-muted-foreground">Entrega dos pedidos no endereço dos clientes.</p>
                    </div>
                    <Switch checked={true} />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">Retirada de pedidos</p>
                      <p className="text-sm text-muted-foreground">Defina retirada de pedidos no local.</p>
                    </div>
                    <Switch checked={true} />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">Pedidos agendados</p>
                      <p className="text-sm text-muted-foreground">Agendamento de pedidos dentro de seu horário de funcionamento.</p>
                    </div>
                    <Switch />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">Exigir CEP</p>
                      <p className="text-sm text-muted-foreground">Ao desativar, o campo de CEP é ocultado da tela de endereço.</p>
                    </div>
                    <Switch />
                  </div>
                  <Separator />
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Itens indisponíveis</Label>
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
              </div>*/}
            </div>
          </div>
        )}

        {activeTab === "personalizacao" && (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Aparência do sistema */}
              <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-surface-2 p-4 border-b border-border">
                  <h3 className="font-semibold text-white">Aparência do sistema</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Define como o painel do SeuGerente é exibido para a sua equipe.
                  </p>
                </div>
                <div className="p-6 space-y-6">
                  <div className="space-y-3">
                    <Label>Cor de destaque</Label>
                    <div className="flex flex-wrap gap-3">
                      {["#4F46E5", "#2563eb", "#0ea5e9", "#059669", "#32805c", "#d97706", "#de4838", "#db2777", "#7c3aed", "#475569"].map((color) => (
                        <button
                          key={color}
                          type="button"
                          aria-label={`Selecionar cor ${color}`}
                          onClick={() => setPersonalizacao(p => ({ ...p, corDestaque: color }))}
                          className={cn(
                            "h-10 w-10 rounded-full border-2 transition-all",
                            personalizacao.corDestaque.toLowerCase() === color.toLowerCase()
                              ? "border-white scale-110"
                              : "border-transparent hover:border-border"
                          )}
                          style={{ backgroundColor: color }}
                        >
                          {personalizacao.corDestaque.toLowerCase() === color.toLowerCase() && (
                            <Check className="mx-auto h-4 w-4 text-white drop-shadow" />
                          )}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={personalizacao.corDestaque}
                        onChange={(e) => setPersonalizacao(p => ({ ...p, corDestaque: e.target.value }))}
                        className="h-10 w-14 cursor-pointer rounded-lg border border-border bg-transparent"
                        aria-label="Cor personalizada"
                      />
                      <Input
                        value={personalizacao.corDestaque}
                        onChange={(e) => setPersonalizacao(p => ({ ...p, corDestaque: e.target.value }))}
                        className="max-w-[140px] font-mono"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Nome exibido no sistema</Label>
                      <Input
                        value={personalizacao.nomeExibicao}
                        onChange={(e) => setPersonalizacao(p => ({ ...p, nomeExibicao: e.target.value }))}
                        placeholder={empresa.nome || "Sua Empresa"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tema da interface</Label>
                      <Select
                        value={personalizacao.tema}
                        onValueChange={(v) => setPersonalizacao(p => ({ ...p, tema: v as "claro" | "escuro" }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="escuro">Escuro</SelectItem>
                          <SelectItem value="claro">Claro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Densidade</Label>
                      <Select
                        value={personalizacao.densidade}
                        onValueChange={(v) => setPersonalizacao(p => ({ ...p, densidade: v as "confortavel" | "compacta" }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="confortavel">Confortável</SelectItem>
                          <SelectItem value="compacta">Compacta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Cantos dos componentes</Label>
                      <Select
                        value={personalizacao.bordas}
                        onValueChange={(v) => setPersonalizacao(p => ({ ...p, bordas: v as "suave" | "arredondada" | "reta" }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="arredondada">Arredondados</SelectItem>
                          <SelectItem value="suave">Suaves</SelectItem>
                          <SelectItem value="reta">Retos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Logo do sistema (URL)</Label>
                    <Input
                      value={personalizacao.logoUrl}
                      onChange={(e) => setPersonalizacao(p => ({ ...p, logoUrl: e.target.value }))}
                      placeholder="https://..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Imagem quadrada (PNG ou SVG) exibida no menu lateral.
                    </p>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="reduzir-animacoes">Reduzir animações</Label>
                      <p className="text-xs text-muted-foreground">
                        Melhora o desempenho em computadores mais lentos.
                      </p>
                    </div>
                    <Switch
                      id="reduzir-animacoes"
                      checked={personalizacao.reduzirAnimacoes}
                      onCheckedChange={(v) => setPersonalizacao(p => ({ ...p, reduzirAnimacoes: v }))}
                    />
                  </div>

                  <Button
                    onClick={salvarPersonalizacao}
                    disabled={savingPersonalizacao}
                    className="w-full rounded-lg bg-primary text-white hover:bg-primary/90"
                  >
                    {personalizacaoSalva ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Salvo!
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        {savingPersonalizacao ? "Salvando..." : "Salvar alterações"}
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Preview do sistema */}
              <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-surface-2 p-4 border-b border-border">
                  <h3 className="font-semibold text-white">Visualização do painel</h3>
                </div>
                <div className="p-6">
                  <div
                    className="overflow-hidden border shadow-lg"
                    style={{
                      borderRadius: personalizacao.bordas === "reta" ? 4 : personalizacao.bordas === "suave" ? 8 : 14,
                      backgroundColor: personalizacao.tema === "claro" ? "#ffffff" : "#0f1117",
                      color: personalizacao.tema === "claro" ? "#111827" : "#ffffff",
                      borderColor: personalizacao.tema === "claro" ? "#e5e7eb" : "#232735",
                    }}
                  >
                    <div className="flex min-h-[240px]">
                      {/* Sidebar simulada */}
                      <div
                        className="w-28 shrink-0 p-3"
                        style={{ backgroundColor: personalizacao.tema === "claro" ? "#f6f7f9" : "#151824" }}
                      >
                        <div className="mb-4 flex items-center gap-2">
                          <div
                            className="flex h-6 w-6 items-center justify-center bg-cover bg-center text-[10px] font-bold text-white"
                            style={{
                              backgroundColor: personalizacao.corDestaque,
                              backgroundImage: personalizacao.logoUrl ? `url(${personalizacao.logoUrl})` : undefined,
                              borderRadius: personalizacao.bordas === "reta" ? 2 : 8,
                            }}
                          >
                            {!personalizacao.logoUrl && "SG"}
                          </div>
                          <span className="truncate text-[9px] font-semibold">
                            {personalizacao.nomeExibicao || empresa.nome || "Sua Empresa"}
                          </span>
                        </div>
                        <div className={personalizacao.densidade === "compacta" ? "space-y-1" : "space-y-2"}>
                          {["Dashboard", "Vendas", "Planejamento", "Estoque"].map((item, i) => (
                            <div
                              key={item}
                              className="truncate px-2 text-[9px]"
                              style={{
                                paddingBlock: personalizacao.densidade === "compacta" ? 3 : 6,
                                borderRadius: personalizacao.bordas === "reta" ? 2 : 6,
                                backgroundColor: i === 0 ? personalizacao.corDestaque : "transparent",
                                color: i === 0 ? "#fff" : undefined,
                                opacity: i === 0 ? 1 : 0.6,
                              }}
                            >
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Conteúdo simulado */}
                      <div className={cn("flex-1 p-3", personalizacao.densidade === "compacta" ? "space-y-2" : "space-y-3")}>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold">Visão geral</span>
                          <span
                            className="px-2 py-1 text-[9px] font-medium text-white"
                            style={{
                              backgroundColor: personalizacao.corDestaque,
                              borderRadius: personalizacao.bordas === "reta" ? 2 : 6,
                            }}
                          >
                            Novo lançamento
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {["Faturamento", "Margem", "Despesas"].map((k) => (
                            <div
                              key={k}
                              className="border p-2"
                              style={{
                                borderRadius: personalizacao.bordas === "reta" ? 2 : 8,
                                borderColor: personalizacao.tema === "claro" ? "#e5e7eb" : "#232735",
                                paddingBlock: personalizacao.densidade === "compacta" ? 4 : 8,
                              }}
                            >
                              <p className="text-[8px] opacity-60">{k}</p>
                              <p className="text-[10px] font-semibold" style={{ color: personalizacao.corDestaque }}>
                                R$ 12.4k
                              </p>
                            </div>
                          ))}
                        </div>
                        <div
                          className="border"
                          style={{
                            height: personalizacao.densidade === "compacta" ? 70 : 96,
                            borderRadius: personalizacao.bordas === "reta" ? 2 : 8,
                            borderColor: personalizacao.tema === "claro" ? "#e5e7eb" : "#232735",
                            background: `linear-gradient(180deg, ${personalizacao.corDestaque}33, transparent)`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <p className="mt-4 text-center text-xs text-muted-foreground">
                    As alterações são aplicadas em todo o sistema ao salvar.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}



        {activeTab === "horarios" && (
          <div className="space-y-6">
            <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-surface-2 p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-white">Horários de Funcionamento</h3>
                  </div>
                  <Button
                    onClick={() => {
                      setEditandoHorario(null);
                      setNovoHorarioOpen(true);
                    }}
                    className="bg-primary hover:bg-primary/90 text-white rounded-full"
                    size="sm"
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Novo período
                  </Button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {horarios.map((horario) => (
                  <div key={horario.id} className="rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-white">{horario.nome}</p>
                        <p className="text-sm text-muted-foreground">
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
                          className="rounded-full text-destructive hover:text-destructive"
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
              <DialogContent className="max-w-md bg-surface rounded-2xl">
                <DialogHeader>
                  <DialogTitle>{editandoHorario ? "Editar Período" : "Novo Período"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Nome do período</Label>
                    <Input
                      value={editandoHorario?.nome || ""}
                      onChange={(e) => setEditandoHorario({ ...editandoHorario!, nome: e.target.value })}
                      placeholder="Ex: ALMOÇO, JANTA"
                      className="mt-1 rounded-lg"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Dias da semana</Label>
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
                              ? "bg-primary text-white"
                              : "bg-surface-2 text-muted-foreground hover:bg-surface-2"
                          )}
                        >
                          {diasExtenso[dia]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Início</Label>
                      <Input
                        type="time"
                        value={editandoHorario?.inicio || "09:00"}
                        onChange={(e) => setEditandoHorario({ ...editandoHorario!, inicio: e.target.value })}
                        className="mt-1 rounded-lg"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Fim</Label>
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
                  <Button onClick={adicionarHorario} className="bg-primary hover:bg-primary/90">Salvar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {activeTab === "entrega" && (
          <div className="space-y-6">
            <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-surface-2 p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-white">Configurações de Entrega</h3>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Tempo de preparo (minutos)</Label>
                    <Input
                      type="number"
                      value={configEntrega.tempoPreparo}
                      onChange={(e) => setConfigEntrega({ ...configEntrega, tempoPreparo: parseInt(e.target.value) || 0 })}
                      className="mt-1 rounded-lg"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Será somado ao tempo de transporte.</p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Frete grátis acima de</Label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70">R$</span>
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
                  <Label className="text-xs font-medium text-muted-foreground">Modalidade de frete</Label>
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
                      <Label className="text-xs font-medium text-muted-foreground">Raio máximo de entrega (Km)</Label>
                      <Input
                        type="number"
                        value={configEntrega.raioMaximo}
                        onChange={(e) => setConfigEntrega({ ...configEntrega, raioMaximo: parseInt(e.target.value) || 0 })}
                        className="mt-1 rounded-lg"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Raio base de entrega (Km)</Label>
                      <Input
                        type="number"
                        value={configEntrega.raioBase}
                        onChange={(e) => setConfigEntrega({ ...configEntrega, raioBase: parseInt(e.target.value) || 0 })}
                        className="mt-1 rounded-lg"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Taxa base de entrega</Label>
                      <div className="relative mt-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70">R$</span>
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
                      <Label className="text-xs font-medium text-muted-foreground">Taxa por Km adicional</Label>
                      <div className="relative mt-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70">R$</span>
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

                <Button onClick={salvarConfigEntrega} className="w-full bg-primary hover:bg-primary/90 text-white rounded-lg">
                  <Save className="mr-2 h-4 w-4" />
                  Salvar configurações
                </Button>
              </div>
            </div>

            {/* Mapa de áreas de entrega */}
            <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-surface-2 p-4 border-b border-border">
                <h3 className="font-semibold text-white">Áreas de Entrega</h3>
              </div>
              <div className="p-6">
                <div className="rounded-xl bg-surface-2 p-8 text-center">
                  <Map className="h-12 w-12 text-muted-foreground/70 mx-auto mb-3" />
                  <p className="text-muted-foreground">Configure as áreas de entrega no mapa</p>
                  <Button variant="outline" className="mt-3 rounded-lg">Configurar áreas</Button>
                </div>
                <p className="text-xs text-muted-foreground mt-4 text-center">
                  Importante: nosso sistema mede a distância do trajeto real, não em linha reta do ponto A ao B.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "pagamento" && (
          <div className="space-y-6">
            <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-surface-2 p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-white">Formas de Pagamento Presencial</h3>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {formasPagamento.map((forma) => (
                  <div key={forma.id} className="flex items-center justify-between p-4 border border-border rounded-xl">
                    <div>
                      <p className="font-medium text-white">{forma.nome}</p>
                      {forma.taxaExtra > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Taxa extra: {forma.taxaTipo === "PERCENTUAL" ? `${forma.taxaExtra}%` : formatCurrency(forma.taxaExtra)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex gap-2">
                        <Badge variant={forma.entrega ? "default" : "outline"} className={forma.entrega ? "bg-success/10 text-success" : ""}>
                          Entrega
                        </Badge>
                        <Badge variant={forma.retirada ? "default" : "outline"} className={forma.retirada ? "bg-success/10 text-success" : ""}>
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
            <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-surface-2 p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-white">Bandeiras Aceitas</h3>
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
                    <div key={bandeira.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-12 bg-surface-2 rounded flex items-center justify-center text-xs">
                          {bandeira.nome.substring(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{bandeira.nome}</p>
                          <p className="text-xs text-muted-foreground">{bandeira.tipo === "CARTAO_CREDITO" ? "Crédito" : "Débito"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={bandeira.ativo} />
                        <Button variant="ghost" size="sm" onClick={() => removerBandeira(bandeira.id)} className="text-destructive">
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
              <DialogContent className="max-w-md bg-surface rounded-2xl">
                <DialogHeader>
                  <DialogTitle>Nova bandeira</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Bandeira do cartão</Label>
                    <Input
                      value={novaBandeiraForm.nome}
                      onChange={(e) => setNovaBandeiraForm({ ...novaBandeiraForm, nome: e.target.value })}
                      placeholder="Ex: Visa, Mastercard"
                      className="mt-1 rounded-lg"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Categoria</Label>
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
                  <Button onClick={adicionarBandeira} className="bg-primary hover:bg-primary/90">Salvar bandeira</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {activeTab === "links" && (
          <div className="space-y-6">
            <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-surface-2 p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Link2 className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-white">Links Pré-definidos</h3>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {Object.entries(storeLinks).map(([key, url]) => (
                  <div key={key} className="flex items-center justify-between p-4 border border-border rounded-xl">
                    <div>
                      <p className="font-medium text-white capitalize">{key === "cardapio" ? "Ver cardápio" : key === "online" ? "Pedidos Online" : key === "mesa" ? "Pedidos na Mesa" : "WebApp Garçom"}</p>
                      <p className="text-sm text-muted-foreground font-mono">{url}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => copiarLink(url, key)} className="rounded-full">
                        {copiedLink === key ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      <Switch checked={true} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-surface-2 p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Link2 className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-white">Links Personalizados</h3>
                  </div>
                  <Button onClick={() => setNovoLinkOpen(true)} variant="outline" size="sm" className="rounded-full">
                    <Plus className="mr-1 h-4 w-4" />
                    Adicionar link
                  </Button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {linksCustomizados.map((link) => (
                  <div key={link.id} className="flex items-center justify-between p-4 border border-border rounded-xl">
                    <div>
                      <p className="font-medium text-white">{link.titulo}</p>
                      <p className="text-sm text-muted-foreground font-mono truncate max-w-[300px]">{link.url}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => window.open(link.url, "_blank")} className="rounded-full">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => removerLink(link.id)} className="rounded-full text-destructive">
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
              <DialogContent className="max-w-md bg-surface rounded-2xl">
                <DialogHeader>
                  <DialogTitle>Adicionar Link Personalizado</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Título do botão</Label>
                    <Input
                      value={novoLinkForm.titulo}
                      onChange={(e) => setNovoLinkForm({ ...novoLinkForm, titulo: e.target.value })}
                      placeholder="Ex: Instagram, Cardápio PDF"
                      className="mt-1 rounded-lg"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">URL do link</Label>
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
                  <Button onClick={adicionarLink} className="bg-primary hover:bg-primary/90">Adicionar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {activeTab === "acessos" && (
          <div className="space-y-6">
            <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-surface-2 p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-white">Usuários</h3>
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
                    <div key={usuario.id} className="border border-border rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/90 flex items-center justify-center text-white font-semibold">
                          {usuario.nome.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-white">{usuario.nome}</p>
                          <p className="text-xs text-muted-foreground">{usuario.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant={usuario.perfil === "ADMIN" ? "default" : "outline"} className={usuario.perfil === "ADMIN" ? "bg-primary/10 text-white" : ""}>
                          {usuario.perfil === "ADMIN" ? "Administrador" : "Operador"}
                        </Badge>
                        {usuario.perfil !== "ADMIN" && (
                          <Button variant="ghost" size="sm" onClick={() => removerUsuario(usuario.id)} className="text-destructive">
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
              <DialogContent className="max-w-md bg-surface rounded-2xl">
                <DialogHeader>
                  <DialogTitle>Novo usuário</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Nome</Label>
                    <Input
                      value={novoUsuarioForm.nome}
                      onChange={(e) => setNovoUsuarioForm({ ...novoUsuarioForm, nome: e.target.value })}
                      placeholder="Nome do usuário"
                      className="mt-1 rounded-lg"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">E-mail</Label>
                    <Input
                      type="email"
                      value={novoUsuarioForm.email}
                      onChange={(e) => setNovoUsuarioForm({ ...novoUsuarioForm, email: e.target.value })}
                      placeholder="usuario@email.com"
                      className="mt-1 rounded-lg"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Perfil</Label>
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
                    <Label className="text-xs font-medium text-muted-foreground">Senha temporária</Label>
                    <Input
                      type="password"
                      value={novoUsuarioForm.senha}
                      onChange={(e) => setNovoUsuarioForm({ ...novoUsuarioForm, senha: e.target.value })}
                      placeholder="********"
                      className="mt-1 rounded-lg"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Será enviada para o e-mail do usuário.</p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setNovoUsuarioOpen(false)}>Cancelar</Button>
                  <Button onClick={adicionarUsuario} className="bg-primary hover:bg-primary/90">Criar usuário</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </PageContainer>
    </div>
  );
}