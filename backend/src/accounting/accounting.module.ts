/**
 * =================================================================
 * 📒 MÓDULO DE CONTABILIDADE
 * =================================================================
 * 
 * Responsável por:
 * - Gestão de contas contábeis (plano de contas)
 * - Gestão de lançamentos contábeis
 * - Importação de extratos bancários
 * - Conciliação bancária automática (NOVO!)
 */

import { Module } from '@nestjs/common';
import { AccountingController } from './accounting.controller';
import { AccountingService } from './accounting.service';
import { AccountingImportController } from './import.controller';
import { AccountingImportService } from './import.service';
import { ReconciliationController } from './reconciliation.controller'; // 🔥 NOVO
import { ReconciliationService } from './reconciliation.service';       // 🔥 NOVO
import { PrismaModule } from '../prisma/prisma.module';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    PrismaModule,
    MulterModule.register({
      dest: './uploads', // Pasta temporária para uploads
    }),
  ],
  controllers: [
    AccountingController, 
    AccountingImportController,
    ReconciliationController // 🔥 NOVO
  ],
  providers: [
    AccountingService, 
    AccountingImportService,
    ReconciliationService // 🔥 NOVO
  ],
  exports: [
    AccountingService, 
    AccountingImportService,
    ReconciliationService // 🔥 NOVO
  ],
})
export class AccountingModule {}