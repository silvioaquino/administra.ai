/*
  Warnings:

  - A unique constraint covering the columns `[empresaId,userId,nome]` on the table `despesas_fixas` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[empresaId,userId,nome]` on the table `despesas_variaveis` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[empresaId,userId,nome]` on the table `funcionarios` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[empresaId,userId,ano,mes]` on the table `planejamento_acompanhamento` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[empresaId,userId,tipo,ano_referencia]` on the table `planejamento_config` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[empresaId,userId,ano,mes]` on the table `planejamento_faturamento` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[empresaId,userId,ano,provisao,funcionario_nome]` on the table `provisoes_funcionarios` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[empresaId]` on the table `taxas_cartao_config` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[resetToken]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `empresaId` to the `despesas_fixas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vencimento` to the `despesas_fixas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `empresaId` to the `despesas_variaveis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `empresaId` to the `ficha_itens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `ficha_itens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `empresaId` to the `fichas_tecnicas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `empresaId` to the `funcionarios` table without a default value. This is not possible if the table is not empty.
  - Added the required column `empresaId` to the `livro_diario` table without a default value. This is not possible if the table is not empty.
  - Added the required column `empresaId` to the `notas_fiscais` table without a default value. This is not possible if the table is not empty.
  - Added the required column `empresaId` to the `pagamentos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `empresaId` to the `planejamento_acompanhamento` table without a default value. This is not possible if the table is not empty.
  - Added the required column `empresaId` to the `planejamento_config` table without a default value. This is not possible if the table is not empty.
  - Added the required column `empresaId` to the `planejamento_faturamento` table without a default value. This is not possible if the table is not empty.
  - Added the required column `empresaId` to the `produtos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `empresaId` to the `provisoes_funcionarios` table without a default value. This is not possible if the table is not empty.
  - Added the required column `empresaId` to the `taxas_cartao_config` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "despesas_fixas_userId_nome_key";

-- DropIndex
DROP INDEX "despesas_variaveis_userId_nome_key";

-- DropIndex
DROP INDEX "funcionarios_userId_nome_key";

-- DropIndex
DROP INDEX "planejamento_acompanhamento_userId_ano_mes_key";

-- DropIndex
DROP INDEX "planejamento_config_userId_tipo_ano_referencia_key";

-- DropIndex
DROP INDEX "planejamento_faturamento_userId_ano_mes_key";

-- DropIndex
DROP INDEX "provisoes_funcionarios_userId_ano_provisao_funcionario_nome_key";

-- AlterTable
ALTER TABLE "despesas_fixas" ADD COLUMN     "conta_id" INTEGER,
ADD COLUMN     "empresaId" TEXT NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDENTE',
ADD COLUMN     "vencimento" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "despesas_variaveis" ADD COLUMN     "empresaId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ficha_itens" ADD COLUMN     "empresaId" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "fichas_tecnicas" ADD COLUMN     "empresaId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "funcionarios" ADD COLUMN     "empresaId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "livro_diario" ADD COLUMN     "empresaId" TEXT NOT NULL,
ADD COLUMN     "origem_destino" TEXT;

-- AlterTable
ALTER TABLE "notas_fiscais" ADD COLUMN     "empresaId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "pagamentos" ADD COLUMN     "empresaId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "planejamento_acompanhamento" ADD COLUMN     "empresaId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "planejamento_config" ADD COLUMN     "empresaId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "planejamento_faturamento" ADD COLUMN     "empresaId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "produtos" ADD COLUMN     "empresaId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "provisoes_funcionarios" ADD COLUMN     "empresaId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "taxas_cartao_config" ADD COLUMN     "empresaId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "resetTokenExpiry" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "empresas" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nome" TEXT,
    "whatsapp" TEXT,
    "segmento" TEXT,
    "cep" TEXT,
    "logradouro" TEXT,
    "numero" TEXT,
    "complemento" TEXT,
    "bairro" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "empresas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contas_financeiras" (
    "id" SERIAL NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "saldo_inicial" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "instituicao" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contas_financeiras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metas_fluxo_caixa" (
    "id" SERIAL NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "meta_faturamento_diaria" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "meta_despesas_diaria" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "meta_lucro_percentual" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "dias_uteis" INTEGER NOT NULL DEFAULT 30,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "metas_fluxo_caixa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fluxo_caixa_diario" (
    "id" SERIAL NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "faturamento_realizado" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "despesas_realizadas" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "lucro_realizado" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fluxo_caixa_diario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plano_contas" (
    "id" SERIAL NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "grupo" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plano_contas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fechamento_mensal" (
    "id" SERIAL NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ABERTO',
    "data_fechamento" TIMESTAMP(3),
    "observacao" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fechamento_mensal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dre_resultados" (
    "id" SERIAL NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "linha" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(15,2) NOT NULL,
    "percentual" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dre_resultados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "caixa_abertura" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "dataAbertura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valorInicial" DOUBLE PRECISION NOT NULL,
    "observacao" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ABERTO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "caixa_abertura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendas" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "dataVenda" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dadosPedido" JSONB NOT NULL,
    "tipoPagamento" TEXT NOT NULL DEFAULT 'PENDENTE',
    "valorTotal" DOUBLE PRECISION NOT NULL,
    "manual" BOOLEAN NOT NULL DEFAULT false,
    "caixaAberturaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "nomeCliente" TEXT,
    "telefoneCliente" TEXT,
    "tipoPedido" TEXT,
    "endereco" TEXT,
    "numeroPedido" TEXT,

    CONSTRAINT "vendas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produto_venda" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "vendaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "adicionais" JSONB,
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produto_venda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendas_manuais" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "dataVenda" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipoPagamento" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "descricao" TEXT,
    "caixaAberturaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendas_manuais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retiradas" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "dataRetirada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valor" DOUBLE PRECISION NOT NULL,
    "observacao" TEXT,
    "caixaAberturaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "retiradas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "caixa_fechamento" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "dataFechamento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valorAbertura" DOUBLE PRECISION NOT NULL,
    "totalVendas" DOUBLE PRECISION NOT NULL,
    "retiradas" DOUBLE PRECISION NOT NULL,
    "saldoFinal" DOUBLE PRECISION NOT NULL,
    "observacoes" TEXT,
    "caixaAberturaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "caixa_fechamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boletos" (
    "id" SERIAL NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "lancamento_id" INTEGER,
    "codigo_barras" TEXT NOT NULL,
    "numero_documento" TEXT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "data_vencimento" TIMESTAMP(3) NOT NULL,
    "data_pagamento" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "observacao" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boletos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" SERIAL NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "user_id" TEXT,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "nivel" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "is_header" BOOLEAN NOT NULL DEFAULT false,
    "parent_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contas_financeiras_empresa_id_idx" ON "contas_financeiras"("empresa_id");

-- CreateIndex
CREATE UNIQUE INDEX "contas_financeiras_nome_empresa_id_key" ON "contas_financeiras"("nome", "empresa_id");

-- CreateIndex
CREATE INDEX "metas_fluxo_caixa_user_id_ano_mes_idx" ON "metas_fluxo_caixa"("user_id", "ano", "mes");

-- CreateIndex
CREATE INDEX "metas_fluxo_caixa_empresa_id_idx" ON "metas_fluxo_caixa"("empresa_id");

-- CreateIndex
CREATE UNIQUE INDEX "metas_fluxo_caixa_empresa_id_user_id_ano_mes_key" ON "metas_fluxo_caixa"("empresa_id", "user_id", "ano", "mes");

-- CreateIndex
CREATE INDEX "fluxo_caixa_diario_user_id_data_idx" ON "fluxo_caixa_diario"("user_id", "data");

-- CreateIndex
CREATE INDEX "fluxo_caixa_diario_empresa_id_idx" ON "fluxo_caixa_diario"("empresa_id");

-- CreateIndex
CREATE UNIQUE INDEX "fluxo_caixa_diario_empresa_id_user_id_data_key" ON "fluxo_caixa_diario"("empresa_id", "user_id", "data");

-- CreateIndex
CREATE INDEX "plano_contas_user_id_tipo_grupo_idx" ON "plano_contas"("user_id", "tipo", "grupo");

-- CreateIndex
CREATE INDEX "plano_contas_empresa_id_idx" ON "plano_contas"("empresa_id");

-- CreateIndex
CREATE UNIQUE INDEX "plano_contas_empresa_id_user_id_codigo_key" ON "plano_contas"("empresa_id", "user_id", "codigo");

-- CreateIndex
CREATE INDEX "fechamento_mensal_user_id_ano_mes_status_idx" ON "fechamento_mensal"("user_id", "ano", "mes", "status");

-- CreateIndex
CREATE INDEX "fechamento_mensal_empresa_id_idx" ON "fechamento_mensal"("empresa_id");

-- CreateIndex
CREATE UNIQUE INDEX "fechamento_mensal_empresa_id_user_id_ano_mes_key" ON "fechamento_mensal"("empresa_id", "user_id", "ano", "mes");

-- CreateIndex
CREATE INDEX "dre_resultados_user_id_ano_mes_idx" ON "dre_resultados"("user_id", "ano", "mes");

-- CreateIndex
CREATE INDEX "dre_resultados_empresa_id_idx" ON "dre_resultados"("empresa_id");

-- CreateIndex
CREATE UNIQUE INDEX "dre_resultados_empresa_id_user_id_ano_mes_linha_key" ON "dre_resultados"("empresa_id", "user_id", "ano", "mes", "linha");

-- CreateIndex
CREATE INDEX "caixa_abertura_status_idx" ON "caixa_abertura"("status");

-- CreateIndex
CREATE INDEX "caixa_abertura_dataAbertura_idx" ON "caixa_abertura"("dataAbertura");

-- CreateIndex
CREATE INDEX "caixa_abertura_empresa_id_idx" ON "caixa_abertura"("empresa_id");

-- CreateIndex
CREATE UNIQUE INDEX "vendas_numeroPedido_key" ON "vendas"("numeroPedido");

-- CreateIndex
CREATE INDEX "vendas_dataVenda_idx" ON "vendas"("dataVenda");

-- CreateIndex
CREATE INDEX "vendas_caixaAberturaId_idx" ON "vendas"("caixaAberturaId");

-- CreateIndex
CREATE INDEX "vendas_tipoPagamento_idx" ON "vendas"("tipoPagamento");

-- CreateIndex
CREATE INDEX "vendas_nomeCliente_idx" ON "vendas"("nomeCliente");

-- CreateIndex
CREATE INDEX "vendas_tipoPedido_idx" ON "vendas"("tipoPedido");

-- CreateIndex
CREATE INDEX "vendas_numeroPedido_idx" ON "vendas"("numeroPedido");

-- CreateIndex
CREATE INDEX "vendas_empresa_id_idx" ON "vendas"("empresa_id");

-- CreateIndex
CREATE INDEX "produto_venda_vendaId_idx" ON "produto_venda"("vendaId");

-- CreateIndex
CREATE INDEX "produto_venda_nome_idx" ON "produto_venda"("nome");

-- CreateIndex
CREATE INDEX "produto_venda_empresa_id_idx" ON "produto_venda"("empresa_id");

-- CreateIndex
CREATE INDEX "vendas_manuais_caixaAberturaId_idx" ON "vendas_manuais"("caixaAberturaId");

-- CreateIndex
CREATE INDEX "vendas_manuais_tipoPagamento_idx" ON "vendas_manuais"("tipoPagamento");

-- CreateIndex
CREATE INDEX "vendas_manuais_empresa_id_idx" ON "vendas_manuais"("empresa_id");

-- CreateIndex
CREATE INDEX "retiradas_caixaAberturaId_idx" ON "retiradas"("caixaAberturaId");

-- CreateIndex
CREATE UNIQUE INDEX "caixa_fechamento_caixaAberturaId_key" ON "caixa_fechamento"("caixaAberturaId");

-- CreateIndex
CREATE INDEX "caixa_fechamento_empresa_id_idx" ON "caixa_fechamento"("empresa_id");

-- CreateIndex
CREATE INDEX "caixa_fechamento_user_id_idx" ON "caixa_fechamento"("user_id");

-- CreateIndex
CREATE INDEX "boletos_user_id_status_idx" ON "boletos"("user_id", "status");

-- CreateIndex
CREATE INDEX "boletos_data_vencimento_idx" ON "boletos"("data_vencimento");

-- CreateIndex
CREATE INDEX "boletos_lancamento_id_idx" ON "boletos"("lancamento_id");

-- CreateIndex
CREATE INDEX "boletos_empresa_id_idx" ON "boletos"("empresa_id");

-- CreateIndex
CREATE UNIQUE INDEX "boletos_empresa_id_numero_documento_key" ON "boletos"("empresa_id", "numero_documento");

-- CreateIndex
CREATE INDEX "categorias_user_id_tipo_nivel_idx" ON "categorias"("user_id", "tipo", "nivel");

-- CreateIndex
CREATE INDEX "categorias_empresa_id_idx" ON "categorias"("empresa_id");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_empresa_id_codigo_key" ON "categorias"("empresa_id", "codigo");

-- CreateIndex
CREATE INDEX "despesas_fixas_empresaId_idx" ON "despesas_fixas"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "despesas_fixas_empresaId_userId_nome_key" ON "despesas_fixas"("empresaId", "userId", "nome");

-- CreateIndex
CREATE INDEX "despesas_variaveis_empresaId_idx" ON "despesas_variaveis"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "despesas_variaveis_empresaId_userId_nome_key" ON "despesas_variaveis"("empresaId", "userId", "nome");

-- CreateIndex
CREATE INDEX "ficha_itens_empresaId_idx" ON "ficha_itens"("empresaId");

-- CreateIndex
CREATE INDEX "fichas_tecnicas_empresaId_idx" ON "fichas_tecnicas"("empresaId");

-- CreateIndex
CREATE INDEX "funcionarios_empresaId_idx" ON "funcionarios"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "funcionarios_empresaId_userId_nome_key" ON "funcionarios"("empresaId", "userId", "nome");

-- CreateIndex
CREATE INDEX "livro_diario_userId_origem_destino_idx" ON "livro_diario"("userId", "origem_destino");

-- CreateIndex
CREATE INDEX "livro_diario_empresaId_idx" ON "livro_diario"("empresaId");

-- CreateIndex
CREATE INDEX "notas_fiscais_empresaId_idx" ON "notas_fiscais"("empresaId");

-- CreateIndex
CREATE INDEX "pagamentos_empresaId_idx" ON "pagamentos"("empresaId");

-- CreateIndex
CREATE INDEX "planejamento_acompanhamento_empresaId_idx" ON "planejamento_acompanhamento"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "planejamento_acompanhamento_empresaId_userId_ano_mes_key" ON "planejamento_acompanhamento"("empresaId", "userId", "ano", "mes");

-- CreateIndex
CREATE INDEX "planejamento_config_empresaId_idx" ON "planejamento_config"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "planejamento_config_empresaId_userId_tipo_ano_referencia_key" ON "planejamento_config"("empresaId", "userId", "tipo", "ano_referencia");

-- CreateIndex
CREATE INDEX "planejamento_faturamento_empresaId_idx" ON "planejamento_faturamento"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "planejamento_faturamento_empresaId_userId_ano_mes_key" ON "planejamento_faturamento"("empresaId", "userId", "ano", "mes");

-- CreateIndex
CREATE INDEX "produtos_empresaId_idx" ON "produtos"("empresaId");

-- CreateIndex
CREATE INDEX "provisoes_funcionarios_empresaId_idx" ON "provisoes_funcionarios"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "provisoes_funcionarios_empresaId_userId_ano_provisao_funcio_key" ON "provisoes_funcionarios"("empresaId", "userId", "ano", "provisao", "funcionario_nome");

-- CreateIndex
CREATE UNIQUE INDEX "taxas_cartao_config_empresaId_key" ON "taxas_cartao_config"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "users_resetToken_key" ON "users"("resetToken");

-- AddForeignKey
ALTER TABLE "empresas" ADD CONSTRAINT "empresas_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contas_financeiras" ADD CONSTRAINT "contas_financeiras_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contas_financeiras" ADD CONSTRAINT "contas_financeiras_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_fiscais" ADD CONSTRAINT "notas_fiscais_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "livro_diario" ADD CONSTRAINT "livro_diario_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planejamento_config" ADD CONSTRAINT "planejamento_config_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planejamento_faturamento" ADD CONSTRAINT "planejamento_faturamento_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planejamento_acompanhamento" ADD CONSTRAINT "planejamento_acompanhamento_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fichas_tecnicas" ADD CONSTRAINT "fichas_tecnicas_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ficha_itens" ADD CONSTRAINT "ficha_itens_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ficha_itens" ADD CONSTRAINT "ficha_itens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "despesas_fixas" ADD CONSTRAINT "despesas_fixas_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "despesas_fixas" ADD CONSTRAINT "despesas_fixas_conta_id_fkey" FOREIGN KEY ("conta_id") REFERENCES "contas_financeiras"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "despesas_variaveis" ADD CONSTRAINT "despesas_variaveis_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funcionarios" ADD CONSTRAINT "funcionarios_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taxas_cartao_config" ADD CONSTRAINT "taxas_cartao_config_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provisoes_funcionarios" ADD CONSTRAINT "provisoes_funcionarios_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metas_fluxo_caixa" ADD CONSTRAINT "metas_fluxo_caixa_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metas_fluxo_caixa" ADD CONSTRAINT "metas_fluxo_caixa_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fluxo_caixa_diario" ADD CONSTRAINT "fluxo_caixa_diario_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fluxo_caixa_diario" ADD CONSTRAINT "fluxo_caixa_diario_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plano_contas" ADD CONSTRAINT "plano_contas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plano_contas" ADD CONSTRAINT "plano_contas_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fechamento_mensal" ADD CONSTRAINT "fechamento_mensal_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fechamento_mensal" ADD CONSTRAINT "fechamento_mensal_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dre_resultados" ADD CONSTRAINT "dre_resultados_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dre_resultados" ADD CONSTRAINT "dre_resultados_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caixa_abertura" ADD CONSTRAINT "caixa_abertura_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caixa_abertura" ADD CONSTRAINT "caixa_abertura_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendas" ADD CONSTRAINT "vendas_caixaAberturaId_fkey" FOREIGN KEY ("caixaAberturaId") REFERENCES "caixa_abertura"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendas" ADD CONSTRAINT "vendas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendas" ADD CONSTRAINT "vendas_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produto_venda" ADD CONSTRAINT "produto_venda_vendaId_fkey" FOREIGN KEY ("vendaId") REFERENCES "vendas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produto_venda" ADD CONSTRAINT "produto_venda_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produto_venda" ADD CONSTRAINT "produto_venda_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendas_manuais" ADD CONSTRAINT "vendas_manuais_caixaAberturaId_fkey" FOREIGN KEY ("caixaAberturaId") REFERENCES "caixa_abertura"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendas_manuais" ADD CONSTRAINT "vendas_manuais_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendas_manuais" ADD CONSTRAINT "vendas_manuais_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retiradas" ADD CONSTRAINT "retiradas_caixaAberturaId_fkey" FOREIGN KEY ("caixaAberturaId") REFERENCES "caixa_abertura"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retiradas" ADD CONSTRAINT "retiradas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retiradas" ADD CONSTRAINT "retiradas_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caixa_fechamento" ADD CONSTRAINT "caixa_fechamento_caixaAberturaId_fkey" FOREIGN KEY ("caixaAberturaId") REFERENCES "caixa_abertura"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caixa_fechamento" ADD CONSTRAINT "caixa_fechamento_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caixa_fechamento" ADD CONSTRAINT "caixa_fechamento_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boletos" ADD CONSTRAINT "boletos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boletos" ADD CONSTRAINT "boletos_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boletos" ADD CONSTRAINT "boletos_lancamento_id_fkey" FOREIGN KEY ("lancamento_id") REFERENCES "livro_diario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categorias" ADD CONSTRAINT "categorias_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categorias" ADD CONSTRAINT "categorias_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
