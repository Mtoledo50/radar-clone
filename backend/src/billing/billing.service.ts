// =================================================================
// INÍCIO: backend/src/billing/billing.service.ts
// =================================================================
/**
 * 💰 BillingService — FD-5 (régua de cobrança + CNAB 240)
 * Régua: PENDENTE → GERADA (remessa) → ENVIADA → PAGA.
 * VENCIDA é derivada na leitura (dueDate < hoje && !PAGA/ENVIADA).
 * 🧠 ADR-061: v1 com entradas explícitas; integração Client = v2.
 */
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { generateCnab240 } from './domain/cnab240';

@Injectable()
export class BillingService {
  constructor(private prisma: PrismaService) {}

  /** Lista com status efetivo (deriva VENCIDA). */
  async list(companyId: string) {
    const items = await this.prisma.billingInstruction.findMany({
      where: { companyId },
      orderBy: { dueDate: 'asc' },
    });
    const today = new Date();
    return items.map((i) => ({
      ...i,
      effectiveStatus:
        i.status === 'PENDENTE' && i.dueDate < today ? 'VENCIDA' : i.status,
    }));
  }

  /** Cria cobrança com nosso número sequencial. */
  async create(
    companyId: string,
    dto: { clientName: string; document?: string; amount: number; dueDate: string },
  ) {
    if (!dto.clientName?.trim()) throw new BadRequestException('Cliente obrigatório');
    if (!dto.amount || dto.amount <= 0) throw new BadRequestException('Valor inválido');
    if (!dto.dueDate) throw new BadRequestException('Vencimento obrigatório');

    const count = await this.prisma.billingInstruction.count({ where: { companyId } });
    return this.prisma.billingInstruction.create({
      data: {
        companyId,
        clientName: dto.clientName.trim(),
        document: dto.document?.trim() || null,
        amount: dto.amount,
        dueDate: new Date(dto.dueDate),
        ourNumber: String(count + 1).padStart(11, '0'),
      },
    });
  }

  async remove(companyId: string, id: string) {
    const item = await this.prisma.billingInstruction.findFirst({ where: { id, companyId } });
    if (!item) throw new BadRequestException('Cobrança não encontrada');
    if (item.status !== 'PENDENTE') {
      throw new BadRequestException('Só cobranças PENDENTES podem ser excluídas');
    }
    return this.prisma.billingInstruction.delete({ where: { id } });
  }

  /** Transição de status da régua (ENVIADA/PAGA). */
  async setStatus(companyId: string, id: string, status: 'ENVIADA' | 'PAGA') {
    const item = await this.prisma.billingInstruction.findFirst({ where: { id, companyId } });
    if (!item) throw new BadRequestException('Cobrança não encontrada');
    return this.prisma.billingInstruction.update({ where: { id }, data: { status } });
  }

  /** Gera remessa CNAB das PENDENTES e marca GERADA. */
  async generateCnab(companyId: string) {
    const pend = await this.prisma.billingInstruction.findMany({
      where: { companyId, status: 'PENDENTE' },
      orderBy: { dueDate: 'asc' },
    });
    if (pend.length === 0) {
      throw new BadRequestException('Nenhuma cobrança PENDENTE p/ gerar remessa');
    }
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { name: true, cnpj: true },
    });
    const txt = generateCnab240(
      company?.name || 'ESCRITORIO',
      company?.cnpj || '',
      pend.map((p) => ({
        clientName: p.clientName,
        document: p.document,
        amount: Number(p.amount),
        dueDate: p.dueDate,
        ourNumber: p.ourNumber,
      })),
    );
    await this.prisma.billingInstruction.updateMany({
      where: { id: { in: pend.map((p) => p.id) } },
      data: { status: 'GERADA' },
    });
    return { txt, count: pend.length };
  }
}
// =================================================================
// FIM: backend/src/billing/billing.service.ts
// =================================================================