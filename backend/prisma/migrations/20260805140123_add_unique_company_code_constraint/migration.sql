/*
  Warnings:

  - A unique constraint covering the columns `[companyId,code]` on the table `accounting_accounts` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "accounting_accounts_companyId_code_key" ON "accounting_accounts"("companyId", "code");
