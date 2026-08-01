import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlanningService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string) {
    return this.prisma.planning.findMany({ where: { companyId }, orderBy: { targetDate: 'asc' } });
  }

  async create(companyId: string, userId: string, data: any) {
    return this.prisma.planning.create({
      data: {
        ...data,
        companyId,
        userId,
        targetDate: new Date(data.targetDate),
        progress: parseFloat(data.progress) || 0,
      },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.planning.update({
      where: { id },
      data: {
        ...data,
        targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
        progress: data.progress ? parseFloat(data.progress) : undefined,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.planning.delete({ where: { id } });
  }
}