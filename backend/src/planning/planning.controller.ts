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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('planning')
@UseGuards(JwtAuthGuard)
export class PlanningController {
  constructor(private planningService: PlanningService) {}

  @Get()
  async findAll(@Request() req) {
    const plannings = await this.planningService.findAll(req.user.companyId);
    return { data: plannings };
  }

  @Post()
  async create(@Request() req, @Body() dto: any) {
    const planning = await this.planningService.create(req.user.companyId, req.user.id, dto);
    return { message: 'Planejamento criado com sucesso!', data: planning };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: any) {
    const planning = await this.planningService.update(id, dto);
    return { message: 'Planejamento atualizado!', data: planning };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.planningService.delete(id);
    return { message: 'Planejamento removido!' };
  }
}