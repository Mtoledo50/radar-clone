import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePricingDto } from './dto/create-pricing.dto';

@Injectable()
export class PricingService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.pricing.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: string, dto: CreatePricingDto) {
    return this.prisma.pricing.create({
      data: {
        userId,
        ...dto,
        softwareCost: dto.softwareCost || 0,
        profitMargin: dto.profitMargin || 20,
        status: dto.status || 'RASCUNHO',
      },
    });
  }

  async update(userId: string, pricingId: string, dto: CreatePricingDto) {
    return this.prisma.pricing.update({
      where: { id: pricingId, userId },
      data: {
        ...dto,
        softwareCost: dto.softwareCost || 0,
        profitMargin: dto.profitMargin || 20,
      },
    });
  }

  async remove(userId: string, pricingId: string) {
    return this.prisma.pricing.delete({
      where: { id: pricingId, userId },
    });
  }

  /**
   * Calcula métricas da precificação
   */
  async getMetrics(userId: string) {
    const totalPricings = await this.prisma.pricing.count({
      where: { userId },
    });

    const avgValue = await this.prisma.pricing.aggregate({
      where: { userId },
      _avg: { finalValue: true },
    });

    return {
      totalPricings,
      averageFinalValue: parseFloat((avgValue._avg.finalValue || 0).toFixed(2)),
    };
  }
}