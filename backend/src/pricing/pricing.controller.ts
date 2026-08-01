import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PricingService } from './pricing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('pricing')
@UseGuards(JwtAuthGuard)
export class PricingController {
  constructor(private pricingService: PricingService) {}

  @Get()
  async findAll(@Request() req) {
    const pricings = await this.pricingService.findAll(req.user.companyId);
    return { data: pricings };
  }

  @Post()
  async create(@Request() req, @Body() dto: any) {
    const pricing = await this.pricingService.create(req.user.companyId, req.user.id, dto);
    return { message: 'Precificação criada com sucesso!', data: pricing };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: any) {
    const pricing = await this.pricingService.update(id, dto);
    return { message: 'Precificação atualizada!', data: pricing };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.pricingService.delete(id);
    return { message: 'Precificação removida!' };
  }
}