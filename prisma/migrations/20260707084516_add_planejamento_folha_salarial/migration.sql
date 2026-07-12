-- CreateTable
CREATE TABLE "planejamento_folha_salarial" (
    "id" SERIAL NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "ano_referencia" INTEGER NOT NULL,
    "total_salarios" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_decimo" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_ferias" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_fgts" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_inss" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_inss_patronal" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_mensal" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "folha_encargos_percentual" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planejamento_folha_salarial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "planejamento_folha_salarial_user_id_ano_referencia_idx" ON "planejamento_folha_salarial"("user_id", "ano_referencia");

-- CreateIndex
CREATE INDEX "planejamento_folha_salarial_empresa_id_idx" ON "planejamento_folha_salarial"("empresa_id");

-- CreateIndex
CREATE UNIQUE INDEX "planejamento_folha_salarial_empresa_id_user_id_ano_referenc_key" ON "planejamento_folha_salarial"("empresa_id", "user_id", "ano_referencia");

-- AddForeignKey
ALTER TABLE "planejamento_folha_salarial" ADD CONSTRAINT "planejamento_folha_salarial_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planejamento_folha_salarial" ADD CONSTRAINT "planejamento_folha_salarial_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
