-- Migration: adicionar NFSE_EMAIL_COLLECT ao enum SkillKey (FD-3b)
ALTER TYPE "SkillKey" ADD VALUE 'NFSE_EMAIL_COLLECT';
