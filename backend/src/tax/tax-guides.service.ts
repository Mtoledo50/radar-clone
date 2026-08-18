// =================================================================
// INÍCIO: backend/src/tax/tax-guides.service.ts
// =================================================================
// TaxGuidesService — calcula guias de imposto (ISS + DAS) por cliente/período
//
// Fluxo (FD-4):
//   1) Lista clientes ativos com NFS-e no período
//   2) Para cada cliente:
//      - ISS: soma NFS-e EMITIDAs (calcIss do domínio puro)
//      - DAS: usa RBT12 (receita últimos 12m) + receita do mês
//   3) Upsert TaxGuide com memória de cálculo completa (ADR-038)
//   4) Warnings → fila REVIEW (Regra de Ouro: LEGAL nunca AUTO)
//
// RBT12: por ora usa soma das NFS-e dos últimos 12 meses do cliente.
//         Futuro: vir do histórico fiscal real (FD-7).
// =================================================================
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AutomationAuditService } from '../digital-employee/audit/automation-audit.service';
import { calcIss, NfseIssInput } from './domain/iss';
import { calcDasSimples } from './domain/simples-nacional';

export interface TaxGuideRunResult {
  processed: number;
  created: number;
  updated: number;
  warnings: number;
}

@Injectable()
export class TaxGuidesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AutomationAuditService,
  ) {}

  /**
   * Calcula guias para TODOS os clientes com NFS-e no período.
   * Usado pelo botão "Calcular guias do mês" e pela skill agendada.
   */
  async calcForPeriod(
    companyId: string,
    period: string, // "YYYY-MM"
    runId?: string,
  ): Promise<TaxGuideRunResult> {
    // 1) Coleta NFS-e EMITIDAs do período, agrupadas por cliente
    const nfses = await this.prisma.fiscalServiceInvoice.findMany({
      where: {
        companyId,
        direction: 'EMITIDA',
        status: { in: ['IMPORTED', 'ACCOUNTED'] }, // REVIEW/REJECTED ficam fora
        emissionDate: {
          gte: new Date(`${period}-01T00:00:00Z`),
          lt: this.nextMonthStart(period),
        },
      },
      include: { client: { select: { id: true, companyName: true } } },
    });

    // Agrupa por cliente
    const byClient = new Map<string, typeof nfses>();
    for (const n of nfses) {
      if (!n.clientId) continue; // órfão — já está na fila REVIEW da NFSeImportSkill
      if (!byClient.has(n.clientId)) byClient.set(n.clientId, []);
      byClient.get(n.clientId)!.push(n);
    }

    let created = 0, updated = 0, warnings = 0;

    for (const [clientId, clientNfses] of byClient.entries()) {
      try {
        const r = await this.calcForClient(
          companyId,
          clientId,
          period,
          clientNfses,
          runId,
        );
        if (r.isNew) created++; else updated++;
        if (r.hasWarnings) warnings++;
      } catch (e: any) {
        // Falha isolada não aborta o lote (Pilar B)
        await this.audit.log({
          companyId,
          actor: 'AURORA',
          action: 'TAX_GUIDE_FAILED',
          entity: 'TaxGuide',
          entityId: `${clientId}:${period}`,
          detail: { error: e?.message },
        });
      }
    }

    return {
      processed: byClient.size,
      created,
      updated,
      warnings,
    };
  }

  /**
   * Calcula ISS + DAS para UM cliente/período.
   * Retorna se criou novo (isNew) e se tem warnings (hasWarnings).
   */
  async calcForClient(
    companyId: string,
    clientId: string,
    period: string,
    nfsesRaw?: any[],
    runId?: string,
  ): Promise<{ isNew: boolean; hasWarnings: boolean }> {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, companyId },
    });
    if (!client) throw new Error(`Cliente ${clientId} não encontrado no tenant`);

    // NFS-e do período (se não vierem, busca)
    const nfses =
      nfsesRaw ??
      (await this.prisma.fiscalServiceInvoice.findMany({
        where: {
          companyId,
          clientId,
          direction: 'EMITIDA',
          status: { in: ['IMPORTED', 'ACCOUNTED'] },
          emissionDate: {
            gte: new Date(`${period}-01T00:00:00Z`),
            lt: this.nextMonthStart(period),
          },
        },
      }));

    if (nfses.length === 0) {
      // Sem movimento → não gera guia (não é erro)
      return { isNew: false, hasWarnings: false };
    }

    // ── ISS ─────────────────────────────────────────────────────
    const issInputs: NfseIssInput[] = nfses.map((n) => ({
      id: n.id,
      number: n.number,
      issBase: Number(n.issBase),
      issRate: Number(n.issRate),
      issRetained: n.issRetained,
    }));
    const iss = calcIss(issInputs);

    // ── RBT12 (soma dos últimos 12 meses, simplificado) ────────
    const twelveMonthsAgo = new Date(`${period}-01T00:00:00Z`);
    twelveMonthsAgo.setUTCMonth(twelveMonthsAgo.getUTCMonth() - 11);
    const rbt12Rows = await this.prisma.fiscalServiceInvoice.findMany({
      where: {
        companyId,
        clientId,
        direction: 'EMITIDA',
        status: { in: ['IMPORTED', 'ACCOUNTED'] },
        emissionDate: { gte: twelveMonthsAgo, lt: this.nextMonthStart(period) },
      },
      select: { serviceValue: true },
    });
    const rbt12 = rbt12Rows.reduce(
      (acc, r) => acc + Number(r.serviceValue),
      0,
    );

    // Receita do mês
    const revenueMonth = nfses.reduce(
      (acc, n) => acc + Number(n.serviceValue),
      0,
    );

    // ── DAS (Simples Nacional — regime default por ora) ─────────
    // TODO FD-7: ler regime real do cliente (SIMPLES/PRESUMIDO/REAL)
    let das: any = null;
    let dasError: string | null = null;
    try {
      das = calcDasSimples(revenueMonth, rbt12);
    } catch (e: any) {
      dasError = e?.message;
    }

    // ── Upsert ISS ──────────────────────────────────────────────
    const issGuide = await this.prisma.taxGuide.upsert({
      where: {
        companyId_clientId_period_type: {
          companyId,
          clientId,
          period,
          type: 'ISS',
        },
      },
      update: {
        value: iss.issPayable,
        dueDate: this.dueDateFor(period, 'ISS'),
        status: iss.warnings.length > 0 ? 'DRAFT' : 'DRAFT', // sempre DRAFT até humano conferir
        memory: {
          type: 'ISS',
          period,
          steps: iss.steps,
          sources: iss.sources,
          warnings: iss.warnings,
          lawRef: iss.lawRef,
          baseTotal: iss.baseTotal,
          issPayable: iss.issPayable,
          issRetainedTotal: iss.issRetainedTotal,
          count: iss.count,
          generatedAt: new Date().toISOString(),
        },
        runId,
      },
      create: {
        companyId,
        clientId,
        period,
        type: 'ISS',
        value: iss.issPayable,
        dueDate: this.dueDateFor(period, 'ISS'),
        status: 'DRAFT',
        memory: {
          type: 'ISS',
          period,
          steps: iss.steps,
          sources: iss.sources,
          warnings: iss.warnings,
          lawRef: iss.lawRef,
          baseTotal: iss.baseTotal,
          issPayable: iss.issPayable,
          issRetainedTotal: iss.issRetainedTotal,
          count: iss.count,
          generatedAt: new Date().toISOString(),
        },
        runId,
      },
    });

    // ── Upsert DAS (se conseguiu calcular) ─────────────────────
    let dasGuide: any = null;
    if (das) {
      dasGuide = await this.prisma.taxGuide.upsert({
        where: {
          companyId_clientId_period_type: {
            companyId,
            clientId,
            period,
            type: 'DAS',
          },
        },
        update: {
          value: das.dasValue,
          dueDate: this.dueDateFor(period, 'DAS'),
          memory: {
            type: 'DAS',
            period,
            steps: das.steps,
            lawRef: das.lawRef,
            rbt12: das.rbt12,
            bracketIndex: das.bracketIndex,
            nominalRate: das.nominalRate,
            deduction: das.deduction,
            effectiveRate: das.effectiveRate,
            revenueMonth: das.revenueMonth,
            dasValue: das.dasValue,
            generatedAt: new Date().toISOString(),
          },
          runId,
        },
        create: {
          companyId,
          clientId,
          period,
          type: 'DAS',
          value: das.dasValue,
          dueDate: this.dueDateFor(period, 'DAS'),
          memory: {
            type: 'DAS',
            period,
            steps: das.steps,
            lawRef: das.lawRef,
            rbt12: das.rbt12,
            bracketIndex: das.bracketIndex,
            nominalRate: das.nominalRate,
            deduction: das.deduction,
            effectiveRate: das.effectiveRate,
            revenueMonth: das.revenueMonth,
            dasValue: das.dasValue,
            generatedAt: new Date().toISOString(),
          },
          runId,
        },
      });
    }

    // ── Auditoria ───────────────────────────────────────────────
    const hasWarnings = iss.warnings.length > 0 || !!dasError;
    await this.audit.log({
      companyId,
      actor: 'AURORA',
      action: 'TAX_GUIDE_CALC',
      entity: 'TaxGuide',
      entityId: issGuide.id,
      detail: {
        clientId,
        clientName: client.companyName,
        period,
        iss: { value: iss.issPayable, warnings: iss.warnings.length },
        das: das
          ? { value: das.dasValue, effectiveRate: das.effectiveRate }
          : { error: dasError },
      },
    });

    return { isNew: true, hasWarnings };
  }

  // ── Helpers ───────────────────────────────────────────────────

  private nextMonthStart(period: string): Date {
    const [y, m] = period.split('-').map(Number);
    return new Date(Date.UTC(y, m, 1)); // mês seguinte dia 1
  }

  /**
   * Vencimento padrão:
   *   ISS → dia 10 do mês seguinte
   *   DAS → dia 20 do mês seguinte
   */
    private dueDateFor(period: string, type: 'ISS' | 'DAS'): Date {
    const [y, m] = period.split('-').map(Number);
    const day = type === 'ISS' ? 10 : 20;
    // 12:00 UTC: impede o fuso local de puxar o dia p/ trás
    return new Date(Date.UTC(y, m, day, 12));
  }

  /** Lista guias do tenant com filtros (para a UI) */
  async list(
    companyId: string,
    period?: string,
    type?: string,
    status?: string,
  ) {
    const where: any = { companyId };
    if (period) where.period = period;
    if (type) where.type = type;
    if (status) where.status = status;
    const items = await this.prisma.taxGuide.findMany({
      where,
      include: { client: { select: { id: true, companyName: true, cnpj: true } } },
      orderBy: [{ period: 'desc' }, { type: 'asc' }],
      take: 200,
    });
    return { value: items, count: items.length };
  }
  // =================================================================
  // 🖨️ PDF DA GUIA (FD-4) — mesmo padrão do MonthlyReport (ADR-035)
  // =================================================================

  /**
   * Gera o PDF profissional de 1 guia (para imprimir/arquivar/enviar).
   * Contém: identificação, valor+vencimento em destaque, resumo,
   * memória de cálculo passo a passo (ADR-038) e rodapé de compliance.
   */
  async generatePdf(companyId: string, guideId: string): Promise<Buffer> {
    const guide = await this.prisma.taxGuide.findFirst({
      where: { id: guideId, companyId },
      include: { client: { select: { companyName: true, cnpj: true } } },
    });
    if (!guide) throw new Error('Guia não encontrada neste tenant');

    // jspdf 2.5.2 + autotable 3.8.2 (pinados — ADR-035)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { jsPDF } = require('jspdf');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const autoTable: any = require('jspdf-autotable').default;

    const doc = new jsPDF();
    const mem: any = guide.memory || {};

    // ── Faixa de cabeçalho (teal #0d9488) ──
    doc.setFillColor(13, 148, 136);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('RADAR CONTA CERTA', 14, 13);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Guia de Imposto ${guide.type} — gerada pela Aurora`, 14, 21);

    // ── Identificação ──
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(guide.client?.companyName || '—', 14, 42);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(
      `CNPJ: ${guide.client?.cnpj || 'não informado'}  |  Período: ${guide.period}  |  Status: ${guide.status}`,
      14,
      49,
    );

    // ── Box de destaque: valor + vencimento ──
    doc.setFillColor(240, 253, 250);
    doc.setDrawColor(13, 148, 136);
    doc.roundedRect(14, 56, 182, 22, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(13, 148, 136);
    doc.text(`Valor a recolher: R$ ${Number(guide.value).toFixed(2)}`, 20, 66);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    const due = guide.dueDate
      ? new Date(guide.dueDate).toLocaleDateString('pt-BR')
      : '—';
    doc.text(`Vencimento: ${due}`, 20, 73);

    // ── Tabela 1: resumo da apuração ──
    autoTable(doc, {
      startY: 86,
      head: [['Resumo', 'Valor']],
      body: [
        ['Tipo da guia', guide.type],
        ['Período de apuração', guide.period],
        ...(mem.baseTotal !== undefined
          ? [['Base de cálculo', `R$ ${Number(mem.baseTotal).toFixed(2)}`]]
          : []),
        ...(mem.effectiveRate !== undefined
          ? [['Alíquota efetiva', `${Number(mem.effectiveRate).toFixed(2)}%`]]
          : []),
        ...(mem.issRate !== undefined && mem.effectiveRate === undefined
          ? [['Alíquota', `${Number(mem.issRate).toFixed(2)}%`]]
          : []),
        ...(mem.issRetainedTotal !== undefined
          ? [
              [
                'ISS retido por tomadores (não gera guia)',
                `R$ ${Number(mem.issRetainedTotal).toFixed(2)}`,
              ],
            ]
          : []),
        ['Valor da guia', `R$ ${Number(guide.value).toFixed(2)}`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [13, 148, 136] },
    });

    // ── Tabela 2: memória de cálculo (passo a passo — ADR-038) ──
    const lastY = (doc as any).lastAutoTable?.finalY ?? 140;
    autoTable(doc, {
      startY: lastY + 8,
      head: [['#', 'Memória de cálculo (passo a passo)']],
      body: (mem.steps || []).map((s: string, i: number) => [String(i + 1), s]),
      theme: 'striped',
      headStyles: { fillColor: [249, 115, 22] },
    });

    // ── Referência legal + fontes ──
    const lastY2 = (doc as any).lastAutoTable?.finalY ?? 200;
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`Referência legal: ${mem.lawRef || '—'}`, 14, lastY2 + 10);
    if (mem.sources?.length) {
      doc.text(
        `Fontes: ${mem.sources.length} NFS-e processadas pela Aurora (FD-3a)`,
        14,
        lastY2 + 16,
      );
    }

    // ── Rodapé de compliance (Regra de Ouro — ADR-030) ──
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Gerado automaticamente pela Aurora em ${new Date().toLocaleString('pt-BR')} | ` +
        'Documento informativo — o recolhimento/transmissão deve ser feito pelo responsável no portal oficial.',
      14,
      285,
    );

    return Buffer.from(doc.output('arraybuffer'));
  }
}
// =================================================================
// FIM: tax-guides.service.ts
// =================================================================