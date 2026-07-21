-- CreateTable
CREATE TABLE "folha_pagamento_config" (
    "id" SERIAL NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "dia_adiantamento" INTEGER NOT NULL DEFAULT 15,
    "percentual_adiantamento" DECIMAL(5,2) NOT NULL DEFAULT 40,
    "dia_salario" INTEGER NOT NULL DEFAULT 5,
    "total_salarios" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "valor_adiantamento" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "valor_salario" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "folha_pagamento_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "folha_pagamento_config_empresa_id_ano_mes_idx" ON "folha_pagamento_config"("empresa_id", "ano", "mes");

-- CreateIndex
CREATE UNIQUE INDEX "folha_pagamento_config_empresa_id_user_id_ano_mes_key" ON "folha_pagamento_config"("empresa_id", "user_id", "ano", "mes");

-- AddForeignKey
ALTER TABLE "folha_pagamento_config" ADD CONSTRAINT "folha_pagamento_config_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folha_pagamento_config" ADD CONSTRAINT "folha_pagamento_config_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
