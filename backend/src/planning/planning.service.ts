import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlanningService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string) {
    return this.prisma.planning.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMetrics(companyId: string) {
    const plans = await this.prisma.planning.findMany({
      where: { companyId },
      select: { progress: true, status: true },
    });

    const totalPlans = plans.length;
    const completedPlans = plans.filter((p) => p.status === 'CONCLUIDO').length;
    const averageProgress =
      totalPlans > 0 ? plans.reduce((acc, curr) => acc + curr.progress, 0) / totalPlans : 0;

    return {
      totalPlans,
      completedPlans,
      averageProgress: Number(averageProgress.toFixed(1)),
    };
  }

  async create(companyId: string, userId: string, data: any) {
    return this.prisma.planning.create({
      data: {
        companyId,
        userId,
        title: data.title,
        description: data.description || '',
        category: data.category,
        targetDate: new Date(data.targetDate),
        status: data.status,
        progress: parseFloat(data.progress) || 0,
      },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.planning.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description || '',
        category: data.category,
        targetDate: new Date(data.targetDate),
        status: data.status,
        progress: parseFloat(data.progress) || 0,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.planning.delete({
      where: { id },
    });
  }
}