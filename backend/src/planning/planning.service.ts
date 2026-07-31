import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlanningDto } from './dto/create-planning.dto';

@Injectable()
export class PlanningService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.planning.findMany({
      where: { userId },
      orderBy: { targetDate: 'asc' }, // Ordena por data do objetivo
    });
  }

  async create(userId: string, dto: CreatePlanningDto) {
    return this.prisma.planning.create({
      data: {
        userId,
        ...dto,
        targetDate: new Date(dto.targetDate),
        status: dto.status || 'PENDENTE',
        progress: dto.progress !== undefined ? dto.progress : 0,
      },
    });
  }

  async update(userId: string, planningId: string, dto: CreatePlanningDto) {
    return this.prisma.planning.update({
      where: { id: planningId, userId },
      data: {
        ...dto,
        targetDate: new Date(dto.targetDate),
        progress: dto.progress !== undefined ? dto.progress : undefined,
      },
    });
  }

  async remove(userId: string, planningId: string) {
    return this.prisma.planning.delete({
      where: { id: planningId, userId },
    });
  }

  /**
   * Calcula métricas do planejamento
   */
  async getMetrics(userId: string) {
    const totalPlans = await this.prisma.planning.count({
      where: { userId },
    });

    const completedPlans = await this.prisma.planning.count({
      where: { userId, status: 'CONCLUIDO' },
    });

    const avgProgress = await this.prisma.planning.aggregate({
      where: { userId },
      _avg: { progress: true },
    });

    return {
      totalPlans,
      completedPlans,
      averageProgress: parseFloat((avgProgress._avg.progress || 0).toFixed(1)),
    };
  }
}