// =================================================================
// INÍCIO: backend/src/digital-employee/orchestrator/job-runner.service.ts
// =================================================================
// JobRunnerService — Executor de skills.
//
// Responsabilidades:
//  1. Cria o AutomationRun (status RUNNING)
//  2. Executa a skill dentro de try/catch
//  3. Atualiza o run com as métricas (SUCCESS | PARTIAL | FAILED)
//  4. Atualiza o lastRunAt/lastRunId da skill
//  5. Registra auditoria da execução
// =================================================================
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AutomationAuditService } from '../audit/automation-audit.service';
import { BaseSkill } from '../skills/base.skill';
import { SkillKey, RunStatus } from '@prisma/client';

@Injectable()
export class JobRunnerService {
  // Registro das skills instanciadas (populado pelo DigitalEmployeeService)
  private readonly skills = new Map<SkillKey, BaseSkill>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AutomationAuditService,
  ) {}

  /**
   * Registra uma skill no runner. Chamado pelo DigitalEmployeeService
   * durante o onModuleInit.
   */
  registerSkill(skill: BaseSkill): void {
    this.skills.set(skill.key, skill);
  }

  /**
   * Retorna a instância da skill pela chave (útil para disparo manual).
   */
  getSkill(skillKey: SkillKey): BaseSkill | undefined {
    return this.skills.get(skillKey);
  }

  /**
   * Executa uma skill criando o AutomationRun correspondente.
   * Usado tanto pelo scheduler (cron) quanto pelo botão "Rodar agora".
   */
  async runSkill(
    companyId: string,
    skillKey: SkillKey,
    triggerType: 'CRON' | 'MANUAL' = 'CRON',
    triggeredBy: string = 'SYSTEM',
  ) {
    const skill = this.skills.get(skillKey);
    if (!skill) {
      throw new Error(`Skill ${skillKey} não registrada no JobRunner.`);
    }

    // Busca a skill configurada para este tenant
    const workerSkill = await this.prisma.robotWorkerSkill.findFirst({
      where: { companyId, skillKey },
    });
    if (!workerSkill) {
      throw new Error(`Skill ${skillKey} não configurada para o tenant.`);
    }

    // Busca o worker (para o foreign key)
    const worker = await this.prisma.robotWorker.findUnique({
      where: { companyId },
    });
    if (!worker) {
      throw new Error(`RobotWorker não encontrado para companyId=${companyId}.`);
    }

    // 1. Cria o AutomationRun em RUNNING
    const run = await this.prisma.automationRun.create({
      data: {
        companyId,
        workerId: worker.id,
        skillKey,
        triggerType,
        triggeredBy,
        status: 'RUNNING' as RunStatus,
      },
    });

    const startedAt = Date.now();

    try {
      // 2. Executa a skill
      const result = await skill.execute({
        companyId,
        skillKey,
        runId: run.id,
        triggeredBy,
        params: (workerSkill.params as Record<string, any>) || {},
      });

      // 3. Determina o status final
      let finalStatus: RunStatus = 'SUCCESS';
      if (result.itemsFailed > 0 && result.itemsProcessed === 0) {
        finalStatus = 'FAILED';
      } else if (result.itemsPendingHuman > 0 || result.itemsFailed > 0) {
        finalStatus = 'PARTIAL';
      }

      // 4. Atualiza o run com as métricas
      await this.prisma.automationRun.update({
        where: { id: run.id },
        data: {
          status: finalStatus,
          finishedAt: new Date(),
          itemsProcessed: result.itemsProcessed,
          itemsAutoApproved: result.itemsAutoApproved,
          itemsPendingHuman: result.itemsPendingHuman,
          itemsFailed: result.itemsFailed,
          secondsSaved: result.secondsSaved,
        },
      });

      // 5. Atualiza o lastRunAt/lastRunId da skill
      await this.prisma.robotWorkerSkill.update({
        where: { id: workerSkill.id },
        data: {
          lastRunAt: new Date(),
          lastRunId: run.id,
        },
      });

      // 6. Registra auditoria do run completo
      await this.audit.log({
        companyId,
        actor: 'AURORA',
        action: `SKILL_FINISHED:${skillKey}`,
        entity: 'AutomationRun',
        entityId: run.id,
        detail: {
          status: finalStatus,
          durationMs: Date.now() - startedAt,
          ...result,
        },
      });

      return { runId: run.id, status: finalStatus, result };
    } catch (error) {
      // Falha catastrófica: atualiza o run com FAILED
      await this.prisma.automationRun.update({
        where: { id: run.id },
        data: {
          status: 'FAILED' as RunStatus,
          finishedAt: new Date(),
          errorMessage: error?.message || 'Erro desconhecido',
        },
      });

      await this.audit.log({
        companyId,
        actor: 'AURORA',
        action: `SKILL_FAILED:${skillKey}`,
        entity: 'AutomationRun',
        entityId: run.id,
        detail: {
          error: error?.message,
          durationMs: Date.now() - startedAt,
        },
      });

      throw error;
    }
  }
}
// =================================================================
// FIM: job-runner.service.ts
// =================================================================