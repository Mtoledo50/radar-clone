-- =================================================================
-- 🛠️ MIGRAÇÃO MULTI-TENANT: Adaptação segura de dados existentes
-- =================================================================

-- 1. Adicionar novas colunas à tabela 'companies' (que já existe)
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "plan" TEXT NOT NULL DEFAULT 'BASIC';
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "allowedModules" TEXT[] DEFAULT ARRAY['dashboard', 'pessoas', 'clientes']::TEXT[];

-- 2. Garantir que a Empresa Padrão (Admin) exista com todos os módulos
INSERT INTO "companies" ("id", "name", "plan", "allowedModules", "createdAt", "updatedAt")
VALUES (
  '00000000-0000-0000-0000-000000000001', 
  'Escritório Padrão (Admin)', 
  'ENTERPRISE', 
  ARRAY['dashboard', 'pessoas', 'clientes', 'precificacao', 'planejamento', 'bi', 'ponto-fora-da-curva', 'indicadores', 'planejamento-tributario', 'reforma-tributaria', 'turnover'],
  CURRENT_TIMESTAMP, 
  CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO UPDATE SET 
  "name" = EXCLUDED."name",
  "plan" = EXCLUDED."plan",
  "allowedModules" = EXCLUDED."allowedModules",
  "updatedAt" = CURRENT_TIMESTAMP;

-- 3. Adicionar a coluna companyId como NULA nas tabelas de dados (para evitar erro em tabelas com dados)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "companyId" TEXT;
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "companyId" TEXT;
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "companyId" TEXT;
ALTER TABLE "financial_transactions" ADD COLUMN IF NOT EXISTS "companyId" TEXT;
ALTER TABLE "plannings" ADD COLUMN IF NOT EXISTS "companyId" TEXT;
ALTER TABLE "pricings" ADD COLUMN IF NOT EXISTS "companyId" TEXT;
ALTER TABLE "turnover_monthly" ADD COLUMN IF NOT EXISTS "companyId" TEXT;
ALTER TABLE "sectors" ADD COLUMN IF NOT EXISTS "companyId" TEXT;
ALTER TABLE "dismissal_reasons" ADD COLUMN IF NOT EXISTS "companyId" TEXT;
ALTER TABLE "positions" ADD COLUMN IF NOT EXISTS "companyId" TEXT;
ALTER TABLE "resignations" ADD COLUMN IF NOT EXISTS "companyId" TEXT;

-- 4. Preencher TODOS os registros existentes com o ID da Empresa Padrão
UPDATE "users" SET "companyId" = '00000000-0000-0000-0000-000000000001', "role" = 'ADMIN' WHERE "companyId" IS NULL;
UPDATE "clients" SET "companyId" = '00000000-0000-0000-0000-000000000001' WHERE "companyId" IS NULL;
UPDATE "employees" SET "companyId" = '00000000-0000-0000-0000-000000000001' WHERE "companyId" IS NULL;
UPDATE "financial_transactions" SET "companyId" = '00000000-0000-0000-0000-000000000001' WHERE "companyId" IS NULL;
UPDATE "plannings" SET "companyId" = '00000000-0000-0000-0000-000000000001' WHERE "companyId" IS NULL;
UPDATE "pricings" SET "companyId" = '00000000-0000-0000-0000-000000000001' WHERE "companyId" IS NULL;
UPDATE "turnover_monthly" SET "companyId" = '00000000-0000-0000-0000-000000000001' WHERE "companyId" IS NULL;
UPDATE "sectors" SET "companyId" = '00000000-0000-0000-0000-000000000001' WHERE "companyId" IS NULL;
UPDATE "dismissal_reasons" SET "companyId" = '00000000-0000-0000-0000-000000000001' WHERE "companyId" IS NULL;
UPDATE "positions" SET "companyId" = '00000000-0000-0000-0000-000000000001' WHERE "companyId" IS NULL;
UPDATE "resignations" SET "companyId" = '00000000-0000-0000-0000-000000000001' WHERE "companyId" IS NULL;

-- 5. Agora que todos os registros têm um companyId, tornamos a coluna OBRIGATÓRIA
ALTER TABLE "users" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "clients" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "employees" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "financial_transactions" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "plannings" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "pricings" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "turnover_monthly" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "sectors" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "dismissal_reasons" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "positions" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "resignations" ALTER COLUMN "companyId" SET NOT NULL;

-- 6. Criar os índices para performance nas buscas por empresa
CREATE INDEX IF NOT EXISTS "users_companyId_idx" ON "users"("companyId");
CREATE INDEX IF NOT EXISTS "clients_companyId_idx" ON "clients"("companyId");
CREATE INDEX IF NOT EXISTS "employees_companyId_idx" ON "employees"("companyId");
CREATE INDEX IF NOT EXISTS "financial_transactions_companyId_idx" ON "financial_transactions"("companyId");
CREATE INDEX IF NOT EXISTS "plannings_companyId_idx" ON "plannings"("companyId");
CREATE INDEX IF NOT EXISTS "pricings_companyId_idx" ON "pricings"("companyId");
CREATE INDEX IF NOT EXISTS "turnover_monthly_companyId_idx" ON "turnover_monthly"("companyId");
CREATE INDEX IF NOT EXISTS "sectors_companyId_idx" ON "sectors"("companyId");
CREATE INDEX IF NOT EXISTS "dismissal_reasons_companyId_idx" ON "dismissal_reasons"("companyId");
CREATE INDEX IF NOT EXISTS "positions_companyId_idx" ON "positions"("companyId");
CREATE INDEX IF NOT EXISTS "resignations_companyId_idx" ON "resignations"("companyId");

-- 7. Atualizar a chave estrangeira (drop antigo e add novo)
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_companyId_fkey";
ALTER TABLE "users" ADD CONSTRAINT "users_companyId_fkey" 
  FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 8. Atualizar o índice único do turnover (de userId para companyId)
DROP INDEX IF EXISTS "turnover_monthly_userId_year_month_key";
CREATE UNIQUE INDEX IF NOT EXISTS "turnover_monthly_companyId_year_month_key" 
  ON "turnover_monthly"("companyId", "year", "month");