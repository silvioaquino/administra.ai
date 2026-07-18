import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import {
  carregarProvisoesAtivas,
  salvarProvisoesAtivas,
  PROVISOES_ATIVAS_PADRAO,
  type ProvisoesAtivasTipos,
} from "@/lib/folha"

// GET - ler os switches globais por tipo de provisão (persistidos no banco).
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Não autorizado" }, { status: 401 })
  }
  const empresaId = session.user.empresaId || "sem-empresa"
  const ano = new Date().getFullYear()
  try {
    const provisoesAtivas = await carregarProvisoesAtivas(empresaId, session.user.id, ano)
    return NextResponse.json({ success: true, provisoesAtivas })
  } catch (error) {
    console.error("Erro ao carregar provisões ativas:", error)
    return NextResponse.json({ success: true, provisoesAtivas: PROVISOES_ATIVAS_PADRAO })
  }
}

// POST - salvar os switches globais por tipo de provisão.
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Não autorizado" }, { status: 401 })
  }
  const empresaId = session.user.empresaId || "sem-empresa"
  const ano = new Date().getFullYear()
  try {
    const body = await request.json()
    const recebidas = (body?.provisoesAtivas || {}) as Partial<ProvisoesAtivasTipos>
    const provisoesAtivas: ProvisoesAtivasTipos = { ...PROVISOES_ATIVAS_PADRAO, ...recebidas }
    await salvarProvisoesAtivas(empresaId, session.user.id, provisoesAtivas, ano)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao salvar provisões ativas:", error)
    return NextResponse.json({ success: false, message: "Erro ao salvar" }, { status: 500 })
  }
}
