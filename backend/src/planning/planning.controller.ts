import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { PlanningService } from './planning.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('plannings')
@UseGuards(JwtAuthGuard)
export class PlanningController {
  constructor(private readonly service: PlanningService) {}

  @Get()
  async findAll(@Request() req) {
    return { success: true, data: await this.service.findAll(req.user.companyId) };
  }

  @Get('metrics')
  async getMetrics(@Request() req) {
    return { success: true, data: await this.service.getMetrics(req.user.companyId) };
  }

  @Post()
  async create(@Request() req, @Body() body: any) {
    return { success: true, data: await this.service.create(req.user.companyId, req.user.id, body) };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return { success: true, data: await this.service.update(id, body) };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
    return { success: true };
  }
}