-- AlterTable
ALTER TABLE "accounting_accounts" ADD COLUMN     "reducedCode" INTEGER;

-- CreateTable
CREATE TABLE "historical_entries" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "clientId" TEXT,
    "year" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "debitCode" TEXT,
    "creditCode" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "historyCode" TEXT,
    "description" TEXT NOT NULL,
    "docNumber" TEXT,
    "entryType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historical_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "historical_entries_companyId_clientId_year_idx" ON "historical_entries"("companyId", "clientId", "year");

-- CreateIndex
CREATE INDEX "historical_entries_companyId_amount_idx" ON "historical_entries"("companyId", "amount");
