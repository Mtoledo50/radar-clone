-- CreateTable
CREATE TABLE "ClientServiceActivation" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "serviceCode" TEXT NOT NULL,
    "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activatedBy" TEXT,

    CONSTRAINT "ClientServiceActivation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClientServiceActivation_companyId_clientId_serviceCode_key" ON "ClientServiceActivation"("companyId", "clientId", "serviceCode");
