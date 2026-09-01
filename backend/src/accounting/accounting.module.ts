// =================================================================
// INÍCIO: backend/src/accounting/accounting.module.ts
// =================================================================
/**
 * AccountingModule
 * ⚠️ REGRA NESTJS: controllers[] = @Controller() • providers[] = @Injectable()
 * 🆕 ETAPA 1: TrialBalanceService + LedgerService como PROVIDERS.
 */
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { PrismaModule } from '../prisma/prisma.module';
import { PdfExtractService } from './domain/pdf/pdf-extract.service';

import { AccountingController } from './accounting.controller';
import { ImportController } from './import.controller';
import { ReconciliationController } from './reconciliation.controller';
import { HistoryController } from './history.controller';
import { AccountTemplateController } from './template.controller';

import { AccountingService } from './accounting.service';
import { ImportService } from './import.service';
import { ReconciliationService } from './reconciliation.service';
import { HistoryService } from './history.service';
import { TrialBalanceService } from './trial-balance.service'; // 🆕 ETAPA 1
import { LedgerService } from './ledger.service'; // 🆕 ETAPA 1
import { SmartImportService } from './smart-import.service'; // 🆕 no topo

@Module({
  imports: [PrismaModule, MulterModule.register({ dest: './uploads' })],
  controllers: [
    AccountingController,
    ImportController,
    ReconciliationController,
    HistoryController,
    AccountTemplateController,
    
  ],
  providers: [
    AccountingService,
    ImportService,
    ReconciliationService,
    HistoryService,
    TrialBalanceService, // 🆕 services vão em PROVIDERS
    LedgerService,       // 🆕
    SmartImportService, // 🆕 ETAPA 2
    PdfExtractService,

  ],
  exports: [
    AccountingService,
    ImportService,
    ReconciliationService,
    HistoryService,
    TrialBalanceService,
    LedgerService,
  ],
})
export class AccountingModule {}
// =================================================================
// FIM: backend/src/accounting/accounting.module.ts
// =================================================================