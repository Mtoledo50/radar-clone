// =================================================================
// INÍCIO: backend/src/employee/employee.service.ts
// =================================================================
/**
 * =================================================================
 * EmployeeService — Gestão de Colaboradores (Sprints B1 + B2)
 * =================================================================
 * Responsabilidades:
 * - CRUD de colaboradores (Employee)
 * - Métricas básicas (total, ativos, admissões no mês)
 * - Validação robusta de datas (admissionDate obrigatório)
 * - Sprint B1: tipo contratual (CLT/ESTAGIARIO/TERCEIRIZADO/SOCIO)
 * - 🆕 Sprint B2: distribuição por setor VALIDADA (atual × benchmark)
 *
 * 🧠 ADRs:
 * - ADR-004: Multi-tenant single-database (companyId em todas as queries)
 * - ADR-047 (proposto): tipo contratual vive no Employee (enum forte)
 * - ADR-048 (proposto): benchmark contábil padrão para validação de setores
 *   (Fiscal 30% / Contábil 25% / DP 20% / Admin 15% / Outros 10%, ±5 p.p.)
 * =================================================================
 */
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContractType } from '@prisma/client';

// 🆕 Sprint B2 — benchmark contábil (ADR-048)
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
      'admin',
      'comercial',
      'vendas',
      'financeiro',
      'diretoria',
      'gestao',
      'gestão',
      'ti',
      'tecnologia',
      'juridico',
      'jurídico',
    ],
  },
  // 🆕 "Outros" = fallback (não tem keywords, captura tudo que não casou)
  {
    name: 'Outros',
    recommendedPct: 10,
    keywords: [],
  },
];

@Injectable()
export class EmployeeService {
  constructor(private prisma: PrismaService) {}

  // =================================================================
  // 📋 LISTAGEM
  // =================================================================

  async findAll(companyId: string) {
    return this.prisma.employee.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
    });
  }

  // =================================================================
  // 📊 MÉTRICAS (KPIs básicos)
  // =================================================================

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
      turnoverRate: 0, // placeholder — será implementado na B3
    };
  }

  // =================================================================
  // 🆕 SPRINT B2 — DISTRIBUIÇÃO POR SETOR VALIDADA
  // =================================================================

  /**
   * 🆕 Sprint B2 (ADR-048): distribuição por setor derivada dos
   * colaboradores ATIVOS, comparada com o benchmark contábil.
   *
   * Pipeline:
   * 1. Busca todos os `Employee` com status ACTIVE do tenant.
   * 2. Normaliza o campo `department` (trim + lowercase).
   * 3. Mapeia cada departamento para um setor canônico pelas keywords.
   * 4. Departamentos não reconhecidos → "Outros" + lista `unmapped`.
   * 5. Calcula: current, currentPct, recommendedPct, delta, status
   *    (OK / OVER / UNDER — tolerância ±5 p.p.).
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

    // Contagem por setor canônico
    const counts: Record<string, number> = {};
    SECTOR_BENCHMARKS.forEach((b) => (counts[b.name] = 0));

    const unmapped: Record<string, number> = {};

    for (const emp of employees) {
      // 🛠️ B2.1: normaliza SEM ACENTOS (NFD + strip) — "Contábil" → "contabil"
      // casa com a keyword 'contab'; sem isso, acento quebrava o matching.
      const dept = (emp.department || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      const sector = this.classifyDepartment(dept);

      if (sector) {
        counts[sector]++;
      } else {
        // departamento não reconhecido → "Outros" + lista unmapped
        counts['Outros']++;
        const original = (emp.department || 'Sem departamento').trim();
        unmapped[original] = (unmapped[original] || 0) + 1;
      }
    }

    // Monta o array com cálculo de % e delta
    const sectors = SECTOR_BENCHMARKS.map((b) => {
      const current = counts[b.name] || 0;
      const currentPct =
        totalActive > 0 ? (current / totalActive) * 100 : 0;
      const delta = currentPct - b.recommendedPct;

      // Regra de validação: tolerância ±5 p.p. (ADR-048)
      let status: 'OK' | 'OVER' | 'UNDER';
      if (Math.abs(delta) <= 5) {
        status = 'OK';
      } else if (delta > 5) {
        status = 'OVER';
      } else {
        status = 'UNDER';
      }

      return {
        name: b.name,
        current,
        currentPct: Number(currentPct.toFixed(1)),
        recommendedPct: b.recommendedPct,
        recommendedHeadcount: Number(((b.recommendedPct / 100) * totalActive).toFixed(1)),
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
  // 💾 CRIAÇÃO
  // =================================================================

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
      if (!isNaN(dDate.getTime())) {
        dismissalDate = dDate;
      }
    }

    const contractType = this.validateContractType(data.contractType);

    return this.prisma.employee.create({
      data: {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        position: data.position,
        department: data.department || null,
        status: data.status || 'ACTIVE',
        contractType,
        companyId,
        userId,
        admissionDate,
        dismissalDate,
        salary: data.salary ? parseFloat(data.salary) : null,
      },
    });
  }

  // =================================================================
  // 🔄 ATUALIZAÇÃO
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

  private validateContractType(value?: string): ContractType {
    const validTypes: ContractType[] = [
      'CLT',
      'ESTAGIARIO',
      'TERCEIRIZADO',
      'SOCIO',
    ];
    if (value && validTypes.includes(value as ContractType)) {
      return value as ContractType;
    }
    return 'CLT';
  }

  /**
   * 🆕 Sprint B2 (ADR-048): classifica um departamento normalizado
   * em um setor canônico pelas keywords. Retorna null se não casar
   * nenhuma keyword — caller trata como "Outros" + unmapped.
   */
  private classifyDepartment(deptNormalized: string): string | null {
    if (!deptNormalized) return null;
    for (const benchmark of SECTOR_BENCHMARKS) {
      // "Outros" não tem keywords — ignora no matching
      if (benchmark.keywords.length === 0) continue;
      if (benchmark.keywords.some((kw) => deptNormalized.includes(kw))) {
        return benchmark.name;
      }
    }
    return null;
  }
}
// =================================================================
// FIM: backend/src/employee/employee.service.ts
// =================================================================