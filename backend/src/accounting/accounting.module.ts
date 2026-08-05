// =================================================================
// INÍCIO: accounting.module.ts
// =================================================================
import { Module } from '@nestjs/common';
import { AccountingController } from './accounting.controller';
import { AccountingService } from './accounting.service';
import { ImportController } from './import.controller';
import { ImportService } from './import.service';
import { ReconciliationController } from './reconciliation.controller';
import { ReconciliationService } from './reconciliation.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    PrismaModule,
    MulterModule.register({ dest: './uploads' }),
  ],
  controllers: [
    AccountingController,
    ImportController,
    ReconciliationController,
  ],
  providers: [
    AccountingService,
    ImportService,
    ReconciliationService,
  ],
  exports: [AccountingService, ImportService, ReconciliationService],
})
export class AccountingModule {}
// =================================================================
// FIM: accounting.module.ts
// =================================================================