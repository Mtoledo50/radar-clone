-- CreateTable
CREATE TABLE "turnover_sector_distribution" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "sectorId" TEXT NOT NULL,
    "initial" INTEGER NOT NULL DEFAULT 0,
    "admissions" INTEGER NOT NULL DEFAULT 0,
    "dismissals" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "turnover_sector_distribution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "turnover_sector_distribution_companyId_idx" ON "turnover_sector_distribution"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "turnover_sector_distribution_companyId_year_month_sectorId_key" ON "turnover_sector_distribution"("companyId", "year", "month", "sectorId");

-- AddForeignKey
ALTER TABLE "turnover_sector_distribution" ADD CONSTRAINT "turnover_sector_distribution_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turnover_sector_distribution" ADD CONSTRAINT "turnover_sector_distribution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turnover_sector_distribution" ADD CONSTRAINT "turnover_sector_distribution_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "sectors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
