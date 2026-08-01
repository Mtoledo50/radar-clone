import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClientService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string) {
    return this.prisma.client.findMany({ where: { companyId }, orderBy: { companyName: 'asc' } });
  }

  async create(companyId: string, userId: string, data: any) {
    return this.prisma.client.create({
      data: {
        ...data,
        companyId,
        userId,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.client.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.client.delete({ where: { id } });
  }
}