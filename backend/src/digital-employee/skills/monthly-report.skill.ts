// =================================================================
// INÍCIO: backend/src/digital-employee/skills/monthly-report.skill.ts
// =================================================================
// MonthlyReportSkill — Relatório mensal em PDF por cliente (FD-2 final)
//
// Pipeline (Pilar B): COLETAR → INTERPRETAR → EXECUTAR → REGISTRAR
//   - COLETAR: clientes ATIVOS + extratos do mês anterior
//   - INTERPRETAR: receitas/despesas/saldo + totais por natureza + top 10
//   - EXECUTAR: PDF profissional (jspdf 2.5 + autotable 3.8)
//   - REGISTRAR: uploads/reports/{companyId}/{periodo}/{clientId}.pdf
//                + upsert MonthlyReport + auditoria
//
// REGRAS:
//   - Relatório é INFORMATIVO (não é ação legal) → auto-aprovação total
//   - Cliente sem movimentação recebe PDF "sem movimentações" (não falha)
//   - Erro em 1 cliente NÃO aborta o lote (resiliência)
//   - Limite de segurança: 100 clientes por execução
// =================================================================
import * as fs from 'fs';
import * as path from 'path';
import { jsPDF } from 'jspdf';
// ✅ jspdf-autotable 3.8 exporta via .default em CommonJS (NestJS)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const autoTable: any = require('jspdf-autotable').default;
import { PrismaService } from '../../prisma/prisma.service';
import { AutomationAuditService } from '../audit/automation-audit.service';
import { BaseSkill, SkillContext, SkillResult } from './base.skill';
import { SkillKey } from '@prisma/client';

/** Limite de segurança por execução */
const MAX_CLIENTS_PER_RUN = 100;

/** Estimativa: 1h de trabalho manual economizada por relatório */
const SECONDS_PER_REPORT = 3600;

export class MonthlyReportSkill extends BaseSkill {
  readonly key: SkillKey = 'MONTHLY_REPORT';
  readonly secondsPerItem = SECONDS_PER_REPORT;

  constructor(prisma: PrismaService, audit: AutomationAuditService) {
    super(prisma, audit);
  }

  // -----------------------------------------------------------------
  // Helpers de formatação (PT-BR)
  // -----------------------------------------------------------------
  private formatBRL(v: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
  }

  private periodLabel(year: number, month: number) {
    return new Date(year, month - 1, 1).toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric',
    });
  }

  // -----------------------------------------------------------------
  // ▶️ EXECUÇÃO PRINCIPAL
  // -----------------------------------------------------------------
  async execute(context: SkillContext): Promise<SkillResult> {
    const { companyId, runId } = context;

    // 1) Período-alvo: mês anterior (ou override via params)
    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const year = context.params?.year ?? target.getFullYear();
    const month = context.params?.month ?? target.getMonth() + 1;
    const period = `${year}-${String(month).padStart(2, '0')}`;

    // 2) COLETAR: clientes ATIVOS do tenant
    const clients = await this.prisma.client.findMany({
      where: { companyId, status: 'ATIVO' },
      orderBy: { companyName: 'asc' },
      take: MAX_CLIENTS_PER_RUN,
    });

    let processed = 0;
    let failed = 0;

    // 3) Gerar 1 PDF por cliente (resiliente: erro não aborta o lote)
    for (const client of clients) {
      try {
        await this.generateForClient(companyId, client, year, month, period, runId);
        processed++;
      } catch (error: any) {
        failed++;
        await this.markFailed(companyId, client.id, period, runId, error?.message);
        await this.logAudit(companyId, 'MONTHLY_REPORT_FAILED', 'MonthlyReport', client.id, {
          period,
          error: error?.message,
        });
      }
    }

    // 4) Auditoria do lote
    await this.logAudit(companyId, 'MONTHLY_REPORT:BATCH', 'MonthlyReport', runId, {
      period,
      total: clients.length,
      processed,
      failed,
    });

    // 5) Métricas (relatório é informativo → tudo conta como auto-aprovado)
    return {
      itemsProcessed: processed,
      itemsAutoApproved: processed,
      itemsPendingHuman: 0,
      itemsFailed: failed,
      secondsSaved: processed * SECONDS_PER_REPORT,
      detail: { period },
    };
  }

  // -----------------------------------------------------------------
  // Gera o PDF de 1 cliente + registra no MonthlyReport
  // -----------------------------------------------------------------
  private async generateForClient(
    companyId: string,
    client: any,
    year: number,
    month: number,
    period: string,
    runId: string,
  ) {
    // 1) COLETAR: extratos do cliente no período + transações
    const statements = await this.prisma.bankStatement.findMany({
      where: { companyId, clientId: client.id, year, month },
      include: { transactions: true },
    });
    const txs = statements.flatMap((s: any) => s.transactions || []);

    // 2) INTERPRETAR: totais + agrupamento por natureza + top 10
    let receitas = 0;
    let despesas = 0;
    const byNature = new Map<string, { total: number; count: number }>();

    for (const t of txs) {
      const v = Number(t.amount);
      if (v >= 0) receitas += v;
      else despesas += -v;

      const key = t.nature || 'NAO_CLASSIFICADO';
      const cur = byNature.get(key) || { total: 0, count: 0 };
      cur.total += v;
      cur.count++;
      byNature.set(key, cur);
    }
    const saldo = receitas - despesas;

    const top = [...txs]
      .sort((a: any, b: any) => Math.abs(Number(b.amount)) - Math.abs(Number(a.amount)))
      .slice(0, 10);

    // 3) EXECUTAR: monta o PDF
    const doc = new jsPDF();

    // ── Faixa de cabeçalho (teal #0d9488) ──
    doc.setFillColor(13, 148, 136);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('RADAR CONTA CERTA', 14, 13);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Relatório Mensal do Cliente - gerado pela Aurora', 14, 21);

    // ── Identificação do cliente ──
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(client.companyName, 14, 42);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`CNPJ: ${client.cnpj || 'não informado'}  |  Serviço: ${client.serviceType}`, 14, 49);
    doc.text(
      `Período: ${this.periodLabel(year, month)}  |  Honorário: ${this.formatBRL(client.monthlyFee)}`,
      14,
      55,
    );

    // ── Tabela 1: resumo financeiro ──
    autoTable(doc, {
      startY: 62,
      head: [['Resumo financeiro', 'Valor']],
      body: [
        ['Receitas no período', this.formatBRL(receitas)],
        ['Despesas no período', this.formatBRL(despesas)],
        ['Saldo do período', this.formatBRL(saldo)],
        ['Total de movimentações', String(txs.length)],
      ],
      theme: 'grid',
      headStyles: { fillColor: [13, 148, 136] },
    });

    // ── Tabela 2: totais por natureza (laranja #f97316) ──
    const lastY2 = (doc as any).lastAutoTable?.finalY ?? 104;
    const natureRows = Array.from(byNature.entries()).map(([nature, v]) => [
      nature,
      String(v.count),
      this.formatBRL(v.total),
    ]);
    autoTable(doc, {
      startY: lastY2 + 6,
      head: [['Natureza', 'Mov.', 'Total']],
      body: natureRows.length ? natureRows : [['Sem movimentações no período', '-', '-']],
      theme: 'striped',
      headStyles: { fillColor: [249, 115, 22] },
    });

    // ── Tabela 3: principais movimentações (cinza #475569) ──
    const lastY3 = (doc as any).lastAutoTable?.finalY ?? 154;
    const topRows = top.map((t: any) => [
      new Date(t.date).toLocaleDateString('pt-BR'),
      String(t.description || '').slice(0, 60),
      this.formatBRL(Number(t.amount)),
    ]);
    autoTable(doc, {
      startY: lastY3 + 6,
      head: [['Data', 'Descrição', 'Valor']],
      body: topRows.length ? topRows : [['Sem movimentações no período', '-', '-']],
      theme: 'striped',
      headStyles: { fillColor: [71, 85, 105] },
    });

    // ── Rodapé (compliance — Regra de Ouro ADR-030) ──
    const finalY = (doc as any).lastAutoTable?.finalY ?? 250;
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Gerado automaticamente pela Aurora em ${new Date().toLocaleString('pt-BR')} | ` +
        'Documento informativo - não substitui obrigações legais (Regra de Ouro, ADR-030).',
      14,
      Math.min(finalY + 12, 285),
    );

    // 4) Salvar o arquivo físico (mkdir -p automático)
    const dir = path.join(process.cwd(), 'uploads', 'reports', companyId, period);
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `${client.id}.pdf`);
    fs.writeFileSync(filePath, Buffer.from(doc.output('arraybuffer')));
    const relPath = `reports/${companyId}/${period}/${client.id}.pdf`;

    // 5) REGISTRAR: upsert no MonthlyReport (1 por cliente/mês/tenant)
    const summary = { receitas, despesas, saldo, txCount: txs.length, natures: byNature.size };
    await this.prisma.monthlyReport.upsert({
      where: { companyId_clientId_period: { companyId, clientId: client.id, period } },
      update: { status: 'READY', pdfPath: relPath, summary, errorMessage: null, runId },
      create: {
        companyId,
        clientId: client.id,
        period,
        status: 'READY',
        pdfPath: relPath,
        summary,
        runId,
      },
    });

    // 6) Auditoria individual (Pilar D)
    await this.logAudit(companyId, 'MONTHLY_REPORT_GENERATED', 'MonthlyReport', client.id, {
      period,
      txCount: txs.length,
    });
  }

  // -----------------------------------------------------------------
  // Marca o relatório como FAILED (não aborta o lote)
  // -----------------------------------------------------------------
  private async markFailed(
    companyId: string,
    clientId: string,
    period: string,
    runId: string,
    message?: string,
  ) {
    try {
      await this.prisma.monthlyReport.upsert({
        where: { companyId_clientId_period: { companyId, clientId, period } },
        update: { status: 'FAILED', errorMessage: message || 'Erro desconhecido', runId },
        create: {
          companyId,
          clientId,
          period,
          status: 'FAILED',
          errorMessage: message || 'Erro desconhecido',
          runId,
        },
      });
    } catch {
      // Se nem o registro de falha funcionar, apenas segue (o run já conta failed++)
    }
  }
}
// =================================================================
// FIM: monthly-report.skill.ts
// =================================================================