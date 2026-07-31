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
import { CreatePricingDto } from './dto/create-pricing.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('pricings')
@UseGuards(JwtAuthGuard)
export class PricingController {
  constructor(private pricingService: PricingService) {}

  @Get()
  async findAll(@Request() req) {
    const pricings = await this.pricingService.findAll(req.user.id);
    return { data: pricings };
  }

  @Get('metrics')
  async getMetrics(@Request() req) {
    const metrics = await this.pricingService.getMetrics(req.user.id);
    return { data: metrics };
  }

  @Post()
  async create(@Request() req, @Body() dto: CreatePricingDto) {
    const pricing = await this.pricingService.create(req.user.id, dto);
    return { message: 'Precificação criada com sucesso!', data: pricing };
  }

  @Put(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: CreatePricingDto,
  ) {
    const pricing = await this.pricingService.update(req.user.id, id, dto);
    return { message: 'Precificação atualizada!', data: pricing };
  }

  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    await this.pricingService.remove(req.user.id, id);
    return { message: 'Precificação removida!' };
  }
}