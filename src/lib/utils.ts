import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

/**
 * Data de hoje no fuso local no formato YYYY-MM-DD (sem conversão UTC).
 */
export function hojeISO(): string {
  const d = new Date()
  const mes = String(d.getMonth() + 1).padStart(2, "0")
  const dia = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${mes}-${dia}`
}

export function formatDate(date: Date | string): string {
  if (typeof date === "string") {
    // Datas ISO (2026-08-02 ou 2026-08-02T00:00:00.000Z) são formatadas
    // sem conversão de fuso — o dia exibido é sempre o dia gravado.
    const match = date.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (match) return `${match[3]}/${match[2]}/${match[1]}`
    const parsed = new Date(date)
    return isNaN(parsed.getTime()) ? date : parsed.toLocaleDateString("pt-BR")
  }
  return date.toLocaleDateString("pt-BR")
}

export function formatDateTime(date: Date | string): string {
  if (typeof date === "string") {
    const match = date.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/)
    if (match) return `${match[3]}/${match[2]}/${match[1]} ${match[4]}:${match[5]}`
  }
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleString("pt-BR")
}


export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`
}

export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
}

export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

// ============= FUNÇÕES DO MÓDULO DE CAIXA =============

export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor)
}

export function formatarData(data: Date | string): string {
  const d = typeof data === 'string' ? new Date(data) : data
  return d.toLocaleString('pt-BR')
}

export function formatarTipoPagamento(tipo: string): string {
  const tipos: { [key: string]: string } = {
    'DINHEIRO': 'Dinheiro',
    'CARTAO_CREDITO': 'Cartão de Crédito',
    'CARTAO_DEBITO': 'Cartão de Débito',
    'PIX': 'PIX',
    'VR': 'Vale Refeição',
    'OUTRO': 'Outro',
    'PENDENTE': 'Pendente'
  }
  return tipos[tipo] || tipo
}

export function getBadgeColorTipoPagamento(tipo: string): string {
  const cores: { [key: string]: string } = {
    'PENDENTE': 'bg-yellow-100 text-yellow-800',
    'DINHEIRO': 'bg-green-100 text-green-800',
    'CARTAO_CREDITO': 'bg-blue-100 text-blue-800',
    'CARTAO_DEBITO': 'bg-cyan-100 text-cyan-800',
    'PIX': 'bg-purple-100 text-purple-800',
    'VR': 'bg-orange-100 text-orange-800',
    'OUTRO': 'bg-gray-100 text-gray-800'
  }
  return cores[tipo] || 'bg-gray-100 text-gray-800'
}

export function getIconTipoPagamento(tipo: string): string {
  const icones: { [key: string]: string } = {
    'PENDENTE': 'bi-clock',
    'DINHEIRO': 'bi-cash',
    'CARTAO_CREDITO': 'bi-credit-card',
    'CARTAO_DEBITO': 'bi-credit-card-2-front',
    'PIX': 'bi-phone',
    'VR': 'bi-bag',
    'OUTRO': 'bi-three-dots'
  }
  return icones[tipo] || 'bi-three-dots'
}

export function formatarDataInput(data: Date): string {
  return data.toISOString().split('T')[0]
}