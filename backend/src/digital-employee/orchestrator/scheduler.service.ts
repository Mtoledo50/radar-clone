// =================================================================
// INÍCIO: backend/src/digital-employee/orchestrator/scheduler.service.ts
// =================================================================
// SchedulerService — Agenda os crons das skills habilitadas.
//
// Ao inicializar o módulo (onModuleInit):
//  1. Busca todos os RobotWorker com status ACTIVE
//  2. Para cada skill enabled, registra o cron no SchedulerRegistry
//  3. Quando o cron dispara, chama o JobRunnerService
//
// 🆕 Sprint FD-1: apenas registra o skeleton. Cron real será ligado
// na FD-2 quando testarmos em produção controlada.
// =================================================================
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { PrismaService } from '../../prisma/prisma.service';
import { JobRunnerService } from './job-runner.service';

@Injectable()
export class SchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly jobRunner: JobRunnerService,
  ) {}

  async onModuleInit() {
    // Por segurança na FD-1, NÃO registramos crons automáticos ainda.
    // O agendamento será ativado manualmente pela UI ou pelo endpoint
    // "Rodar agora". Na FD-2 ligamos os crons após validação em dev.
    this.logger.log('SchedulerService inicializado (modo FD-1: crons desabilitados por segurança).');
    this.logger.log('Use POST /digital-employee/skills/:skillKey/run para disparar manualmente.');
  }

  /**
   * Registra um cron para uma skill específica.
   * Método público para ser chamado quando o usuário liga a skill pela UI.
   */
  registerCron(companyId: string, skillKey: string, cronExpr: string): void {
    const jobName = `aurora:${companyId}:${skillKey}`;

    // Remove cron anterior se existir (para o caso de reconfiguração)
    if (this.schedulerRegistry.doesExist('cron', jobName)) {
      this.schedulerRegistry.deleteCronJob(jobName);
    }

    const job = new CronJob(cronExpr, async () => {
      try {
        this.logger.log(`[Cron] Disparando ${skillKey} para ${companyId}`);
        await this.jobRunner.runSkill(companyId, skillKey as any, 'CRON', 'SYSTEM');
      } catch (error) {
        this.logger.error(`[Cron] Falha em ${skillKey}/${companyId}: ${error?.message}`);
      }
    });

    this.schedulerRegistry.addCronJob(jobName, job);
    job.start();
    this.logger.log(`Cron registrado: ${jobName} = "${cronExpr}"`);
  }

  /**
   * Remove o cron de uma skill (quando o usuário desliga pela UI).
   */
  unregisterCron(companyId: string, skillKey: string): void {
    const jobName = `aurora:${companyId}:${skillKey}`;
    if (this.schedulerRegistry.doesExist('cron', jobName)) {
      this.schedulerRegistry.deleteCronJob(jobName);
      this.logger.log(`Cron removido: ${jobName}`);
    }
  }
}
// =================================================================
// FIM: scheduler.service.ts
// =================================================================