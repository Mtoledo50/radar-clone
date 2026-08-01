import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PricingService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string) {
    return this.prisma.pricing.findMany({ where: { companyId }, orderBy: { createdAt: 'desc' } });
  }

  async create(companyId: string, userId: string, data: any) {
    return this.prisma.pricing.create({
      data: {
        ...data,
        companyId,
        userId,
        estimatedHours: parseFloat(data.estimatedHours),
        hourlyRate: parseFloat(data.hourlyRate),
        softwareCost: parseFloat(data.softwareCost) || 0,
        profitMargin: parseFloat(data.profitMargin) || 20,
        finalValue: parseFloat(data.finalValue),
      },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.pricing.update({
      where: { id },
      data: {
        ...data,
        estimatedHours: data.estimatedHours ? parseFloat(data.estimatedHours) : undefined,
        hourlyRate: data.hourlyRate ? parseFloat(data.hourlyRate) : undefined,
        softwareCost: data.softwareCost ? parseFloat(data.softwareCost) : undefined,
        profitMargin: data.profitMargin ? parseFloat(data.profitMargin) : undefined,
        finalValue: data.finalValue ? parseFloat(data.finalValue) : undefined,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.pricing.delete({ where: { id } });
  }
}