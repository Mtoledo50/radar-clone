// =================================================================
// INÍCIO: backend/src/employee/employee.service.ts
// =================================================================
/**
 * =================================================================
 * EmployeeService — Gestão de Colaboradores (Sprints B1 + B2 + B3)
 * =================================================================
 * Responsabilidades:
 * - CRUD de colaboradores (Employee) com validação robusta de datas
 * - Sprint B1: tipo contratual (CLT/ESTAGIARIO/TERCEIRIZADO/SOCIO)
 * - Sprint B2: distribuição por setor VALIDADA (benchmark ADR-048)
 * - Sprint B3: KPIs de turnover (novatos <12m + críticos 🔑 + tenure)
 *
 * 🧠 ADRs:
 * - ADR-004: Multi-tenant single-database (companyId em todas as queries)
 * - ADR-047: tipo contratual vive no Employee (enum forte)
 * - ADR-048: benchmark contábil ±5 p.p. (Fiscal 30/Contábil 25/DP 20/
 *   Admin 15/Outros 10) com normalização sem acentos (NFD)
 * - ADR-049: flag crítico com cópia histórica (Employee.isCritical +
 *   Resignation.isCritical), espelho do ADR-047
 * =================================================================
 */
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContractType } from '@prisma/client';
// 🆕 Sprint B5: motor de benchmark de cargos (domínio puro — ADR-051)
import { analyzeSectorPositions } from './domain/position-benchmark';


// =================================================================
// 🆕 SPRINT B2 — BENCHMARK CONTÁBIL (ADR-048)
// =================================================================
interface SectorBenchmark {
  name: string;
  recommendedPct: number;
  keywords: string[];
}

const SECTOR_BENCHMARKS: SectorBenchmark[] = [
  {
    name: 'Fiscal',
    recommendedPct: 30,
    keywords: ['fiscal', 'tributo', 'sped', 'imposto', 'tribut'],
  },
  {
    name: 'Contábil',
    recommendedPct: 25,
    keywords: ['contab', 'escriturac', 'balancete', 'conciliac', 'contabil'],
  },
  {
    name: 'Departamento Pessoal',
    recommendedPct: 20,
    keywords: ['pessoal', 'dp', 'rh', 'folha', 'departamento pessoal', 'dpt'],
  },
  {
    name: 'Administrativo/Comercial',
    recommendedPct: 15,
    keywords: [
      'admin', 'comercial', 'vendas', 'financeiro', 'diretoria',
      'gestao', 'gestão', 'ti', 'tecnologia', 'juridico', 'jurídico',
    ],
  },
  // "Outros" = fallback (sem keywords — captura o que não casou)
  { name: 'Outros', recommendedPct: 10, keywords: [] },
];

@Injectable()
export class EmployeeService {
  constructor(private prisma: PrismaService) {}

  // =================================================================
  // 📋 LISTAGEM
  // =================================================================

  /** Lista todos os colaboradores do tenant, ordenados por nome. */
  async findAll(companyId: string) {
    return this.prisma.employee.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
    });
  }

  // =================================================================
  // 📊 MÉTRICAS BÁSICAS
  // =================================================================

  /** KPIs básicos: total, ativos, admissões no mês. */
  async getMetrics(companyId: string) {
    const active = await this.prisma.employee.count({
      where: { companyId, status: 'ACTIVE' },
    });
    const total = await this.prisma.employee.count({ where: { companyId } });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const admissionsThisMonth = await this.prisma.employee.count({
      where: { companyId, admissionDate: { gte: startOfMonth } },
    });

    return {
      totalActive: active,
      totalEmployees: total,
      admissionsThisMonth,
      turnoverRate: 0, // placeholder — turnover real vem de getTurnoverKpis (B3)
    };
  }

  // =================================================================
  // 🆕 SPRINT B3 — KPIs DE TURNOVER (novatos + críticos + tenure)
  // =================================================================

  /**
   * 🎯 getTurnoverKpis — responde às 2 perguntas do diretor:
   *   1. "Estamos perdendo quem acabou de chegar?"  → newbieTurnoverRate
   *   2. "Estamos perdendo quem não podíamos perder?" → criticalDismissals
   *
   * Fórmulas (determinísticas — ADR-031):
   * - newbieTurnoverRate = desligados c/ tenure <12m ÷ total desligados
   *   no ano × 100 (guarda divisão por zero)
   * - avgTenureMonths = média de meses(admissionDate → hoje) dos ATIVOS
   * - criticalDismissals = Resignation.isCritical no ano (ADR-049)
   */
  async getTurnoverKpis(companyId: string, year: number) {
    // 1) Ativos: tenure médio + contagem de críticos 🔑
    const active = await this.prisma.employee.findMany({
      where: { companyId, status: 'ACTIVE' },
      select: { admissionDate: true, isCritical: true },
    });

    const activeCount = active.length;
    const criticalActive = active.filter((e) => e.isCritical).length;
    const now = new Date();
    const avgTenureMonths =
      activeCount > 0
        ? active.reduce((sum, e) => sum + this.monthsBetween(e.admissionDate, now), 0) /
          activeCount
        : 0;

    // 2) Desligamentos do ano (Resignation)
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31, 23, 59, 59);
    const resignations = await this.prisma.resignation.findMany({
      where: { companyId, dismissalDate: { gte: start, lte: end } },
      select: { admissionDate: true, dismissalDate: true, isCritical: true },
    });

    const totalDismissals = resignations.length;
    const newbieDismissals = resignations.filter(
      (r) => this.monthsBetween(r.admissionDate, r.dismissalDate) < 12,
    ).length;
    const criticalDismissals = resignations.filter((r) => r.isCritical).length;

    // % de novatos entre os desligados (guarda divisão por zero)
    const newbieTurnoverRate =
      totalDismissals > 0 ? (newbieDismissals / totalDismissals) * 100 : 0;

    return {
      year,
      activeCount,
      criticalActive,
      avgTenureMonths: this.round1(avgTenureMonths),
      totalDismissals,
      newbieDismissals,
      newbieTurnoverRate: this.round1(newbieTurnoverRate),
      criticalDismissals,
    };
  }

  // =================================================================
  // 🆕 SPRINT B2 — DISTRIBUIÇÃO POR SETOR VALIDADA (ADR-048)
  // =================================================================

  /**
   * Deriva a distribuição atual por setor dos colaboradores ATIVOS
   * (fonte da verdade), normaliza `department` (minúsculo + SEM acentos)
   * e compara com o benchmark contábil (tolerância ±5 p.p.).
   *
   * Retorno: { totalActive, sectors: [...], unmapped: [...] }
   */
  async getSectorDistribution(companyId: string) {
    const employees = await this.prisma.employee.findMany({
      where: { companyId, status: 'ACTIVE' },
      select: { department: true },
    });

    const totalActive = employees.length;
    if (totalActive === 0) {
      return {
        totalActive: 0,
        sectors: SECTOR_BENCHMARKS.map((b) => ({
          name: b.name,
          current: 0,
          currentPct: 0,
          recommendedPct: b.recommendedPct,
          recommendedHeadcount: 0,
          delta: -b.recommendedPct,
          status: 'UNDER' as const,
        })),
        unmapped: [],
      };
    }

    // Contagem por setor canônico + lista de não reconhecidos
    const counts: Record<string, number> = {};
    SECTOR_BENCHMARKS.forEach((b) => (counts[b.name] = 0));
    const unmapped: Record<string, number> = {};

    for (const emp of employees) {
      // 🛠️ B2.1: normaliza SEM ACENTOS (NFD + strip) — "Contábil" → "contabil"
      const dept = (emp.department || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      const sector = this.classifyDepartment(dept);

      if (sector) {
        counts[sector]++;
      } else {
        counts['Outros']++;
        const original = (emp.department || 'Sem departamento').trim();
        unmapped[original] = (unmapped[original] || 0) + 1;
      }
    }

    // Monta o array com % atual, delta e status (OK/OVER/UNDER)
    const sectors = SECTOR_BENCHMARKS.map((b) => {
      const current = counts[b.name] || 0;
      const currentPct = totalActive > 0 ? (current / totalActive) * 100 : 0;
      const delta = currentPct - b.recommendedPct;

      let status: 'OK' | 'OVER' | 'UNDER';
      if (Math.abs(delta) <= 5) status = 'OK';
      else if (delta > 5) status = 'OVER';
      else status = 'UNDER';

      return {
        name: b.name,
        current,
        currentPct: Number(currentPct.toFixed(1)),
        recommendedPct: b.recommendedPct,
        recommendedHeadcount: Number(
          ((b.recommendedPct / 100) * totalActive).toFixed(1),
        ),
        delta: Number(delta.toFixed(1)),
        status,
      };
    });

    return {
      totalActive,
      sectors,
      unmapped: Object.entries(unmapped).map(([name, count]) => ({
        name,
        current: count,
      })),
    };
  }
  // =================================================================
  // 🆕 SPRINT B5 — BENCHMARK DE CARGOS POR SETOR (ADR-051)
  // =================================================================

  /**
   * 🎯 getPositionBenchmark — "minha equipe tem os cargos certos?"
   *
   * 1. Agrupa os ATIVOS por setor canônico (mesma classificação da B2).
   * 2. Agrega os cargos reais por setor ({ name, count }).
   * 3. Roda o domínio `analyzeSectorPositions` (maiores restos + gaps).
   * 4. Soma totais de vagas em aberto (VACANCY) e sobras (OVER).
   *
   * Zero tabelas novas: tudo derivado em memória dos Employees (ADR-051).
   */
  async getPositionBenchmark(companyId: string) {
    const employees = await this.prisma.employee.findMany({
      where: { companyId, status: 'ACTIVE' },
      select: { department: true, position: true },
    });
    const totalActive = employees.length;

    // Agrega por setor canônico: headcount + cargos reais
    const bySector: Record<
      string,
      { headcount: number; positions: Record<string, number> }
    > = {};

    for (const emp of employees) {
      // Mesma normalização da B2 (minúsculo + sem acentos — NFD)
      const dept = (emp.department || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      const sector = this.classifyDepartment(dept) || 'Outros';

      if (!bySector[sector]) bySector[sector] = { headcount: 0, positions: {} };
      bySector[sector].headcount++;
      const posName = (emp.position || 'Sem cargo').trim();
      bySector[sector].positions[posName] =
        (bySector[sector].positions[posName] || 0) + 1;
    }

    // Analisa cada setor presente (ordenado por headcount desc)
    const sectors = Object.entries(bySector)
      .sort((a, b) => b[1].headcount - a[1].headcount)
      .map(([name, agg]) =>
        analyzeSectorPositions(
          name,
          agg.headcount,
          Object.entries(agg.positions).map(([n, count]) => ({ name: n, count })),
        ),
      );

    // Totais p/ KPIs do frontend
    let vacancies = 0;
    let over = 0;
    for (const s of sectors) {
      for (const p of s.positions) {
        if (p.status === 'VACANCY') vacancies += p.gap;
        if (p.status === 'OVER') over += -p.gap;
      }
    }

    return { totalActive, vacancies, over, sectors };
  }
  // =================================================================
  // 💾 CRIAÇÃO
  // =================================================================

  /**
   * Cria colaborador com validação robusta de datas.
   * B1: contractType • B3: isCritical (🔑).
   */
  async create(companyId: string, userId: string, data: any) {
    const admissionDate = new Date(data.admissionDate);
    if (isNaN(admissionDate.getTime())) {
      throw new BadRequestException(
        'Data de admissão inválida ou ausente. Use o formato AAAA-MM-DD.',
      );
    }

    let dismissalDate = null;
    if (data.dismissalDate) {
      const dDate = new Date(data.dismissalDate);
      if (!isNaN(dDate.getTime())) dismissalDate = dDate;
    }

    return this.prisma.employee.create({
      data: {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        position: data.position,
        department: data.department || null,
        status: data.status || 'ACTIVE',
        contractType: this.validateContractType(data.contractType),
        isCritical: Boolean(data.isCritical), // 🆕 B3
        companyId,
        userId,
        admissionDate,
        dismissalDate,
        salary: data.salary ? parseFloat(data.salary) : null,
      },
    });
  }

  // =================================================================
  // 🔄 ATUALIZAÇÃO (patch parcial)
  // =================================================================

  async update(id: string, data: any) {
    const updateData: any = {};

    if (data.name) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.position) updateData.position = data.position;
    if (data.department !== undefined) updateData.department = data.department;
    if (data.status) updateData.status = data.status;
    if (data.salary !== undefined) {
      updateData.salary = data.salary ? parseFloat(data.salary) : null;
    }
    if (data.contractType !== undefined) {
      updateData.contractType = this.validateContractType(data.contractType);
    }
    // 🆕 B3: flag crítico
    if (data.isCritical !== undefined) {
      updateData.isCritical = Boolean(data.isCritical);
    }

    if (data.admissionDate) {
      const aDate = new Date(data.admissionDate);
      if (!isNaN(aDate.getTime())) updateData.admissionDate = aDate;
    }
    if (data.dismissalDate !== undefined) {
      if (data.dismissalDate) {
        const dDate = new Date(data.dismissalDate);
        if (!isNaN(dDate.getTime())) updateData.dismissalDate = dDate;
      } else {
        updateData.dismissalDate = null;
      }
    }

    return this.prisma.employee.update({ where: { id }, data: updateData });
  }

  // =================================================================
  // 🗑️ EXCLUSÃO
  // =================================================================

  async delete(id: string) {
    return this.prisma.employee.delete({ where: { id } });
  }

  // =================================================================
  // 🔧 HELPERS PRIVADOS
  // =================================================================

  /** B1: valida tipo contratual contra o enum (default CLT). */
  private validateContractType(value?: string): ContractType {
    const validTypes: ContractType[] = ['CLT', 'ESTAGIARIO', 'TERCEIRIZADO', 'SOCIO'];
    if (value && validTypes.includes(value as ContractType)) {
      return value as ContractType;
    }
    return 'CLT';
  }

  /** B2: classifica departamento normalizado em setor canônico (null = Outros). */
  private classifyDepartment(deptNormalized: string): string | null {
    if (!deptNormalized) return null;
    for (const benchmark of SECTOR_BENCHMARKS) {
      if (benchmark.keywords.length === 0) continue; // "Outros" não casa keywords
      if (benchmark.keywords.some((kw) => deptNormalized.includes(kw))) {
        return benchmark.name;
      }
    }
    return null;
  }

  /** B3: meses entre duas datas (piso, mínimo 0). 30.44 = mês médio. */
  private monthsBetween(from: Date, to: Date): number {
    const ms = to.getTime() - from.getTime();
    return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24 * 30.44)));
  }

  /** B3: arredonda 1 casa decimal. */
  private round1(v: number): number {
    return Math.round(v * 10) / 10;
  }
}
// =================================================================
// FIM: backend/src/employee/employee.service.ts
// =================================================================