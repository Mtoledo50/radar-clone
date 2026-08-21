// =================================================================
// INÍCIO: backend/src/billing/billing.controller.ts
// =================================================================
/**
 * 💰 BillingController — FD-5
 * Rotas /digital-employee/billing/* (JWT).
 */
import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

interface UserPayload { id: string; companyId: string; email: string; role: string; }

@Controller('digital-employee/billing')
@UseGuards(JwtAuthGuard)
export class BillingController {
  constructor(private readonly service: BillingService) {}

  @Get()
  async list(@CurrentUser() user: UserPayload) {
    return { success: true, data: await this.service.list(user.companyId) };
  }

  @Post()
  async create(@CurrentUser() user: UserPayload, @Body() body: any) {
    const data = await this.service.create(user.companyId, body);
    return { success: true, data, message: 'Cobrança criada!' };
  }

  @Delete(':id')
  async remove(@CurrentUser() user: UserPayload, @Param('id') id: string) {
    await this.service.remove(user.companyId, id);
    return { success: true, message: 'Cobrança removida' };
  }

  @Post(':id/status')
  async setStatus(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
    @Body() body: { status: 'ENVIADA' | 'PAGA' },
  ) {
    const data = await this.service.setStatus(user.companyId, id, body.status);
    return { success: true, data, message: `Status: ${body.status}` };
  }

  /** ⬇️ Gera e baixa a remessa CNAB 240 das PENDENTES. */
  @Get('cnab')
  async cnab(@CurrentUser() user: UserPayload) {
    const data = await this.service.generateCnab(user.companyId);
    return { success: true, data };
  }
}
// =================================================================
// FIM: backend/src/billing/billing.controller.ts
// =================================================================