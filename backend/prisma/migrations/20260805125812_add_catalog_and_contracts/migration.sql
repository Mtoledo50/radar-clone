/*
  Warnings:

  - The `serviceType` column on the `clients` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `clients` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `employees` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `plannings` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `serviceType` column on the `pricings` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `complexity` column on the `pricings` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `pricings` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `includedPlans` on the `proposals` table. All the data in the column will be lost.
  - The `status` column on the `proposals` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `role` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `type` on the `financial_transactions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `basePrice` to the `service_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `estimatedHours` to the `service_items` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER', 'CLIENTE');

-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DISMISSED');

-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('ATIVO', 'PROSPECT', 'INATIVO', 'CHURN', 'SUSPENSO');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('CONTABIL', 'FISCAL', 'PESSOAL', 'MEI', 'IRPF', 'CONSULTORIA', 'OUTROS');

-- CreateEnum
CREATE TYPE "Complexity" AS ENUM ('BAIXA', 'MEDIA', 'ALTA');

-- CreateEnum
CREATE TYPE "PricingStatus" AS ENUM ('RASCUNHO', 'APROVADO', 'REJEITADO');

-- CreateEnum
CREATE TYPE "PlanningStatus" AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('RECEITA', 'DESPESA');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('ATIVO', 'PASSIVO', 'PATRIMONIO_LIQUIDO', 'RECEITA', 'DESPESA');

-- CreateEnum
CREATE TYPE "AccountNature" AS ENUM ('DEVEDORA', 'CREDORA');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('DRAFT', 'SENT', 'VIEWED', 'CLOSED_WON', 'CLOSED_LOST');

-- CreateEnum
CREATE TYPE "Recurrence" AS ENUM ('AVULSO', 'MENSAL', 'TRIMESTRAL', 'ANUAL');

-- DropForeignKey
ALTER TABLE "clients" DROP CONSTRAINT "clients_userId_fkey";

-- DropForeignKey
ALTER TABLE "company_profiles" DROP CONSTRAINT "company_profiles_userId_fkey";

-- DropForeignKey
ALTER TABLE "employees" DROP CONSTRAINT "employees_userId_fkey";

-- DropForeignKey
ALTER TABLE "plannings" DROP CONSTRAINT "plannings_userId_fkey";

-- DropForeignKey
ALTER TABLE "pricings" DROP CONSTRAINT "pricings_userId_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_companyId_fkey";

-- DropIndex
DROP INDEX "dismissal_reasons_userId_idx";

-- DropIndex
DROP INDEX "financial_transactions_clientId_idx";

-- DropIndex
DROP INDEX "financial_transactions_userId_idx";

-- DropIndex
DROP INDEX "financial_transactions_userId_type_idx";

-- DropIndex
DROP INDEX "plannings_userId_idx";

-- DropIndex
DROP INDEX "positions_userId_idx";

-- DropIndex
DROP INDEX "pricings_userId_idx";

-- DropIndex
DROP INDEX "resignations_userId_idx";

-- DropIndex
DROP INDEX "sectors_userId_idx";

-- DropIndex
DROP INDEX "turnover_monthly_userId_idx";

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "deletedAt" TIMESTAMP(3),
DROP COLUMN "serviceType",
ADD COLUMN     "serviceType" "ServiceType" NOT NULL DEFAULT 'CONTABIL',
DROP COLUMN "status",
ADD COLUMN     "status" "ClientStatus" NOT NULL DEFAULT 'ATIVO';

-- AlterTable
ALTER TABLE "commercial_plans" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ALTER COLUMN "multiplier" SET DEFAULT 1.0;

-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "address" TEXT,
ADD COLUMN     "businessGoals" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "email" TEXT,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "softwareStack" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "deletedAt" TIMESTAMP(3),
DROP COLUMN "status",
ADD COLUMN     "status" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "financial_transactions" DROP COLUMN "type",
ADD COLUMN     "type" "TransactionType" NOT NULL;

-- AlterTable
ALTER TABLE "plan_service_items" ADD COLUMN     "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "plannings" DROP COLUMN "status",
ADD COLUMN     "status" "PlanningStatus" NOT NULL DEFAULT 'PENDENTE';

-- AlterTable
ALTER TABLE "pricings" DROP COLUMN "serviceType",
ADD COLUMN     "serviceType" "ServiceType" NOT NULL DEFAULT 'CONTABIL',
DROP COLUMN "complexity",
ADD COLUMN     "complexity" "Complexity" NOT NULL DEFAULT 'MEDIA',
DROP COLUMN "status",
ADD COLUMN     "status" "PricingStatus" NOT NULL DEFAULT 'RASCUNHO';

-- AlterTable
ALTER TABLE "proposals" DROP COLUMN "includedPlans",
DROP COLUMN "status",
ADD COLUMN     "status" "ProposalStatus" NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "service_categories" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "service_items" ADD COLUMN     "basePrice" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "estimatedHours" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "outOfScope" TEXT,
ADD COLUMN     "recurrence" "Recurrence" NOT NULL DEFAULT 'MENSAL',
ADD COLUMN     "requiredDocs" TEXT,
ADD COLUMN     "scope" TEXT,
ADD COLUMN     "slaDays" INTEGER NOT NULL DEFAULT 5;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "deletedAt" TIMESTAMP(3),
DROP COLUMN "role",
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE "client_contracts" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "commercialPlanId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "monthlyFee" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_services" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "serviceItemId" TEXT NOT NULL,
    "customPrice" DECIMAL(10,2),
    "recurrence" "Recurrence" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposal_items" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "commercialPlanId" TEXT,
    "serviceItemId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "totalPrice" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proposal_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_monthly_data" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "initialClients" INTEGER NOT NULL DEFAULT 0,
    "newClients" INTEGER NOT NULL DEFAULT 0,
    "churnedClients" INTEGER NOT NULL DEFAULT 0,
    "finalClients" INTEGER NOT NULL DEFAULT 0,
    "newRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lostRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "finalRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "churnRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "accumulatedChurn" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_monthly_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounting_entries" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "entryDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "documentNumber" TEXT,
    "counterpartyName" TEXT,
    "counterpartyCpfCnpj" TEXT,
    "counterpartyType" TEXT,
    "clientId" TEXT,
    "debitAccountId" TEXT,
    "debitValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "creditAccountId" TEXT,
    "creditValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounting_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounting_accounts" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AccountType" NOT NULL,
    "nature" "AccountNature" NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "parentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sciCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounting_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planning_cycles" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "responsible" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planning_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planning_areas" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "leader" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planning_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planning_objectives" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "context" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planning_objectives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planning_goals" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "objectiveId" TEXT NOT NULL,
    "areaId" TEXT,
    "title" TEXT NOT NULL,
    "targetValue" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planning_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planning_kpis" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "formula" TEXT,
    "unit" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planning_kpis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planning_action_plans" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "responsible" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planning_action_plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "client_contracts_companyId_idx" ON "client_contracts"("companyId");

-- CreateIndex
CREATE INDEX "client_contracts_clientId_idx" ON "client_contracts"("clientId");

-- CreateIndex
CREATE INDEX "client_services_companyId_idx" ON "client_services"("companyId");

-- CreateIndex
CREATE INDEX "client_services_clientId_idx" ON "client_services"("clientId");

-- CreateIndex
CREATE INDEX "proposal_items_proposalId_idx" ON "proposal_items"("proposalId");

-- CreateIndex
CREATE INDEX "client_monthly_data_companyId_idx" ON "client_monthly_data"("companyId");

-- CreateIndex
CREATE INDEX "client_monthly_data_userId_idx" ON "client_monthly_data"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "client_monthly_data_companyId_year_month_key" ON "client_monthly_data"("companyId", "year", "month");

-- CreateIndex
CREATE INDEX "accounting_entries_companyId_idx" ON "accounting_entries"("companyId");

-- CreateIndex
CREATE INDEX "accounting_entries_status_idx" ON "accounting_entries"("status");

-- CreateIndex
CREATE INDEX "accounting_entries_entryDate_idx" ON "accounting_entries"("entryDate");

-- CreateIndex
CREATE INDEX "accounting_accounts_companyId_idx" ON "accounting_accounts"("companyId");

-- CreateIndex
CREATE INDEX "accounting_accounts_code_idx" ON "accounting_accounts"("code");

-- CreateIndex
CREATE INDEX "planning_cycles_companyId_idx" ON "planning_cycles"("companyId");

-- CreateIndex
CREATE INDEX "planning_areas_companyId_idx" ON "planning_areas"("companyId");

-- CreateIndex
CREATE INDEX "planning_objectives_companyId_idx" ON "planning_objectives"("companyId");

-- CreateIndex
CREATE INDEX "planning_objectives_cycleId_idx" ON "planning_objectives"("cycleId");

-- CreateIndex
CREATE INDEX "planning_goals_companyId_idx" ON "planning_goals"("companyId");

-- CreateIndex
CREATE INDEX "planning_goals_objectiveId_idx" ON "planning_goals"("objectiveId");

-- CreateIndex
CREATE INDEX "planning_kpis_companyId_idx" ON "planning_kpis"("companyId");

-- CreateIndex
CREATE INDEX "planning_action_plans_companyId_idx" ON "planning_action_plans"("companyId");

-- CreateIndex
CREATE INDEX "planning_action_plans_goalId_idx" ON "planning_action_plans"("goalId");

-- CreateIndex
CREATE INDEX "proposals_status_idx" ON "proposals"("status");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_profiles" ADD CONSTRAINT "company_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_contracts" ADD CONSTRAINT "client_contracts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_contracts" ADD CONSTRAINT "client_contracts_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_contracts" ADD CONSTRAINT "client_contracts_commercialPlanId_fkey" FOREIGN KEY ("commercialPlanId") REFERENCES "commercial_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_services" ADD CONSTRAINT "client_services_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_services" ADD CONSTRAINT "client_services_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_services" ADD CONSTRAINT "client_services_serviceItemId_fkey" FOREIGN KEY ("serviceItemId") REFERENCES "service_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal_items" ADD CONSTRAINT "proposal_items_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal_items" ADD CONSTRAINT "proposal_items_commercialPlanId_fkey" FOREIGN KEY ("commercialPlanId") REFERENCES "commercial_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal_items" ADD CONSTRAINT "proposal_items_serviceItemId_fkey" FOREIGN KEY ("serviceItemId") REFERENCES "service_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_monthly_data" ADD CONSTRAINT "client_monthly_data_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_monthly_data" ADD CONSTRAINT "client_monthly_data_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_entries" ADD CONSTRAINT "accounting_entries_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_entries" ADD CONSTRAINT "accounting_entries_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_entries" ADD CONSTRAINT "accounting_entries_debitAccountId_fkey" FOREIGN KEY ("debitAccountId") REFERENCES "accounting_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_entries" ADD CONSTRAINT "accounting_entries_creditAccountId_fkey" FOREIGN KEY ("creditAccountId") REFERENCES "accounting_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_accounts" ADD CONSTRAINT "accounting_accounts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_accounts" ADD CONSTRAINT "accounting_accounts_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "accounting_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricings" ADD CONSTRAINT "pricings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plannings" ADD CONSTRAINT "plannings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planning_cycles" ADD CONSTRAINT "planning_cycles_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planning_areas" ADD CONSTRAINT "planning_areas_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planning_objectives" ADD CONSTRAINT "planning_objectives_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planning_objectives" ADD CONSTRAINT "planning_objectives_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "planning_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planning_goals" ADD CONSTRAINT "planning_goals_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planning_goals" ADD CONSTRAINT "planning_goals_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "planning_objectives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planning_kpis" ADD CONSTRAINT "planning_kpis_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planning_action_plans" ADD CONSTRAINT "planning_action_plans_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planning_action_plans" ADD CONSTRAINT "planning_action_plans_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "planning_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
