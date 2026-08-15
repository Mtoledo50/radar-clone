// =================================================================
// INÍCIO: backend/src/digital-employee/digital-employee.module.ts
// =================================================================
// DigitalEmployeeModule — registro do módulo Aurora no NestJS (FD-1).
// Versão expandida: inclui orquestrador, auditoria e skills.
// =================================================================
import { Module, OnModuleInit } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DigitalEmployeeController } from './digital-employee.controller';
import { DigitalEmployeeService } from './digital-employee.service';
import { AutomationAuditService } from './audit/automation-audit.service';
import { JobRunnerService } from './orchestrator/job-runner.service';
import { SchedulerService } from './orchestrator/scheduler.service';
import { ReconciliationSkill } from './skills/reconciliation.skill';
import { BankingModule } from '../banking/banking.module';
import { PrismaService } from '../prisma/prisma.service';
import { BankingReconcileService } from '../banking/banking-reconcile.service';

@Module({
  imports: [ScheduleModule.forRoot(), BankingModule],
  controllers: [DigitalEmployeeController],
  providers: [
    DigitalEmployeeService,
    AutomationAuditService,
    JobRunnerService,
    SchedulerService,
      // Skills (instanciadas via factory para receber as dependências)
    {
      provide: ReconciliationSkill,
      useFactory: (
        prisma: PrismaService,
        audit: AutomationAuditService,
        reconcileService: BankingReconcileService,
      ) => {
        return new ReconciliationSkill(prisma, audit, reconcileService);
      },
      inject: [PrismaService, AutomationAuditService, BankingReconcileService],
    },
  ],
  exports: [DigitalEmployeeService, JobRunnerService],
})
export class DigitalEmployeeModule implements OnModuleInit {
  constructor(
    private readonly jobRunner: JobRunnerService,
    private readonly reconciliationSkill: ReconciliationSkill,
  ) {}

  onModuleInit() {
    // Registra as skills no runner para que possam ser disparadas
    this.jobRunner.registerSkill(this.reconciliationSkill);
    // Demais skills serão registradas quando criadas (FD-2+)
  }
}
// =================================================================
// FIM: digital-employee.module.ts
// =================================================================