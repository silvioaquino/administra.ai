"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Search,
  CheckCircle2,
  RefreshCw,
  Barcode,
  Tag,
  Factory,
  Save,
  Loader2,
  AlertCircle,
  PackageSearch,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"

interface ProdutoRevisao {
  id: number
  descricao: string
  nomeNormalizado: string | null
  marca: string | null
  categoriaSugestao: string | null
  codigoBarras: string | null
  fonteDados: string
  precisaRevisao: boolean
  unidadeMedida: string | null
  createdAt: string
}

interface Edits {
  nomeNormalizado: string
  marca: string
  categoriaSugestao: string
  unidadeMedida: string
}

type FonteVariant = "success" | "warning" | "secondary"

const FONTE: Record<string, { texto: string; variant: FonteVariant }> = {
  OPEN_FOOD_FACTS: { texto: "Open Food Facts", variant: "success" },
  NORMALIZACAO_LOCAL: { texto: "Normalização local", variant: "warning" },
  MANUAL: { texto: "Manual", variant: "secondary" },
}

const LIMITE = 20

export default function CorrecaoProdutosPage() {
  const router = useRouter()
  const [produtos, setProdutos] = useState<ProdutoRevisao[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState("")
  const [skip, setSkip] = useState(0)
  // Ref controla a paginação sem disparar re-render (evita loop infinito de fetch)
  const skipRef = useRef(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [savingId, setSavingId] = useState<number | null>(null)
  const [syncingId, setSyncingId] = useState<number | null>(null)
  const [edits, setEdits] = useState<Record<number, Edits>>({})
  const [feedback, setFeedback] = useState<{ tipo: "success" | "error"; msg: string } | null>(null)

  const carregar = useCallback(
    async (modo: "reset" | "more") => {
      try {
        if (modo === "reset") {
          setLoading(true)
          skipRef.current = 0
        } else {
          setLoadingMore(true)
        }
        const response = await fetch(
          `/api/produtos/revisao?limit=${LIMITE}&skip=${skipRef.current}&search=${encodeURIComponent(search)}`
        )
        const data = await response.json()
        if (data.success) {
          if (modo === "reset") {
            setProdutos(data.data)
          } else {
            setProdutos((prev) => [...prev, ...data.data])
          }
          skipRef.current += LIMITE
          setSkip(skipRef.current)
          setTotal(data.total)
        } else {
          throw new Error(data.error || "Falha ao carregar produtos")
        }
      } catch (error) {
        setFeedback({
          tipo: "error",
          msg: error instanceof Error ? error.message : "Erro ao carregar produtos",
        })
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [search]
  )

  // Carrega a lista apenas na montagem da página.
  // A busca e a paginação são disparadas manualmente (Botão "Buscar" / "Carregar mais").
  useEffect(() => {
    carregar("reset")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!feedback) return
    const t = setTimeout(() => setFeedback(null), 4000)
    return () => clearTimeout(t)
  }, [feedback])

  function valor(item: ProdutoRevisao, field: keyof Edits): string {
    const e = edits[item.id]
    if (e && e[field] !== undefined) return e[field]
    if (field === "nomeNormalizado") return item.nomeNormalizado ?? ""
    if (field === "marca") return item.marca ?? ""
    if (field === "categoriaSugestao") return item.categoriaSugestao ?? ""
    return item.unidadeMedida ?? ""
  }

  function aoMudar(item: ProdutoRevisao, field: keyof Edits, value: string) {
    setEdits((prev) => ({
      ...prev,
      [item.id]: {
        nomeNormalizado: valor(item, "nomeNormalizado"),
        marca: valor(item, "marca"),
        categoriaSugestao: valor(item, "categoriaSugestao"),
        unidadeMedida: valor(item, "unidadeMedida"),
        [field]: value,
      },
    }))
  }

  async function salvar(item: ProdutoRevisao) {
    const nome = valor(item, "nomeNormalizado").trim()
    if (!nome) {
      setFeedback({ tipo: "error", msg: "Informe um nome normalizado." })
      return
    }
    setSavingId(item.id)
    try {
      const response = await fetch(`/api/produtos/${item.id}/normalizacao`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nomeNormalizado: nome,
          marca: valor(item, "marca").trim() || null,
          categoriaSugestao: valor(item, "categoriaSugestao").trim() || null,
          unidadeMedida: valor(item, "unidadeMedida").trim() || null,
        }),
      })
      const data = await response.json()
      if (!data.success) throw new Error(data.error || "Falha ao salvar")
      setFeedback({ tipo: "success", msg: `Produto "${nome}" corrigido manualmente.` })
      setProdutos((prev) => prev.filter((p) => p.id !== item.id))
      setTotal((t) => Math.max(0, t - 1))
      setEdits((prev) => {
        const copia = { ...prev }
        delete copia[item.id]
        return copia
      })
    } catch (error) {
      setFeedback({
        tipo: "error",
        msg: error instanceof Error ? error.message : "Erro ao salvar correção",
      })
    } finally {
      setSavingId(null)
    }
  }

  async function sincronizar(item: ProdutoRevisao) {
    setSyncingId(item.id)
    try {
      const response = await fetch(`/api/produtos/${item.id}/resync`, { method: "POST" })
      const data = await response.json()
      if (!data.success) throw new Error(data.error || "Falha ao sincronizar")
      const atualizado = data.data as ProdutoRevisao
      setFeedback({ tipo: "success", msg: `Produto #${item.id} sincronizado com a Open Food Facts.` })
      if (!atualizado.precisaRevisao) {
        setProdutos((prev) => prev.filter((p) => p.id !== item.id))
        setTotal((t) => Math.max(0, t - 1))
      } else {
        setProdutos((prev) => prev.map((p) => (p.id === item.id ? { ...p, ...atualizado } : p)))
      }
    } catch (error) {
      setFeedback({
        tipo: "error",
        msg: error instanceof Error ? error.message : "Erro ao sincronizar",
      })
    } finally {
      setSyncingId(null)
    }
  }

  const fonte = (item: ProdutoRevisao) => FONTE[item.fonteDados] ?? { texto: item.fonteDados, variant: "secondary" as FonteVariant }

  return (
    <div className="min-h-screen bg-[#e5e7eb]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/nfe/produtos")}
            className="rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-gray-800">Correção de Produtos</h1>
            <p className="text-sm text-gray-500">
              Revise os nomes normalizados automaticamente e ajuste o que for necessário
            </p>
          </div>
        </div>
        <Badge variant="warning" className="rounded-full">
          {total} pendentes
        </Badge>
      </div>

      <div className="container mx-auto p-6 max-w-5xl">
        {/* Feedback */}
        {feedback && (
          <div
            className={`mb-4 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
              feedback.tipo === "success"
                ? "border-green-300 bg-green-50 text-green-800"
                : "border-red-300 bg-red-50 text-red-800"
            }`}
          >
            {feedback.tipo === "success" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            {feedback.msg}
          </div>
        )}

        {/* Busca */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            carregar("reset")
          }}
          className="mb-4 flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar por nome original ou normalizado..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-lg border-gray-300 focus:ring-[#de4838] focus:border-[#de4838]"
            />
          </div>
          <Button type="submit" className="bg-[#de4838] hover:bg-[#c73d2e] text-white rounded-lg">
            Buscar
          </Button>
        </form>

        {/* Legenda */}
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-gray-500">
          <span>Fonte dos dados:</span>
          <Badge variant="success" className="rounded-full">Open Food Facts</Badge>
          <Badge variant="warning" className="rounded-full">Normalização local</Badge>
          <Badge variant="secondary" className="rounded-full">Manual</Badge>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#de4838] border-t-transparent" />
          </div>
        ) : produtos.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm">
            <div className="flex h-80 flex-col items-center justify-center text-center p-6">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <PackageSearch className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500 mb-2">Nenhum produto pendente de revisão</p>
              <p className="text-sm text-gray-400">
                Tudo certo! Os produtos importados estão normalizados.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {produtos.map((item) => {
              const f = fonte(item)
              const nome = valor(item, "nomeNormalizado")
              const podeSalvar = nome.trim().length > 0 && savingId !== item.id
              return (
                <div key={item.id} className="bg-white rounded-2xl shadow-sm p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={f.variant} className="rounded-full">
                        {f.texto}
                      </Badge>
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                        <Barcode className="h-3.5 w-3.5" />
                        {item.codigoBarras || "Sem GTIN"}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDate(item.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Original</p>
                    <p className="text-sm text-gray-700">{item.descricao}</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-gray-600">Nome normalizado</label>
                      <Input
                        value={nome}
                        onChange={(e) => aoMudar(item, "nomeNormalizado", e.target.value)}
                        className="mt-1 rounded-lg border-gray-300 focus:ring-[#de4838] focus:border-[#de4838]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 inline-flex items-center gap-1">
                        <Factory className="h-3 w-3" /> Marca
                      </label>
                      <Input
                        value={valor(item, "marca")}
                        onChange={(e) => aoMudar(item, "marca", e.target.value)}
                        className="mt-1 rounded-lg border-gray-300 focus:ring-[#de4838] focus:border-[#de4838]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 inline-flex items-center gap-1">
                        <Tag className="h-3 w-3" /> Categoria
                      </label>
                      <Input
                        value={valor(item, "categoriaSugestao")}
                        onChange={(e) => aoMudar(item, "categoriaSugestao", e.target.value)}
                        className="mt-1 rounded-lg border-gray-300 focus:ring-[#de4838] focus:border-[#de4838]"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-gray-600">Unidade de medida</label>
                      <Input
                        value={valor(item, "unidadeMedida")}
                        onChange={(e) => aoMudar(item, "unidadeMedida", e.target.value)}
                        placeholder="Ex.: UN, KG, L, ML"
                        className="mt-1 rounded-lg border-gray-300 focus:ring-[#de4838] focus:border-[#de4838]"
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      onClick={() => salvar(item)}
                      disabled={!podeSalvar}
                      className="bg-[#de4838] hover:bg-[#c73d2e] text-white rounded-lg disabled:opacity-50"
                    >
                      {savingId === item.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Salvar correção
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => sincronizar(item)}
                      disabled={syncingId === item.id || !item.codigoBarras}
                      className="rounded-lg border-gray-200 hover:bg-gray-100 disabled:opacity-50"
                      title={item.codigoBarras ? "Consultar Open Food Facts" : "Sem GTIN para consultar"}
                    >
                      {syncingId === item.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 h-4 w-4" />
                      )}
                      Sincronizar
                    </Button>
                  </div>
                </div>
              )
            })}

            {produtos.length < total && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  onClick={() => carregar("more")}
                  disabled={loadingMore}
                  className="rounded-full border-gray-200 hover:bg-gray-100"
                >
                  {loadingMore ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Carregar mais
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
