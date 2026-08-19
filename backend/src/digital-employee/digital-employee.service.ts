// =================================================================
// INÍCIO: backend/src/digital-employee/digital-employee.service.ts
// =================================================================
/**
 * DigitalEmployeeService — O "Cérebro" da Aurora (Sprints FD-1 a FD-4)
 * 
 * Responsabilidades Principais:
 * 1. Lazy Creation: Criar a instância da Aurora sob demanda (1 por tenant/empresa).
 * 2. Orquestração: Gerenciar Skills (ligar/desligar) e sincronizar com o Cron Scheduler.
 * 3. Human-in-the-loop: Gerenciar a fila de pendências e aprovações humanas.
 * 4. Compliance: Garantir que TODA ação humana ou automática seja auditada (Regra de Ouro).
 * 
 * ADRs Aplicados:
 * - ADR-004: Multi-tenant single-database (todas as queries filtradas por companyId).
 * - ADR-FD-01: Efeitos colaterais de aprovação devem ser tolerantes a falhas (não quebrar o fluxo principal).
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SkillKey, ApprovalDecision } from '@prisma/client';
import { JobRunnerService } from './orchestrator/job-runner.service';
import { SchedulerService } from './orchestrator/scheduler.service';
import { AutomationAuditService } from './audit/automation-audit.service';
import * as fs from 'fs';
import * as path from 'path';
import { MonthlyReportSkill } from './skills/monthly-report.skill';
import { TaxGuidesService } from '../tax/tax-guides.service';

// -----------------------------------------------------------------
// CONFIGURAÇÃO PADRÃO DAS SKILLS
// Quando a Aurora é criada pela 1ª vez, ela ganha estas 4 habilidades.
// Todas começam DESLIGADAS (enabled: false). O usuário as ativa no painel.
// O cronExpr segue o formato POSIX (ex: '0 2 * * *' = todo dia às 02:00).
// -----------------------------------------------------------------
const DEFAULT_SKILLS: Array<{
  skillKey: SkillKey;
  cronExpr: string;
}> = [
  { skillKey: 'RECONCILIATION', cronExpr: '0 2 * * *' },      // Conciliação: 02:00 diário
  { skillKey: 'CLASSIFICATION', cronExpr: '30 2 * * *' },     // Classificação: 02:30 diário
  { skillKey: 'ACCOUNTING_BRIDGE', cronExpr: '0 3 * * *' },   // Ponte Contábil: 03:00 diário
  { skillKey: 'MONTHLY_REPORT', cronExpr: '0 8 5 * *' },      // Relatório Mensal: Dia 5, às 08:00
];

@Injectable()
export class DigitalEmployeeService {
  constructor(
    // Prisma: Acesso seguro e tipado ao banco de dados
    private readonly prisma: PrismaService,
    // JobRunner: Executa a lógica pesada das skills em background
    private readonly jobRunner: JobRunnerService,
    // Scheduler: Gerencia os timers/crons em memória do servidor Node.js
    private readonly scheduler: SchedulerService,
    // Audit: Registra trilha de compliance imutável (Regra de Ouro)
    private readonly audit: AutomationAuditService,
    // Skills injetadas para execução manual ou delegação
    private readonly monthlyReportSkill: MonthlyReportSkill,
    private readonly taxGuidesService: TaxGuidesService,
  ) {}

  // =================================================================
  // 🔒 LAZY CREATION — Garantir que a Aurora existe
  // =================================================================
  /**
   * Padrão "Lazy Initialization": Verifica se a Aurora já existe para esta empresa.
   * Se não existir, cria com as skills padrão. Isso evita erros de "null reference".
   * 
   * @param companyId - O ID da empresa (tenant)
   * @returns A instância do RobotWorker
   */
  private async getOrCreateRobotWorker(companyId: string) {
    // 1. Tenta buscar no banco. Se existir, retorna imediatamente (performance).
    const existingWorker = await this.prisma.robotWorker.findFirst({
      where: { companyId },
      include: { skills: true }, // Já traz as skills para evitar query extra depois
    });

    if (existingWorker) {
      return existingWorker;
    }

    // 2. Se NÃO existir, cria em uma transação atômica para garantir integridade.
    return this.prisma.$transaction(async (tx) => {
      // Cria o worker base
      const worker = await tx.robotWorker.create({
        data: {
          companyId: companyId, // ⚠️ CRÍTICO: Vincula ao tenant (ADR-004)
          name: 'Aurora',
          status: 'ACTIVE',
        },
      });

      // Cria as 4 skills padrão desligadas para este worker
      const skillsData = DEFAULT_SKILLS.map((skill) => ({
        companyId,
        workerId: worker.id,
        skillKey: skill.skillKey,
        cronExpr: skill.cronExpr,
        enabled: false, // Começam desligadas por segurança
      }));

      await tx.robotWorkerSkill.createMany({
        data: skillsData,
      });

      // Retorna o worker já com as skills incluídas
      return tx.robotWorker.findUniqueOrThrow({
        where: { id: worker.id },
        include: { skills: true },
      });
    });
  }

  /**
   * Obtém ou cria o RobotWorker (Aurora) para o tenant.
   * (Método público para ser chamado pelo Controller)
   */
  async getOrCreateWorker(companyId: string) {
    return this.getOrCreateRobotWorker(companyId);
  }

  /**
   * Atualiza configurações do RobotWorker (ex: pausar/retomar).
   */
  async updateWorker(companyId: string, data: { status?: string; name?: string }) {
    const worker = await this.prisma.robotWorker.findFirst({
      where: { companyId },
    });
    
    if (!worker) {
      throw new NotFoundException('Aurora (RobotWorker) não encontrada para este tenant.');
    }

    return this.prisma.robotWorker.update({
      where: { id: worker.id },
      data: {
        ...(data.status ? { status: data.status as any } : {}),
        ...(data.name ? { name: data.name } : {}),
      },
    });
  }

  // =================================================================
  // 📊 DASHBOARD — Agregação de KPIs
  // =================================================================
  /**
   * Monta os números do painel principal da Aurora.
   * Usa Promise.all para executar 4 queries em paralelo, reduzindo o tempo de resposta.
   */
  async getDashboard(companyId: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const [runsToday, pendingCount, lifetime, lastRun] = await Promise.all([
      this.prisma.automationRun.findMany({
        where: { companyId, startedAt: { gte: startOfDay, lte: endOfDay } },
        select: {
          id: true,
          skillKey: true,
          status: true,
          startedAt: true,
          itemsAutoApproved: true,
          secondsSaved: true,
        },
        orderBy: { startedAt: 'desc' },
      }),
      this.prisma.automationPending.count({
        where: { companyId, status: 'PENDING' },
      }),
      this.prisma.automationRun.aggregate({
        where: { companyId },
        _sum: {
          itemsAutoApproved: true,
          secondsSaved: true,
        },
      }),
      this.prisma.automationRun.findFirst({
        where: { companyId },
        orderBy: { startedAt: 'desc' },
        select: { id: true, skillKey: true, status: true, startedAt: true },
      }),
    ]);

    return {
      today: {
        runs: runsToday.length,
        autoApproved: runsToday.reduce((sum, r) => sum + (r.itemsAutoApproved || 0), 0),
        secondsSaved: runsToday.reduce((sum, r) => sum + (r.secondsSaved || 0), 0),
        runsList: runsToday,
      },
      pendingReview: pendingCount,
      lifetime: {
        itemsAutoApproved: lifetime._sum.itemsAutoApproved ?? 0,
        secondsSaved: lifetime._sum.secondsSaved ?? 0,
      },
      lastRun,
    };
  }

  // =================================================================
  // 🧩 SKILLS — Gerenciamento de Habilidades e Cron
  // =================================================================
  /**
   * Lista as habilidades configuradas para a Aurora deste tenant.
   */
  async listSkills(companyId: string) {
    const worker = await this.getOrCreateRobotWorker(companyId);
    return worker.skills;
  }

  /**
   * Atualiza uma skill (liga/desliga ou muda o horário do cron).
   * ⚠️ DECISÃO TÉCNICA (FD-2): O banco de dados é a "Fonte da Verdade".
   */
  async updateSkill(
    companyId: string,
    skillId: string,
    data: { enabled?: boolean; cronExpr?: string },
  ) {
    const skill = await this.prisma.robotWorkerSkill.findFirst({
      where: { id: skillId, companyId },
    });
    if (!skill) throw new NotFoundException('Skill não encontrada ou sem permissão.');

    const updated = await this.prisma.robotWorkerSkill.update({
      where: { id: skillId },
      data: {
        ...(data.enabled !== undefined ? { enabled: data.enabled } : {}),
        ...(data.cronExpr ? { cronExpr: data.cronExpr } : {}),
      },
    });

    const finalEnabled = data.enabled !== undefined ? data.enabled : skill.enabled;
    const finalCron = data.cronExpr || skill.cronExpr;

    if (finalEnabled) {
      this.scheduler.registerCron(companyId, updated.skillKey, finalCron);
    } else {
      this.scheduler.unregisterCron(companyId, updated.skillKey);
    }

    return updated;
  }

  // =================================================================
  // 📋 RUNS & PENDÊNCIAS — Histórico e Fila de Revisão
  // =================================================================
  async listRuns(companyId: string, limit = 20) {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    return this.prisma.automationRun.findMany({
      where: { companyId },
      orderBy: { startedAt: 'desc' },
      take: safeLimit,
    });
  }

  async listPending(companyId: string) {
    return this.prisma.automationPending.findMany({
      where: { companyId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });
  }

  // =================================================================
  // ✅ RESOLUÇÃO DE PENDÊNCIAS (Human-in-the-loop)
  // =================================================================
  /**
   * 🛡️ REGRA DE OURO (Compliance):
   * Esta operação usa uma Transação Atômica ($transaction) para garantir 3 coisas:
   * 1. A pendência muda de status.
   * 2. Um registro de auditoria (ApprovalRecord) é criado.
   * 3. O "Efeito Colateral" é aplicado (ex: se aprovou classificação, atualiza a transação).
   */
  async resolvePending(
    companyId: string,
    userId: string,
    pendingId: string,
    decision: ApprovalDecision,
    notes?: string,
  ) {
    const pending = await this.prisma.automationPending.findFirst({
      where: { id: pendingId, companyId },
    });
    
    if (!pending) throw new NotFoundException('Pendência não encontrada.');
    if (pending.status !== 'PENDING') {
      throw new BadRequestException('Esta pendência já foi resolvida anteriormente.');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const resolved = await tx.automationPending.update({
        where: { id: pendingId },
        data: {
          status: decision === 'APPROVED' ? 'APPROVED' : 'REJECTED',
          resolvedBy: userId,
          resolvedAt: new Date(),
          ...(notes ? { notes } : {}),
        },
      });

      await tx.approvalRecord.create({
        data: {
          companyId,
          entityType: pending.type,
          entityId: pending.id,
          decision,
          decidedBy: userId,
          ...(notes ? { notes } : {}),
        },
      });

      if (decision === 'APPROVED' && pending.type === 'CLASSIFICATION') {
        const payload = (pending.payload || {}) as {
          transactionId?: string;
          suggestedNature?: string;
        };

        if (payload?.transactionId && payload?.suggestedNature) {
          const exists = await tx.bankTransaction.findFirst({
            where: { id: payload.transactionId, companyId },
          });

          if (exists) {
            await tx.bankTransaction.update({
              where: { id: payload.transactionId },
              data: { nature: payload.suggestedNature },
            });
          }
        }
      }

      return resolved;
    });

    try {
      await this.audit.log({
        companyId,
        actor: `USER_${userId}`,
        action: `USER_${decision}:${pending.type}`,
        entity: 'AutomationPending',
        entityId: pendingId,
        detail: { notes: notes || null, type: pending.type },
      });
    } catch (auditError) {
      console.error(
        `[resolvePending] Falha ao registrar auditoria da decisão ${decision} na pendência ${pendingId}:`,
        (auditError as Error)?.message,
      );
    }

    return updated;
  }

  // =================================================================
  // 📝 AUDITORIA & DISPARO MANUAL
  // =================================================================
  async listAudit(companyId: string, limit = 50) {
    const safeLimit = Math.min(Math.max(limit, 1), 200);
    return this.prisma.automationAudit.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: safeLimit,
    });
  }

  async runSkillNow(companyId: string, skillKey: string, userId: string) {
    return this.jobRunner.runSkill(companyId, skillKey as any, 'MANUAL', userId);
  }

  // =================================================================
  // 📊 FD-2: RELATÓRIOS MENSAIS
  // =================================================================
  async listReports(
    companyId: string,
    period?: string,
    clientId?: string,
    status?: string,
  ) {
    const where: any = { companyId };
    if (period) where.period = period;
    if (clientId) where.clientId = clientId;
    if (status) where.status = status;

    const reports = await this.prisma.monthlyReport.findMany({
      where,
      include: {
        client: {
          select: { id: true, companyName: true, cnpj: true },
        },
      },
      orderBy: { period: 'desc' },
    });

    return { value: reports, count: reports.length };
  }

  async downloadReport(companyId: string, id: string, res: any) {
    const report = await this.prisma.monthlyReport.findFirst({
      where: { id, companyId },
    });
    if (!report || !report.pdfPath) {
      return res.status(404).json({ message: 'Relatório não encontrado' });
    }

    const filePath = path.join(process.cwd(), 'uploads', report.pdfPath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Arquivo PDF não encontrado no disco' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="relatorio-${report.period}.pdf"`,
    );
    
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  }

  async generateReportForClient(
    companyId: string,
    userId: string,
    clientId: string,
    year?: number,
    month?: number,
  ) {
    const worker = await this.getOrCreateRobotWorker(companyId);

    const run = await this.prisma.automationRun.create({
      data: {
        companyId,
        workerId: worker.id,
        skillKey: 'MONTHLY_REPORT',
        triggerType: 'MANUAL',
        triggeredBy: userId,
        status: 'RUNNING',
      },
    });

    try {
      const result = await this.monthlyReportSkill.execute({
        companyId,
        runId: run.id,
        skillKey: 'MONTHLY_REPORT',
        triggeredBy: userId,
        params: { clientId, year, month },
      });

      await this.prisma.automationRun.update({
        where: { id: run.id },
        data: {
          status: result.itemsFailed > 0 ? 'PARTIAL' : 'SUCCESS',
          finishedAt: new Date(),
          itemsProcessed: result.itemsProcessed,
          itemsAutoApproved: result.itemsAutoApproved,
          itemsPendingHuman: result.itemsPendingHuman,
          itemsFailed: result.itemsFailed,
          secondsSaved: result.secondsSaved,
        },
      });

      return { runId: run.id, status: 'SUCCESS', result };
    } catch (error: any) {
      await this.prisma.automationRun.update({
        where: { id: run.id },
        data: {
          status: 'FAILED',
          finishedAt: new Date(),
          errorMessage: error.message,
        },
      });
      throw error;
    }
  }

  // =================================================================
  // 📥 FD-3a: NFS-e (Caixa de Entrada)
  // =================================================================
  async saveNfseToInbox(companyId: string, xml: string, clientId?: string) {
    if (!xml || typeof xml !== 'string' || xml.trim().length < 10) {
      throw new BadRequestException('XML vazio ou inválido');
    }
    
    const dir = path.join(process.cwd(), 'uploads', 'nfse-inbox');
    fs.mkdirSync(dir, { recursive: true });
    
    const safeClient = clientId || 'auto';
    const file = `${companyId}_${safeClient}_${Date.now()}.xml`;
    fs.writeFileSync(path.join(dir, file), xml, 'utf-8');
    
    return { saved: file };
  }

  async listNfse(companyId: string, status?: string) {
    const where: any = { companyId };
    if (status) where.status = status;
    
    const items = await this.prisma.fiscalServiceInvoice.findMany({
      where,
      include: { client: { select: { id: true, companyName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    
    return { value: items, count: items.length };
  }

  // =================================================================
  // 🧾 FD-4: GUIAS DE IMPOSTO
  // =================================================================
  async listTaxGuides(companyId: string, period?: string, type?: string, status?: string) {
    return this.taxGuidesService.list(companyId, period, type, status);
  }

  async calculateTaxGuides(companyId: string, period: string, userId: string) {
    const worker = await this.getOrCreateRobotWorker(companyId);
    if (!worker) throw new Error('Aurora não inicializada para este tenant');

    const run = await this.prisma.automationRun.create({
      data: {
        companyId,
        workerId: worker.id,
        skillKey: 'TAX_GUIDES',
        triggerType: 'MANUAL',
        triggeredBy: userId,
        status: 'RUNNING',
      },
    });

    try {
      const result = await this.taxGuidesService.calcForPeriod(companyId, period, run.id);

      const status = result.warnings > 0 ? 'PARTIAL' : 'SUCCESS';
      
      await this.prisma.automationRun.update({
        where: { id: run.id },
        data: {
          status,
          finishedAt: new Date(),
          itemsProcessed: result.processed,
          itemsAutoApproved: result.created + result.updated - result.warnings,
          itemsPendingHuman: result.warnings,
          itemsFailed: 0,
          secondsSaved: result.processed * 900,
        },
      });

      return { runId: run.id, status, result, period };
    } catch (e: any) {
      await this.prisma.automationRun.update({
        where: { id: run.id },
        data: { status: 'FAILED', finishedAt: new Date(), errorMessage: e?.message },
      });
      throw e;
    }
  }

  async updateTaxGuide(companyId: string, id: string, status: string, userId: string) {
    const guide = await this.prisma.taxGuide.findFirst({
      where: { id, companyId },
    });
    if (!guide) throw new NotFoundException('Guia não encontrada');

    const updated = await this.prisma.taxGuide.update({
      where: { id },
      data: { status: status as any },
    });

    await this.audit.log({
      companyId,
      actor: `USER_${userId}`,
      action: 'USER_TAX_GUIDE_UPDATE',
      entity: 'TaxGuide',
      entityId: id,
      detail: { from: guide.status, to: status, type: guide.type, period: guide.period },
    });

    return updated;
  }

  async taxGuidePdf(companyId: string, id: string) {
    return this.taxGuidesService.generatePdf(companyId, id);
  }
}
// =================================================================
// FIM: backend/src/digital-employee/digital-employee.service.ts
// =================================================================