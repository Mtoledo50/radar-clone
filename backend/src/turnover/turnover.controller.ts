import { Controller, Get, Post, Put, Delete, Query, Body, UseGuards, Request, Param } from '@nestjs/common';
import { TurnoverService } from './turnover.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('turnover')
@UseGuards(JwtAuthGuard)
export class TurnoverController {
  constructor(private readonly turnoverService: TurnoverService) {}

  @Get('dashboard')
  async getDashboard(@Request() req, @Query('year') year: string) {
    const { companyId } = req.user;
    const data = await this.turnoverService.getDashboard(companyId, parseInt(year) || new Date().getFullYear());
    return { success: true, data };
  }

  @Post('monthly')
  async saveMonthlyData(@Request() req, @Body() body: any) {
    const { id: userId, companyId } = req.user;
    const data = await this.turnoverService.saveMonthlyData(companyId, userId, body.year, body.month, body.data);
    return { success: true, data };
  }

  @Get('sectors')
  async getSectors(@Request() req) {
    const data = await this.turnoverService.getSectors(req.user.companyId);
    return { success: true, data };
  }

  @Post('sectors')
  async createSector(@Request() req, @Body() body: { name: string }) {
    const data = await this.turnoverService.createSector(req.user.companyId, req.user.id, body.name);
    return { success: true, data };
  }

  @Put('sectors/:id')
  async updateSector(@Param('id') id: string, @Body() body: { name: string }) {
    const data = await this.turnoverService.updateSector(id, body.name);
    return { success: true, data };
  }

  @Delete('sectors/:id')
  async deleteSector(@Param('id') id: string) {
    await this.turnoverService.deleteSector(id);
    return { success: true };
  }

  @Get('sector-distribution')
  async getSectorDistribution(@Request() req, @Query('year') year: string, @Query('month') month: string) {
    const data = await this.turnoverService.getSectorDistribution(req.user.companyId, parseInt(year), parseInt(month));
    return { success: true, data };
  }

  @Post('sector-distribution')
  async saveSectorDistribution(@Request() req, @Body() body: any) {
    const { id: userId, companyId } = req.user;
    const data = await this.turnoverService.saveSectorDistribution(companyId, userId, body.year, body.month, body.distributions);
    return { success: true, data };
  }

  @Get('reasons')
  async getReasons(@Request() req) {
    const data = await this.turnoverService.getDismissalReasons(req.user.companyId);
    return { success: true, data };
  }

  @Post('reasons')
  async createReason(@Request() req, @Body() body: { name: string; description?: string }) {
    const data = await this.turnoverService.createDismissalReason(req.user.companyId, req.user.id, body.name, body.description);
    return { success: true, data };
  }

  @Put('reasons/:id')
  async updateReason(@Param('id') id: string, @Body() body: { name: string; description?: string }) {
    const data = await this.turnoverService.updateDismissalReason(id, body.name, body.description);
    return { success: true, data };
  }

  @Delete('reasons/:id')
  async deleteReason(@Param('id') id: string) {
    await this.turnoverService.deleteDismissalReason(id);
    return { success: true };
  }

  @Get('positions')
  async getPositions(@Request() req) {
    const data = await this.turnoverService.getPositions(req.user.companyId);
    return { success: true, data };
  }

  @Post('positions')
  async createPosition(@Request() req, @Body() body: { name: string; description?: string }) {
    const data = await this.turnoverService.createPosition(req.user.companyId, req.user.id, body.name, body.description);
    return { success: true, data };
  }

  @Put('positions/:id')
  async updatePosition(@Param('id') id: string, @Body() body: { name: string; description?: string }) {
    const data = await this.turnoverService.updatePosition(id, body.name, body.description);
    return { success: true, data };
  }

  @Delete('positions/:id')
  async deletePosition(@Param('id') id: string) {
    await this.turnoverService.deletePosition(id);
    return { success: true };
  }

  @Get('resignations')
  async getResignations(@Request() req, @Query('year') year: string, @Query('sectorId') sectorId?: string, @Query('contractType') contractType?: string) {
    const data = await this.turnoverService.getResignations(req.user.companyId, { year, sectorId, contractType });
    return { success: true, data };
  }

  @Post('resignations')
  async createResignation(@Request() req, @Body() body: any) {
    const data = await this.turnoverService.createResignation(req.user.companyId, req.user.id, body);
    return { success: true, data };
  }

  @Put('resignations/:id')
  async updateResignation(@Param('id') id: string, @Body() body: any) {
    const data = await this.turnoverService.updateResignation(id, body);
    return { success: true, data };
  }

  @Delete('resignations/:id')
  async deleteResignation(@Param('id') id: string) {
    await this.turnoverService.deleteResignation(id);
    return { success: true };
  }
}