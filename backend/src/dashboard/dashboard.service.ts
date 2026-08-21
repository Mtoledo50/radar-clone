// =================================================================
// INÍCIO: backend/src/dashboard/dashboard.service.ts
// =================================================================
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getMetrics(companyId: string) {
    // 1. Clientes: usa 'ATIVO' (padrão do model Client no nosso schema)
    const activeClients = await this.prisma.client.count({
      where: { companyId, status: 'ATIVO' },
    });

    const totalClients = await this.prisma.client.count({
      where: { companyId },
    });

    // 2. Colaboradores: usa 'ACTIVE' (padrão do enum EmployeeStatus)
    const totalEmployees = await this.prisma.employee.count({
      where: { companyId, status: 'ACTIVE' },
    });

    // Admissões este mês
    const admissionsThisMonth = await this.prisma.employee.count({
      where: {
        companyId,
        status: 'ACTIVE',
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    });

    return {
      activeClients,
      totalClients,
      totalEmployees,
      admissionsThisMonth,
    };
  }
}
// =================================================================
// FIM: backend/src/dashboard/dashboard.service.ts
// =================================================================