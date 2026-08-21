// =================================================================
// INÍCIO: backend/src/company/company.controller.ts
// =================================================================
/**
 * =================================================================
 * CompanyController — Perfil + Branding + Software Stack + Benchmark
 * =================================================================
 * Rotas (todas exigem JWT; algumas só ADMIN):
 *
 * PERFIL (CompanyProfile — onboarding/visão):
 *   GET    /company             → busca perfil
 *   POST   /company             → cria perfil
 *   PUT    /company/:id         → atualiza perfil (id ignorado p/ segurança)
 *
 * BRANDING (Company — white-label das propostas):
 *   GET    /company/branding    → cores/logo/rodapé (com fallback)
 *   PATCH  /company/branding    → atualiza (só ADMIN)
 *
 * SOFTWARE STACK (Company.softwareStack — Sprint C1):
 *   GET    /company/software-stack      → lê stack salvo
 *   PATCH  /company/software-stack      → salva stack (memória da UI)
 *
 * BENCHMARK (Sprint C1):
 *   GET    /company/software-benchmark  → benchmark de mercado (ADR-052)
 *
 * 🛡️ Segurança:
 *   - Todas as rotas exigem JWT (JwtAuthGuard).
 *   - PATCH /company/branding é restrito a ADMIN (RolesGuard + @Roles).
 *   - Rotas de perfil usam req.user.id como fonte da verdade
 *     (usuário A nunca edita o perfil do usuário B).
 *
 * 🧠 ADRs:
 *   - ADR-025: RBAC com @Roles + 3 camadas.
 *   - ADR-043: fallback de cores Conta Certa.
 *   - ADR-052: benchmark híbrido (rede + catálogo v1).
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
import { ScoreService } from './score.service';

/** Payload do JWT (espelho do que o JwtStrategy injeta). */
interface UserPayload {
  id: string;
  companyId: string;
  email: string;
  role: string;
}

@Controller('company')
export class CompanyController {
  constructor(private readonly service: CompanyService,    
             private readonly scoreService: ScoreService, // 🆕 Sprint C4
) {}
  

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
  // 🆕 SPRINT C1 — SOFTWARE STACK (persistência real — Company)
  // =================================================================

  /**
   * GET /company/software-stack
   * Lê o stack salvo no tenant (memória da UI).
   * Fonte da verdade do Benchmark de Mercado.
   */
  @Get('software-stack')
  @UseGuards(JwtAuthGuard)
  async getSoftwareStack(@CurrentUser() user: UserPayload) {
    const data = await this.service.getSoftwareStack(user.companyId);
    return { success: true, data };
  }

  /**
   * PATCH /company/software-stack
   * Salva o stack no tenant (resolve o "sem memória de atualização").
   * Qualquer usuário logado pode salvar (não é decisão de branding).
   */
  @Patch('software-stack')
  @UseGuards(JwtAuthGuard)
  async updateSoftwareStack(
    @CurrentUser() user: UserPayload,
    @Body() body: { softwareStack: string[] },
  ) {
    const data = await this.service.updateSoftwareStack(
      user.companyId,
      body?.softwareStack ?? [],
    );
    return { success: true, data, message: 'Stack de softwares atualizado!' };
  }

  // =================================================================
  // 🆕 SPRINT C1 — BENCHMARK DE SOFTWARES (ADR-052)
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
  // =================================================================
  // 🆕 SPRINT C2 — BENCHMARK DE SERVIÇOS EXTRAS (ADR-053)
  // =================================================================

  /**
   * GET /company/extra-services-benchmark
   * Quanto você deixa na mesa de serviços extras que o mercado cobra.
   * Cruza ServiceItem do tenant com catálogo curado v1.
   */
  @Get('extra-services-benchmark')
  @UseGuards(JwtAuthGuard)
  async getExtraServicesBenchmark(@CurrentUser() user: UserPayload) {
    const data = await this.service.getExtraServicesBenchmark(user.companyId);
    return { success: true, data };
  }
  // =================================================================
  // 🆕 SPRINT C4 — SCORE 0–100 DO ESCRITÓRIO (ADR-055)
  // =================================================================
  /**
   * GET /company/score
   * Nota única de saúde do escritório (5 dimensões ponderadas).
   */
  @Get('score')
  @UseGuards(JwtAuthGuard)
  async getScore(@CurrentUser() user: UserPayload) {
    const data = await this.scoreService.getScore(user.companyId);
    return { success: true, data };
  }
  // =================================================================
  // 🆕 SPRINT D1 — MENTORIA: VISÃO DE FUTURO (ADR-056)
  // =================================================================
  /** GET /company/mentoria — visão + metas + focos derivados do Score. */
  @Get('mentoria')
  @UseGuards(JwtAuthGuard)
  async getMentoria(@CurrentUser() user: UserPayload) {
    const data = await this.scoreService.getMentoria(user.companyId);
    return { success: true, data };
  }
}
// =================================================================
// FIM: backend/src/company/company.controller.ts
// =================================================================