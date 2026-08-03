-- CreateTable
CREATE TABLE "maquininhas" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "taxa_debito" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxa_credito" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxa_pix" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "aluguel" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "conta_credito_id" INTEGER,
    "conta_debito_id" INTEGER,
    "conta_pix_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maquininhas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "maquininhas_empresa_id_idx" ON "maquininhas"("empresa_id");

-- CreateIndex
CREATE UNIQUE INDEX "maquininhas_empresa_id_nome_key" ON "maquininhas"("empresa_id", "nome");

-- AlterTable
ALTER TABLE "vendas" ADD COLUMN "maquininha_id" TEXT,
ADD COLUMN "conta_financeira_id" INTEGER;

-- AlterTable
ALTER TABLE "livro_diario" ADD COLUMN "venda_id" TEXT;

-- CreateIndex
CREATE INDEX "vendas_maquininha_id_idx" ON "vendas"("maquininha_id");

-- CreateIndex
CREATE INDEX "vendas_conta_financeira_id_idx" ON "vendas"("conta_financeira_id");

-- CreateIndex
CREATE INDEX "livro_diario_venda_id_idx" ON "livro_diario"("venda_id");

-- AddForeignKey
ALTER TABLE "maquininhas" ADD CONSTRAINT "maquininhas_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maquininhas" ADD CONSTRAINT "maquininhas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maquininhas" ADD CONSTRAINT "maquininhas_conta_credito_id_fkey" FOREIGN KEY ("conta_credito_id") REFERENCES "contas_financeiras"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maquininhas" ADD CONSTRAINT "maquininhas_conta_debito_id_fkey" FOREIGN KEY ("conta_debito_id") REFERENCES "contas_financeiras"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maquininhas" ADD CONSTRAINT "maquininhas_conta_pix_id_fkey" FOREIGN KEY ("conta_pix_id") REFERENCES "contas_financeiras"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendas" ADD CONSTRAINT "vendas_maquininha_id_fkey" FOREIGN KEY ("maquininha_id") REFERENCES "maquininhas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendas" ADD CONSTRAINT "vendas_conta_financeira_id_fkey" FOREIGN KEY ("conta_financeira_id") REFERENCES "contas_financeiras"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "livro_diario" ADD CONSTRAINT "livro_diario_venda_id_fkey" FOREIGN KEY ("venda_id") REFERENCES "vendas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
