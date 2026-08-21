// =================================================================
// INÍCIO: backend/src/legal/legal.service.ts
// =================================================================
/**
 * ⚖️ LegalService — FD-8 (Legalização) + FD-6 (Certificado A1)
 * Cofre AES-256-GCM + obrigações legais + EFD-Contribuições v1.
 * 🧠 ADR-059: segredo nunca volta em listagens (só hasSecret);
 *    reveal é ADMIN + auditável. ADR-060: EFD v1 sem filtro de
 *    período (tudo importado; filtro por competência = v2).
 */
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { encryptSecret, decryptSecret } from '../common/crypto/vault';

@Injectable()
export class LegalService {
  constructor(private prisma: PrismaService) {}

  // =================================================================
  // 🔐 COFRE (FD-8)
  // =================================================================
  /** Lista SEM o segredo (só metadados + dias p/ vencer). */
  async listVault(companyId: string) {
    const items = await this.prisma.secretVaultItem.findMany({
      where: { companyId },
      orderBy: [{ category: 'asc' }, { label: 'asc' }],
    });
    const today = new Date();
    return items.map((i) => ({
      id: i.id,
      label: i.label,
      category: i.category,
      url: i.url,
      hasSecret: Boolean(i.encryptedSecret),
      expiresAt: i.expiresAt,
      daysToExpire: i.expiresAt
        ? Math.ceil((i.expiresAt.getTime() - today.getTime()) / 86400000)
        : null,
    }));
  }

  /** Cria item de cofre (senha/procuração/eCAC). */
  async createVaultItem(
    companyId: string,
    dto: { label: string; category: string; secret?: string; url?: string; expiresAt?: string },
  ) {
    if (!dto.label?.trim()) throw new BadRequestException('Label obrigatório');
    return this.prisma.secretVaultItem.create({
      data: {
        companyId,
        label: dto.label.trim(),
        category: dto.category || 'PASSWORD',
        encryptedSecret: dto.secret ? encryptSecret(dto.secret) : null,
        url: dto.url || null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
      select: { id: true, label: true, category: true },
    });
  }

  /** 🆕 FD-6: upload do certificado A1 (.pfx + senha) cifrado. */
  async uploadCertificate(
    companyId: string,
    dto: { label: string; pfxBase64: string; password: string; expiresAt?: string },
  ) {
    if (!dto.pfxBase64 || !dto.password) {
      throw new BadRequestException('Arquivo .pfx e senha são obrigatórios');
    }
    return this.prisma.secretVaultItem.create({
      data: {
        companyId,
        label: dto.label?.trim() || 'Certificado A1',
        category: 'CERT_A1',
        encryptedSecret: encryptSecret(
          JSON.stringify({ pfxBase64: dto.pfxBase64, password: dto.password }),
        ),
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
      select: { id: true, label: true, category: true, expiresAt: true },
    });
  }

  /** 🔓 Reveal (ADMIN): decifra sob demanda. Auditoria no controller. */
  async reveal(companyId: string, id: string) {
    const item = await this.prisma.secretVaultItem.findFirst({ where: { id, companyId } });
    if (!item) throw new BadRequestException('Item não encontrado');
    if (!item.encryptedSecret) throw new BadRequestException('Item sem segredo');
    return { label: item.label, category: item.category, secret: decryptSecret(item.encryptedSecret) };
  }

  async deleteVaultItem(companyId: string, id: string) {
    const item = await this.prisma.secretVaultItem.findFirst({ where: { id, companyId } });
    if (!item) throw new BadRequestException('Item não encontrado');
    return this.prisma.secretVaultItem.delete({ where: { id } });
  }

  // =================================================================
  // 📅 OBRIGAÇÕES LEGAIS (FD-8)
  // =================================================================
  async listDeadlines(companyId: string) {
    const items = await this.prisma.legalDeadline.findMany({
      where: { companyId },
      orderBy: { dueDate: 'asc' },
    });
    const today = new Date();
    return items.map((d) => ({
      ...d,
      daysLeft: Math.ceil((d.dueDate.getTime() - today.getTime()) / 86400000),
    }));
  }

  async createDeadline(companyId: string, dto: { title: string; dueDate: string }) {
    if (!dto.title?.trim() || !dto.dueDate) throw new BadRequestException('Título e data obrigatórios');
    return this.prisma.legalDeadline.create({
      data: { companyId, title: dto.title.trim(), dueDate: new Date(dto.dueDate) },
    });
  }

  async toggleDeadline(companyId: string, id: string) {
    const d = await this.prisma.legalDeadline.findFirst({ where: { id, companyId } });
    if (!d) throw new BadRequestException('Obrigação não encontrada');
    return this.prisma.legalDeadline.update({
      where: { id },
      data: { status: d.status === 'ABERTO' ? 'CONCLUIDO' : 'ABERTO' },
    });
  }

  async deleteDeadline(companyId: string, id: string) {
    const d = await this.prisma.legalDeadline.findFirst({ where: { id, companyId } });
    if (!d) throw new BadRequestException('Obrigação não encontrada');
    return this.prisma.legalDeadline.delete({ where: { id } });
  }

  // =================================================================
  // 📄 EFD-CONTRIBUIÇÕES v1 (FD-6 — ADR-060)
  // =================================================================
  /**
   * Gera txt da EFD-Contribuições a partir das bases PIS/COFINS
   * capturadas na auditoria F6 (pisBase/pisRate/cofinsBase/cofinsRate).
   * v1: período = tudo importado (sem filtro de competência).
   */
  async generateEfdContribuicoes(companyId: string): Promise<string> {
    const items = await this.prisma.fiscalInvoiceItem.findMany({
      where: { invoice: { companyId } },
      select: { pisBase: true, pisRate: true, cofinsBase: true, cofinsRate: true },
    });
    if (items.length === 0) throw new BadRequestException('Nenhuma NF-e com bases PIS/COFINS importada');

    // Consolida bases × alíquotas reais do XML (F6)
    let pisBase = 0, pisVal = 0, cofinsBase = 0, cofinsVal = 0;
    for (const i of items as any[]) {
      const pb = Number(i.pisBase) || 0;
      const pr = Number(i.pisRate) || 0;
      const cb = Number(i.cofinsBase) || 0;
      const cr = Number(i.cofinsRate) || 0;
      pisBase += pb; pisVal += (pb * pr) / 100;
      cofinsBase += cb; cofinsVal += (cb * cr) / 100;
    }
    const r2 = (v: number) => v.toFixed(2).replace('.', ',');
    const now = new Date();
    const dt = `${now.getDate().toString().padStart(2, '0')}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getFullYear()}`;

    // Layout simplificado v1: 0000 + M200 (PIS) + M600 (COFINS) + 9990/9999
    const lines = [
      `|0000|006|0|${dt}|${dt}|CONTA CERTA|01|`,
      `|M200|01|1|${r2(pisVal)}|${r2(pisBase)}|`,
      `|M600|01|1|${r2(cofinsVal)}|${r2(cofinsBase)}|`,
      `|9990|04|`,
      `|9999|`,
    ];
    return lines.join('\r\n');
  }
}
// =================================================================
// FIM: backend/src/legal/legal.service.ts
// =================================================================