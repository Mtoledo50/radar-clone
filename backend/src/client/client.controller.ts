import { Controller, Get, Post, Put, Delete, Body, Param, Request, Query, UseGuards } from '@nestjs/common';
import { ClientService } from './client.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // 🔥 CAMINHO CORRIGIDO

@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientController {
  constructor(private clientService: ClientService) {}

  // =================================================================
  // 📋 CRUD BÁSICO
  // =================================================================
  @Get()
  async findAll(@Request() req) {
    const clients = await this.clientService.findAll(req.user.companyId);
    return { success: true, data: clients };
  }

  @Post()
  async create(@Request() req, @Body() dto: any) {
    const client = await this.clientService.create(req.user.companyId, req.user.id, dto);
    return { success: true, message: 'Cliente criado com sucesso!', data: client };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: any) {
    const client = await this.clientService.update(id, dto);
    return { success: true, message: 'Cliente atualizado!', data: client };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.clientService.delete(id);
    return { success: true, message: 'Cliente removido!' };
  }

  // =================================================================
  // 📊 NOVO ENDPOINT: Métricas do Dashboard
  // =================================================================
  @Get('dashboard')
  async getDashboard(@Request() req, @Query('year') year: string) {
    const companyId = req.user.companyId;
    const yearNum = year ? parseInt(year, 10) : new Date().getFullYear();
    const data = await this.clientService.getDashboard(companyId, yearNum);
    return { success: true, data };
  }

  // =================================================================
  // 📅 NOVO ENDPOINT: Buscar Dados Mensais
  // =================================================================
  @Get('monthly')
  async getMonthlyData(@Request() req, @Query('year') year: string) {
    const companyId = req.user.companyId;
    const yearNum = year ? parseInt(year, 10) : new Date().getFullYear();
    const data = await this.clientService.getMonthlyData(companyId, yearNum);
    return { success: true, data };
  }

  // =================================================================
  // 💾 NOVO ENDPOINT: Salvar Dados Mensais
  // =================================================================
  @Post('monthly')
  async upsertMonthlyData(@Request() req, @Body() body: any) {
    const { companyId, id: userId } = req.user;
    const { year, month, data } = body;
    
    const result = await this.clientService.upsertMonthlyData(companyId, userId, year, month, data);
    return { success: true, data: result };
  }
}