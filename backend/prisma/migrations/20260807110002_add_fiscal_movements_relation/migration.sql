-- CreateEnum
CREATE TYPE "FiscalDocumentType" AS ENUM ('NFE_ENTRADA', 'NFE_DEVOLUCAO', 'CTE');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('UPLOADED', 'PARSING', 'PARSED', 'PARSE_ERROR', 'AWAITING_REVIEW', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('ENTRADA', 'DEVOLUCAO', 'AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO', 'TRANSFERENCIA');

-- CreateEnum
CREATE TYPE "ProductMatchStatus" AS ENUM ('IDENTIFIED', 'SUGGESTED', 'NEW');

-- CreateTable
CREATE TABLE "fiscal_suppliers" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tradeName" TEXT,
    "stateRegistration" TEXT,
    "state" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "fiscal_suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fiscal_products" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "ean" TEXT,
    "description" TEXT NOT NULL,
    "ncm" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "averageCost" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "currentStock" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "fiscal_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fiscal_invoices" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "documentType" "FiscalDocumentType" NOT NULL DEFAULT 'NFE_ENTRADA',
    "status" "InvoiceStatus" NOT NULL DEFAULT 'UPLOADED',
    "number" TEXT NOT NULL,
    "series" TEXT NOT NULL,
    "accessKey" TEXT NOT NULL,
    "emissionDate" TIMESTAMP(3) NOT NULL,
    "entryDate" TIMESTAMP(3),
    "cfop" TEXT,
    "natOp" TEXT,
    "totalValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discountValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "freightValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "insuranceValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "otherValues" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "icmsBase" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "icmsValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "icmsStValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "ipiValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "pisValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "cofinsValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "xmlOriginalUrl" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fiscal_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fiscal_invoice_items" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "productId" TEXT,
    "productMatchStatus" "ProductMatchStatus" NOT NULL DEFAULT 'NEW',
    "itemNumber" INTEGER NOT NULL,
    "supplierCode" TEXT,
    "description" TEXT NOT NULL,
    "ncm" TEXT NOT NULL,
    "cfop" TEXT NOT NULL,
    "cst" TEXT,
    "csosn" TEXT,
    "quantity" DECIMAL(12,4) NOT NULL,
    "unitValue" DECIMAL(12,4) NOT NULL,
    "totalValue" DECIMAL(12,2) NOT NULL,
    "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "icmsBase" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "icmsRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "icmsValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "icmsStBase" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "icmsStValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "ipiBase" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "ipiRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "ipiValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "pisBase" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "pisRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "pisValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "cofinsBase" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "cofinsRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "cofinsValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fiscal_invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fiscal_inventory_movements" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "type" "MovementType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "quantity" DECIMAL(12,4) NOT NULL,
    "unitCost" DECIMAL(12,4) NOT NULL,
    "totalCost" DECIMAL(12,2) NOT NULL,
    "averageCostAfter" DECIMAL(12,4) NOT NULL,
    "reason" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fiscal_inventory_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fiscal_inventory_balances" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "initialQty" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "initialValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "inQty" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "inValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "outQty" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "outValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "finalQty" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "finalValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "averageCost" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fiscal_inventory_balances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fiscal_suppliers_companyId_name_idx" ON "fiscal_suppliers"("companyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "fiscal_suppliers_companyId_cnpj_key" ON "fiscal_suppliers"("companyId", "cnpj");

-- CreateIndex
CREATE INDEX "fiscal_products_companyId_ncm_idx" ON "fiscal_products"("companyId", "ncm");

-- CreateIndex
CREATE INDEX "fiscal_products_companyId_description_idx" ON "fiscal_products"("companyId", "description");

-- CreateIndex
CREATE UNIQUE INDEX "fiscal_products_companyId_code_key" ON "fiscal_products"("companyId", "code");

-- CreateIndex
CREATE INDEX "fiscal_invoices_companyId_supplierId_idx" ON "fiscal_invoices"("companyId", "supplierId");

-- CreateIndex
CREATE INDEX "fiscal_invoices_companyId_emissionDate_idx" ON "fiscal_invoices"("companyId", "emissionDate");

-- CreateIndex
CREATE INDEX "fiscal_invoices_companyId_status_idx" ON "fiscal_invoices"("companyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "fiscal_invoices_companyId_accessKey_key" ON "fiscal_invoices"("companyId", "accessKey");

-- CreateIndex
CREATE INDEX "fiscal_invoice_items_productId_idx" ON "fiscal_invoice_items"("productId");

-- CreateIndex
CREATE INDEX "fiscal_invoice_items_ncm_idx" ON "fiscal_invoice_items"("ncm");

-- CreateIndex
CREATE UNIQUE INDEX "fiscal_invoice_items_invoiceId_itemNumber_key" ON "fiscal_invoice_items"("invoiceId", "itemNumber");

-- CreateIndex
CREATE INDEX "fiscal_inventory_movements_companyId_productId_date_idx" ON "fiscal_inventory_movements"("companyId", "productId", "date");

-- CreateIndex
CREATE INDEX "fiscal_inventory_movements_companyId_date_idx" ON "fiscal_inventory_movements"("companyId", "date");

-- CreateIndex
CREATE INDEX "fiscal_inventory_movements_invoiceId_idx" ON "fiscal_inventory_movements"("invoiceId");

-- CreateIndex
CREATE INDEX "fiscal_inventory_balances_companyId_year_month_idx" ON "fiscal_inventory_balances"("companyId", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "fiscal_inventory_balances_companyId_productId_year_month_key" ON "fiscal_inventory_balances"("companyId", "productId", "year", "month");

-- AddForeignKey
ALTER TABLE "fiscal_suppliers" ADD CONSTRAINT "fiscal_suppliers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_products" ADD CONSTRAINT "fiscal_products_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_invoices" ADD CONSTRAINT "fiscal_invoices_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_invoices" ADD CONSTRAINT "fiscal_invoices_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "fiscal_suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_invoice_items" ADD CONSTRAINT "fiscal_invoice_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "fiscal_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_invoice_items" ADD CONSTRAINT "fiscal_invoice_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "fiscal_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_inventory_movements" ADD CONSTRAINT "fiscal_inventory_movements_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_inventory_movements" ADD CONSTRAINT "fiscal_inventory_movements_productId_fkey" FOREIGN KEY ("productId") REFERENCES "fiscal_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_inventory_movements" ADD CONSTRAINT "fiscal_inventory_movements_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "fiscal_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_inventory_balances" ADD CONSTRAINT "fiscal_inventory_balances_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_inventory_balances" ADD CONSTRAINT "fiscal_inventory_balances_productId_fkey" FOREIGN KEY ("productId") REFERENCES "fiscal_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
