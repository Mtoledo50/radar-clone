-- 🆕 Sprint 24: converte enum BankNature -> TEXT (naturezas dinâmicas)
ALTER TABLE "bank_transactions" ALTER COLUMN "nature" DROP DEFAULT;
ALTER TABLE "bank_transactions" ALTER COLUMN "nature" TYPE TEXT USING "nature"::TEXT;
ALTER TABLE "bank_transactions" ALTER COLUMN "nature" SET DEFAULT 'NAO_CLASSIFICADO';

ALTER TABLE "bank_classification_rules" ALTER COLUMN "nature" TYPE TEXT USING "nature"::TEXT;

DROP TYPE IF EXISTS "BankNature";