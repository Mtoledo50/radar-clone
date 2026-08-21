// =================================================================
// INÍCIO: backend/src/legal/legal.controller.ts
// =================================================================
/**
 * ⚖️ LegalController — FD-8 + FD-6
 * Rotas /digital-employee/legal/* (JWT; reveal = ADMIN + RolesGuard).
 */
import { Controller, Get, Post, Delete, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { LegalService } from './legal.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

interface UserPayload { id: string; companyId: string; email: string; role: string; }

@Controller('digital-employee/legal')
@UseGuards(JwtAuthGuard)
export class LegalController {
  constructor(private readonly service: LegalService) {}

  @Get('vault')
  async listVault(@CurrentUser() user: UserPayload) {
    return { success: true, data: await this.service.listVault(user.companyId) };
  }

  @Post('vault')
  async createVaultItem(@CurrentUser() user: UserPayload, @Body() body: any) {
    const data = await this.service.createVaultItem(user.companyId, body);
    return { success: true, data, message: 'Item guardado no cofre 🔐' };
  }

  @Post('vault/certificate')
  async uploadCertificate(@CurrentUser() user: UserPayload, @Body() body: any) {
    const data = await this.service.uploadCertificate(user.companyId, body);
    return { success: true, data, message: 'Certificado A1 guardado 🔐' };
  }

  /** 🔓 ADMIN: revela segredo sob demanda (ADR-059). */
  @Post('vault/:id/reveal')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async reveal(@CurrentUser() user: UserPayload, @Param('id') id: string) {
    const data = await this.service.reveal(user.companyId, id);
    return { success: true, data };
  }

  @Delete('vault/:id')
  async deleteVaultItem(@CurrentUser() user: UserPayload, @Param('id') id: string) {
    await this.service.deleteVaultItem(user.companyId, id);
    return { success: true, message: 'Item removido do cofre' };
  }

  @Get('deadlines')
  async listDeadlines(@CurrentUser() user: UserPayload) {
    return { success: true, data: await this.service.listDeadlines(user.companyId) };
  }

  @Post('deadlines')
  async createDeadline(@CurrentUser() user: UserPayload, @Body() body: any) {
    const data = await this.service.createDeadline(user.companyId, body);
    return { success: true, data, message: 'Obrigação cadastrada' };
  }

  @Patch('deadlines/:id')
  async toggleDeadline(@CurrentUser() user: UserPayload, @Param('id') id: string) {
    const data = await this.service.toggleDeadline(user.companyId, id);
    return { success: true, data };
  }

  @Delete('deadlines/:id')
  async deleteDeadline(@CurrentUser() user: UserPayload, @Param('id') id: string) {
    await this.service.deleteDeadline(user.companyId, id);
    return { success: true, message: 'Obrigação removida' };
  }

  /** 📄 FD-6: baixa o txt da EFD-Contribuições v1. */
  @Get('efd-contribuicoes')
  async efd(@CurrentUser() user: UserPayload) {
    const txt = await this.service.generateEfdContribuicoes(user.companyId);
    return { success: true, data: { txt } };
  }
}
// =================================================================
// FIM: backend/src/legal/legal.controller.ts
// =================================================================