// =================================================================
// INÍCIO: backend/src/digital-employee/digital-employee.service.ts
// =================================================================
// DigitalEmployeeService — Lógica de negócio da Aurora (Sprint FD-1).
//
// Responsabilidades:
//  - Criar a Aurora sob demanda (lazy) — 1 por tenant (ADR-004)
//  - Pausar/retomar o funcionário
//  - Agregar KPIs do dashboard
//  - Gerenciar skills (ligar/desligar, cron)
//  - Listar runs, pendências e auditoria
//  - Resolver pendências (aprovar/rejeitar) + ApprovalRecord
// =================================================================
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SkillKey, ApprovalDecision } from '@prisma/client';
import { JobRunnerService } from './orchestrator/job-runner.service';

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
    private readonly jobRunner: JobRunnerService, // 🆕 FD-3
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
   * Valida posse: a skill deve pertencer ao worker do tenant.
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

    return this.prisma.robotWorkerSkill.update({
      where: { id: skillId },
      data: {
        ...(data.enabled !== undefined ? { enabled: data.enabled } : {}),
        ...(data.cronExpr ? { cronExpr: data.cronExpr } : {}),
      },
    });
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
   * Sempre cria um ApprovalRecord (trava de transmissão — Regra de Ouro).
   *
   * @param userId - quem decidiu (auditoria)
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

    // Transação atômica: atualiza pendência + cria ApprovalRecord juntos
    return this.prisma.$transaction(async (tx) => {
      // 1. Atualiza a pendência para o status final
      const updated = await tx.automationPending.update({
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

      return updated;
    });
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
  async runSkillNow(
    companyId: string,
    skillKey: string,
    userId: string,
  ) {
    return this.jobRunner.runSkill(companyId, skillKey as any, 'MANUAL', userId);
  }
}
// =================================================================
// FIM: backend/src/digital-employee/digital-employee.service.ts
// =================================================================