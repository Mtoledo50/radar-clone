-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('CLT', 'ESTAGIARIO', 'TERCEIRIZADO', 'SOCIO');

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "contractType" "ContractType" NOT NULL DEFAULT 'CLT';
