/*
  Warnings:

  - The `nature` column on the `bank_transactions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `nature` on the `bank_classification_rules` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('SUGESTAO', 'CONFIRMADO', 'DESCARTADO');

-- CreateEnum
CREATE TYPE "MatchType" AS ENUM ('AUTO', 'MANUAL');

-- AlterTable
ALTER TABLE "accounting_entries" ADD COLUMN     "bankTransactionId" TEXT;

-- AlterTable
ALTER TABLE "bank_classification_rules" DROP COLUMN "nature",
ADD COLUMN     "nature" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "bank_transactions" DROP COLUMN "nature",
ADD COLUMN     "nature" TEXT NOT NULL DEFAULT 'NAO_CLASSIFICADO';

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "installments" INTEGER,
ADD COLUMN     "lastPaymentDate" TIMESTAMP(3),
ADD COLUMN     "openAmount" DOUBLE PRECISION,
ADD COLUMN     "overdueAmount" DOUBLE PRECISION,
ADD COLUMN     "paidAmount" DOUBLE PRECISION;

-- DropEnum
DROP TYPE "BankNature";

-- CreateTable
CREATE TABLE "bank_categories" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "clientId" TEXT,
    "label" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_nfe_matches" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "bankTransactionId" TEXT NOT NULL,
    "fiscalInvoiceId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "matchType" "MatchType" NOT NULL DEFAULT 'AUTO',
    "status" "MatchStatus" NOT NULL DEFAULT 'SUGESTAO',
    "scoreBreakdown" JSONB,
    "confirmedAt" TIMESTAMP(3),
    "confirmedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_nfe_matches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bank_categories_companyId_clientId_idx" ON "bank_categories"("companyId", "clientId");

-- CreateIndex
CREATE UNIQUE INDEX "bank_categories_companyId_clientId_label_key" ON "bank_categories"("companyId", "clientId", "label");

-- CreateIndex
CREATE INDEX "bank_nfe_matches_companyId_status_idx" ON "bank_nfe_matches"("companyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "bank_nfe_matches_bankTransactionId_fiscalInvoiceId_key" ON "bank_nfe_matches"("bankTransactionId", "fiscalInvoiceId");

-- CreateIndex
CREATE INDEX "bank_transactions_companyId_nature_idx" ON "bank_transactions"("companyId", "nature");

-- AddForeignKey
ALTER TABLE "bank_nfe_matches" ADD CONSTRAINT "bank_nfe_matches_bankTransactionId_fkey" FOREIGN KEY ("bankTransactionId") REFERENCES "bank_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_nfe_matches" ADD CONSTRAINT "bank_nfe_matches_fiscalInvoiceId_fkey" FOREIGN KEY ("fiscalInvoiceId") REFERENCES "fiscal_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
