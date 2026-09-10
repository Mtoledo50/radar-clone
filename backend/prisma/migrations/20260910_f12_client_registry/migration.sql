-- =================================================================
-- Sprint F12 — Cadastro Completo de Clientes (S3D)
-- ADR-111: contatos 1-N • ADR-112: responsáveis por departamento
-- ADR-114: regime como enum • ADR-115: datas de relacionamento
-- Atenção: colunas do model Client NÃO têm @map → nomes camelCase!
-- =================================================================

-- 1) Enum de regimes tributários
DO $$ BEGIN
  CREATE TYPE "TaxRegime" AS ENUM (
    'SIMPLES_NACIONAL','LUCRO_PRESUMIDO','LUCRO_REAL','MEI','DOMESTICAS_CEI','OUTROS'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) Novos campos do Client (identificação + endereço + registros + ciclo)
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS "tradeName"            TEXT,
  ADD COLUMN IF NOT EXISTS "taxRegime"           "TaxRegime",
  ADD COLUMN IF NOT EXISTS "nire"                TEXT,
  ADD COLUMN IF NOT EXISTS "municipalRegistration"    TEXT,
  ADD COLUMN IF NOT EXISTS "municipalRegistrationDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "stateRegistrations"  TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "isStateExempt"       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "otherIdentifiers"    TEXT,
  ADD COLUMN IF NOT EXISTS "phone"               TEXT,
  ADD COLUMN IF NOT EXISTS "address"             TEXT,
  ADD COLUMN IF NOT EXISTS "addressNumber"       TEXT,
  ADD COLUMN IF NOT EXISTS "addressComplement"   TEXT,
  ADD COLUMN IF NOT EXISTS "addressDistrict"     TEXT,
  ADD COLUMN IF NOT EXISTS "addressCity"         TEXT,
  ADD COLUMN IF NOT EXISTS "addressState"        TEXT,
  ADD COLUMN IF NOT EXISTS "addressZip"          TEXT,
  ADD COLUMN IF NOT EXISTS "website"             TEXT,
  ADD COLUMN IF NOT EXISTS "s3dNickname"         TEXT,
  ADD COLUMN IF NOT EXISTS "companyGroup"        TEXT,
  ADD COLUMN IF NOT EXISTS "foundationDate"      TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "clientSince"         TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "clientUntil"         TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "s3dRegistrationDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "tags"                TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "s3dId"               INTEGER;

-- ID do S3D é âncora de reimportação (1 empresa S3D = 1 Client)
CREATE UNIQUE INDEX IF NOT EXISTS clients_s3dId_key ON clients("s3dId");

-- 3) Tabela de CONTATOS (1-N por cliente) — ADR-111
CREATE TABLE IF NOT EXISTS client_contacts (
  id          TEXT PRIMARY KEY,
  "companyId" TEXT NOT NULL,
  "clientId"  TEXT NOT NULL,
  name        TEXT NOT NULL,
  role        TEXT,
  phone       TEXT,
  email       TEXT,
  departments TEXT[] NOT NULL DEFAULT '{}',
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT client_contacts_client_fkey
    FOREIGN KEY ("clientId") REFERENCES clients(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT client_contacts_company_fkey
    FOREIGN KEY ("companyId") REFERENCES companies(id)
    ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS client_contacts_companyId_clientId_idx
  ON client_contacts("companyId", "clientId");

-- 4) Tabela de RESPONSÁVEIS INTERNOS por departamento — ADR-112
CREATE TABLE IF NOT EXISTS client_department_owners (
  id          TEXT PRIMARY KEY,
  "companyId" TEXT NOT NULL,
  "clientId"  TEXT NOT NULL,
  department  TEXT NOT NULL,
  "ownerName" TEXT NOT NULL,
  "employeeId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT client_department_owners_client_fkey
    FOREIGN KEY ("clientId") REFERENCES clients(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT client_department_owners_company_fkey
    FOREIGN KEY ("companyId") REFERENCES companies(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT client_department_owners_employee_fkey
    FOREIGN KEY ("employeeId") REFERENCES employees(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT client_department_owners_uniq
    UNIQUE ("companyId", "clientId", department)
);
CREATE INDEX IF NOT EXISTS client_department_owners_companyId_clientId_idx
  ON client_department_owners("companyId", "clientId");

-- 5) Permissões para o usuário da aplicação (tabelas novas criadas pelo superuser)
GRANT ALL ON TABLE client_contacts          TO radar_user;
GRANT ALL ON TABLE client_department_owners TO radar_user;