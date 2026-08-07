/*
  Warnings:

  - A unique constraint covering the columns `[companyId,clientId,year,month]` on the table `fiscal_icms_apurations` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,clientId,code]` on the table `fiscal_products` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "fiscal_icms_apurations_companyId_year_month_key";

-- DropIndex
DROP INDEX "fiscal_products_companyId_code_key";

-- AlterTable
ALTER TABLE "fiscal_icms_apurations" ADD COLUMN     "clientId" TEXT;

-- AlterTable
ALTER TABLE "fiscal_inventory_movements" ADD COLUMN     "clientId" TEXT;

-- AlterTable
ALTER TABLE "fiscal_invoices" ADD COLUMN     "clientId" TEXT;

-- AlterTable
ALTER TABLE "fiscal_products" ADD COLUMN     "clientId" TEXT;

-- CreateIndex
CREATE INDEX "fiscal_icms_apurations_companyId_clientId_year_idx" ON "fiscal_icms_apurations"("companyId", "clientId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "fiscal_icms_apurations_companyId_clientId_year_month_key" ON "fiscal_icms_apurations"("companyId", "clientId", "year", "month");

-- CreateIndex
CREATE INDEX "fiscal_inventory_movements_companyId_clientId_idx" ON "fiscal_inventory_movements"("companyId", "clientId");

-- CreateIndex
CREATE INDEX "fiscal_invoices_companyId_clientId_idx" ON "fiscal_invoices"("companyId", "clientId");

-- CreateIndex
CREATE INDEX "fiscal_products_companyId_clientId_idx" ON "fiscal_products"("companyId", "clientId");

-- CreateIndex
CREATE UNIQUE INDEX "fiscal_products_companyId_clientId_code_key" ON "fiscal_products"("companyId", "clientId", "code");

-- AddForeignKey
ALTER TABLE "fiscal_products" ADD CONSTRAINT "fiscal_products_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_invoices" ADD CONSTRAINT "fiscal_invoices_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_inventory_movements" ADD CONSTRAINT "fiscal_inventory_movements_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_icms_apurations" ADD CONSTRAINT "fiscal_icms_apurations_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
