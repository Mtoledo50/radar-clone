-- CreateEnum
CREATE TYPE "RobotWorkerStatus" AS ENUM ('ACTIVE', 'PAUSED');

-- CreateEnum
CREATE TYPE "SkillKey" AS ENUM ('RECONCILIATION', 'CLASSIFICATION', 'ACCOUNTING_BRIDGE', 'MONTHLY_REPORT', 'TAX_GUIDES', 'NFSE_IMPORT', 'BILLING', 'OBLIGATIONS');

-- CreateEnum
CREATE TYPE "AutonomyLevel" AS ENUM ('AUTO', 'REVIEW', 'MANUAL');

-- CreateEnum
CREATE TYPE "RunStatus" AS ENUM ('RUNNING', 'SUCCESS', 'PARTIAL', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PendingStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ApprovalDecision" AS ENUM ('APPROVED', 'REJECTED');

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

-- AddForeignKey
ALTER TABLE "robot_workers" ADD CONSTRAINT "robot_workers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "robot_worker_skills" ADD CONSTRAINT "robot_worker_skills_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "robot_workers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_runs" ADD CONSTRAINT "automation_runs_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "robot_workers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_pendings" ADD CONSTRAINT "automation_pendings_runId_fkey" FOREIGN KEY ("runId") REFERENCES "automation_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
