// =================================================================
// INÍCIO: backend/src/employee/employee.service.ts
// =================================================================
/**
 * =================================================================
 * EmployeeService — Gestão de Colaboradores (Sprint B1)
 * =================================================================
 * Responsabilidades:
 * - CRUD de colaboradores (Employee)
 * - Métricas básicas (total, ativos, admissões no mês)
 * - Validação robusta de datas (admissionDate obrigatório)
 * - 🆕 Sprint B1: tipo contratual (CLT/ESTAGIARIO/TERCEIRIZADO/SOCIO)
 *
 * 🧠 ADRs:
 * - ADR-004: Multi-tenant single-database (companyId em todas as queries)
 * - ADR-047 (proposto): tipo contratual vive no Employee (enum forte);
 *   Resignation.contractType continua como cópia histórica no desligamento.
 * =================================================================
 */
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContractType } from '@prisma/client'; // 🆕 Sprint B1

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
  // 📊 MÉTRICAS (KPIs básicos)
  // =================================================================

  /**
   * Métricas de colaboradores (total, ativos, admissões no mês).
   * 🆕 Sprint B2 (futuro): distribuição por setor validada.
   * 🆕 Sprint B3 (futuro): KPIs novato/crítico.
   */
  async getMetrics(companyId: string) {
    const active = await this.prisma.employee.count({
      where: { companyId, status: 'ACTIVE' },
    });
    const total = await this.prisma.employee.count({ where: { companyId } });

    // Admissões no mês corrente
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const admissionsThisMonth = await this.prisma.employee.count({
      where: {
        companyId,
        admissionDate: { gte: startOfMonth },
      },
    });

    // Taxa de turnover simplificada (desligamentos ÷ média de ativos)
    // 🆕 Sprint B2 (futuro): cálculo completo com média móvel
    const turnoverRate = 0; // placeholder — será implementado na B2

    return {
      totalActive: active,
      totalEmployees: total,
      admissionsThisMonth,
      turnoverRate,
    };
  }

  // =================================================================
  // 💾 CRIAÇÃO
  // =================================================================

  /**
   * Cria um novo colaborador com validação robusta de datas.
   * 🆕 Sprint B1: aceita `contractType` (default CLT).
   */
  async create(companyId: string, userId: string, data: any) {
    // 🔥 VALIDAÇÃO ROBUSTA DE DATAS
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

    // 🆕 Sprint B1: tipo contratual (valida enum, default CLT)
    const contractType = this.validateContractType(data.contractType);

    return this.prisma.employee.create({
      data: {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        position: data.position,
        department: data.department || null,
        status: data.status || 'ACTIVE',
        contractType, // 🆕 Sprint B1
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

  /**
   * Atualiza dados do colaborador (patch parcial).
   * 🆕 Sprint B1: aceita `contractType`.
   */
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

    // 🆕 Sprint B1: tipo contratual
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

    return this.prisma.employee.update({
      where: { id },
      data: updateData,
    });
  }

  // =================================================================
  // 🗑️ EXCLUSÃO
  // =================================================================

  /** Remove colaborador (soft delete preservaria histórico — futuro). */
  async delete(id: string) {
    return this.prisma.employee.delete({ where: { id } });
  }

  // =================================================================
  // 🔧 HELPERS PRIVADOS
  // =================================================================

  /**
   * 🆕 Sprint B1: valida tipo contratual contra o enum ContractType.
   * Retorna CLT como default se o valor for inválido ou ausente.
   */
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
    return 'CLT'; // default seguro
  }
}
// =================================================================
// FIM: backend/src/employee/employee.service.ts
// =================================================================