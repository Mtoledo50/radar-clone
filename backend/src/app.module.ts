// =================================================================
// INÍCIO: backend/src/app.module.ts
// Módulo raiz da aplicação. Organiza e registra todos os módulos e controllers.
// =================================================================

import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

// 1. Infraestrutura e Core
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';

// 2. Autenticação e Governança
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CompanyModule } from './company/company.module';
import { AdminModule } from './admin/admin.module';

// 3. Gestão de Pessoas e Clientes
import { EmployeeModule } from './employee/employee.module';
import { TurnoverModule } from './turnover/turnover.module';
import { ClientModule } from './client/client.module';
import { ClientImportModule } from './client/client-import.module';
import { ClientPortalModule } from './client-portal/client-portal.module';

// 4. Comercial, Propostas e Pricing
import { CommercialPlansModule } from './commercial-plans/commercial-plans.module';
import { PricingModule } from './pricing/pricing.module';
import { PricingCalculatorModule } from './pricing-calculator/pricing-calculator.module';
import { ProposalsModule } from './proposals/proposals.module';

// 5. Operações Contábeis, Fiscais e Bancárias
import { AccountingModule } from './accounting/accounting.module';
import { FiscalModule } from './fiscal/fiscal.module';
import { BankingModule } from './banking/banking.module';
import { TaxModule } from './tax/tax.module'; // FD-4

// 6. BI e Planejamento Estratégico
import { BiModule } from './bi/bi.module';
import { PlanningModule } from './planning/planning.module';

// 7. Gestão Operacional (Tarefas e Projetos)
import { TasksModule } from './tasks/tasks.module';
import { ProjectsModule } from './projects/projects.module';

// 8. Funcionário Digital (Aurora) e Jurídico
import { DigitalEmployeeModule } from './digital-employee/digital-employee.module';
import { LegalModule } from './legal/legal.module';
import { BillingModule } from './billing/billing.module';

// 9. Comunicação
import { ComunicadosModule } from './comunicados/comunicados.module';

// 10. 🆕 Novos Recursos (F13 - Tracking)
import { TrackingController } from './tracking/tracking.controller';
// F14 (Backend da Memória)
import { MemoriaController } from './memoria/memoria.controller';

import { AnaliseController } from './analise/analise.controller';
@Module({
  imports: [
    // --- Infraestrutura ---
    PrismaModule,
    ScheduleModule.forRoot(), // Agendador de tarefas (deve ser importado apenas uma vez na raiz)
    HealthModule,             // Health Check (ADR-088)

    // --- Autenticação e Governança ---
    AuthModule,
    UsersModule,
    CompanyModule,
    AdminModule,

    // --- Pessoas e Clientes ---
    EmployeeModule,
    TurnoverModule,
    ClientModule,
    ClientImportModule,
    ClientPortalModule,

    // --- Comercial e Pricing ---
    CommercialPlansModule,
    PricingModule,
    PricingCalculatorModule,
    ProposalsModule,

    // --- Contábil, Fiscal e Bancário ---
    AccountingModule,
    FiscalModule,
    BankingModule,
    TaxModule,

    // --- BI e Planejamento ---
    BiModule,
    PlanningModule,

    // --- Operacional ---
    TasksModule,
    ProjectsModule,

    // --- Aurora e Jurídico ---
    DigitalEmployeeModule,
    LegalModule,
    BillingModule,

    // --- Comunicação ---
    ComunicadosModule,

    // Nota: Módulos como ReportsModule ou EmailModule podem ser descomentados e adicionados aqui quando forem utilizados.
  ],
  
  controllers: [
    // 🆕 F13: Controller de Webhooks de Tracking
    // IMPORTANTE: Controllers devem ficar SEMPRE neste array, NUNCA no array de 'imports'
    TrackingController,
    MemoriaController, // 👈 adicione esta linha
    AnaliseController, // 👈 adicione esta linha
  ],
  
  // providers: [], // Adicionar providers globais aqui se necessário no futuro
})
export class AppModule {}

// =================================================================
// FIM: backend/src/app.module.ts
// =================================================================