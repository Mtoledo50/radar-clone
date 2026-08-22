// =================================================================
// INÃCIO: backend/src/accounting/accounting.controller.ts
// =================================================================
/**
 * AccountingController
 * Gerencia os endpoints REST para contas contÃ¡beis, lanÃ§amentos
 * e exportaÃ§Ã£o de arquivos para o sistema SCI.
 * 
 * ðŸ†• Sprint 25.2: endpoint promote-from-banking
 * ðŸ†• ImportaÃ§Ã£o: endpoint para upload de CSV de plano de contas
 */
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AccountingService } from './accounting.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('accounting')
@UseGuards(JwtAuthGuard)
export class AccountingController {
  constructor(private readonly service: AccountingService) {}

  // =================================================================
  // ENDPOINTS DE CONTAS CONTÃBEIS (CRUD)
  // =================================================================

  @Get('accounts')
  async getAccounts(@Request() req) {
    return { 
      success: true, 
      data: await this.service.getAccounts(req.user.companyId) 
    };
  }

  @Post('accounts')
  async createAccount(@Request() req, @Body() body: any) {
    return { 
      success: true, 
      data: await this.service.createAccount(req.user.companyId, body) 
    };
  }

  @Put('accounts/:id')
  async updateAccount(@Param('id') id: string, @Body() body: any) {
    return { 
      success: true, 
      data: await this.service.updateAccount(id, body) 
    };
  }

  @Delete('accounts/:id')
  async deleteAccount(@Param('id') id: string) {
    return { 
      success: true, 
      data: await this.service.deleteAccount(id) 
    };
  }

  // =================================================================
  // CONCILIAÃ‡ÃƒO DE LANÃ‡AMENTOS
  // =================================================================

  @Put('entries/:id/conciliate')
  async conciliateEntry(@Param('id') id: string, @Request() req, @Body() body: any) {
    try {
      const result = await this.service.conciliateEntry(id, req.user.companyId, body);
      return { success: true, data: result };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  // =================================================================
  // ENDPOINTS DE LANÃ‡AMENTOS CONTÃBEIS (CRUD)
  // =================================================================

  @Get('entries')
  async getEntries(@Request() req) {
    return { 
      success: true, 
      data: await this.service.getEntries(req.user.companyId) 
    };
  }

  @Post('entries')
  async createEntry(@Request() req, @Body() body: any) {
    return { 
      success: true, 
      data: await this.service.createEntry(req.user.companyId, body) 
    };
  }

  @Put('entries/:id')
  async updateEntry(@Request() req, @Param('id') id: string, @Body() body: any) {
    return { 
      success: true, 
      data: await this.service.updateEntry(id, req.user.companyId, body) 
    };
  }

  @Delete('entries/:id')
  async deleteEntry(@Request() req, @Param('id') id: string) {
    await this.service.deleteEntry(id, req.user.companyId);
    return { success: true };
  }

  // =================================================================
  // EXPORTAÃ‡ÃƒO PARA SCI
  // =================================================================

  @Get('export-sci')
  async exportToSCI(
    @Request() req,
    @Query('year') year?: string,
    @Query('month') month?: string
  ) {
    const content = await this.service.exportToSCI(
      req.user.companyId,
      year ? parseInt(year) : undefined,
      month ? parseInt(month) : undefined
    );

    return { 
      success: true, 
      content,
      message: 'Arquivo gerado com sucesso!' 
    };
  }

  // =================================================================
  // ðŸ†• SPRINT 25.2: PROMOVER TRANSAÃ‡Ã•ES BANCÃRIAS P/ CONTÃBIL
  // =================================================================

  @Post('promote-from-banking')
  async promoteFromBanking(@Request() req, @Body() body: any) {
    const result = await this.service.promoteFromBanking(req.user.companyId, {
      statementId: body.statementId,
      clientId: body.clientId || null,
      accountMapping: body.accountMapping || {},
      bankAccountId: body.bankAccountId,
    });
    return { success: true, data: result };
  }

  // =================================================================
  // ðŸ†• SPRINT 26: DRE OFICIAL DO CLIENTE + CONFRONTO BANCÃRIO
  // =================================================================

  @Get('dre')
  async getClientDRE(
    @Request() req,
    @Query('clientId') clientId: string,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    const now = new Date();
    return {
      success: true,
      data: await this.service.getClientDRE(
        req.user.companyId,
        clientId,
        year ? parseInt(year) : now.getFullYear(),
        month ? parseInt(month) : now.getMonth() + 1,
      ),
    };
  }


}
// =================================================================
// FIM: backend/src/accounting/accounting.controller.ts
// =================================================================
