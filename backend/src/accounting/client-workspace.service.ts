import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * 🏢 ADR-104 — Serviços da Ficha do Cliente (Setores)
 * Delegate defensivo: se a tabela ClientServiceActivation não existir
 * no Prisma Client, os métodos degradam graciosamente.
 */
@Injectable()
export class ClientWorkspaceService {
  constructor(private readonly prisma: PrismaService) {}

  async getWorkspace(companyId: string, clientId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, companyId },
    });
    if (!client) return { client: null, activeServices: [] };

    const delegate = (this.prisma as any).clientServiceActivation;
    const acts = delegate
      ? await delegate.findMany({ where: { companyId, clientId } })
      : [];
    return { client, activeServices: acts.map((a: any) => a.serviceCode) };
  }

  async toggleService(
    companyId: string,
    clientId: string,
    serviceCode: string,
    active: boolean,
    userId?: string,
  ) {
    const delegate = (this.prisma as any).clientServiceActivation;
    if (!delegate) return { success: false, message: 'Tabela de ativações indisponível.' };

    if (active) {
      await delegate.upsert({
        where: {
          companyId_clientId_serviceCode: { companyId, clientId, serviceCode },
        },
        update: {},
        create: { companyId, clientId, serviceCode, activatedBy: userId },
      });
    } else {
      await delegate.deleteMany({ where: { companyId, clientId, serviceCode } });
    }
    return { success: true };
  }
}