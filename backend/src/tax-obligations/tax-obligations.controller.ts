import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { TaxObligationsService } from './tax-obligations.service';
import { CreateTaxObligationDto } from './dto/create-tax-obligation.dto';
import { UpdateTaxObligationDto } from './dto/update-tax-obligation.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('tax-obligations')
@UseGuards(JwtAuthGuard)
export class TaxObligationsController {
  constructor(private readonly service: TaxObligationsService) {}

  @Post()
  create(@Body() createDto: CreateTaxObligationDto, @Request() req) {
    return this.service.create(createDto, req.user.companyId);
  }

  @Get()
  findAll(@Query() filters: any, @Request() req) {
    return this.service.findAll(req.user.companyId, filters);
  }

  @Get('metrics')
  getMetrics(@Request() req) {
    return this.service.getDashboardMetrics(req.user.companyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.service.findOne(id, req.user.companyId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateTaxObligationDto, @Request() req) {
    return this.service.update(id, req.user.companyId, updateDto);
  }

  @Patch(':id/pagar')
  markAsPaid(@Param('id') id: string, @Request() req) {
    return this.service.markAsPaid(id, req.user.companyId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.service.remove(id, req.user.companyId);
  }
}