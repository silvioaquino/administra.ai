-- AlterTable
ALTER TABLE "despesas_variaveis" ADD COLUMN     "aluguel" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "despesas_variaveis_resultados" (
    "id" SERIAL NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "mes" INTEGER,
    "faturamento_base" DECIMAL(15,2) NOT NULL,
    "distribuicao_debito" INTEGER NOT NULL,
    "distribuicao_credito" INTEGER NOT NULL,
    "distribuicao_voucher" INTEGER NOT NULL,
    "manutencao" DOUBLE PRECISION NOT NULL,
    "simples_nacional" DOUBLE PRECISION NOT NULL,
    "maquininhas_config" JSONB NOT NULL,
    "debito_media" DOUBLE PRECISION NOT NULL,
    "credito_media" DOUBLE PRECISION NOT NULL,
    "taxa_media_geral" DOUBLE PRECISION NOT NULL,
    "aluguel_total" DOUBLE PRECISION NOT NULL,
    "percentual_aluguel" DOUBLE PRECISION NOT NULL,
    "total_despesas_variaveis" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "despesas_variaveis_resultados_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "despesas_variaveis_resultados_user_id_ano_mes_idx" ON "despesas_variaveis_resultados"("user_id", "ano", "mes");

-- CreateIndex
CREATE INDEX "despesas_variaveis_resultados_empresa_id_idx" ON "despesas_variaveis_resultados"("empresa_id");

-- CreateIndex
CREATE UNIQUE INDEX "despesas_variaveis_resultados_empresa_id_user_id_ano_mes_key" ON "despesas_variaveis_resultados"("empresa_id", "user_id", "ano", "mes");

-- AddForeignKey
ALTER TABLE "despesas_variaveis_resultados" ADD CONSTRAINT "despesas_variaveis_resultados_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "despesas_variaveis_resultados" ADD CONSTRAINT "despesas_variaveis_resultados_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
