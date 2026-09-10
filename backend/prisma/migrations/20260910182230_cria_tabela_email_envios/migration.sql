-- DropForeignKey
ALTER TABLE "client_contacts" DROP CONSTRAINT "client_contacts_company_fkey";

-- DropForeignKey
ALTER TABLE "client_department_owners" DROP CONSTRAINT "client_department_owners_company_fkey";

-- DropForeignKey
ALTER TABLE "client_department_owners" DROP CONSTRAINT "client_department_owners_employee_fkey";

-- CreateTable
CREATE TABLE "counterparty_account_rules" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "clientId" TEXT,
    "pattern" TEXT NOT NULL,
    "debitAccountId" TEXT,
    "creditAccountId" TEXT,
    "hits" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "counterparty_account_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_envios" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT,
    "clienteNome" TEXT NOT NULL,
    "clienteCnpj" TEXT NOT NULL,
    "clienteEmail" TEXT NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "caminhoOriginal" TEXT NOT NULL,
    "caminhoFinal" TEXT,
    "assunto" TEXT NOT NULL,
    "corpoEmail" TEXT,
    "trackingToken" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "enviado" BOOLEAN NOT NULL DEFAULT false,
    "aberto" BOOLEAN NOT NULL DEFAULT false,
    "baixado" BOOLEAN NOT NULL DEFAULT false,
    "dataEnvio" TIMESTAMP(3),
    "dataAbertura" TIMESTAMP(3),
    "dataDownload" TIMESTAMP(3),
    "usuarioEnvioId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_envios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "counterparty_account_rules_companyId_pattern_idx" ON "counterparty_account_rules"("companyId", "pattern");

-- CreateIndex
CREATE UNIQUE INDEX "counterparty_account_rules_companyId_clientId_pattern_key" ON "counterparty_account_rules"("companyId", "clientId", "pattern");

-- CreateIndex
CREATE UNIQUE INDEX "email_envios_trackingToken_key" ON "email_envios"("trackingToken");

-- RenameForeignKey
ALTER TABLE "client_contacts" RENAME CONSTRAINT "client_contacts_client_fkey" TO "client_contacts_clientId_fkey";

-- RenameForeignKey
ALTER TABLE "client_department_owners" RENAME CONSTRAINT "client_department_owners_client_fkey" TO "client_department_owners_clientId_fkey";

-- RenameIndex
ALTER INDEX "client_contacts_companyid_clientid_idx" RENAME TO "client_contacts_companyId_clientId_idx";

-- RenameIndex
ALTER INDEX "client_department_owners_companyid_clientid_idx" RENAME TO "client_department_owners_companyId_clientId_idx";

-- RenameIndex
ALTER INDEX "client_department_owners_uniq" RENAME TO "client_department_owners_companyId_clientId_department_key";

-- RenameIndex
ALTER INDEX "clients_s3did_key" RENAME TO "clients_s3dId_key";
