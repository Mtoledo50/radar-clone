// =================================================================
// INÍCIO: backend/src/company/custom-indicator.service.ts
// =================================================================
/**
 * =================================================================
 * 🧮 CustomIndicatorService — Sprint C3 (Indicadores com Fórmula)
 * =================================================================
 * CRUD de indicadores customizados + avaliação das fórmulas contra
 * o contexto real do tenant.
 *
 * 🧠 ADR-054: parser seguro por whitelist (zero eval/Function).
 * 📐 Determinístico: 100% auditável, zero IA.
 * =================================================================
 */
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClientStatus } from '@prisma/client'; // 🆕 enum real do schema
import {
  parseFormula,
  validateVariables,
  evaluate,
  FormulaContext,
} from './domain/formula-engine';

// =================================================================
// 🛡️ STATUS "ATIVO" DO CLIENTE — agnóstico ao schema
// =================================================================
/**
 * O enum ClientStatus pode variar entre versões do schema
 * (ACTIVE vs ATIVO). Descobrimos o membro "ativo" em runtime
 * para o código compilar e rodar em qualquer schema.
 */
const CLIENT_STATUS_VALUES = Object.values(ClientStatus) as string[];
const ACTIVE_CLIENT_STATUS = (CLIENT_STATUS_VALUES.find((v) =>
  ['ACTIVE', 'ATIVO'].includes(v),
) ?? CLIENT_STATUS_VALUES[0]) as ClientStatus;

/**
 * Variáveis permitidas nas fórmulas (whitelist ADR-054).
 * Qualquer outra palavra é REJEITADA pelo parser.
 */
export const ALLOWED_VARIABLES = [
  // CompanyProfile (diretas)
  'clientesHoje', 'clientesAno',
  'funcionariosHoje', 'funcionariosAno',
  // Derivadas (calculadas em buildContext)
  'totalActive',          // colaboradores ativos
  'criticalActive',       // colaboradores críticos (🔑)
  'totalClients',         // todos os clientes do tenant
  'activeClients',        // clientes com status ativo
  'offeredServices',      // ServiceItem ativos oferecidos
  'totalServices',        // total de ServiceItem cadastrados
  'softwareCoverage',     // % de cobertura da C1
  'servicesCoverage',     // % de cobertura da C2
];

export interface IndicatorFormData {
  name: string;
  description?: string;
  formula: string;
  target?: number | null;
  unit?: string;
  category?: string;
  color?: string;
}

export interface EvaluatedIndicator {
  id: string;
  name: string;
  description: string | null;
  formula: string;
  target: number | null;
  unit: string;
  category: string;
  color: string;
  isFavorite: boolean;
  currentValue: number | null; // resultado da avaliação (ou null = erro)
  progressPct: number | null;  // (atual / target) * 100 se tiver target
  error: string | null;        // mensagem de erro se falhou
}

@Injectable()
export class CustomIndicatorService {
  constructor(private prisma: PrismaService) {}

  // =================================================================
  // 📋 LISTAGEM (CRUD)
  // =================================================================
  async list(companyId: string) {
    return this.prisma.customIndicator.findMany({
      where: { companyId, isActive: true },
      orderBy: [{ isFavorite: 'desc' }, { category: 'asc' }, { name: 'asc' }],
    });
  }

  // =================================================================
  // 💾 CRIAÇÃO (com validação de fórmula)
  // =================================================================
  async create(companyId: string, userId: string, data: IndicatorFormData) {
    const parsed = parseFormula(data.formula);
    if (!parsed.valid || !parsed.ast) {
      throw new BadRequestException(`Fórmula inválida: ${parsed.error}`);
    }
    const varErr = validateVariables(parsed.ast, ALLOWED_VARIABLES);
    if (varErr) throw new BadRequestException(varErr);

    return this.prisma.customIndicator.create({
      data: {
        companyId,
        userId,
        name: data.name.trim(),
        description: data.description?.trim() || null,
        formula: data.formula.trim(),
        target: data.target ?? null,
        unit: data.unit?.trim() || '%',
        category: (data.category as any) || 'CUSTOM',
        color: data.color?.trim() || '#0d9488',
      },
    });
  }

  // =================================================================
  // 🔄 ATUALIZAÇÃO (patch parcial + revalida fórmula se mudou)
  // =================================================================
  async update(id: string, companyId: string, data: Partial<IndicatorFormData>) {
    const existing = await this.prisma.customIndicator.findFirst({
      where: { id, companyId },
    });
    if (!existing) throw new BadRequestException('Indicador não encontrado');

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.description !== undefined) updateData.description = data.description?.trim() || null;
    if (data.unit !== undefined) updateData.unit = data.unit.trim() || '%';
    if (data.category !== undefined) updateData.category = data.category as any;
    if (data.color !== undefined) updateData.color = data.color.trim() || '#0d9488';
    if (data.target !== undefined) updateData.target = data.target ?? null;

    if (data.formula !== undefined) {
      const parsed = parseFormula(data.formula);
      if (!parsed.valid || !parsed.ast) {
        throw new BadRequestException(`Fórmula inválida: ${parsed.error}`);
      }
      const varErr = validateVariables(parsed.ast, ALLOWED_VARIABLES);
      if (varErr) throw new BadRequestException(varErr);
      updateData.formula = data.formula.trim();
    }

    return this.prisma.customIndicator.update({ where: { id }, data: updateData });
  }

  // =================================================================
  // 🗑️ EXCLUSÃO (soft delete: marca isActive=false)
  // =================================================================
  async remove(id: string, companyId: string) {
    const existing = await this.prisma.customIndicator.findFirst({
      where: { id, companyId },
    });
    if (!existing) throw new BadRequestException('Indicador não encontrado');

    return this.prisma.customIndicator.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // =================================================================
  // ⭐ FAVORITO (toggle)
  // =================================================================
  async toggleFavorite(id: string, companyId: string) {
    const existing = await this.prisma.customIndicator.findFirst({
      where: { id, companyId },
    });
    if (!existing) throw new BadRequestException('Indicador não encontrado');

    return this.prisma.customIndicator.update({
      where: { id },
      data: { isFavorite: !existing.isFavorite },
    });
  }

  // =================================================================
  // 🎯 DASHBOARD — avalia TODOS os indicadores do tenant
  // =================================================================
  async getDashboard(companyId: string): Promise<EvaluatedIndicator[]> {
    const indicators = await this.list(companyId);
    const ctx = await this.buildContext(companyId);

    return indicators.map((ind) => {
      const parsed = parseFormula(ind.formula);
      if (!parsed.valid || !parsed.ast) {
        return {
          id: ind.id,
          name: ind.name,
          description: ind.description,
          formula: ind.formula,
          target: ind.target,
          unit: ind.unit,
          category: ind.category,
          color: ind.color,
          isFavorite: ind.isFavorite,
          currentValue: null,
          progressPct: null,
          error: parsed.error || 'Fórmula inválida',
        };
      }
      const value = evaluate(parsed.ast, ctx);
      const progressPct =
        value !== null && ind.target && ind.target > 0
          ? Math.round((value / ind.target) * 100)
          : null;
      return {
        id: ind.id,
        name: ind.name,
        description: ind.description,
        formula: ind.formula,
        target: ind.target,
        unit: ind.unit,
        category: ind.category,
        color: ind.color,
        isFavorite: ind.isFavorite,
        currentValue: value,
        progressPct,
        error: value === null ? 'Variável ausente ou divisão por zero' : null,
      };
    });
  }

  // =================================================================
  // 🔧 CONTEXTO — monta o FormulaContext com todas as variáveis
  // =================================================================
  private async buildContext(companyId: string): Promise<FormulaContext> {
    // 1) CompanyProfile (metas/visão) — via primeiro ADMIN do tenant
    const adminUser = await this.prisma.user.findFirst({
      where: { companyId, role: 'ADMIN' },
      select: { id: true },
    });
    const profile = adminUser
      ? await this.prisma.companyProfile.findUnique({
          where: { userId: adminUser.id },
        })
      : null;

    // 2) Colaboradores
    const totalActive = await this.prisma.employee.count({
      where: { companyId, status: 'ACTIVE' },
    });
    const criticalActive = await this.prisma.employee.count({
      where: { companyId, status: 'ACTIVE', isCritical: true },
    });

    // 3) Clientes (status ativo descoberto em runtime — agnóstico ao schema)
    const totalClients = await this.prisma.client.count({ where: { companyId } });
    const activeClients = await this.prisma.client.count({
      where: { companyId, status: ACTIVE_CLIENT_STATUS },
    });

    // 4) Serviços oferecidos
    const offeredServices = await this.prisma.serviceItem.count({
      where: { companyId, isActive: true },
    });
    const totalServices = await this.prisma.serviceItem.count({
      where: { companyId },
    });

    // 5) Coberturas (C1 e C2)
    const softwareCoverage = await this.computeSoftwareCoverage(companyId);
    const servicesCoverage = await this.computeServicesCoverage(companyId);

    return {
      // CompanyProfile
      clientesHoje: profile?.clientesHoje ?? 0,
      clientesAno: profile?.clientesAno ?? 0,
      funcionariosHoje: profile?.funcionariosHoje ?? 0,
      funcionariosAno: profile?.funcionariosAno ?? 0,
      // Derivadas
      totalActive,
      criticalActive,
      totalClients,
      activeClients,
      offeredServices,
      totalServices,
      softwareCoverage,
      servicesCoverage,
    };
  }

  /** 🆕 Sprint C1: % de categorias essenciais cobertas pelo stack. */
  private async computeSoftwareCoverage(companyId: string): Promise<number> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { softwareStack: true },
    });
    const stack = (company?.softwareStack || [])
      .map((e) => e.split(':').slice(1).join(':'))
      .filter((v) => v && v !== 'NÃO_UTILIZADO');

    // 🛡️ FIX TS2339: tipado como tupla p/ `keywords` ser string[]
    const essentialCategories: Array<[string, string[]]> = [
      ['contabil', ['sci', 'dominio', 'questor', 'alter', 'prosoft', 'sage', 'totvs']],
      ['dp', ['dominio dp', 'questor dp', 'totvs rm folha']],
      ['fiscal', ['mastersiga fiscal', 'taxone', 'dominio fiscal']],
      ['financeiro', ['conta azul', 'omie', 'bling', 'quickbooks']],
      ['assinatura', ['d4sign', 'docusign', 'clicksign', 'zapsign']],
    ];

    const normalizedStack = stack.map((s) =>
      s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
    );
    let covered = 0;
    for (const [, keywords] of essentialCategories) {
      const hasAny = normalizedStack.some((s) =>
        keywords.some((kw) => s.includes(kw)),
      );
      if (hasAny) covered++;
    }
    return Math.round((covered / essentialCategories.length) * 100);
  }

  /** 🆕 Sprint C2: % de serviços extras oferecidos (catálogo v1). */
  private async computeServicesCoverage(companyId: string): Promise<number> {
    const items = await this.prisma.serviceItem.findMany({
      where: { companyId, isActive: true },
      select: { name: true },
    });
    const catalogKeywords: string[][] = [
      ['bpo', 'financeiro'], ['dashboard', 'bpo'], ['irpf', 'renda'],
      ['abertura', 'empresa'], ['baixa', 'encerramento'], ['mei'],
      ['cnd', 'certidao'], ['parcelamento', 'regulariza'],
      ['consultoria', 'tributaria'], ['revisao', 'simples'],
      ['lgpd', 'compliance'], ['folha', 'departamento pessoal'],
    ];
    const normalizedItems = items.map((i) =>
      i.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
    );
    let covered = 0;
    for (const keywords of catalogKeywords) {
      const hasAny = normalizedItems.some((n) =>
        keywords.some((kw) => n.includes(kw)),
      );
      if (hasAny) covered++;
    }
    return Math.round((covered / catalogKeywords.length) * 100);
  }

  // =================================================================
  // 🧪 PREVIEW — valida fórmula ao vivo (p/ modal do frontend)
  // =================================================================
  async preview(formula: string) {
    const parsed = parseFormula(formula);
    if (!parsed.valid || !parsed.ast) {
      return { valid: false, error: parsed.error };
    }
    const varErr = validateVariables(parsed.ast, ALLOWED_VARIABLES);
    if (varErr) return { valid: false, error: varErr };
    return { valid: true, error: null };
  }

  /** Lista das variáveis disponíveis (p/ help do modal). */
  getAllowedVariables() {
    return ALLOWED_VARIABLES;
  }
}
// =================================================================
// FIM: backend/src/company/custom-indicator.service.ts
// =================================================================