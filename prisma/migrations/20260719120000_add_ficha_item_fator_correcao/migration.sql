-- AlterTable: fator de correção por item da ficha técnica
ALTER TABLE "ficha_itens"
  ADD COLUMN "peso_bruto" DECIMAL(10,3),
  ADD COLUMN "peso_liquido" DECIMAL(10,3),
  ADD COLUMN "fator_correcao" DECIMAL(6,3) NOT NULL DEFAULT 1;
