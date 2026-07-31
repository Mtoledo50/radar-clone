import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';

@Injectable()
export class EmployeeService {
  constructor(private prisma: PrismaService) {}

  /**
   * Lista todos os colaboradores do usuário autenticado
   */
  async findAll(userId: string) {
    return this.prisma.employee.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Cria um novo colaborador
   */
  async create(userId: string, dto: CreateEmployeeDto) {
    return this.prisma.employee.create({
      data: {
        userId,
        ...dto,
        admissionDate: new Date(dto.admissionDate),
        dismissalDate: dto.dismissalDate ? new Date(dto.dismissalDate) : null,
        status: dto.dismissalDate ? 'DISMISSED' : 'ACTIVE',
      },
    });
  }

  /**
   * Atualiza um colaborador existente
   */
  async update(userId: string, employeeId: string, dto: CreateEmployeeDto) {
    return this.prisma.employee.update({
      where: { id: employeeId, userId },
      data: {
        ...dto,
        admissionDate: new Date(dto.admissionDate),
        dismissalDate: dto.dismissalDate ? new Date(dto.dismissalDate) : null,
        status: dto.dismissalDate ? 'DISMISSED' : 'ACTIVE',
      },
    });
  }

  /**
   * Remove um colaborador
   */
  async remove(userId: string, employeeId: string) {
    return this.prisma.employee.delete({
      where: { id: employeeId, userId },
    });
  }

  /**
   * Calcula métricas de turnover para o dashboard
   * Turnover = (Demissões no período / Média de colaboradores) * 100
   */
  async getMetrics(userId: string) {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Total de colaboradores ativos
    const totalActive = await this.prisma.employee.count({
      where: { userId, status: 'ACTIVE' },
    });

    // Total de colaboradores (ativos + demitidos)
    const totalEmployees = await this.prisma.employee.count({
      where: { userId },
    });

    // Admissões no mês atual
    const admissionsThisMonth = await this.prisma.employee.count({
      where: {
        userId,
        admissionDate: { gte: firstDayOfMonth },
      },
    });

    // Demissões no mês atual
    const dismissalsThisMonth = await this.prisma.employee.count({
      where: {
        userId,
        status: 'DISMISSED',
        dismissalDate: { gte: firstDayOfMonth },
      },
    });

    // Taxa de turnover mensal (%)
    const averageEmployees = (totalActive + totalEmployees) / 2;
    const turnoverRate = averageEmployees > 0 
      ? (dismissalsThisMonth / averageEmployees) * 100 
      : 0;

    return {
      totalActive,
      totalEmployees,
      admissionsThisMonth,
      dismissalsThisMonth,
      turnoverRate: parseFloat(turnoverRate.toFixed(2)),
    };
  }
}