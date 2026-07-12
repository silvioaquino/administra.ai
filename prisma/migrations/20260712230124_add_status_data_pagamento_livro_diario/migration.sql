-- AlterTable
ALTER TABLE "livro_diario" ADD COLUMN     "data_pagamento" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDENTE';

-- CreateIndex
CREATE INDEX "livro_diario_userId_status_idx" ON "livro_diario"("userId", "status");
