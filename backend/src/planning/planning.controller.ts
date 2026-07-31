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
import { PlanningService } from './planning.service';
import { CreatePlanningDto } from './dto/create-planning.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('plannings')
@UseGuards(JwtAuthGuard)
export class PlanningController {
  constructor(private planningService: PlanningService) {}

  @Get()
  async findAll(@Request() req) {
    const plannings = await this.planningService.findAll(req.user.id);
    return { data: plannings };
  }

  @Get('metrics')
  async getMetrics(@Request() req) {
    const metrics = await this.planningService.getMetrics(req.user.id);
    return { data: metrics };
  }

  @Post()
  async create(@Request() req, @Body() dto: CreatePlanningDto) {
    const planning = await this.planningService.create(req.user.id, dto);
    return { message: 'Planejamento criado com sucesso!', data: planning };
  }

  @Put(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: CreatePlanningDto,
  ) {
    const planning = await this.planningService.update(req.user.id, id, dto);
    return { message: 'Planejamento atualizado!', data: planning };
  }

  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    await this.planningService.remove(req.user.id, id);
    return { message: 'Planejamento removido!' };
  }
}