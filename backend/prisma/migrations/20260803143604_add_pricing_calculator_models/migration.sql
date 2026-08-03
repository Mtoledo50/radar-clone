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

-- CreateIndex
CREATE UNIQUE INDEX "pricing_configs_companyId_key" ON "pricing_configs"("companyId");

-- CreateIndex
CREATE INDEX "pricing_hour_rules_companyId_idx" ON "pricing_hour_rules"("companyId");

-- CreateIndex
CREATE INDEX "pricing_hour_rules_regime_activity_idx" ON "pricing_hour_rules"("regime", "activity");

-- CreateIndex
CREATE INDEX "pricing_calculations_companyId_idx" ON "pricing_calculations"("companyId");

-- CreateIndex
CREATE INDEX "pricing_calculations_status_idx" ON "pricing_calculations"("status");

-- AddForeignKey
ALTER TABLE "pricing_configs" ADD CONSTRAINT "pricing_configs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_hour_rules" ADD CONSTRAINT "pricing_hour_rules_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_calculations" ADD CONSTRAINT "pricing_calculations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_calculations" ADD CONSTRAINT "pricing_calculations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
