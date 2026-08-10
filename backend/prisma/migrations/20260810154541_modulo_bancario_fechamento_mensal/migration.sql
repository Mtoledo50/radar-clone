-- CreateEnum
CREATE TYPE "BankNature" AS ENUM ('RECEITA_OPERACIONAL', 'RECEITA_FINANCEIRA', 'DESPESA_OPERACIONAL', 'IMPOSTO', 'SOCIO', 'NAO_CLASSIFICADO');

-- CreateTable
CREATE TABLE "bank_statements" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "clientId" TEXT,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "fileName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ABERTO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_statements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_transactions" (
    "id" TEXT NOT NULL,
    "statementId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "counterparty" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "nature" "BankNature" NOT NULL DEFAULT 'NAO_CLASSIFICADO',
    "classifiedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_classification_rules" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "nature" "BankNature" NOT NULL,
    "hits" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_classification_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bank_statements_companyId_clientId_idx" ON "bank_statements"("companyId", "clientId");

-- CreateIndex
CREATE UNIQUE INDEX "bank_statements_companyId_clientId_year_month_key" ON "bank_statements"("companyId", "clientId", "year", "month");

-- CreateIndex
CREATE INDEX "bank_transactions_statementId_idx" ON "bank_transactions"("statementId");

-- CreateIndex
CREATE INDEX "bank_transactions_companyId_nature_idx" ON "bank_transactions"("companyId", "nature");

-- CreateIndex
CREATE UNIQUE INDEX "bank_classification_rules_companyId_pattern_key" ON "bank_classification_rules"("companyId", "pattern");

-- AddForeignKey
ALTER TABLE "bank_statements" ADD CONSTRAINT "bank_statements_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_statements" ADD CONSTRAINT "bank_statements_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_statementId_fkey" FOREIGN KEY ("statementId") REFERENCES "bank_statements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
