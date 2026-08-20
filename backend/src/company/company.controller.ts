// =================================================================
// INÍCIO: backend/src/company/company.controller.ts
// =================================================================
/**
 * =================================================================
 * CompanyController — Perfil da Empresa + Branding (Sprint A5)
 * =================================================================
 * Responsabilidades:
 * 1. Perfil da empresa (CompanyProfile) — onboarding/visão estratégica.
 *    Rotas: GET /company • POST /company • PUT /company/:id
 * 2. Branding white-label (Company) — cores/logo/rodapé das propostas.
 *    Rotas: GET /company/branding • PATCH /company/branding
 *
 * 🛡️ Segurança:
 * - Todas as rotas exigem JWT (JwtAuthGuard).
 * - PATCH /company/branding é restrito a ADMIN (RolesGuard + @Roles).
 *   (mudar a identidade visual é ato de gestão, não de colaborador)
 * - Rotas de perfil usam req.user.id como fonte da verdade
 *   (usuário A nunca edita o perfil do usuário B).
 *
 * 🧠 ADRs: ADR-025 (RBAC @Roles) • ADR-043 (fallback de cores).
 * =================================================================
 */
import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';

import { CompanyService } from './company.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UpdateBrandingDto } from './dto/update-branding.dto';

/** Payload do JWT (espelho do que o JwtStrategy injeta). */
interface UserPayload {
  id: string;
  companyId: string;
  email: string;
  role: string;
}

@Controller('company')
export class CompanyController {
  constructor(private readonly service: CompanyService) {}

  // =================================================================
  // 📋 PERFIL DA EMPRESA (CompanyProfile — onboarding/visão)
  // =================================================================

  /**
   * GET /company
   * Busca o perfil (CompanyProfile) do usuário logado.
   * Retorna { id: null } se ainda não existir (frontend trata vazio).
   */
  @UseGuards(JwtAuthGuard)
  @Get()
  async getProfile(@Request() req) {
    const data = await this.service.getProfile(req.user.id);
    return { success: true, data, message: 'Perfil carregado com sucesso' };
  }

  /**
   * POST /company
   * Cria o perfil da empresa (primeiro salvamento após onboarding).
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  async createProfile(@Request() req, @Body() body: any) {
    const data = await this.service.createProfile(req.user.id, body);
    return { success: true, data, message: 'Dados da empresa salvos com sucesso!' };
  }

  /**
   * PUT /company/:id
   * Atualiza o perfil existente (upsert — cria se não existir).
   *
   * ⚠️ O :id da URL é ignorado por segurança: usamos req.user.id
   * como fonte da verdade (evita edição cruzada entre usuários).
   */
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async updateProfile(@Request() req, @Param('id') id: string, @Body() body: any) {
    const data = await this.service.updateProfile(req.user.id, body);
    return { success: true, data, message: 'Dados da empresa atualizados com sucesso!' };
  }

  // =================================================================
  // 🎨 SPRINT A5 — BRANDING (white-label das propostas públicas)
  // =================================================================

  /**
   * GET /company/branding
   * Retorna cores/logo/rodapé do tenant logado, JÁ COM FALLBACK
   * Conta Certa aplicado (qualquer usuário logado pode ler —
   * o wizard de propostas e o preview precisam dessas cores).
   */
  @Get('branding')
  @UseGuards(JwtAuthGuard)
  async getBranding(@CurrentUser() user: UserPayload) {
    return this.service.getBranding(user.companyId);
  }

  /**
   * PATCH /company/branding
   * Atualiza cores primária/secundária e texto do rodapé.
   *
   * 🛡️ Restrito a ADMIN (@Roles + RolesGuard): identidade visual
   * é decisão de gestão do escritório.
   */
  @Patch('branding')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateBranding(
    @CurrentUser() user: UserPayload,
    @Body() dto: UpdateBrandingDto,
  ) {
    const updated = await this.service.updateBranding(user.companyId, dto);
    return { success: true, data: updated };
  }
  // =================================================================
  // 🆕 SPRINT C1 — BENCHMARK DE SOFTWARES (rota PÚBLICA do tenant)
  // =================================================================
  /**
   * GET /company/software-benchmark
   * Benchmark do stack do tenant logado vs. rede + catálogo de mercado.
   * Qualquer usuário logado do tenant pode ler (é dado estratégico,
   * não confidencial — o próprio tenant cadastra o stack).
   * 🧠 ADR-052: fonte híbrida (rede real + catálogo curado v1).
   */
  @Get('software-benchmark')
  @UseGuards(JwtAuthGuard)
  async getSoftwareBenchmark(@CurrentUser() user: UserPayload) {
    const data = await this.service.getSoftwareBenchmark(user.companyId);
    return { success: true, data };
  }
}
// =================================================================
// FIM: backend/src/company/company.controller.ts
// =================================================================