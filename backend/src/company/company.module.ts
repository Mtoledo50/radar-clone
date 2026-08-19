// =================================================================
// INÍCIO: backend/src/company/company.module.ts
// =================================================================
/**
 * =================================================================
 * CompanyModule — Perfil da Empresa + Branding (Sprint A5)
 * =================================================================
 * Responsabilidades do módulo:
 * 1. Perfil do escritório (CompanyProfile) — onboarding/visão de futuro.
 * 2. 🆕 Branding white-label (cores + rodapé da proposta pública).
 *
 * 🔌 Endpoints expostos (CompanyController):
 * - GET    /company            → perfil (CompanyProfile)
 * - POST   /company            → cria perfil
 * - PUT    /company/:id        → atualiza perfil (upsert)
 * - GET    /company/branding   → 🆕 cores/logo/rodapé (qualquer usuário)
 * - PATCH  /company/branding   → 🆕 atualiza branding (só ADMIN)
 *
 * 📦 Exporta CompanyService para outros módulos que precisem ler
 *    o branding (ex.: ProposalsModule no futuro, se necessário).
 * =================================================================
 */
import { Module } from '@nestjs/common';
import { CompanyService } from './company.service';
import { CompanyController } from './company.controller';

@Module({
  controllers: [CompanyController],
  providers: [CompanyService],
  exports: [CompanyService], // permite reuso do service em outros módulos
})
export class CompanyModule {}
// =================================================================
// FIM: backend/src/company/company.module.ts
// =================================================================