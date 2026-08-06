import { Module } from '@nestjs/common';
import { AccountingController } from './accounting.controller';
import { AccountingService } from './accounting.service';
import { ImportController } from './import.controller';
import { ImportService } from './import.service';
import { ReconciliationController } from './reconciliation.controller';
import { ReconciliationService } from './reconciliation.service';
import { HistoryController } from './history.controller';
import { HistoryService } from './history.service';
import { AccountTemplateController } from './template.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [PrismaModule, MulterModule.register({ dest: './uploads' })],
  controllers: [
    AccountingController,
    ImportController,
    ReconciliationController,
    HistoryController,         // ✅ Pipeline contábil
    AccountTemplateController, // ✅ Plano de contas padrão
  ],
  providers: [
    AccountingService,
    ImportService,
    ReconciliationService,
    HistoryService,            // ✅
  ],
  exports: [
    AccountingService,
    ImportService,
    ReconciliationService,
    HistoryService,
  ],
})
export class AccountingModule {}