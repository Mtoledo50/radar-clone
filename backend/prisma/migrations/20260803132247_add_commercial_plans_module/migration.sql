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

    CONSTRAINT "service_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_items" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commercial_plans" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "multiplier" DOUBLE PRECISION NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isIndependent" BOOLEAN NOT NULL DEFAULT false,
    "color" TEXT,
    "badge" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commercial_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_service_items" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "serviceItemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_service_items_pkey" PRIMARY KEY ("id")
);

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
