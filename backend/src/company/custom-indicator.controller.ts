// =================================================================
// INÍCIO: backend/src/company/custom-indicator.controller.ts
// =================================================================
/**
 * =================================================================
 * 🧮 CustomIndicatorController — Sprint C3
 * =================================================================
 * CRUD + dashboard dos indicadores customizados do diretor.
 *
 * Rotas:
 *   GET    /company/indicators            → lista do tenant
 *   POST   /company/indicators            → cria (valida fórmula)
 *   PUT    /company/indicators/:id        → atualiza (valida fórmula)
 *   DELETE /company/indicators/:id        → soft delete
 *   PATCH  /company/indicators/:id/favorite → toggle favorito
 *   GET    /company/indicators/dashboard  → avalia todos
 *   POST   /company/indicators/preview    → valida fórmula ao vivo
 *   GET    /company/indicators/variables  → lista variáveis permitidas
 *
 * 🛡️ Todas exigem JWT; ownership checado no service.
 * 🧠 ADR-054: parser seguro por whitelist.
 * =================================================================
 */
import {
  Controller, Get, Post, Put, Delete, Patch,
  Body, Param, UseGuards,
} from '@nestjs/common';
import { CustomIndicatorService, IndicatorFormData } from './custom-indicator.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

interface UserPayload {
  id: string;
  companyId: string;
  email: string;
  role: string;
}

@Controller('company/indicators')
@UseGuards(JwtAuthGuard)
export class CustomIndicatorController {
  constructor(private readonly service: CustomIndicatorService) {}

  // =================================================================
  // 📋 LISTA
  // =================================================================
  @Get()
  async list(@CurrentUser() user: UserPayload) {
    const data = await this.service.list(user.companyId);
    return { success: true, data };
  }

  // =================================================================
  // 🎯 DASHBOARD (avalia todas as fórmulas)
  // =================================================================
  @Get('dashboard')
  async dashboard(@CurrentUser() user: UserPayload) {
    const data = await this.service.getDashboard(user.companyId);
    return { success: true, data };
  }

  // =================================================================
  // 🔧 PREVIEW (validação ao vivo da fórmula)
  // =================================================================
  @Post('preview')
  async preview(@Body() body: { formula: string }) {
    const data = await this.service.preview(body.formula || '');
    return { success: true, data };
  }

  // =================================================================
  // 📚 VARIÁVEIS DISPONÍVEIS (p/ help do modal)
  // =================================================================
  @Get('variables')
  async variables() {
    return { success: true, data: this.service.getAllowedVariables() };
  }

  // =================================================================
  // 💾 CRIAÇÃO
  // =================================================================
  @Post()
  async create(
    @CurrentUser() user: UserPayload,
    @Body() body: IndicatorFormData,
  ) {
    const data = await this.service.create(user.companyId, user.id, body);
    return { success: true, data, message: 'Indicador criado!' };
  }

  // =================================================================
  // 🔄 ATUALIZAÇÃO
  // =================================================================
  @Put(':id')
  async update(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
    @Body() body: Partial<IndicatorFormData>,
  ) {
    const data = await this.service.update(id, user.companyId, body);
    return { success: true, data, message: 'Indicador atualizado!' };
  }

  // =================================================================
  // ⭐ FAVORITO
  // =================================================================
  @Patch(':id/favorite')
  async toggleFavorite(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
  ) {
    const data = await this.service.toggleFavorite(id, user.companyId);
    return { success: true, data };
  }

  // =================================================================
  // 🗑️ EXCLUSÃO (soft)
  // =================================================================
  @Delete(':id')
  async remove(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
  ) {
    await this.service.remove(id, user.companyId);
    return { success: true, message: 'Indicador removido' };
  }
}
// =================================================================
// FIM: backend/src/company/custom-indicator.controller.ts
// =================================================================