-- Add fatorOscilacao (price fluctuation factor) to FichaTecnica
ALTER TABLE "fichas_tecnicas" ADD COLUMN "fator_oscilacao" DECIMAL(5,2) NOT NULL DEFAULT 0;
