import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('accounting')
@UseGuards(JwtAuthGuard)
export class AccountingController {
  constructor(private readonly service: AccountingService) {}

  // Contas Contábeis
  @Get('accounts')
  async getAccounts(@Request() req) {
    return { success: true, data: await this.service.getAccounts(req.user.companyId) };
  }

  @Post('accounts')
  async createAccount(@Request() req, @Body() body: any) {
    return { success: true, data: await this.service.createAccount(req.user.companyId, body) };
  }

  @Put('accounts/:id')
  async updateAccount(@Param('id') id: string, @Body() body: any) {
    return { success: true, data: await this.service.updateAccount(id, body) };
  }

  @Delete('accounts/:id')
  async deleteAccount(@Param('id') id: string) {
    return { success: true, data: await this.service.deleteAccount(id) };
  }

  // Lançamentos Contábeis
  @Get('entries')
  async getEntries(@Request() req) {
    return { success: true, data: await this.service.getEntries(req.user.companyId) };
  }

  @Post('entries')
  async createEntry(@Request() req, @Body() body: any) {
    return { success: true, data: await this.service.createEntry(req.user.companyId, body) };
  }

  @Put('entries/:id')
  async updateEntry(@Request() req, @Param('id') id: string, @Body() body: any) {
    return { success: true, data: await this.service.updateEntry(id, req.user.companyId, body) };
  }

  @Delete('entries/:id')
  async deleteEntry(@Request() req, @Param('id') id: string) {
    await this.service.deleteEntry(id, req.user.companyId);
    return { success: true };
  }
}