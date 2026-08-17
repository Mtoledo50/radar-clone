// =================================================================
// banking.module.ts — Módulo Bancário (Sprints 21–29)
// =================================================================
import { Module } from '@nestjs/common';
import { BankingController } from './banking.controller';
import { BankingService } from './banking.service';
import { BankingReconcileService } from './banking-reconcile.service'; // 🆕 Sprint 29
import { BankingReviewService } from './banking-review.service'; // 🆕 Sprint 32


@Module({
  controllers: [BankingController],
  providers: [
    BankingService,
    BankingReconcileService,
    BankingReviewService, // 🆕 Sprint 32
  ],
  exports: [BankingReconcileService, BankingService], // 🆕 FD-2: BankingService para a ClassificationSkill
})
export class BankingModule {}