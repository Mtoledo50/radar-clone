-- DropIndex
DROP INDEX "proposals_slug_idx";

-- AlterTable
ALTER TABLE "proposals" ADD COLUMN     "isCurrent" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "originalProposalId" TEXT,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE INDEX "proposals_userId_idx" ON "proposals"("userId");

-- CreateIndex
CREATE INDEX "proposals_originalProposalId_idx" ON "proposals"("originalProposalId");

-- CreateIndex
CREATE INDEX "proposals_isCurrent_idx" ON "proposals"("isCurrent");

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_originalProposalId_fkey" FOREIGN KEY ("originalProposalId") REFERENCES "proposals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
