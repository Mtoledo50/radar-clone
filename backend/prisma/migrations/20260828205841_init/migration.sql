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

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('CLT', 'ESTAGIARIO', 'TERCEIRIZADO', 'SOCIO');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('BACKLOG', 'TODO', 'IN_PROGRESS', 'REVIEW', 'BLOCKED', 'DONE');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "TaskCategory" AS ENUM ('FISCAL', 'CONTABIL', 'DEPARTAMENTO_PESSOAL', 'SOCIETARIO', 'FINANCEIRO', 'COMERCIAL', 'INTERNO', 'OUTRO');

-- CreateEnum
CREATE TYPE "FiscalDocumentType" AS ENUM ('NFE_ENTRADA', 'NFE_DEVOLUCAO', 'CTE');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('UPLOADED', 'PARSING', 'PARSED', 'PARSE_ERROR', 'AWAITING_REVIEW', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('ENTRADA', 'DEVOLUCAO', 'AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO', 'TRANSFERENCIA', 'SALDO_INICIAL');

-- CreateEnum
CREATE TYPE "ProductMatchStatus" AS ENUM ('IDENTIFIED', 'SUGGESTED', 'NEW');

-- CreateEnum
CREATE TYPE "NfseDirection" AS ENUM ('EMITIDA', 'RECEBIDA');

-- CreateEnum
CREATE TYPE "NfseStatus" AS ENUM ('IMPORTED', 'REVIEW', 'ACCOUNTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('SUGESTAO', 'CONFIRMADO', 'DESCARTADO');

-- CreateEnum
CREATE TYPE "MatchType" AS ENUM ('AUTO', 'MANUAL');

-- CreateEnum
CREATE TYPE "RobotWorkerStatus" AS ENUM ('ACTIVE', 'PAUSED');

-- CreateEnum
CREATE TYPE "TaxGuideType" AS ENUM ('DAS', 'ISS', 'DARF');

-- CreateEnum
CREATE TYPE "TaxGuideStatus" AS ENUM ('DRAFT', 'APPROVED', 'TRANSMITTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SkillKey" AS ENUM ('RECONCILIATION', 'CLASSIFICATION', 'ACCOUNTING_BRIDGE', 'MONTHLY_REPORT', 'TAX_GUIDES', 'NFSE_IMPORT', 'NFSE_EMAIL_COLLECT', 'BILLING', 'OBLIGATIONS');

-- CreateEnum
CREATE TYPE "AutonomyLevel" AS ENUM ('AUTO', 'REVIEW', 'MANUAL');

-- CreateEnum
CREATE TYPE "RunStatus" AS ENUM ('RUNNING', 'SUCCESS', 'PARTIAL', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PendingStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ApprovalDecision" AS ENUM ('APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('GENERATING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "IndicatorCategory" AS ENUM ('COMERCIAL', 'OPERACIONAL', 'FINANCEIRO', 'EQUIPE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "CnabTipoArquivo" AS ENUM ('REMESSA', 'RETORNO');

-- CreateEnum
CREATE TYPE "CnabFormato" AS ENUM ('CNAB_240', 'CNAB_400');

-- CreateEnum
CREATE TYPE "CnabStatus" AS ENUM ('GERADA', 'ENVIADA', 'PROCESSADA', 'ERRO');

-- CreateEnum
CREATE TYPE "CobrancaCanal" AS ENUM ('EMAIL', 'WHATSAPP', 'SMS');

-- CreateEnum
CREATE TYPE "CobrancaStatus" AS ENUM ('AGUARDANDO_APROVACAO', 'APROVADO', 'REJEITADO', 'ENVIADO', 'FALHOU');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('BILLING_DUE', 'BILLING_OVERDUE', 'GUIDE_DUE', 'TASK_OVERDUE', 'PROPOSAL_VIEWED', 'SYSTEM');

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cnpj" TEXT,
    "state" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "logoUrl" TEXT,
    "primaryColor" TEXT,
    "secondaryColor" TEXT,
    "proposalFooterText" TEXT,
    "softwareStack" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "businessGoals" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'BASIC',
    "allowedModules" TEXT[] DEFAULT ARRAY['dashboard', 'pessoas', 'clientes']::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "razaoSocial" TEXT,
    "cnpj" TEXT,
    "estado" TEXT,
    "softwareConsultoria" BOOLEAN NOT NULL DEFAULT false,
    "softwareContabil" BOOLEAN NOT NULL DEFAULT false,
    "softwareFiscal" BOOLEAN NOT NULL DEFAULT false,
    "clientesHoje" INTEGER NOT NULL DEFAULT 0,
    "clientesAno" INTEGER NOT NULL DEFAULT 0,
    "funcionariosHoje" INTEGER NOT NULL DEFAULT 0,
    "funcionariosAno" INTEGER NOT NULL DEFAULT 0,
    "visaoEmpresa" TEXT,
    "maiorDesafio" TEXT,
    "compromisso" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "position" TEXT NOT NULL,
    "department" TEXT,
    "admissionDate" TIMESTAMP(3) NOT NULL,
    "dismissalDate" TIMESTAMP(3),
    "salary" DOUBLE PRECISION,
    "status" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
    "contractType" "ContractType" NOT NULL DEFAULT 'CLT',
    "isCritical" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "accountingPlan" TEXT,
    "companyName" TEXT NOT NULL,
    "cnpj" TEXT,
    "serviceType" "ServiceType" NOT NULL DEFAULT 'CONTABIL',
    "monthlyFee" DOUBLE PRECISION NOT NULL,
    "status" "ClientStatus" NOT NULL DEFAULT 'ATIVO',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "observations" TEXT,
    "lastPaymentDate" TIMESTAMP(3),
    "installments" INTEGER,
    "openAmount" DOUBLE PRECISION,
    "paidAmount" DOUBLE PRECISION,
    "overdueAmount" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_categories" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "service_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_items" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "scope" TEXT,
    "outOfScope" TEXT,
    "requiredDocs" TEXT,
    "basePrice" DECIMAL(10,2) NOT NULL,
    "estimatedHours" DOUBLE PRECISION NOT NULL,
    "slaDays" INTEGER NOT NULL DEFAULT 5,
    "recurrence" "Recurrence" NOT NULL DEFAULT 'MENSAL',
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "service_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commercial_plans" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "multiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "isIndependent" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "color" TEXT,
    "badge" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "commercial_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_service_items" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "serviceItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_service_items_pkey" PRIMARY KEY ("id")
);

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
    "recurrence" "Recurrence" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_calculations" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "proposalNumber" TEXT,
    "clientName" TEXT NOT NULL,
    "taxRegime" TEXT NOT NULL,
    "annex" TEXT,
    "activity" TEXT NOT NULL,
    "monthlyRevenue" DOUBLE PRECISION NOT NULL,
    "employeeCount" INTEGER NOT NULL,
    "dpMethod" TEXT NOT NULL DEFAULT 'MARGIN',
    "dpValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hasBranches" BOOLEAN NOT NULL DEFAULT false,
    "hasErp" BOOLEAN NOT NULL DEFAULT false,
    "hoursFiscal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hoursAccounting" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "costPerHour" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "basePrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currentCharge" DOUBLE PRECISION,
    "planPrices" JSONB,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_calculations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposals" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "proposalNumber" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientCnpj" TEXT,
    "taxRegime" TEXT NOT NULL,
    "activity" TEXT NOT NULL,
    "monthlyRevenue" DOUBLE PRECISION NOT NULL,
    "employeeCount" INTEGER NOT NULL,
    "basePrice" DOUBLE PRECISION NOT NULL,
    "aboutOffice" TEXT,
    "differentials" TEXT,
    "onboarding" TEXT,
    "commercialTerms" TEXT,
    "specificNote" TEXT,
    "status" "ProposalStatus" NOT NULL DEFAULT 'DRAFT',
    "sentAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "closedPlanId" TEXT,
    "closedPrice" DOUBLE PRECISION,
    "closingDetails" JSONB,
    "lossReason" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "whatsappClicks" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "originalProposalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proposals_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "financial_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "clientId" TEXT,
    "type" "TransactionType" NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_transactions_pkey" PRIMARY KEY ("id")
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
    "bankTransactionId" TEXT,
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
    "planName" TEXT DEFAULT 'Padrão',
    "seq" TEXT,
    "accountNumber" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "type" "AccountType" NOT NULL,
    "nature" "AccountNature" NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "parentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sciCode" TEXT,
    "reducedCode" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounting_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'PLANNING',
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "color" TEXT,
    "startDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "clientId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "category" "TaskCategory" NOT NULL DEFAULT 'OUTRO',
    "projectId" TEXT,
    "clientId" TEXT,
    "assigneeId" TEXT,
    "startDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "estimatedHours" DECIMAL(8,2),
    "actualHours" DECIMAL(8,2),
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "serviceType" "ServiceType" NOT NULL DEFAULT 'CONTABIL',
    "complexity" "Complexity" NOT NULL DEFAULT 'MEDIA',
    "estimatedHours" DOUBLE PRECISION NOT NULL,
    "hourlyRate" DOUBLE PRECISION NOT NULL,
    "softwareCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "profitMargin" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "finalValue" DOUBLE PRECISION NOT NULL,
    "status" "PricingStatus" NOT NULL DEFAULT 'RASCUNHO',
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plannings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'GERAL',
    "targetDate" TIMESTAMP(3) NOT NULL,
    "status" "PlanningStatus" NOT NULL DEFAULT 'PENDENTE',
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plannings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turnover_monthly" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "cltInitial" INTEGER NOT NULL DEFAULT 0,
    "cltAdmissions" INTEGER NOT NULL DEFAULT 0,
    "cltDismissals" INTEGER NOT NULL DEFAULT 0,
    "internInitial" INTEGER NOT NULL DEFAULT 0,
    "internAdmissions" INTEGER NOT NULL DEFAULT 0,
    "internDismissals" INTEGER NOT NULL DEFAULT 0,
    "thirdInitial" INTEGER NOT NULL DEFAULT 0,
    "thirdAdmissions" INTEGER NOT NULL DEFAULT 0,
    "thirdDismissals" INTEGER NOT NULL DEFAULT 0,
    "partnerInitial" INTEGER NOT NULL DEFAULT 0,
    "partnerAdmissions" INTEGER NOT NULL DEFAULT 0,
    "partnerDismissals" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "turnover_monthly_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sectors" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mandatory" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sectors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cells" (
    "id" TEXT NOT NULL,
    "sectorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cells_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dismissal_reasons" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dismissal_reasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "positions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resignations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "employeeName" TEXT NOT NULL,
    "admissionDate" TIMESTAMP(3) NOT NULL,
    "dismissalDate" TIMESTAMP(3) NOT NULL,
    "sectorId" TEXT,
    "cellId" TEXT,
    "positionId" TEXT,
    "contractType" TEXT NOT NULL,
    "isCritical" BOOLEAN NOT NULL DEFAULT false,
    "dismissalReasonId" TEXT,
    "observations" TEXT,
    "exitInterview" JSONB,
    "exitAnalysis" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resignations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turnover_sector_distribution" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "sectorId" TEXT NOT NULL,
    "initial" INTEGER NOT NULL DEFAULT 0,
    "admissions" INTEGER NOT NULL DEFAULT 0,
    "dismissals" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "turnover_sector_distribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_configs" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "salaryAverage" DOUBLE PRECISION NOT NULL DEFAULT 4000,
    "chargesPercent" DOUBLE PRECISION NOT NULL DEFAULT 69,
    "hoursPerMonth" DOUBLE PRECISION NOT NULL DEFAULT 160,
    "livesPerEmployee" DOUBLE PRECISION NOT NULL DEFAULT 150,
    "taxesPercent" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "backOfficePercent" DOUBLE PRECISION NOT NULL DEFAULT 4,
    "adminPercent" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "marginFC" DOUBLE PRECISION NOT NULL DEFAULT 15,
    "marginDP" DOUBLE PRECISION NOT NULL DEFAULT 15,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_hour_rules" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "regime" TEXT NOT NULL,
    "activity" TEXT NOT NULL,
    "annex" TEXT,
    "revenueMin" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "revenueMax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hoursFiscal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hoursAccounting" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_hour_rules_pkey" PRIMARY KEY ("id")
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

-- CreateTable
CREATE TABLE "historical_entries" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "clientId" TEXT,
    "year" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "debitCode" TEXT,
    "creditCode" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "historyCode" TEXT,
    "description" TEXT NOT NULL,
    "docNumber" TEXT,
    "reducedCode" INTEGER,
    "entryType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historical_entries_pkey" PRIMARY KEY ("id")
);

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
    "clientId" TEXT,
    "code" TEXT,
    "unifiedCode" TEXT,
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
    "clientId" TEXT,
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
    "clientId" TEXT,
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

-- CreateTable
CREATE TABLE "fiscal_icms_apurations" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "clientId" TEXT,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "creditsIcms" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "creditsIcmsSt" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "purchasesValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "invoicesCount" INTEGER NOT NULL DEFAULT 0,
    "salesValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "debitRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "debitsIcms" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ABERTA',
    "closedAt" TIMESTAMP(3),
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fiscal_icms_apurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fiscal_service_invoices" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "clientId" TEXT,
    "number" TEXT NOT NULL,
    "series" TEXT NOT NULL DEFAULT '',
    "verificationCode" TEXT,
    "emissionDate" TIMESTAMP(3) NOT NULL,
    "competenceDate" TIMESTAMP(3),
    "issuerCnpj" TEXT NOT NULL,
    "issuerName" TEXT NOT NULL,
    "takerCnpj" TEXT,
    "takerName" TEXT,
    "serviceValue" DECIMAL(12,2) NOT NULL,
    "deductions" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "issBase" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "issRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "issValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "issRetained" BOOLEAN NOT NULL DEFAULT false,
    "serviceCode" TEXT,
    "serviceDescription" TEXT,
    "municipalityCode" TEXT,
    "direction" "NfseDirection" NOT NULL DEFAULT 'EMITIDA',
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "status" "NfseStatus" NOT NULL DEFAULT 'IMPORTED',
    "rawXml" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fiscal_service_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_statements" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "clientId" TEXT,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "fileName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ABERTO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_statements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_transactions" (
    "id" TEXT NOT NULL,
    "statementId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "counterparty" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "nature" TEXT NOT NULL DEFAULT 'NAO_CLASSIFICADO',
    "classifiedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_classification_rules" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "nature" TEXT NOT NULL,
    "hits" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_classification_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_categories" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "clientId" TEXT,
    "label" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_nfe_matches" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "bankTransactionId" TEXT NOT NULL,
    "fiscalInvoiceId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "matchType" "MatchType" NOT NULL DEFAULT 'AUTO',
    "status" "MatchStatus" NOT NULL DEFAULT 'SUGESTAO',
    "scoreBreakdown" JSONB,
    "confirmedAt" TIMESTAMP(3),
    "confirmedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_nfe_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_guides" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "type" "TaxGuideType" NOT NULL,
    "value" DECIMAL(12,2) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "status" "TaxGuideStatus" NOT NULL DEFAULT 'DRAFT',
    "memory" JSONB NOT NULL DEFAULT '{}',
    "runId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_guides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "robot_workers" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Aurora',
    "avatar" TEXT NOT NULL DEFAULT '🌅',
    "status" "RobotWorkerStatus" NOT NULL DEFAULT 'ACTIVE',
    "config" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "robot_workers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "robot_worker_skills" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "skillKey" "SkillKey" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "cronExpr" TEXT NOT NULL DEFAULT '0 2 * * *',
    "autonomy" "AutonomyLevel" NOT NULL DEFAULT 'REVIEW',
    "params" JSONB NOT NULL DEFAULT '{}',
    "lastRunAt" TIMESTAMP(3),
    "lastRunId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "robot_worker_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_runs" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "skillKey" "SkillKey" NOT NULL,
    "triggerType" TEXT NOT NULL DEFAULT 'CRON',
    "triggeredBy" TEXT,
    "status" "RunStatus" NOT NULL DEFAULT 'RUNNING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "itemsProcessed" INTEGER NOT NULL DEFAULT 0,
    "itemsAutoApproved" INTEGER NOT NULL DEFAULT 0,
    "itemsPendingHuman" INTEGER NOT NULL DEFAULT 0,
    "itemsFailed" INTEGER NOT NULL DEFAULT 0,
    "secondsSaved" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,

    CONSTRAINT "automation_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_pendings" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "runId" TEXT,
    "type" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "payload" JSONB NOT NULL,
    "status" "PendingStatus" NOT NULL DEFAULT 'PENDING',
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "automation_pendings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_audits" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "actor" TEXT NOT NULL DEFAULT 'AURORA',
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "detail" JSONB,
    "robotVersion" TEXT,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "automation_audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_records" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "decision" "ApprovalDecision" NOT NULL,
    "decidedBy" TEXT NOT NULL,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT,
    "notes" TEXT,

    CONSTRAINT "approval_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_reports" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "pdfPath" TEXT,
    "summary" JSONB,
    "status" "ReportStatus" NOT NULL DEFAULT 'GENERATING',
    "errorMessage" TEXT,
    "runId" TEXT,
    "generatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monthly_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_indicators" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "formula" TEXT NOT NULL,
    "target" DOUBLE PRECISION,
    "unit" TEXT NOT NULL DEFAULT '%',
    "category" "IndicatorCategory" NOT NULL DEFAULT 'CUSTOM',
    "color" TEXT NOT NULL DEFAULT '#0d9488',
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_indicators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentorship_checklist_items" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'custom',
    "done" BOOLEAN NOT NULL DEFAULT false,
    "doneAt" TIMESTAMP(3),
    "doneBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mentorship_checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "secret_vault_items" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "encryptedSecret" TEXT,
    "url" TEXT,
    "expiresAt" TIMESTAMP(3),
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "secret_vault_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_deadlines" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ABERTO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legal_deadlines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_instructions" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "document" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "ourNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT,

    CONSTRAINT "billing_instructions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trial_balances" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "competence" TEXT NOT NULL,
    "fileName" TEXT,
    "rowCount" INTEGER NOT NULL DEFAULT 0,
    "totalDebit" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalCredit" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trial_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trial_balance_rows" (
    "id" TEXT NOT NULL,
    "trialBalanceId" TEXT NOT NULL,
    "accountNumber" TEXT,
    "seq" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isSynthetic" BOOLEAN NOT NULL DEFAULT false,
    "prevBalance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "debit" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "credit" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "currentBalance" DECIMAL(14,2) NOT NULL DEFAULT 0,

    CONSTRAINT "trial_balance_rows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_imports" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "periodLabel" TEXT NOT NULL,
    "fileName" TEXT,
    "months" JSONB NOT NULL,
    "accounts" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_imports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_ledger_entries" (
    "id" TEXT NOT NULL,
    "ledgerImportId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "accountCode" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "entryDate" TIMESTAMP(3) NOT NULL,
    "counterparty" TEXT NOT NULL,
    "debit" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "credit" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "balance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cnab_arquivos" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "tipo" "CnabTipoArquivo" NOT NULL,
    "formato" "CnabFormato" NOT NULL,
    "banco" TEXT NOT NULL,
    "sequencial" INTEGER NOT NULL,
    "status" "CnabStatus" NOT NULL DEFAULT 'GERADA',
    "erroMensagem" TEXT,
    "dataGeracao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataProcessamento" TIMESTAMP(3),
    "nomeArquivo" TEXT,
    "tamanhoBytes" INTEGER,
    "checksum" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cnab_arquivos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cnab_movimentos" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "arquivoId" TEXT NOT NULL,
    "nossoNumero" TEXT NOT NULL,
    "numeroDocumento" TEXT NOT NULL,
    "codigoMovimento" TEXT NOT NULL,
    "descricaoMovimento" TEXT NOT NULL,
    "valorTitulo" DOUBLE PRECISION NOT NULL,
    "valorPago" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tarifa" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dataOcorrencia" TIMESTAMP(3) NOT NULL,
    "dataCredito" TIMESTAMP(3),
    "bankTransactionId" TEXT,
    "clientId" TEXT,
    "aplicado" BOOLEAN NOT NULL DEFAULT false,
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cnab_movimentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cobranca_regras" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "diasAposVencimento" INTEGER NOT NULL,
    "canal" "CobrancaCanal" NOT NULL,
    "templateMensagem" TEXT NOT NULL,
    "requerAprovacao" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cobranca_regras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cobranca_eventos" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "regraId" TEXT NOT NULL,
    "clientId" TEXT,
    "faturaIdentificador" TEXT NOT NULL,
    "valorDevido" DOUBLE PRECISION NOT NULL,
    "dataVencimento" TIMESTAMP(3) NOT NULL,
    "canal" "CobrancaCanal" NOT NULL,
    "mensagemEnviada" TEXT NOT NULL,
    "status" "CobrancaStatus" NOT NULL DEFAULT 'AGUARDANDO_APROVACAO',
    "aprovadoPorId" TEXT,
    "dataAprovacao" TIMESTAMP(3),
    "motivoRejeicao" TEXT,
    "destinatario" TEXT,
    "provider" TEXT,
    "externalId" TEXT,
    "dataEnvio" TIMESTAMP(3),
    "erroEnvio" TEXT,
    "protocoloExterno" TEXT,
    "reagendadoPara" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cobranca_eventos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_cnpj_key" ON "companies"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_companyId_idx" ON "users"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "company_profiles_userId_key" ON "company_profiles"("userId");

-- CreateIndex
CREATE INDEX "employees_userId_idx" ON "employees"("userId");

-- CreateIndex
CREATE INDEX "employees_companyId_idx" ON "employees"("companyId");

-- CreateIndex
CREATE INDEX "clients_userId_idx" ON "clients"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "clients_companyId_companyName_key" ON "clients"("companyId", "companyName");

-- CreateIndex
CREATE INDEX "service_categories_companyId_idx" ON "service_categories"("companyId");

-- CreateIndex
CREATE INDEX "service_items_companyId_idx" ON "service_items"("companyId");

-- CreateIndex
CREATE INDEX "service_items_categoryId_idx" ON "service_items"("categoryId");

-- CreateIndex
CREATE INDEX "commercial_plans_companyId_idx" ON "commercial_plans"("companyId");

-- CreateIndex
CREATE INDEX "plan_service_items_planId_idx" ON "plan_service_items"("planId");

-- CreateIndex
CREATE INDEX "plan_service_items_serviceItemId_idx" ON "plan_service_items"("serviceItemId");

-- CreateIndex
CREATE UNIQUE INDEX "plan_service_items_planId_serviceItemId_key" ON "plan_service_items"("planId", "serviceItemId");

-- CreateIndex
CREATE INDEX "client_contracts_companyId_idx" ON "client_contracts"("companyId");

-- CreateIndex
CREATE INDEX "client_contracts_clientId_idx" ON "client_contracts"("clientId");

-- CreateIndex
CREATE INDEX "client_services_companyId_idx" ON "client_services"("companyId");

-- CreateIndex
CREATE INDEX "client_services_clientId_idx" ON "client_services"("clientId");

-- CreateIndex
CREATE INDEX "pricing_calculations_companyId_idx" ON "pricing_calculations"("companyId");

-- CreateIndex
CREATE INDEX "pricing_calculations_status_idx" ON "pricing_calculations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "proposals_proposalNumber_key" ON "proposals"("proposalNumber");

-- CreateIndex
CREATE UNIQUE INDEX "proposals_slug_key" ON "proposals"("slug");

-- CreateIndex
CREATE INDEX "proposals_companyId_idx" ON "proposals"("companyId");

-- CreateIndex
CREATE INDEX "proposals_userId_idx" ON "proposals"("userId");

-- CreateIndex
CREATE INDEX "proposals_status_idx" ON "proposals"("status");

-- CreateIndex
CREATE INDEX "proposals_originalProposalId_idx" ON "proposals"("originalProposalId");

-- CreateIndex
CREATE INDEX "proposals_isCurrent_idx" ON "proposals"("isCurrent");

-- CreateIndex
CREATE INDEX "proposal_items_proposalId_idx" ON "proposal_items"("proposalId");

-- CreateIndex
CREATE INDEX "client_monthly_data_companyId_idx" ON "client_monthly_data"("companyId");

-- CreateIndex
CREATE INDEX "client_monthly_data_userId_idx" ON "client_monthly_data"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "client_monthly_data_companyId_year_month_key" ON "client_monthly_data"("companyId", "year", "month");

-- CreateIndex
CREATE INDEX "financial_transactions_companyId_idx" ON "financial_transactions"("companyId");

-- CreateIndex
CREATE INDEX "financial_transactions_userId_date_idx" ON "financial_transactions"("userId", "date");

-- CreateIndex
CREATE INDEX "accounting_entries_companyId_idx" ON "accounting_entries"("companyId");

-- CreateIndex
CREATE INDEX "accounting_entries_status_idx" ON "accounting_entries"("status");

-- CreateIndex
CREATE INDEX "accounting_entries_entryDate_idx" ON "accounting_entries"("entryDate");

-- CreateIndex
CREATE INDEX "accounting_accounts_companyId_code_idx" ON "accounting_accounts"("companyId", "code");

-- CreateIndex
CREATE INDEX "accounting_accounts_companyId_type_idx" ON "accounting_accounts"("companyId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "accounting_accounts_companyId_planName_code_key" ON "accounting_accounts"("companyId", "planName", "code");

-- CreateIndex
CREATE INDEX "projects_companyId_status_idx" ON "projects"("companyId", "status");

-- CreateIndex
CREATE INDEX "projects_companyId_deletedAt_idx" ON "projects"("companyId", "deletedAt");

-- CreateIndex
CREATE INDEX "tasks_companyId_status_idx" ON "tasks"("companyId", "status");

-- CreateIndex
CREATE INDEX "tasks_companyId_priority_idx" ON "tasks"("companyId", "priority");

-- CreateIndex
CREATE INDEX "tasks_companyId_projectId_idx" ON "tasks"("companyId", "projectId");

-- CreateIndex
CREATE INDEX "tasks_companyId_assigneeId_idx" ON "tasks"("companyId", "assigneeId");

-- CreateIndex
CREATE INDEX "tasks_companyId_dueDate_idx" ON "tasks"("companyId", "dueDate");

-- CreateIndex
CREATE INDEX "tasks_companyId_deletedAt_idx" ON "tasks"("companyId", "deletedAt");

-- CreateIndex
CREATE INDEX "pricings_companyId_idx" ON "pricings"("companyId");

-- CreateIndex
CREATE INDEX "plannings_companyId_idx" ON "plannings"("companyId");

-- CreateIndex
CREATE INDEX "turnover_monthly_companyId_idx" ON "turnover_monthly"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "turnover_monthly_companyId_year_month_key" ON "turnover_monthly"("companyId", "year", "month");

-- CreateIndex
CREATE INDEX "sectors_companyId_idx" ON "sectors"("companyId");

-- CreateIndex
CREATE INDEX "dismissal_reasons_companyId_idx" ON "dismissal_reasons"("companyId");

-- CreateIndex
CREATE INDEX "positions_companyId_idx" ON "positions"("companyId");

-- CreateIndex
CREATE INDEX "resignations_companyId_idx" ON "resignations"("companyId");

-- CreateIndex
CREATE INDEX "resignations_dismissalDate_idx" ON "resignations"("dismissalDate");

-- CreateIndex
CREATE INDEX "turnover_sector_distribution_companyId_idx" ON "turnover_sector_distribution"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "turnover_sector_distribution_companyId_year_month_sectorId_key" ON "turnover_sector_distribution"("companyId", "year", "month", "sectorId");

-- CreateIndex
CREATE UNIQUE INDEX "pricing_configs_companyId_key" ON "pricing_configs"("companyId");

-- CreateIndex
CREATE INDEX "pricing_hour_rules_companyId_idx" ON "pricing_hour_rules"("companyId");

-- CreateIndex
CREATE INDEX "pricing_hour_rules_regime_activity_idx" ON "pricing_hour_rules"("regime", "activity");

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
CREATE UNIQUE INDEX "account_templates_reducedCode_key" ON "account_templates"("reducedCode");

-- CreateIndex
CREATE INDEX "account_templates_code_idx" ON "account_templates"("code");

-- CreateIndex
CREATE INDEX "account_templates_accountType_idx" ON "account_templates"("accountType");

-- CreateIndex
CREATE INDEX "historical_entries_companyId_clientId_year_idx" ON "historical_entries"("companyId", "clientId", "year");

-- CreateIndex
CREATE INDEX "historical_entries_companyId_amount_idx" ON "historical_entries"("companyId", "amount");

-- CreateIndex
CREATE INDEX "fiscal_suppliers_companyId_name_idx" ON "fiscal_suppliers"("companyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "fiscal_suppliers_companyId_cnpj_key" ON "fiscal_suppliers"("companyId", "cnpj");

-- CreateIndex
CREATE INDEX "fiscal_products_companyId_clientId_idx" ON "fiscal_products"("companyId", "clientId");

-- CreateIndex
CREATE INDEX "fiscal_products_companyId_ncm_idx" ON "fiscal_products"("companyId", "ncm");

-- CreateIndex
CREATE INDEX "fiscal_products_companyId_description_idx" ON "fiscal_products"("companyId", "description");

-- CreateIndex
CREATE UNIQUE INDEX "fiscal_products_companyId_clientId_code_key" ON "fiscal_products"("companyId", "clientId", "code");

-- CreateIndex
CREATE INDEX "fiscal_invoices_companyId_clientId_idx" ON "fiscal_invoices"("companyId", "clientId");

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
CREATE INDEX "fiscal_inventory_movements_companyId_clientId_idx" ON "fiscal_inventory_movements"("companyId", "clientId");

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

-- CreateIndex
CREATE INDEX "fiscal_icms_apurations_companyId_clientId_year_idx" ON "fiscal_icms_apurations"("companyId", "clientId", "year");

-- CreateIndex
CREATE INDEX "fiscal_icms_apurations_companyId_year_idx" ON "fiscal_icms_apurations"("companyId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "fiscal_icms_apurations_companyId_clientId_year_month_key" ON "fiscal_icms_apurations"("companyId", "clientId", "year", "month");

-- CreateIndex
CREATE INDEX "fiscal_service_invoices_companyId_clientId_idx" ON "fiscal_service_invoices"("companyId", "clientId");

-- CreateIndex
CREATE INDEX "fiscal_service_invoices_companyId_status_idx" ON "fiscal_service_invoices"("companyId", "status");

-- CreateIndex
CREATE INDEX "fiscal_service_invoices_companyId_emissionDate_idx" ON "fiscal_service_invoices"("companyId", "emissionDate");

-- CreateIndex
CREATE UNIQUE INDEX "fiscal_service_invoices_companyId_issuerCnpj_number_series_key" ON "fiscal_service_invoices"("companyId", "issuerCnpj", "number", "series");

-- CreateIndex
CREATE INDEX "bank_statements_companyId_clientId_idx" ON "bank_statements"("companyId", "clientId");

-- CreateIndex
CREATE UNIQUE INDEX "bank_statements_companyId_clientId_year_month_key" ON "bank_statements"("companyId", "clientId", "year", "month");

-- CreateIndex
CREATE INDEX "bank_transactions_statementId_idx" ON "bank_transactions"("statementId");

-- CreateIndex
CREATE INDEX "bank_transactions_companyId_nature_idx" ON "bank_transactions"("companyId", "nature");

-- CreateIndex
CREATE UNIQUE INDEX "bank_classification_rules_companyId_pattern_key" ON "bank_classification_rules"("companyId", "pattern");

-- CreateIndex
CREATE INDEX "bank_categories_companyId_clientId_idx" ON "bank_categories"("companyId", "clientId");

-- CreateIndex
CREATE UNIQUE INDEX "bank_categories_companyId_clientId_label_key" ON "bank_categories"("companyId", "clientId", "label");

-- CreateIndex
CREATE INDEX "bank_nfe_matches_companyId_status_idx" ON "bank_nfe_matches"("companyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "bank_nfe_matches_bankTransactionId_fiscalInvoiceId_key" ON "bank_nfe_matches"("bankTransactionId", "fiscalInvoiceId");

-- CreateIndex
CREATE INDEX "tax_guides_companyId_period_idx" ON "tax_guides"("companyId", "period");

-- CreateIndex
CREATE INDEX "tax_guides_companyId_status_idx" ON "tax_guides"("companyId", "status");

-- CreateIndex
CREATE INDEX "tax_guides_companyId_type_idx" ON "tax_guides"("companyId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "tax_guides_companyId_clientId_period_type_key" ON "tax_guides"("companyId", "clientId", "period", "type");

-- CreateIndex
CREATE UNIQUE INDEX "robot_workers_companyId_key" ON "robot_workers"("companyId");

-- CreateIndex
CREATE INDEX "robot_worker_skills_companyId_enabled_idx" ON "robot_worker_skills"("companyId", "enabled");

-- CreateIndex
CREATE UNIQUE INDEX "robot_worker_skills_companyId_skillKey_key" ON "robot_worker_skills"("companyId", "skillKey");

-- CreateIndex
CREATE INDEX "automation_runs_companyId_startedAt_idx" ON "automation_runs"("companyId", "startedAt");

-- CreateIndex
CREATE INDEX "automation_runs_companyId_status_idx" ON "automation_runs"("companyId", "status");

-- CreateIndex
CREATE INDEX "automation_runs_workerId_idx" ON "automation_runs"("workerId");

-- CreateIndex
CREATE INDEX "automation_pendings_companyId_status_idx" ON "automation_pendings"("companyId", "status");

-- CreateIndex
CREATE INDEX "automation_pendings_companyId_type_idx" ON "automation_pendings"("companyId", "type");

-- CreateIndex
CREATE INDEX "automation_pendings_runId_idx" ON "automation_pendings"("runId");

-- CreateIndex
CREATE INDEX "automation_audits_companyId_createdAt_idx" ON "automation_audits"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "automation_audits_companyId_entity_entityId_idx" ON "automation_audits"("companyId", "entity", "entityId");

-- CreateIndex
CREATE INDEX "approval_records_companyId_entityType_entityId_idx" ON "approval_records"("companyId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "monthly_reports_companyId_period_idx" ON "monthly_reports"("companyId", "period");

-- CreateIndex
CREATE INDEX "monthly_reports_clientId_idx" ON "monthly_reports"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_reports_companyId_clientId_period_key" ON "monthly_reports"("companyId", "clientId", "period");

-- CreateIndex
CREATE INDEX "custom_indicators_companyId_idx" ON "custom_indicators"("companyId");

-- CreateIndex
CREATE INDEX "custom_indicators_companyId_category_idx" ON "custom_indicators"("companyId", "category");

-- CreateIndex
CREATE INDEX "custom_indicators_companyId_isActive_idx" ON "custom_indicators"("companyId", "isActive");

-- CreateIndex
CREATE INDEX "mentorship_checklist_items_companyId_idx" ON "mentorship_checklist_items"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "mentorship_checklist_items_companyId_title_source_key" ON "mentorship_checklist_items"("companyId", "title", "source");

-- CreateIndex
CREATE INDEX "secret_vault_items_companyId_idx" ON "secret_vault_items"("companyId");

-- CreateIndex
CREATE INDEX "legal_deadlines_companyId_dueDate_idx" ON "legal_deadlines"("companyId", "dueDate");

-- CreateIndex
CREATE INDEX "billing_instructions_companyId_status_idx" ON "billing_instructions"("companyId", "status");

-- CreateIndex
CREATE INDEX "trial_balances_companyId_clientId_idx" ON "trial_balances"("companyId", "clientId");

-- CreateIndex
CREATE UNIQUE INDEX "trial_balances_companyId_clientId_competence_key" ON "trial_balances"("companyId", "clientId", "competence");

-- CreateIndex
CREATE INDEX "trial_balance_rows_trialBalanceId_code_idx" ON "trial_balance_rows"("trialBalanceId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "ledger_imports_companyId_clientId_periodLabel_key" ON "ledger_imports"("companyId", "clientId", "periodLabel");

-- CreateIndex
CREATE INDEX "client_ledger_entries_companyId_clientId_accountCode_entryD_idx" ON "client_ledger_entries"("companyId", "clientId", "accountCode", "entryDate");

-- CreateIndex
CREATE INDEX "client_ledger_entries_companyId_clientId_counterparty_idx" ON "client_ledger_entries"("companyId", "clientId", "counterparty");

-- CreateIndex
CREATE INDEX "cnab_arquivos_companyId_status_idx" ON "cnab_arquivos"("companyId", "status");

-- CreateIndex
CREATE INDEX "cnab_arquivos_companyId_banco_formato_idx" ON "cnab_arquivos"("companyId", "banco", "formato");

-- CreateIndex
CREATE INDEX "cnab_movimentos_companyId_nossoNumero_idx" ON "cnab_movimentos"("companyId", "nossoNumero");

-- CreateIndex
CREATE INDEX "cnab_movimentos_companyId_dataOcorrencia_idx" ON "cnab_movimentos"("companyId", "dataOcorrencia");

-- CreateIndex
CREATE INDEX "cnab_movimentos_companyId_bankTransactionId_idx" ON "cnab_movimentos"("companyId", "bankTransactionId");

-- CreateIndex
CREATE INDEX "cobranca_regras_companyId_ativa_idx" ON "cobranca_regras"("companyId", "ativa");

-- CreateIndex
CREATE UNIQUE INDEX "cobranca_regras_companyId_nome_diasAposVencimento_canal_key" ON "cobranca_regras"("companyId", "nome", "diasAposVencimento", "canal");

-- CreateIndex
CREATE INDEX "cobranca_eventos_companyId_status_idx" ON "cobranca_eventos"("companyId", "status");

-- CreateIndex
CREATE INDEX "cobranca_eventos_companyId_clientId_dataVencimento_idx" ON "cobranca_eventos"("companyId", "clientId", "dataVencimento");

-- CreateIndex
CREATE INDEX "cobranca_eventos_companyId_aprovadoPorId_idx" ON "cobranca_eventos"("companyId", "aprovadoPorId");

-- CreateIndex
CREATE INDEX "Notification_companyId_read_idx" ON "Notification"("companyId", "read");

-- CreateIndex
CREATE INDEX "Notification_companyId_createdAt_idx" ON "Notification"("companyId", "createdAt");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_profiles" ADD CONSTRAINT "company_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_categories" ADD CONSTRAINT "service_categories_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_items" ADD CONSTRAINT "service_items_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_items" ADD CONSTRAINT "service_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "service_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commercial_plans" ADD CONSTRAINT "commercial_plans_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_service_items" ADD CONSTRAINT "plan_service_items_planId_fkey" FOREIGN KEY ("planId") REFERENCES "commercial_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_service_items" ADD CONSTRAINT "plan_service_items_serviceItemId_fkey" FOREIGN KEY ("serviceItemId") REFERENCES "service_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "pricing_calculations" ADD CONSTRAINT "pricing_calculations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_calculations" ADD CONSTRAINT "pricing_calculations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_originalProposalId_fkey" FOREIGN KEY ("originalProposalId") REFERENCES "proposals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
ALTER TABLE "projects" ADD CONSTRAINT "projects_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricings" ADD CONSTRAINT "pricings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plannings" ADD CONSTRAINT "plannings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turnover_monthly" ADD CONSTRAINT "turnover_monthly_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sectors" ADD CONSTRAINT "sectors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cells" ADD CONSTRAINT "cells_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "sectors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dismissal_reasons" ADD CONSTRAINT "dismissal_reasons_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "positions" ADD CONSTRAINT "positions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resignations" ADD CONSTRAINT "resignations_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "sectors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resignations" ADD CONSTRAINT "resignations_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resignations" ADD CONSTRAINT "resignations_dismissalReasonId_fkey" FOREIGN KEY ("dismissalReasonId") REFERENCES "dismissal_reasons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resignations" ADD CONSTRAINT "resignations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turnover_sector_distribution" ADD CONSTRAINT "turnover_sector_distribution_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turnover_sector_distribution" ADD CONSTRAINT "turnover_sector_distribution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turnover_sector_distribution" ADD CONSTRAINT "turnover_sector_distribution_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "sectors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_configs" ADD CONSTRAINT "pricing_configs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_hour_rules" ADD CONSTRAINT "pricing_hour_rules_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "fiscal_suppliers" ADD CONSTRAINT "fiscal_suppliers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_products" ADD CONSTRAINT "fiscal_products_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_products" ADD CONSTRAINT "fiscal_products_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_invoices" ADD CONSTRAINT "fiscal_invoices_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_invoices" ADD CONSTRAINT "fiscal_invoices_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_invoices" ADD CONSTRAINT "fiscal_invoices_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "fiscal_suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_invoice_items" ADD CONSTRAINT "fiscal_invoice_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "fiscal_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_invoice_items" ADD CONSTRAINT "fiscal_invoice_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "fiscal_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_inventory_movements" ADD CONSTRAINT "fiscal_inventory_movements_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_inventory_movements" ADD CONSTRAINT "fiscal_inventory_movements_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_inventory_movements" ADD CONSTRAINT "fiscal_inventory_movements_productId_fkey" FOREIGN KEY ("productId") REFERENCES "fiscal_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_inventory_movements" ADD CONSTRAINT "fiscal_inventory_movements_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "fiscal_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_inventory_balances" ADD CONSTRAINT "fiscal_inventory_balances_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_inventory_balances" ADD CONSTRAINT "fiscal_inventory_balances_productId_fkey" FOREIGN KEY ("productId") REFERENCES "fiscal_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_icms_apurations" ADD CONSTRAINT "fiscal_icms_apurations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_icms_apurations" ADD CONSTRAINT "fiscal_icms_apurations_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_service_invoices" ADD CONSTRAINT "fiscal_service_invoices_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_service_invoices" ADD CONSTRAINT "fiscal_service_invoices_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_statements" ADD CONSTRAINT "bank_statements_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_statements" ADD CONSTRAINT "bank_statements_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_statementId_fkey" FOREIGN KEY ("statementId") REFERENCES "bank_statements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_nfe_matches" ADD CONSTRAINT "bank_nfe_matches_bankTransactionId_fkey" FOREIGN KEY ("bankTransactionId") REFERENCES "bank_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_nfe_matches" ADD CONSTRAINT "bank_nfe_matches_fiscalInvoiceId_fkey" FOREIGN KEY ("fiscalInvoiceId") REFERENCES "fiscal_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_guides" ADD CONSTRAINT "tax_guides_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_guides" ADD CONSTRAINT "tax_guides_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "robot_workers" ADD CONSTRAINT "robot_workers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "robot_worker_skills" ADD CONSTRAINT "robot_worker_skills_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "robot_workers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_runs" ADD CONSTRAINT "automation_runs_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "robot_workers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_pendings" ADD CONSTRAINT "automation_pendings_runId_fkey" FOREIGN KEY ("runId") REFERENCES "automation_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_reports" ADD CONSTRAINT "monthly_reports_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_reports" ADD CONSTRAINT "monthly_reports_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_reports" ADD CONSTRAINT "monthly_reports_runId_fkey" FOREIGN KEY ("runId") REFERENCES "automation_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_indicators" ADD CONSTRAINT "custom_indicators_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_indicators" ADD CONSTRAINT "custom_indicators_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorship_checklist_items" ADD CONSTRAINT "mentorship_checklist_items_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secret_vault_items" ADD CONSTRAINT "secret_vault_items_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_deadlines" ADD CONSTRAINT "legal_deadlines_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_instructions" ADD CONSTRAINT "billing_instructions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_instructions" ADD CONSTRAINT "billing_instructions_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trial_balances" ADD CONSTRAINT "trial_balances_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trial_balances" ADD CONSTRAINT "trial_balances_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trial_balance_rows" ADD CONSTRAINT "trial_balance_rows_trialBalanceId_fkey" FOREIGN KEY ("trialBalanceId") REFERENCES "trial_balances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_imports" ADD CONSTRAINT "ledger_imports_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_imports" ADD CONSTRAINT "ledger_imports_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_ledger_entries" ADD CONSTRAINT "client_ledger_entries_ledgerImportId_fkey" FOREIGN KEY ("ledgerImportId") REFERENCES "ledger_imports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cnab_arquivos" ADD CONSTRAINT "cnab_arquivos_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cnab_movimentos" ADD CONSTRAINT "cnab_movimentos_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cnab_movimentos" ADD CONSTRAINT "cnab_movimentos_arquivoId_fkey" FOREIGN KEY ("arquivoId") REFERENCES "cnab_arquivos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cnab_movimentos" ADD CONSTRAINT "cnab_movimentos_bankTransactionId_fkey" FOREIGN KEY ("bankTransactionId") REFERENCES "bank_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cnab_movimentos" ADD CONSTRAINT "cnab_movimentos_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cobranca_regras" ADD CONSTRAINT "cobranca_regras_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cobranca_eventos" ADD CONSTRAINT "cobranca_eventos_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cobranca_eventos" ADD CONSTRAINT "cobranca_eventos_regraId_fkey" FOREIGN KEY ("regraId") REFERENCES "cobranca_regras"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cobranca_eventos" ADD CONSTRAINT "cobranca_eventos_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cobranca_eventos" ADD CONSTRAINT "cobranca_eventos_aprovadoPorId_fkey" FOREIGN KEY ("aprovadoPorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
