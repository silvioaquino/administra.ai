-- AlterTable
ALTER TABLE "ficha_itens" ADD COLUMN     "gramas_equivalentes" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "produtos" ADD COLUMN     "densidade" DECIMAL(5,3) DEFAULT 1,
ADD COLUMN     "peso_unitario" DECIMAL(10,3);
