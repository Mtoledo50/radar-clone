// =================================================================
// INÍCIO: backend/src/digital-employee/digital-employee.module.ts
// =================================================================
// DigitalEmployeeModule — agora registra as 4 skills no orquestrador:
//   1. ReconciliationSkill    (conciliação Banco × NF-e)
//   2. ClassificationSkill    (classificação com memória)
//   3. AccountingBridgeSkill  (ponte Bancário → Contábil)
//   4. MonthlyReportSkill 🆕  (relatório mensal em PDF)
//
// As skills NÃO são @Injectable() — são instanciadas via useFactory
// para receberem as dependências corretas (Prisma + Audit + Motor).
// =================================================================
import { Module, OnModuleInit } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DigitalEmployeeController } from './digital-employee.controller';
import { DigitalEmployeeService } from './digital-employee.service';
import { AutomationAuditService } from './audit/automation-audit.service';
import { JobRunnerService } from './orchestrator/job-runner.service';
import { SchedulerService } from './orchestrator/scheduler.service';
import { ReconciliationSkill } from './skills/reconciliation.skill';
import { ClassificationSkill } from './skills/classification.skill';
import { AccountingBridgeSkill } from './skills/accounting-bridge.skill';
import { MonthlyReportSkill } from './skills/monthly-report.skill';
import { BankingModule } from '../banking/banking.module';
import { AccountingModule } from '../accounting/accounting.module';
import { PrismaService } from '../prisma/prisma.service';
import { BankingReconcileService } from '../banking/banking-reconcile.service';
import { BankingService } from '../banking/banking.service';
import { AccountingService } from '../accounting/accounting.service';

@Module({
  // ScheduleModule: infraestrutura de cron (@nestjs/schedule)
  // BankingModule / AccountingModule: motores existentes reutilizados
  imports: [ScheduleModule.forRoot(), BankingModule, AccountingModule],
  controllers: [DigitalEmployeeController],
  providers: [
    DigitalEmployeeService,
    AutomationAuditService,
    JobRunnerService,
    SchedulerService,

    // -----------------------------------------------------------------
    // SKILL 1 — Conciliação Banco × NF-e (FD-1)
    // -----------------------------------------------------------------
    {
      provide: ReconciliationSkill,
      useFactory: (
        prisma: PrismaService,
        audit: AutomationAuditService,
        reconcileService: BankingReconcileService,
      ) => new ReconciliationSkill(prisma, audit, reconcileService),
      inject: [PrismaService, AutomationAuditService, BankingReconcileService],
    },

    // -----------------------------------------------------------------
    // SKILL 2 — Classificação com Memória (FD-2)
    // -----------------------------------------------------------------
    {
      provide: ClassificationSkill,
      useFactory: (
        prisma: PrismaService,
        audit: AutomationAuditService,
        bankingService: BankingService,
      ) => new ClassificationSkill(prisma, audit, bankingService),
      inject: [PrismaService, AutomationAuditService, BankingService],
    },

    // -----------------------------------------------------------------
    // SKILL 3 — Ponte Bancário → Contábil (FD-2)
    // -----------------------------------------------------------------
    {
      provide: AccountingBridgeSkill,
      useFactory: (
        prisma: PrismaService,
        audit: AutomationAuditService,
        accountingService: AccountingService,
      ) => new AccountingBridgeSkill(prisma, audit, accountingService),
      inject: [PrismaService, AutomationAuditService, AccountingService],
    },

    // -----------------------------------------------------------------
    // SKILL 4 — Relatório mensal em PDF (FD-2 final) 🆕
    // -----------------------------------------------------------------
    {
      provide: MonthlyReportSkill,
      useFactory: (
        prisma: PrismaService,
        audit: AutomationAuditService,
      ) => new MonthlyReportSkill(prisma, audit),
      inject: [PrismaService, AutomationAuditService],
    },
  ],
  exports: [DigitalEmployeeService, JobRunnerService],
})
export class DigitalEmployeeModule implements OnModuleInit {
  constructor(
    private readonly jobRunner: JobRunnerService,
    private readonly reconciliationSkill: ReconciliationSkill,
    private readonly classificationSkill: ClassificationSkill,
    private readonly accountingBridgeSkill: AccountingBridgeSkill,
    private readonly monthlyReportSkill: MonthlyReportSkill, // 🆕 FD-2 final
  ) {}

  /**
   * Ao iniciar o módulo, registra as 4 skills no orquestrador.
   * Agora o botão "Rodar agora" e os crons podem disparar qualquer uma.
   */
  onModuleInit() {
    this.jobRunner.registerSkill(this.reconciliationSkill);
    this.jobRunner.registerSkill(this.classificationSkill);
    this.jobRunner.registerSkill(this.accountingBridgeSkill);
    this.jobRunner.registerSkill(this.monthlyReportSkill); // 🆕
  }
}
// =================================================================
// FIM: digital-employee.module.ts
// =================================================================