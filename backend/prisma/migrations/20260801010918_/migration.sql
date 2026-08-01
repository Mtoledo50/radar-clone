-- AlterTable
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'CLIENTE';

-- CreateIndex
CREATE INDEX "financial_transactions_userId_idx" ON "financial_transactions"("userId");
