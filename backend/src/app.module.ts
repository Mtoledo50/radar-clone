// =================================================================
// INÍCIO: backend/src/app.module.ts
// =================================================================
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DashboardModule } from './dashboard/dashboard.module';

// Core
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';

// Tenant & Admin
import { CompanyModule } from './company/company.module';
import { AdminModule } from './admin/admin.module';

// People & HR
import { EmployeeModule } from './employee/employee.module';
import { TurnoverModule } from './turnover/turnover.module';

// Clients & Commercial
import { ClientModule } from './client/client.module';
import { CommercialPlansModule } from './commercial-plans/commercial-plans.module';
import { PricingModule } from './pricing/pricing.module';
import { PricingCalculatorModule } from './pricing-calculator/pricing-calculator.module';
import { ProposalsModule } from './proposals/proposals.module';

// Accounting & BI
import { AccountingModule } from './accounting/accounting.module';
import { BiModule } from './bi/bi.module';

// Strategic Planning
import { PlanningModule } from './planning/planning.module';

// Operational Management
import { TasksModule } from './tasks/tasks.module';
import { ProjectsModule } from './projects/projects.module';

// Operational Fiscal
import { FiscalModule } from './fiscal/fiscal.module';
import { BankingModule } from './banking/banking.module';
import { ClientImportModule } from './client/client-import.module';

// 🆕 Digital Employee (FD-1) — Aurora
import { DigitalEmployeeModule } from './digital-employee/digital-employee.module';
import { TaxModule } from './tax/tax.module'; // 🆕 FD-4

// 🆕 Aurora FD-5 + FD-8 (batch atual)
import { LegalModule } from './legal/legal.module';
import { BillingModule } from './billing/billing.module';

@Module({
  imports: [
    // Core
    PrismaModule,
    AuthModule,
    DashboardModule, 

    // 🆕 Aurora — Legalização & Cobrança (FD-5 + FD-8)
    LegalModule,
    BillingModule,

    // Tenant & Admin
    CompanyModule,
    AdminModule,

    // People & HR
    EmployeeModule,
    TurnoverModule,

    // Clients & Commercial
    ClientModule,
    CommercialPlansModule,
    PricingModule,
    PricingCalculatorModule,
    ProposalsModule,

    // Accounting & BI
    AccountingModule,
    BiModule,

    // Strategic Planning
    PlanningModule,

    // Operational Management
    TasksModule,
    ProjectsModule,

    // Fiscal & Banking
    FiscalModule,
    BankingModule,
    ClientImportModule,

    // 🆕 Digital Employee (FD-1) — Aurora
    ScheduleModule.forRoot(),
    DigitalEmployeeModule,
    TaxModule, // 🆕 FD-4
  ],
})
export class AppModule {}
// =================================================================
// FIM: backend/src/app.module.ts
// =================================================================