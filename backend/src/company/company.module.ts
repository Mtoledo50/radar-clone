// =================================================================
// INÍCIO: backend/src/company/company.module.ts
// =================================================================
import { Module } from '@nestjs/common';
import { CompanyController } from './company.controller';
import { CustomIndicatorController } from './custom-indicator.controller';
import { CompanyService } from './company.service';
import { CustomIndicatorService } from './custom-indicator.service';
import { ScoreService } from './score.service'; // 🆕 Sprint C4

@Module({
  controllers: [CompanyController, CustomIndicatorController],
  providers: [CompanyService, CustomIndicatorService, ScoreService],
  exports: [CompanyService, CustomIndicatorService, ScoreService],
})
export class CompanyModule {}
// =================================================================
// FIM: backend/src/company/company.module.ts
// =================================================================