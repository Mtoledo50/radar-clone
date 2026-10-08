import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaxObligationDto } from './dto/create-tax-obligation.dto';
import { UpdateTaxObligationDto } from './dto/update-tax-obligation.dto';
import { ObligationStatus } from '@prisma/client';

@Injectable()
export class TaxObligationsService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateTaxObligationDto, companyId: string) {
    if (!/^\d{2}\/\d{4}$/.test(createDto.competence)) {
      throw new BadRequestException('O formato da competência deve ser MM/AAAA (ex: 10/2026)');
    }

    return this.prisma.taxObligation.create({
      data: {
        ...createDto,
        companyId,
        dueDate: new Date(createDto.dueDate),
        status: createDto.status || ObligationStatus.PENDENTE,
      },
    });
  }

  async findAll(companyId: string, filters?: { clientId?: string; status?: string; competence?: string }) {
    const where: any = { companyId };
    if (filters?.clientId) where.clientId = filters.clientId;
    if (filters?.status) where.status = filters.status;
    if (filters?.competence) where.competence = filters.competence;

    return this.prisma.taxObligation.findMany({
      where,
      orderBy: { dueDate: 'asc' },
    });
  }

  async findOne(id: string, companyId: string) {
    const obligation = await this.prisma.taxObligation.findFirst({ where: { id, companyId } });
    if (!obligation) throw new NotFoundException('Obrigação não encontrada');
    return obligation;
  }

  async update(id: string, companyId: string, updateDto: UpdateTaxObligationDto) {
    await this.findOne(id, companyId);
    const dataToUpdate: any = { ...updateDto };
    if (updateDto.dueDate) dataToUpdate.dueDate = new Date(updateDto.dueDate);

    return this.prisma.taxObligation.update({ where: { id }, data: dataToUpdate });
  }

  async markAsPaid(id: string, companyId: string) {
    await this.findOne(id, companyId);
    return this.prisma.taxObligation.update({
      where: { id },
      data: { status: ObligationStatus.PAGO },
    });
  }

  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);
    return this.prisma.taxObligation.delete({ where: { id } });
  }

  async getDashboardMetrics(companyId: string) {
    const [pendente, atrasado, pago] = await Promise.all([
      this.prisma.taxObligation.aggregate({ where: { companyId, status: 'PENDENTE' }, _sum: { amount: true }, _count: { id: true } }),
      this.prisma.taxObligation.aggregate({ where: { companyId, status: 'ATRASADO' }, _sum: { amount: true }, _count: { id: true } }),
      this.prisma.taxObligation.aggregate({ where: { companyId, status: 'PAGO' }, _sum: { amount: true } }),
    ]);

    return {
      pendente: { count: pendente._count.id || 0, total: Number(pendente._sum.amount || 0) },
      atrasado: { count: atrasado._count.id || 0, total: Number(atrasado._sum.amount || 0) },
      pago: { total: Number(pago._sum.amount || 0) },
    };
  }
}