-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "isCritical" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "resignations" ADD COLUMN     "isCritical" BOOLEAN NOT NULL DEFAULT false;
