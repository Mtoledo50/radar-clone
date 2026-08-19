/*
  Warnings:

  - A unique constraint covering the columns `[companyId,companyName]` on the table `clients` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "TaxGuideType" AS ENUM ('DAS', 'ISS', 'DARF');

-- CreateEnum
CREATE TYPE "TaxGuideStatus" AS ENUM ('DRAFT', 'APPROVED', 'TRANSMITTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('GENERATING', 'READY', 'FAILED');

-- DropIndex
DROP INDEX "clients_companyId_idx";

-- CreateTable
CREATE TABLE "tax_guides" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "type" "TaxGuideType" NOT NULL,
    "value" DECIMAL(12,2) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "status" "TaxGuideStatus" NOT NULL DEFAULT 'DRAFT',
    "memory" JSONB NOT NULL DEFAULT '{}',
    "runId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_guides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_reports" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "pdfPath" TEXT,
    "summary" JSONB,
    "status" "ReportStatus" NOT NULL DEFAULT 'GENERATING',
    "errorMessage" TEXT,
    "runId" TEXT,
    "generatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monthly_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tax_guides_companyId_period_idx" ON "tax_guides"("companyId", "period");

-- CreateIndex
CREATE INDEX "tax_guides_companyId_status_idx" ON "tax_guides"("companyId", "status");

-- CreateIndex
CREATE INDEX "tax_guides_companyId_type_idx" ON "tax_guides"("companyId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "tax_guides_companyId_clientId_period_type_key" ON "tax_guides"("companyId", "clientId", "period", "type");

-- CreateIndex
CREATE INDEX "monthly_reports_companyId_period_idx" ON "monthly_reports"("companyId", "period");

-- CreateIndex
CREATE INDEX "monthly_reports_clientId_idx" ON "monthly_reports"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_reports_companyId_clientId_period_key" ON "monthly_reports"("companyId", "clientId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "clients_companyId_companyName_key" ON "clients"("companyId", "companyName");

-- AddForeignKey
ALTER TABLE "tax_guides" ADD CONSTRAINT "tax_guides_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_guides" ADD CONSTRAINT "tax_guides_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_reports" ADD CONSTRAINT "monthly_reports_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_reports" ADD CONSTRAINT "monthly_reports_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_reports" ADD CONSTRAINT "monthly_reports_runId_fkey" FOREIGN KEY ("runId") REFERENCES "automation_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
