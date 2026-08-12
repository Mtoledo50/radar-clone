// =================================================================
// banking.module.ts — Módulo Bancário (Sprints 21–29)
// =================================================================
import { Module } from '@nestjs/common';
import { BankingController } from './banking.controller';
import { BankingService } from './banking.service';
import { BankingReconcileService } from './banking-reconcile.service'; // 🆕 Sprint 29

@Module({
  controllers: [BankingController],
  // 🆕 Sprint 29: BankingReconcileService registrado para injeção no controller
  providers: [BankingService, BankingReconcileService],
})
export class BankingModule {}