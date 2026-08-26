-- AlterTable
ALTER TABLE "billing_instructions" ADD COLUMN     "clientId" TEXT;

-- AddForeignKey
ALTER TABLE "billing_instructions" ADD CONSTRAINT "billing_instructions_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

