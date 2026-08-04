import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { PricingCalculatorService } from './pricing-calculator.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('pricing-calculator')
@UseGuards(JwtAuthGuard)
export class PricingCalculatorController {
  constructor(private readonly service: PricingCalculatorService) {}

  @Get('config')
  async getConfig(@Request() req) {
    return { success: true, data: await this.service.getConfig(req.user.companyId) };
  }

  @Put('config')
  async updateConfig(@Request() req, @Body() body: any) {
    return { success: true, data: await this.service.updateConfig(req.user.companyId, body) };
  }

  @Get('hour-rules')
  async getHourRules(@Request() req) {
    return { success: true, data: await this.service.getHourRules(req.user.companyId) };
  }

  @Post('hour-rules')
  async createHourRule(@Request() req, @Body() body: any) {
    return { success: true, data: await this.service.createHourRule(req.user.companyId, body) };
  }

  @Put('hour-rules/:id')
  async updateHourRule(@Param('id') id: string, @Body() body: any) {
    return { success: true, data: await this.service.updateHourRule(id, body) };
  }

  @Delete('hour-rules/:id')
  async deleteHourRule(@Param('id') id: string) {
    await this.service.deleteHourRule(id);
    return { success: true };
  }

  @Post('calculate')
  async calculate(@Request() req, @Body() body: any) {
    return { success: true, data: await this.service.calculate(req.user.companyId, body) };
  }

  @Post('save-calculation')
  async saveCalculation(@Request() req, @Body() body: any) {
    return { success: true, data: await this.service.saveCalculation(req.user.companyId, req.user.id, body) };
  }

  @Get('calculations')
  async getCalculations(@Request() req, @Query('status') status?: string) {
    return { success: true, data: await this.service.getCalculations(req.user.companyId, status) };
  }
}