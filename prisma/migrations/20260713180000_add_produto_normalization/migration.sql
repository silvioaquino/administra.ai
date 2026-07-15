-- AlterTable: campos de normalização de produtos.
-- Obs: a coluna "empresaId" ja existe em "produtos" (criada pela migration
-- 20260624203920_add_empresa_isolation), portanto nao eh recriada aqui.
ALTER TABLE "produtos" ADD COLUMN "codigo_barras" TEXT;
ALTER TABLE "produtos" ADD COLUMN "nome_normalizado" TEXT;
ALTER TABLE "produtos" ADD COLUMN "marca" TEXT;
ALTER TABLE "produtos" ADD COLUMN "categoria_sugestao" TEXT;
ALTER TABLE "produtos" ADD COLUMN "unidade_medida" TEXT;
ALTER TABLE "produtos" ADD COLUMN "fonte_dados" TEXT NOT NULL DEFAULT 'NORMALIZACAO_LOCAL';
ALTER TABLE "produtos" ADD COLUMN "precisa_revisao" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "produtos" ADD COLUMN "normalizado_em" TIMESTAMP(3);

-- CreateIndex: indices compostos de normalização (coluna empresaId, camelCase)
CREATE INDEX "produtos_empresaId_codigo_barras_idx" ON "produtos"("empresaId","codigo_barras");

CREATE INDEX "produtos_empresaId_nome_normalizado_idx" ON "produtos"("empresaId","nome_normalizado");

CREATE INDEX "produtos_empresaId_fonte_dados_idx" ON "produtos"("empresaId","fonte_dados");

CREATE INDEX "produtos_empresaId_precisa_revisao_idx" ON "produtos"("empresaId","precisa_revisao");
