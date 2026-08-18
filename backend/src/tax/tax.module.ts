// =================================================================
// TaxModule — registra o TaxGuidesService + reexporta p/ DigitalEmployeeModule
// =================================================================
import { Module } from '@nestjs/common';
import { TaxGuidesService } from './tax-guides.service';
import { PrismaService } from '../prisma/prisma.service';
import { AutomationAuditService } from '../digital-employee/audit/automation-audit.service';

@Module({
  providers: [TaxGuidesService, PrismaService, AutomationAuditService],
  exports: [TaxGuidesService],
})
export class TaxModule {}
// =================================================================