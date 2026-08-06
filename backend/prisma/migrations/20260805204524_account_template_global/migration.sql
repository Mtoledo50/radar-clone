/*
  Warnings:

  - You are about to drop the column `customPrice` on the `client_services` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "client_services" DROP COLUMN "customPrice";

-- CreateTable
CREATE TABLE "account_templates" (
    "id" TEXT NOT NULL,
    "reducedCode" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "parentCode" TEXT,
    "name" TEXT NOT NULL,
    "nickname" TEXT,
    "accountType" TEXT NOT NULL,
    "report" TEXT NOT NULL,
    "isSynthetic" BOOLEAN NOT NULL DEFAULT false,
    "level" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "account_templates_reducedCode_key" ON "account_templates"("reducedCode");

-- CreateIndex
CREATE INDEX "account_templates_code_idx" ON "account_templates"("code");

-- CreateIndex
CREATE INDEX "account_templates_accountType_idx" ON "account_templates"("accountType");
