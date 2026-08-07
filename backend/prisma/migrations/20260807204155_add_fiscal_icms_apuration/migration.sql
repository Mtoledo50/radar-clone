-- CreateTable
CREATE TABLE "fiscal_icms_apurations" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "creditsIcms" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "creditsIcmsSt" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "purchasesValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "invoicesCount" INTEGER NOT NULL DEFAULT 0,
    "salesValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "debitRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "debitsIcms" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ABERTA',
    "closedAt" TIMESTAMP(3),
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fiscal_icms_apurations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fiscal_icms_apurations_companyId_year_idx" ON "fiscal_icms_apurations"("companyId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "fiscal_icms_apurations_companyId_year_month_key" ON "fiscal_icms_apurations"("companyId", "year", "month");

-- AddForeignKey
ALTER TABLE "fiscal_icms_apurations" ADD CONSTRAINT "fiscal_icms_apurations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
