// =================================================================
// INÍCIO: backend/src/company/score.service.ts
// =================================================================
/**
 * 🏆 ScoreService — Sprint C4
 * Coleta inputs de módulos existentes e roda o domínio office-score.
 * v1: derivações leves inline (dívida consciente documentada).
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { computeOfficeScore, ScoreInputs } from './domain/office-score';
import { CustomIndicatorService } from './custom-indicator.service';
// Reaproveita o domínio puro da B5 (cargos por setor)
import { analyzeSectorPositions } from '../employee/domain/position-benchmark';

// Mini-benchmark de setores (mesmas keywords da B2 — cópia leve p/ score v1)
const SECTOR_KEYWORDS: Array<{ name: string; keywords: string[] }> = [
  { name: 'Fiscal', keywords: ['fiscal', 'tributo', 'sped', 'imposto', 'tribut'] },
  { name: 'Contábil', keywords: ['contab', 'escriturac', 'balancete', 'conciliac', 'contabil'] },
  { name: 'Departamento Pessoal', keywords: ['pessoal', 'dp', 'rh', 'folha', 'dpt'] },
  { name: 'Administrativo/Comercial', keywords: ['admin', 'comercial', 'vendas', 'financeiro', 'diretoria', 'gestao', 'gestão', 'ti', 'tecnologia', 'juridico', 'jurídico'] },
];

const norm = (t: string) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '');

@Injectable()
export class ScoreService {
  constructor(
    private prisma: PrismaService,
    private indicators: CustomIndicatorService, // reusa dashboard C3
  ) {}

  async getScore(companyId: string) {
    const year = new Date().getFullYear();

    // ── MERCADO (C1+C2) ──
    const softwareCoverage = await this.computeSoftwareCoverage(companyId);
    const servicesCoverage = await this.computeServicesCoverage(companyId);

    // ── PESSOAS (B2+B3) ──
    const employees = await this.prisma.employee.findMany({
      where: { companyId, status: 'ACTIVE' },
      select: { department: true, position: true },
    });
    const resignations = await this.prisma.resignation.findMany({
      where: { companyId, dismissalDate: { gte: new Date(year, 0, 1), lte: new Date(year, 11, 31, 23, 59, 59) } },
      select: { admissionDate: true, dismissalDate: true },
    });
    const months = (a: Date, b: Date) => Math.max(0, Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24 * 30.44)));
    const newbie = resignations.filter((r) => months(r.admissionDate, r.dismissalDate) < 12).length;
    const newbieTurnoverRate = resignations.length > 0 ? (newbie / resignations.length) * 100 : 0;

    // setores presentes × benchmark (±5 p.p.)
    const counts: Record<string, number> = {};
    const bySectorPositions: Record<string, Record<string, number>> = {};
    for (const emp of employees) {
      const dept = norm(emp.department || '');
      const sector = SECTOR_KEYWORDS.find((s) => s.keywords.some((k) => dept.includes(norm(k))))?.name || 'Outros';
      counts[sector] = (counts[sector] || 0) + 1;
      if (!bySectorPositions[sector]) bySectorPositions[sector] = {};
      const pos = (emp.position || 'Sem cargo').trim();
      bySectorPositions[sector][pos] = (bySectorPositions[sector][pos] || 0) + 1;
    }
    const totalEmp = employees.length || 1;
    const sectorNames = Object.keys(counts).filter((s) => s !== 'Outros');
    const okSectors = sectorNames.filter((s) => {
      const rec = { Fiscal: 30, 'Contábil': 25, 'Departamento Pessoal': 20, 'Administrativo/Comercial': 15 }[s as keyof typeof rec] || 10;
      const pct = (counts[s] / totalEmp) * 100;
      return Math.abs(pct - rec) <= 5;
    });
    const sectorOkPct = sectorNames.length > 0 ? (okSectors.length / sectorNames.length) * 100 : 0;

    // cargos benchmark (B5) — coverage = preenchido(cap) ÷ recomendado
    let recTotal = 0, filledCapped = 0;
    for (const [sector, positions] of Object.entries(bySectorPositions)) {
      const analysis = analyzeSectorPositions(sector, counts[sector],
        Object.entries(positions).map(([name, count]) => ({ name, count })));
      for (const p of analysis.positions) {
        recTotal += p.recommended;
        filledCapped += Math.min(p.filled, p.recommended);
      }
    }
    const positionCoverage = recTotal > 0 ? (filledCapped / recTotal) * 100 : 0;

    // ── COMERCIAL (A7) ──
    const proposals = await this.prisma.proposal.findMany({
      where: { companyId },
      select: { status: true, closingDetails: true },
    });
    const won = proposals.filter((p) => p.status === 'CLOSED_WON').length;
    const lost = proposals.filter((p) => p.status === 'CLOSED_LOST').length;
    const conversionRate = won + lost > 0 ? (won / (won + lost)) * 100 : null;
    const discounts = proposals
      .map((p) => (p.closingDetails as any)?.discountPercent)
      .filter((d): d is number => typeof d === 'number');
    const avgDiscount = discounts.length > 0 ? discounts.reduce((a, b) => a + b, 0) / discounts.length : null;

    // ── CRESCIMENTO (CompanyProfile) ──
    const admin = await this.prisma.user.findFirst({ where: { companyId, role: 'ADMIN' }, select: { id: true } });
    const profile = admin ? await this.prisma.companyProfile.findUnique({ where: { userId: admin.id } }) : null;
    const clientsGoalPct = profile && profile.clientesAno > 0 ? (profile.clientesHoje / profile.clientesAno) * 100 : profile && profile.clientesHoje > 0 ? 100 : 0;
    const teamGoalPct = profile && profile.funcionariosAno > 0 ? (profile.funcionariosHoje / profile.funcionariosAno) * 100 : profile && profile.funcionariosHoje > 0 ? 100 : 0;

    // ── GESTÃO (C3) ──
    const dash = await this.indicators.getDashboard(companyId);
    const withTarget = dash.filter((d) => d.progressPct !== null);
    const customProgressAvg = withTarget.length > 0
      ? withTarget.reduce((s, d) => s + (d.progressPct || 0), 0) / withTarget.length
      : null;

    const inputs: ScoreInputs = {
      softwareCoverage, servicesCoverage,
      newbieTurnoverRate, sectorOkPct, positionCoverage,
      conversionRate, avgDiscount,
      clientsGoalPct, teamGoalPct, customProgressAvg,
    };

    return computeOfficeScore(inputs);
  }

  // ── Cópias leves das coberturas C1/C2 (dívida consciente v1) ──
  private async computeSoftwareCoverage(companyId: string): Promise<number> {
    const company = await this.prisma.company.findUnique({ where: { id: companyId }, select: { softwareStack: true } });
    const stack = (company?.softwareStack || []).map((e) => e.split(':').slice(1).join(':')).filter((v) => v && v !== 'NÃO_UTILIZADO').map(norm);
    const cats: string[][] = [
      ['sci', 'dominio', 'questor', 'alter', 'prosoft', 'sage', 'totvs'],
      ['dominiodp', 'questordp', 'totvsrmfolha'],
      ['mastersigafiscal', 'taxone', 'dominiofiscal'],
      ['contaazul', 'omie', 'bling', 'quickbooks'],
      ['d4sign', 'docusign', 'clicksign', 'zapsign'],
    ];
    const covered = cats.filter((kws) => stack.some((s) => kws.some((k) => s.includes(k)))).length;
    return (covered / cats.length) * 100;
  }

  private async computeServicesCoverage(companyId: string): Promise<number> {
    const items = await this.prisma.serviceItem.findMany({ where: { companyId, isActive: true }, select: { name: true } });
    const names = items.map((i) => norm(i.name));
    const cats: string[][] = [
      ['bpo', 'financeiro'], ['dashboard', 'bpo'], ['irpf', 'renda'],
      ['abertura', 'empresa'], ['baixa', 'encerramento'], ['mei'],
      ['cnd', 'certidao'], ['parcelamento', 'regulariza'],
      ['consultoria', 'tributaria'], ['revisao', 'simples'],
      ['lgpd', 'compliance'], ['folha', 'departamentopessoal'],
    ];
    const covered = cats.filter((kws) => names.some((n) => kws.some((k) => n.includes(k)))).length;
    return (covered / cats.length) * 100;
  }
}
// =================================================================
// FIM: backend/src/company/score.service.ts
// =================================================================