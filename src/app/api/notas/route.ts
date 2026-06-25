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

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const empresaId = session.user.empresaId;
  if (!empresaId) {
    return NextResponse.json({ error: "Empresa não encontrada" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100");

    const notas = await prisma.notaFiscal.findMany({
      where: {
        empresaId,
      },
      include: {
        produtos: true,
        pagamentos: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: notas.map(formatarNota),
    });
  } catch (error) {
    console.error("Erro ao buscar notas fiscais:", error);
    return NextResponse.json(
      { error: "Erro ao buscar notas fiscais" },
      { status: 500 }
    );
  }
}
