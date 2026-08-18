-- CreateEnum
CREATE TYPE "NfseDirection" AS ENUM ('EMITIDA', 'RECEBIDA');

-- CreateEnum
CREATE TYPE "NfseStatus" AS ENUM ('IMPORTED', 'REVIEW', 'ACCOUNTED', 'REJECTED');

-- CreateTable
CREATE TABLE "fiscal_service_invoices" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "clientId" TEXT,
    "number" TEXT NOT NULL,
    "series" TEXT NOT NULL DEFAULT '',
    "verificationCode" TEXT,
    "emissionDate" TIMESTAMP(3) NOT NULL,
    "competenceDate" TIMESTAMP(3),
    "issuerCnpj" TEXT NOT NULL,
    "issuerName" TEXT NOT NULL,
    "takerCnpj" TEXT,
    "takerName" TEXT,
    "serviceValue" DECIMAL(12,2) NOT NULL,
    "deductions" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "issBase" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "issRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "issValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "issRetained" BOOLEAN NOT NULL DEFAULT false,
    "serviceCode" TEXT,
    "serviceDescription" TEXT,
    "municipalityCode" TEXT,
    "direction" "NfseDirection" NOT NULL DEFAULT 'EMITIDA',
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "status" "NfseStatus" NOT NULL DEFAULT 'IMPORTED',
    "rawXml" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fiscal_service_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fiscal_service_invoices_companyId_clientId_idx" ON "fiscal_service_invoices"("companyId", "clientId");

-- CreateIndex
CREATE INDEX "fiscal_service_invoices_companyId_status_idx" ON "fiscal_service_invoices"("companyId", "status");

-- CreateIndex
CREATE INDEX "fiscal_service_invoices_companyId_emissionDate_idx" ON "fiscal_service_invoices"("companyId", "emissionDate");

-- CreateIndex
CREATE UNIQUE INDEX "fiscal_service_invoices_companyId_issuerCnpj_number_series_key" ON "fiscal_service_invoices"("companyId", "issuerCnpj", "number", "series");

-- AddForeignKey
ALTER TABLE "fiscal_service_invoices" ADD CONSTRAINT "fiscal_service_invoices_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_service_invoices" ADD CONSTRAINT "fiscal_service_invoices_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

