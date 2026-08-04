import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClientService {
  constructor(private prisma: PrismaService) {}

  // =================================================================
  // 📋 CRUD BÁSICO
  // =================================================================
  async findAll(companyId: string) {
    return this.prisma.client.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
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
    return this.prisma.client.delete({
      where: { id },
    });
  }

  // =================================================================
  // 📊 DASHBOARD: Métricas Gerais (Churn, MRR, Ticket Médio)
  // =================================================================
  async getDashboard(companyId: string, year: number) {
    // 1. Buscar clientes ativos para MRR e Ticket Médio
    const activeClients = await this.prisma.client.findMany({
      where: { companyId, status: 'ATIVO' },
      select: { monthlyFee: true, startDate: true },
    });

    const totalClients = activeClients.length;
    const monthlyRevenue = activeClients.reduce((acc, client) => acc + (client.monthlyFee || 0), 0);
    const averageTicket = totalClients > 0 ? monthlyRevenue / totalClients : 0;

    // 2. Calcular Churn do Ano
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);
    
    const churnedThisYear = await this.prisma.client.count({
      where: {
        companyId,
        status: 'CHURN', // ou 'INATIVO', dependendo de como você marca no frontend
        endDate: { gte: yearStart, lte: yearEnd },
      },
    });

    const avgClients = totalClients > 0 ? totalClients : 1;
    const churnRate = (churnedThisYear / avgClients) * 100;

    return {
      totalClients,
      monthlyRevenue,
      averageTicket,
      churnRate: Number(churnRate.toFixed(2)),
      churnedThisYear,
    };
  }

  // =================================================================
  // 📅 DADOS MENSAIS: Buscar histórico de um ano
  // =================================================================
  async getMonthlyData(companyId: string, year: number) {
    const data = await this.prisma.clientMonthlyData.findMany({
      where: { companyId, year },
      orderBy: { month: 'asc' },
    });

    // Se não existir dados, retorna array de 12 meses com zeros
    if (data.length === 0) {
      return Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        initialClients: 0,
        newClients: 0,
        churnedClients: 0,
        finalClients: 0,
        newRevenue: 0,
        lostRevenue: 0,
        finalRevenue: 0,
        churnRate: 0,
        accumulatedChurn: 0,
      }));
    }

    return data;
  }

  // =================================================================
  // 💾 DADOS MENSAIS: Salvar ou Atualizar (Upsert)
  // =================================================================
  async upsertMonthlyData(companyId: string, userId: string, year: number, month: number, data: any) {
    const initial = Number(data.initialClients) || 0;
    const newClients = Number(data.newClients) || 0;
    const churned = Number(data.churnedClients) || 0;
    const finalClients = initial + newClients - churned;

    const newRev = Number(data.newRevenue) || 0;
    const lostRev = Number(data.lostRevenue) || 0;
    const finalRevenue = data.finalRevenue !== undefined ? Number(data.finalRevenue) : 0;

    const churnRate = initial > 0 ? (churned / initial) * 100 : 0;
    const accumulatedChurn = churnRate; // Simplificado para o exemplo

    return this.prisma.clientMonthlyData.upsert({
      where: {
        companyId_year_month: { companyId, year, month },
      },
      update: {
        initialClients: initial,
        newClients: newClients,
        churnedClients: churned,
        finalClients: finalClients,
        newRevenue: newRev,
        lostRevenue: lostRev,
        finalRevenue: finalRevenue,
        churnRate: Number(churnRate.toFixed(2)),
        accumulatedChurn: Number(accumulatedChurn.toFixed(2)),
      },
      create: {
        companyId,
        userId,
        year,
        month,
        initialClients: initial,
        newClients: newClients,
        churnedClients: churned,
        finalClients: finalClients,
        newRevenue: newRev,
        lostRevenue: lostRev,
        finalRevenue: finalRevenue,
        churnRate: Number(churnRate.toFixed(2)),
        accumulatedChurn: Number(accumulatedChurn.toFixed(2)),
      },
    });
  }
}