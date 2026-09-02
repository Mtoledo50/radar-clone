// =================================================================
// backend/src/accounting/accounting.module.ts
// =================================================================
/**
 * @module AccountingModule
 * @description
 * Módulo central de contabilidade do SaaS.
 * Segrega responsabilidades entre ingestão de dados (PDF/CSV),
 * processamento (Ledger/TrialBalance) e reconciliação.
 * 
 * @architecture_notes
 * - Providers registrados garantem o ciclo de vida Singleton do NestJS.
 * - HttpModule adicionado para suportar integrações assíncronas (Webhooks/APIs de bancos).
 * - Multer configurado via ENV para suportar volumes persistentes em produção (S3/EFS).
 */
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Infrastructure
import { PrismaModule } from '../prisma/prisma.module';

// Domain: PDF Extraction
import { PdfExtractService } from './domain/pdf/pdf-extract.service';

// Controllers (Camada de Apresentação / API REST)
import { AccountingController } from './accounting.controller';
import { ImportController } from './import.controller';
import { ReconciliationController } from './reconciliation.controller';
import { HistoryController } from './history.controller';
import { AccountTemplateController } from './template.controller';
import { ClientWorkspaceController } from './client-workspace.controller';

// Application Services (Camada de Negócio / Use Cases)
import { AccountingService } from './accounting.service';
import { ImportService } from './import.service';
import { ReconciliationService } from './reconciliation.service';
import { HistoryService } from './history.service';
import { TrialBalanceService } from './trial-balance.service';
import { LedgerService } from './ledger.service';
import { SmartImportService } from './smart-import.service';
import { ClientWorkspaceService } from './client-workspace.service';

@Module({
  imports: [
    PrismaModule,
    
    // 🆕 Necessário para chamadas HTTP externas (ex: APIs de bancos, validação de CNPJ)
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),

    // 🛡️ SaaS Best Practice: Configuração dinâmica via ENV, não hardcoded.
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        dest: configService.get<string>('UPLOAD_DIR', './uploads'),
        limits: {
          fileSize: configService.get<number>('MAX_FILE_SIZE', 10 * 1024 * 1024), // 10MB default
        },
      }),
    }),
  ],
  
  controllers: [
    AccountingController,
    ImportController,
    ReconciliationController,
    HistoryController,
    AccountTemplateController,
    ClientWorkspaceController,
  ],
  
  providers: [
    // Core Business Logic
    AccountingService,
    ClientWorkspaceService, // 🐛 FIX: Estava faltando. Causaria crash no boot.
    
    // Import & Processing Pipeline
    ImportService,
    SmartImportService,
    PdfExtractService,
    
    // Financial Engines
    LedgerService,
    TrialBalanceService,
    ReconciliationService,
    HistoryService,
  ],
  
  exports: [
    // 📦 Exportamos os serviços que outros módulos do SaaS podem consumir
    // (ex: O BillingModule pode precisar do AccountingService para gerar faturas)
    AccountingService,
    ClientWorkspaceService,
    ImportService,
    SmartImportService,
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