-- =================================================================
-- CORREÇÃO: Criação dos enums CNAB que faltavam nesta migração
-- =================================================================
CREATE TYPE "CnabTipoArquivo" AS ENUM ('REMESSA', 'RETORNO');
CREATE TYPE "CnabFormato" AS ENUM ('CNAB_240', 'CNAB_400');
CREATE TYPE "CnabStatus" AS ENUM ('GERADA', 'ENVIADA', 'PROCESSADA', 'ERRO');
CREATE TYPE "CobrancaCanal" AS ENUM ('EMAIL', 'WHATSAPP', 'SMS');
CREATE TYPE "CobrancaStatus" AS ENUM ('AGUARDANDO_APROVACAO', 'APROVADO', 'REJEITADO', 'ENVIADO', 'FALHOU');

-- (O RESTANTE DO ARQUIVO DEVE PERMANECER EXATAMENTE COMO ESTAVA)-- CreateTable
CREATE TABLE "cnab_arquivos" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "tipo" "CnabTipoArquivo" NOT NULL,
    "formato" "CnabFormato" NOT NULL,
    "banco" TEXT NOT NULL,
    "sequencial" INTEGER NOT NULL,
    "status" "CnabStatus" NOT NULL DEFAULT 'GERADA',
    "erroMensagem" TEXT,
    "dataGeracao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataProcessamento" TIMESTAMP(3),
    "nomeArquivo" TEXT,
    "tamanhoBytes" INTEGER,
    "checksum" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cnab_arquivos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cnab_movimentos" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "arquivoId" TEXT NOT NULL,
    "nossoNumero" TEXT NOT NULL,
    "numeroDocumento" TEXT NOT NULL,
    "codigoMovimento" TEXT NOT NULL,
    "descricaoMovimento" TEXT NOT NULL,
    "valorTitulo" DOUBLE PRECISION NOT NULL,
    "valorPago" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tarifa" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dataOcorrencia" TIMESTAMP(3) NOT NULL,
    "dataCredito" TIMESTAMP(3),
    "bankTransactionId" TEXT,
    "clientId" TEXT,
    "aplicado" BOOLEAN NOT NULL DEFAULT false,
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cnab_movimentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cobranca_regras" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "diasAposVencimento" INTEGER NOT NULL,
    "canal" "CobrancaCanal" NOT NULL,
    "templateMensagem" TEXT NOT NULL,
    "requerAprovacao" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cobranca_regras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cobranca_eventos" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "regraId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "faturaIdentificador" TEXT NOT NULL,
    "valorDevido" DOUBLE PRECISION NOT NULL,
    "dataVencimento" TIMESTAMP(3) NOT NULL,
    "canal" "CobrancaCanal" NOT NULL,
    "mensagemEnviada" TEXT NOT NULL,
    "status" "CobrancaStatus" NOT NULL DEFAULT 'AGUARDANDO_APROVACAO',
    "aprovadoPorId" TEXT,
    "dataAprovacao" TIMESTAMP(3),
    "motivoRejeicao" TEXT,
    "dataEnvio" TIMESTAMP(3),
    "erroEnvio" TEXT,
    "protocoloExterno" TEXT,
    "reagendadoPara" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cobranca_eventos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cnab_arquivos_companyId_status_idx" ON "cnab_arquivos"("companyId", "status");

-- CreateIndex
CREATE INDEX "cnab_arquivos_companyId_banco_formato_idx" ON "cnab_arquivos"("companyId", "banco", "formato");

-- CreateIndex
CREATE INDEX "cnab_movimentos_companyId_nossoNumero_idx" ON "cnab_movimentos"("companyId", "nossoNumero");

-- CreateIndex
CREATE INDEX "cnab_movimentos_companyId_dataOcorrencia_idx" ON "cnab_movimentos"("companyId", "dataOcorrencia");

-- CreateIndex
CREATE INDEX "cnab_movimentos_companyId_bankTransactionId_idx" ON "cnab_movimentos"("companyId", "bankTransactionId");

-- CreateIndex
CREATE INDEX "cobranca_regras_companyId_ativa_idx" ON "cobranca_regras"("companyId", "ativa");

-- CreateIndex
CREATE UNIQUE INDEX "cobranca_regras_companyId_nome_diasAposVencimento_canal_key" ON "cobranca_regras"("companyId", "nome", "diasAposVencimento", "canal");

-- CreateIndex
CREATE INDEX "cobranca_eventos_companyId_status_idx" ON "cobranca_eventos"("companyId", "status");

-- CreateIndex
CREATE INDEX "cobranca_eventos_companyId_clientId_dataVencimento_idx" ON "cobranca_eventos"("companyId", "clientId", "dataVencimento");

-- CreateIndex
CREATE INDEX "cobranca_eventos_companyId_aprovadoPorId_idx" ON "cobranca_eventos"("companyId", "aprovadoPorId");

-- AddForeignKey
ALTER TABLE "cnab_arquivos" ADD CONSTRAINT "cnab_arquivos_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cnab_movimentos" ADD CONSTRAINT "cnab_movimentos_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cnab_movimentos" ADD CONSTRAINT "cnab_movimentos_arquivoId_fkey" FOREIGN KEY ("arquivoId") REFERENCES "cnab_arquivos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cnab_movimentos" ADD CONSTRAINT "cnab_movimentos_bankTransactionId_fkey" FOREIGN KEY ("bankTransactionId") REFERENCES "bank_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cnab_movimentos" ADD CONSTRAINT "cnab_movimentos_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cobranca_regras" ADD CONSTRAINT "cobranca_regras_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cobranca_eventos" ADD CONSTRAINT "cobranca_eventos_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cobranca_eventos" ADD CONSTRAINT "cobranca_eventos_regraId_fkey" FOREIGN KEY ("regraId") REFERENCES "cobranca_regras"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cobranca_eventos" ADD CONSTRAINT "cobranca_eventos_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cobranca_eventos" ADD CONSTRAINT "cobranca_eventos_aprovadoPorId_fkey" FOREIGN KEY ("aprovadoPorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

