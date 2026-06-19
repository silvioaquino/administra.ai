import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

interface ProdutoNotaApi {
  codigo: string | null;
  descricao: string;
  unidade: string | null;
  quantidade: Prisma.Decimal | null;
  valorUnitario: Prisma.Decimal | null;
  valorTotal: Prisma.Decimal | null;
}

interface PagamentoApi {
  formaPagamento: string;
  valor: unknown;
}

interface NotaFiscalApi {
  id: number;
  chaveAcesso: string;
  numero: number;
  serie: number;
  dataEmissao: Date;
  cnpjEmitente: string;
  nomeEmitente: string;
  valorTotal: unknown;
  produtos: ProdutoNotaApi[];
  pagamentos: PagamentoApi[];
}

const formatarNota = (nota: NotaFiscalApi) => ({
  id: nota.id,
  chaveAcesso: nota.chaveAcesso,
  numero: nota.numero,
  serie: nota.serie,
  dataEmissao: nota.dataEmissao.toISOString(),
  cnpjEmitente: nota.cnpjEmitente,
  nomeEmitente: nota.nomeEmitente,
  valorTotal: Number(nota.valorTotal),
  produtos: (nota.produtos || []).map((produto) => ({
    codigo: produto.codigo || "",
    descricao: produto.descricao,
    unidade: produto.unidade || "",
    quantidade: Number(produto.quantidade || 0),
    valorUnitario: Number(produto.valorUnitario || 0),
    valorTotal: Number(produto.valorTotal || 0),
  })),
  pagamentos: (nota.pagamentos || []).map((pagamento) => ({
    formaPagamento: pagamento.formaPagamento,
    valor: Number(pagamento.valor || 0),
  })),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const nota = await prisma.notaFiscal.findFirst({
      where: {
        id: parseInt(id),
        userId: session.user.id,
      },
      include: {
        produtos: true,
        pagamentos: true,
      },
    });

    if (!nota) {
      return NextResponse.json(
        { error: "Nota fiscal não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(formatarNota(nota));
  } catch (error) {
    console.error("Erro ao buscar nota fiscal:", error);
    return NextResponse.json(
      { error: "Erro ao buscar nota fiscal" },
      { status: 500 }
    );
  }
}
