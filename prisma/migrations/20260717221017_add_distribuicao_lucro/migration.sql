-- CreateTable
CREATE TABLE "distribuicoes_lucro" (
    "id" SERIAL NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "fechamento_mensal_id" INTEGER,
    "ano" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "percentual" DECIMAL(5,2) NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "conta_id" INTEGER,
    "pago" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "distribuicoes_lucro_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "distribuicoes_lucro_empresa_id_ano_mes_idx" ON "distribuicoes_lucro"("empresa_id", "ano", "mes");
