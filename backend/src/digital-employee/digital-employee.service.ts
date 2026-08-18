// =================================================================
// INÍCIO: backend/src/digital-employee/digital-employee.service.ts
// =================================================================
// DigitalEmployeeService — Lógica de negócio da Aurora (Sprint FD-1/FD-2).
//
// Responsabilidades:
//  - Criar a Aurora sob demanda (lazy) — 1 por tenant (ADR-004)
//  - Pausar/retomar o funcionário
//  - Agregar KPIs do dashboard
//  - Gerenciar skills (ligar/desligar, cron)
//  - Listar runs, pendências e auditoria
//  - Resolver pendências (aprovar/rejeitar) + ApprovalRecord + AUDITORIA
//    + efeito colateral seguro para CLASSIFICATION (FD-2 final)
// =================================================================
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SkillKey, ApprovalDecision } from '@prisma/client';
import { JobRunnerService } from './orchestrator/job-runner.service';
import { SchedulerService } from './orchestrator/scheduler.service';
import { AutomationAuditService } from './audit/automation-audit.service'; // 🆕 FD-2 final
import * as fs from 'fs';
import * as path from 'path';
import { MonthlyReportSkill } from './skills/monthly-report.skill';
// -----------------------------------------------------------------
// Configuração das skills padrão da Aurora.
// Quando o worker é criado, fazemos o "seed" destas 4 skills
// (todas DESLIGADAS — o usuário liga pelo painel).
// cronExpr usa formato POSIX cron.
// -----------------------------------------------------------------
const DEFAULT_SKILLS: Array<{
  skillKey: SkillKey;
  cronExpr: string;
}> = [
  { skillKey: 'RECONCILIATION', cronExpr: '0 2 * * *' },      // 02:00 diário
  { skillKey: 'CLASSIFICATION', cronExpr: '30 2 * * *' },     // 02:30 diário
  { skillKey: 'ACCOUNTING_BRIDGE', cronExpr: '0 3 * * *' },   // 03:00 diário
  { skillKey: 'MONTHLY_REPORT', cronExpr: '0 8 5 * *' },      // 08:00 dia 5
];

@Injectable()
export class DigitalEmployeeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jobRunner: JobRunnerService,
    private readonly scheduler: SchedulerService, // 🆕 FD-2: sincroniza toggle ↔ cron
    private readonly audit: AutomationAuditService, // 🆕 FD-2 final: auditoria das decisões humanas
    private readonly monthlyReportSkill: MonthlyReportSkill,
  ) {}

  // =================================================================
  // 🤖 WORKER — Lazy create (cria na primeira vez que acessa)
  // =================================================================
  /**
   * Busca a Aurora do tenant. Se ainda não existir, cria com o nome
   * padrão "Aurora" + as 4 skills padrão (desligadas).
   * O companyId é UNIQUE no modelo RobotWorker, então nunca duplica.
   */
  async getOrCreateWorker(companyId: string) {
    // Tenta buscar primeiro (caminho feliz — já existe)
    const existing = await this.prisma.robotWorker.findUnique({
      where: { companyId },
      include: { skills: true },
    });
    if (existing) return existing;

    // Não existe ainda → cria dentro de uma transação (worker + skills)
    return this.prisma.$transaction(async (tx) => {
      const worker = await tx.robotWorker.create({
        data: { companyId, name: 'Aurora', avatar: '🌅' },
      });

      // Seed das skills padrão (todas desligadas por segurança)
      for (const skill of DEFAULT_SKILLS) {
        await tx.robotWorkerSkill.create({
          data: {
            companyId,
            workerId: worker.id,
            skillKey: skill.skillKey,
            enabled: false,
            cronExpr: skill.cronExpr,
            autonomy: 'REVIEW', // Regra de Ouro: começa sempre em revisão
          },
        });
      }

      // Retorna já com as skills carregadas
      return tx.robotWorker.findUnique({
        where: { id: worker.id },
        include: { skills: true },
      });
    });
  }

  /**
   * Atualiza a Aurora (pausar/retomar ou renomear).
   * Valida posse por companyId (multi-tenant — ADR-004).
   */
  async updateWorker(
    companyId: string,
    data: { status?: 'ACTIVE' | 'PAUSED'; name?: string },
  ) {
    const worker = await this.prisma.robotWorker.findUnique({
      where: { companyId },
    });
    if (!worker) throw new NotFoundException('Funcionário digital não encontrado.');

    return this.prisma.robotWorker.update({
      where: { id: worker.id },
      data: {
        ...(data.status ? { status: data.status } : {}),
        ...(data.name ? { name: data.name } : {}),
      },
    });
  }

  // =================================================================
  // 📊 DASHBOARD — KPIs agregados
  // =================================================================
  /**
   * Agrega os números para o topo do painel da Aurora:
   *  - Quantas execuções (runs) ocorreram hoje
   *  - Quantos itens foram aprovados sozinhos (score ≥80%)
   *  - Quantas pendências aguardam o humano (fila 🟡)
   *  - Tempo total economizado (métrica de marketing)
   */
  async getDashboard(companyId: string) {
    // Início e fim do dia de hoje (para o filtro "runs hoje")
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // 4 consultas em paralelo (Promise.all) — performance
    const [runsToday, pendingCount, lifetime, lastRun] = await Promise.all([
      // Runs de hoje
      this.prisma.automationRun.findMany({
        where: { companyId, startedAt: { gte: startOfDay, lte: endOfDay } },
        select: {
          id: true,
          skillKey: true,
          status: true,
          startedAt: true,
          itemsProcessed: true,
          itemsAutoApproved: true,
          itemsPendingHuman: true,
          secondsSaved: true,
        },
        orderBy: { startedAt: 'desc' },
      }),
      // Pendências abertas (fila 🟡)
      this.prisma.automationPending.count({
        where: { companyId, status: 'PENDING' },
      }),
      // Totais acumulados (desde sempre)
      this.prisma.automationRun.aggregate({
        where: { companyId },
        _sum: {
          itemsProcessed: true,
          itemsAutoApproved: true,
          secondsSaved: true,
        },
      }),
      // Última execução (para mostrar "última vez que trabalhou")
      this.prisma.automationRun.findFirst({
        where: { companyId },
        orderBy: { startedAt: 'desc' },
        select: { id: true, skillKey: true, status: true, startedAt: true },
      }),
    ]);

    return {
      today: {
        runs: runsToday.length,
        autoApproved: runsToday.reduce((s, r) => s + r.itemsAutoApproved, 0),
        secondsSaved: runsToday.reduce((s, r) => s + r.secondsSaved, 0),
        runsList: runsToday,
      },
      pendingReview: pendingCount,
      lifetime: {
        itemsProcessed: lifetime._sum.itemsProcessed ?? 0,
        itemsAutoApproved: lifetime._sum.itemsAutoApproved ?? 0,
        secondsSaved: lifetime._sum.secondsSaved ?? 0,
      },
      lastRun,
    };
  }

  // =================================================================
  // 🧩 SKILLS — ligar/desligar e configurar cron
  // =================================================================
  /**
   * Lista as skills da Aurora do tenant.
   * Garante que o worker existe antes (lazy create).
   */
  async listSkills(companyId: string) {
    const worker = await this.getOrCreateWorker(companyId);
    return worker.skills;
  }

  /**
   * Atualiza uma skill (ligar/desligar + cron).
   * 🆕 FD-2: o toggle agora SINCRONIZA o cron em tempo real:
   *    ON  → scheduler.registerCron (Aurora passa a acordar sozinha)
   *    OFF → scheduler.unregisterCron (Aurora dorme)
   */
  async updateSkill(
    companyId: string,
    skillId: string,
    data: { enabled?: boolean; cronExpr?: string },
  ) {
    const skill = await this.prisma.robotWorkerSkill.findFirst({
      where: { id: skillId, companyId },
    });
    if (!skill) throw new NotFoundException('Skill não encontrada.');

    // 1. Persiste a mudança no banco
    const updated = await this.prisma.robotWorkerSkill.update({
      where: { id: skillId },
      data: {
        ...(data.enabled !== undefined ? { enabled: data.enabled } : {}),
        ...(data.cronExpr ? { cronExpr: data.cronExpr } : {}),
      },
    });

    // 2. 🆕 Sincroniza o cron com o estado final do toggle
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
  // 📋 RUNS — histórico de execuções (o "ponto" da Aurora)
  // =================================================================
  /**
   * Lista as últimas execuções (mais recentes primeiro).
   * @param limit - quantidade máxima (padrão 20, máx 100)
   */
  async listRuns(companyId: string, limit = 20) {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    return this.prisma.automationRun.findMany({
      where: { companyId },
      orderBy: { startedAt: 'desc' },
      take: safeLimit,
    });
  }

  // =================================================================
  // 🟡 PENDÊNCIAS — fila de revisão (human-in-the-loop)
  // =================================================================
  /**
   * Lista as pendências abertas (status = PENDING).
   * É o que o contador revisa/aprova no painel.
   */
  async listPending(companyId: string) {
    return this.prisma.automationPending.findMany({
      where: { companyId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Resolve uma pendência: aprova ou rejeita.
   *
   * 🆕 FD-2 final (Central de Aprovações):
   *  - Auditoria da decisão humana (USER_APPROVED / USER_REJECTED)
   *  - Efeito colateral SEGURO: CLASSIFICATION aprovada aplica a natureza
   *    sugerida na transação (se ela existir no tenant); MATCH continua
   *    sendo confirmado na tela de Conciliação (motor da Sprint 29).
   *  - Sempre cria ApprovalRecord (trava de transmissão — Regra de Ouro).
   *
   * @param companyId - Tenant (valida posse)
   * @param userId - quem decidiu (auditoria)
   * @param pendingId - ID da pendência
   * @param decision - APPROVED ou REJECTED
   * @param notes - nota opcional do contador (alimenta memória futura)
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
      throw new BadRequestException('Esta pendência já foi resolvida.');
    }

    // -----------------------------------------------------------------
    // Transação atômica: pendência + ApprovalRecord + efeito colateral
    // -----------------------------------------------------------------
    const updated = await this.prisma.$transaction(async (tx) => {
      // 1. Atualiza a pendência para o status final (APPROVED/REJECTED)
      const resolved = await tx.automationPending.update({
        where: { id: pendingId },
        data: {
          status: decision === 'APPROVED' ? 'APPROVED' : 'REJECTED',
          resolvedBy: userId,
          resolvedAt: new Date(),
          ...(notes ? { notes } : {}),
        },
      });

      // 2. Cria o ApprovalRecord (prova jurídica da decisão)
      await tx.approvalRecord.create({
        data: {
          companyId,
          entityType: pending.type, // ex.: MATCH, CLASSIFICATION
          entityId: pending.id,
          decision,
          decidedBy: userId,
          ...(notes ? { notes } : {}),
        },
      });

      // 3. 🆕 Efeito colateral seguro por tipo de pendência
      //
      //    CLASSIFICATION aprovada → aplica a natureza sugerida na
      //    transação bancária correspondente (se ela existir no tenant).
      //    Se a transação não existir (ex.: dado de teste), simplesmente
      //    ignora — não é erro, é tolerância.
      //
      //    MATCH → a confirmação efetiva continua na tela de Conciliação
      //    (motor de score da Sprint 29). Aqui apenas registramos a
      //    decisão para compliance e auditoria.
      if (decision === 'APPROVED' && pending.type === 'CLASSIFICATION') {
        const payload = (pending.payload || {}) as {
          transactionId?: string;
          suggestedNature?: string;
        };

        if (payload?.transactionId && payload?.suggestedNature) {
          // Só aplica se a transação existir no tenant (tolerante a testes)
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

    // -----------------------------------------------------------------
    // 4. 🆕 Auditoria da decisão humana (fora da transação — fire-and-forget)
    //
    //    Registra USER_APPROVED:<tipo> ou USER_REJECTED:<tipo> na trilha
    //    de compliance. A nota vai no detail para histórico completo.
    //    Se der erro aqui, não deve quebrar a resolução já persistida.
    // -----------------------------------------------------------------
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
      // Log do erro de auditoria NÃO deve quebrar o fluxo principal.
      // A resolução já foi persistida na transação acima.
      console.error(
        `[resolvePending] Falha ao registrar auditoria da decisão ${decision} ` +
          `na pendência ${pendingId}:`,
        auditError?.message,
      );
    }

    return updated;
  }

  // =================================================================
  // 📝 AUDITORIA — trilha de compliance
  // =================================================================
  /**
   * Lista as últimas ações da Aurora (e do humano revisando).
   * @param limit - quantidade máxima (padrão 50, máx 200)
   */
  async listAudit(companyId: string, limit = 50) {
    const safeLimit = Math.min(Math.max(limit, 1), 200);
    return this.prisma.automationAudit.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: safeLimit,
    });
  }

  // =================================================================
  // ▶️ DISPARO MANUAL — Botão "Rodar agora"
  // =================================================================
  /**
   * Dispara uma skill sob demanda (usada pelo botão "Rodar agora").
   * Wrapper sobre o JobRunnerService para manter a API coesa.
   *
   * @param companyId - Tenant
   * @param skillKey - Qual skill executar (RECONCILIATION, CLASSIFICATION...)
   * @param userId - Quem disparou (auditoria)
   */
  async runSkillNow(companyId: string, skillKey: string, userId: string) {
    return this.jobRunner.runSkill(companyId, skillKey as any, 'MANUAL', userId);
  }
  // =================================================================
  // 📊 RELATÓRIOS MENSAIS (FD-2 final)
  // =================================================================

  /**
   * Lista todos os relatórios do tenant, com filtros opcionais.
   * Ordena por período decrescente (mais recente primeiro).
   */
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
          select: {
            id: true,
            companyName: true,
            cnpj: true,
            serviceType: true,
            monthlyFee: true,
          },
        },
      },
      orderBy: { period: 'desc' },
    });

    return { value: reports, count: reports.length };
  }

  /**
   * Faz o download do PDF do relatório (stream direto do filesystem).
   * Retorna 404 se o relatório não pertencer ao tenant ou o arquivo não existir.
   */
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
      `attachment; filename="relatorio-${report.period}-${report.clientId.slice(0, 8)}.pdf"`,
    );
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  }

  /**
   * Gera o relatório de 1 cliente específico (modo manual da skill).
   * Reutiliza a MonthlyReportSkill com params.clientId.
   */
  async generateReportForClient(
    companyId: string,
    userId: string,
    clientId: string,
    year?: number,
    month?: number,
  ) {
    // Cria um run de auditoria para este disparo manual
    const worker = await this.prisma.robotWorker.findFirst({
      where: { companyId },
    });
    if (!worker) {
      throw new Error('RobotWorker não encontrado para o tenant');
    }

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
        skillKey: 'MONTHLY_REPORT',   // 🆕 exigido pelo SkillContext
        triggeredBy: userId,          // 🆕 exigido pelo SkillContext
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

      await this.audit.log({
        companyId,
        actor: `USER_${userId}`,
        action: 'SKILL_FINISHED:MONTHLY_REPORT',
        entity: 'AutomationRun',
        entityId: run.id,
        detail: { ...result, period: result.detail?.period },
      });

      return {
        runId: run.id,
        status: result.itemsFailed > 0 ? 'PARTIAL' : 'SUCCESS',
        result,
      };
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
  // 📥 NFS-e (FD-3a)
  // =================================================================

  /**
   * Salva o XML na caixa de entrada da Aurora.
   * Nome do arquivo carrega tenant + clientId opcional:
   *   {companyId}_{clientId|auto}_{timestamp}.xml
   */
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

  /**
   * Lista NFS-e do tenant (com cliente vinculado, se houver).
   */
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
}
// =================================================================
// FIM: backend/src/digital-employee/digital-employee.service.ts
// =================================================================