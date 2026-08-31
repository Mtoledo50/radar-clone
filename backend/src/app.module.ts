// =================================================================
// INÍCIO: backend/src/app.module.ts
// =================================================================
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthModule } from './health/health.module';


// Core
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';

// User Management & Admin (Governança e Multi-Tenant)
import { UsersModule } from './users/users.module'; // ✅ CORREÇÃO: Importação local
import { CompanyModule } from './company/company.module';
import { AdminModule } from './admin/admin.module';

// People & HR
import { EmployeeModule } from './employee/employee.module';
import { TurnoverModule } from './turnover/turnover.module';

// Clients & Commercial
import { ClientModule } from './client/client.module';
import { ClientImportModule } from './client/client-import.module';
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

// Operational Fiscal & Banking
import { FiscalModule } from './fiscal/fiscal.module';
import { BankingModule } from './banking/banking.module';

// 🆕 Digital Employee (FD-1) — Aurora
import { DigitalEmployeeModule } from './digital-employee/digital-employee.module';
import { TaxModule } from './tax/tax.module'; // 🆕 FD-4

// 🆕 Aurora FD-5 + FD-8 (batch atual)
import { LegalModule } from './legal/legal.module';
import { BillingModule } from './billing/billing.module';

// 🆕 Fase E — Notificações
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    // 1. Core (Infraestrutura base)
    PrismaModule,
    HealthModule,
    ScheduleModule.forRoot(), // Deve ser importado apenas uma vez, no nível raiz

    // 2. Autenticação e Dashboard
    AuthModule,
    DashboardModule,

    // 3. Governança, Multi-Tenant e Usuários
    UsersModule,      // ✅ Módulo de gestão de usuários, roles e senhas
    CompanyModule,
    AdminModule,

    // 4. Pessoas e RH
    EmployeeModule,
    TurnoverModule,

    // 5. Clientes e Comercial
    ClientModule,
    ClientImportModule,
    CommercialPlansModule,
    PricingModule,
    PricingCalculatorModule,
    ProposalsModule,

    // 6. Contábil e BI
    AccountingModule,
    BiModule,

    // 7. Planejamento Estratégico
    PlanningModule,

    // 8. Gestão Operacional
    TasksModule,
    ProjectsModule,

    // 9. Fiscal e Bancário
    FiscalModule,
    BankingModule,

    // 10. Funcionário Digital (Aurora) e Obrigações
    DigitalEmployeeModule,
    TaxModule,
    LegalModule,
    BillingModule,

    // 11. Notificações
    NotificationsModule,
  ],
})
export class AppModule {}
// =================================================================
// FIM: backend/src/app.module.ts
// =================================================================