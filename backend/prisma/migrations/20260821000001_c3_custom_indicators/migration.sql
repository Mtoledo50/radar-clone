-- =================================================================
-- 🆕 Sprint C3 — Indicadores Customizados (ADR-054)
-- Permite ao diretor criar seus próprios KPIs com fórmula matemática.
-- =================================================================

-- Enum de categorias (organização visual no dashboard)
CREATE TYPE "IndicatorCategory" AS ENUM (
  'COMERCIAL',    -- conversão, ticket médio, funil
  'OPERACIONAL',  -- produtividade, capacidade, SLA
  'FINANCEIRO',   -- MRR, churn, LTV
  'EQUIPE',       -- turnover, tenure, críticos
  'CUSTOM'        -- categoria livre
);

-- Tabela principal
CREATE TABLE "custom_indicators" (
  "id"           TEXT NOT NULL PRIMARY KEY,
  "companyId"    TEXT NOT NULL,
  "userId"       TEXT NOT NULL,            -- quem criou (auditoria)
  "name"         TEXT NOT NULL,            -- ex: "% da Meta de Clientes"
  "description"  TEXT,                     -- ex: "Progresso em relação à meta de 1 ano"
  "formula"      TEXT NOT NULL,            -- ex: "(clientesHoje / clientesAno) * 100"
  "target"       DOUBLE PRECISION,         -- meta numérica (opcional)
  "unit"         TEXT NOT NULL DEFAULT '%', -- %, R$, un, dias
  "category"     "IndicatorCategory" NOT NULL DEFAULT 'CUSTOM',
  "color"        TEXT NOT NULL DEFAULT '#0d9488', -- cor do card/barra
  "isFavorite"   BOOLEAN NOT NULL DEFAULT false,
  "isActive"     BOOLEAN NOT NULL DEFAULT true,

  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL,

  CONSTRAINT "custom_indicators_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE,
  CONSTRAINT "custom_indicators_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX "custom_indicators_companyId_idx" ON "custom_indicators"("companyId");
CREATE INDEX "custom_indicators_companyId_category_idx" ON "custom_indicators"("companyId", "category");
CREATE INDEX "custom_indicators_companyId_isActive_idx" ON "custom_indicators"("companyId", "isActive");

COMMENT ON TABLE "custom_indicators" IS
  'KPIs customizados criados pelo diretor com fórmula matemática segura (ADR-054).';
COMMENT ON COLUMN "custom_indicators"."formula" IS
  'Fórmula matemática usando variáveis whitelisted (ex: clientesHoje / clientesAno * 100)';
COMMENT ON COLUMN "custom_indicators"."target" IS
  'Meta numérica; NULL = sem meta (só exibe o valor atual)';