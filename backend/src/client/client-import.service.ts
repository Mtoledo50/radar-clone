import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * =================================================================
 * 📥 ClientImportService — Importação de carteira (Sprint 23)
 * =================================================================
 * Upsert por nome (case-insensitive): reimportar ATUALIZA em vez
 * de duplicar. Multi-tenant (companyId) + dono (userId).
 * =================================================================
 */
export interface ImportClientItem {
  companyName: string;
  startDate?: string | null;
  endDate?: string | null;
  lastPaymentDate?: string | null;
  installments?: number | null;
  monthlyFee?: number;
  openAmount?: number | null;
  paidAmount?: number | null;
  overdueAmount?: number | null;
}

@Injectable()
export class ClientImportService {
  constructor(private readonly prisma: PrismaService) {}

  async importClients(
    companyId: string,
    userId: string,
    items: ImportClientItem[],
  ) {
    if (!items || items.length === 0) {
      throw new BadRequestException('Nenhum cliente para importar.');
    }

    let created = 0;
    let updated = 0;
    const skipped: { name: string; reason: string }[] = [];

    const toDateTime = (s?: string | null) =>
      s ? new Date(s + 'T12:00:00') : null;

    await this.prisma.$transaction(async (tx) => {
      for (const it of items) {
        const name = (it.companyName || '').trim();
        if (!name) {
          skipped.push({ name: '—', reason: 'Nome vazio.' });
          continue;
        }

        const data = {
          monthlyFee: Number(it.monthlyFee || 0),
          startDate: toDateTime(it.startDate) ?? new Date(),
          endDate: toDateTime(it.endDate),
          lastPaymentDate: toDateTime(it.lastPaymentDate),
          installments: it.installments != null ? Number(it.installments) : null,
          openAmount: it.openAmount != null ? Number(it.openAmount) : null,
          paidAmount: it.paidAmount != null ? Number(it.paidAmount) : null,
          overdueAmount: it.overdueAmount != null ? Number(it.overdueAmount) : null,
        };

        // 🛡️ Anti-duplicidade: busca por nome ignorando maiúsculas
        const existing = await tx.client.findFirst({
          where: {
            companyId,
            deletedAt: null,
            companyName: { equals: name, mode: 'insensitive' },
          },
        });

        if (existing) {
          await tx.client.update({ where: { id: existing.id }, data });
          updated++;
        } else {
          await tx.client.create({
            data: {
              ...data,
              companyName: name,
              companyId,
              userId,
              serviceType: 'CONTABIL',
              status: 'ATIVO',
            },
          });
          created++;
        }
      }
    });

    return { created, updated, skipped };
  }
}