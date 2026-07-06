-- CreateTable
CREATE TABLE "planejamento_faturamento_novo" (
    "id" SERIAL NOT NULL,
    "empresaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "meta_diaria" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dias_trabalhados" INTEGER NOT NULL DEFAULT 26,
    "meta_total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planejamento_faturamento_novo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planejamento_despesas_fixas_novo" (
    "id" SERIAL NOT NULL,
    "empresaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "mes" INTEGER,
    "nome" TEXT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "data_vencimento" TIMESTAMP(3),
    "data_pagamento" TIMESTAMP(3),
    "conta_financeira" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planejamento_despesas_fixas_novo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planejamento_despesas_variaveis_novo" (
    "id" SERIAL NOT NULL,
    "empresaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "mes" INTEGER,
    "percentual_total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "faturamento_base" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "impacto_mensal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "config" JSONB NOT NULL,
    "resultados" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planejamento_despesas_variaveis_novo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planejamento_acompanhamento_novo" (
    "id" SERIAL NOT NULL,
    "empresaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "faturamento_almoco" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "faturamento_janta" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "faturamento_total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "observacao" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planejamento_acompanhamento_novo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "planejamento_faturamento_novo_userId_ano_mes_idx" ON "planejamento_faturamento_novo"("userId", "ano", "mes");

-- CreateIndex
CREATE INDEX "planejamento_faturamento_novo_empresaId_idx" ON "planejamento_faturamento_novo"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "planejamento_faturamento_novo_empresaId_userId_ano_mes_key" ON "planejamento_faturamento_novo"("empresaId", "userId", "ano", "mes");

-- CreateIndex
CREATE INDEX "planejamento_despesas_fixas_novo_userId_ano_mes_idx" ON "planejamento_despesas_fixas_novo"("userId", "ano", "mes");

-- CreateIndex
CREATE INDEX "planejamento_despesas_fixas_novo_empresaId_idx" ON "planejamento_despesas_fixas_novo"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "planejamento_despesas_fixas_novo_empresaId_userId_ano_nome_key" ON "planejamento_despesas_fixas_novo"("empresaId", "userId", "ano", "nome");

-- CreateIndex
CREATE INDEX "planejamento_despesas_variaveis_novo_userId_ano_mes_idx" ON "planejamento_despesas_variaveis_novo"("userId", "ano", "mes");

-- CreateIndex
CREATE INDEX "planejamento_despesas_variaveis_novo_empresaId_idx" ON "planejamento_despesas_variaveis_novo"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "planejamento_despesas_variaveis_novo_empresaId_userId_ano_m_key" ON "planejamento_despesas_variaveis_novo"("empresaId", "userId", "ano", "mes");

-- CreateIndex
CREATE INDEX "planejamento_acompanhamento_novo_userId_ano_mes_idx" ON "planejamento_acompanhamento_novo"("userId", "ano", "mes");

-- CreateIndex
CREATE INDEX "planejamento_acompanhamento_novo_empresaId_idx" ON "planejamento_acompanhamento_novo"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "planejamento_acompanhamento_novo_empresaId_userId_ano_mes_key" ON "planejamento_acompanhamento_novo"("empresaId", "userId", "ano", "mes");

-- AddForeignKey
ALTER TABLE "planejamento_faturamento_novo" ADD CONSTRAINT "planejamento_faturamento_novo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planejamento_faturamento_novo" ADD CONSTRAINT "planejamento_faturamento_novo_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planejamento_despesas_fixas_novo" ADD CONSTRAINT "planejamento_despesas_fixas_novo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planejamento_despesas_fixas_novo" ADD CONSTRAINT "planejamento_despesas_fixas_novo_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planejamento_despesas_variaveis_novo" ADD CONSTRAINT "planejamento_despesas_variaveis_novo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planejamento_despesas_variaveis_novo" ADD CONSTRAINT "planejamento_despesas_variaveis_novo_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planejamento_acompanhamento_novo" ADD CONSTRAINT "planejamento_acompanhamento_novo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planejamento_acompanhamento_novo" ADD CONSTRAINT "planejamento_acompanhamento_novo_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
