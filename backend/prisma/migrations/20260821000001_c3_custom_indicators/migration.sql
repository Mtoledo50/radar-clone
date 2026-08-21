-- =================================================================
-- Sprint C3 — Indicadores Customizados (ADR-054)
-- Tabela custom_indicators + enum IndicatorCategory
-- =================================================================

-- Enum de categorias
DO $$ BEGIN
  CREATE TYPE "IndicatorCategory" AS ENUM ('COMERCIAL','OPERACIONAL','FINANCEIRO','EQUIPE','CUSTOM');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Tabela principal
CREATE TABLE IF NOT EXISTS "custom_indicators" (
    "id"          TEXT NOT NULL PRIMARY KEY,
    "companyId"   TEXT NOT NULL,
    "userId"      TEXT NOT NULL,
    "name"        TEXT NOT NULL,
    "description" TEXT,
    "formula"     TEXT NOT NULL,
    "target"      DOUBLE PRECISION,
    "unit"        TEXT NOT NULL DEFAULT '%',
    "category"    "IndicatorCategory" NOT NULL DEFAULT 'CUSTOM',
    "color"       TEXT NOT NULL DEFAULT '#0d9488',
    "isFavorite"  BOOLEAN NOT NULL DEFAULT false,
    "isActive"    BOOLEAN NOT NULL DEFAULT true,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,
    CONSTRAINT "custom_indicators_companyId_fkey"
        FOREIGN KEY ("companyId") REFERENCES "companies"("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "custom_indicators_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "users"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- Índices (espelho do schema.prisma)
CREATE INDEX IF NOT EXISTS "custom_indicators_companyId_idx"
    ON "custom_indicators"("companyId");
CREATE INDEX IF NOT EXISTS "custom_indicators_companyId_category_idx"
    ON "custom_indicators"("companyId", "category");
CREATE INDEX IF NOT EXISTS "custom_indicators_companyId_isActive_idx"
    ON "custom_indicators"("companyId", "isActive");

-- Permissões para o usuário da aplicação (ajuste se o seu for outro)
GRANT SELECT, INSERT, UPDATE, DELETE ON "custom_indicators" TO radar_user;