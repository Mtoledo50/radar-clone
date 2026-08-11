import { Module } from '@nestjs/common';

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

// Operational Management (NOVO)
import { TasksModule } from './tasks/tasks.module';
import { ProjectsModule } from './projects/projects.module';

// Operational Fiscal (NOVO)
import { FiscalModule } from './fiscal/fiscal.module';
import { BankingModule } from './banking/banking.module';
import { ClientImportModule } from './client/client-import.module';

@Module({
  imports: [
    // Core
    PrismaModule,
    AuthModule,

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
    
    FiscalModule,
    BankingModule,
    ClientImportModule,
  ],
})
export class AppModule {}
