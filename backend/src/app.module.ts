import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CompanyModule } from './company/company.module';
import { EmployeeModule } from './employee/employee.module';
import { ClientModule } from './client/client.module'; // <-- ADICIONE
import { PricingModule } from './pricing/pricing.module'; // <-- ADICIONE
import { PlanningModule } from './planning/planning.module'; // <-- NOVO
import { BiModule } from './bi/bi.module'; // <-- ADICIONE ESTA LINHA
import { TurnoverModule } from './turnover/turnover.module';
import { AdminModule } from './admin/admin.module'; // 🔥 NOVO IMPORT
import { CommercialPlansModule } from './commercial-plans/commercial-plans.module';
import { PricingCalculatorModule } from './pricing-calculator/pricing-calculator.module';
import { ProposalsModule } from './proposals/proposals.module';
@Module({
  imports: [PrismaModule, AuthModule, CompanyModule, EmployeeModule, ClientModule, PricingModule, PlanningModule, BiModule, TurnoverModule, AdminModule, CommercialPlansModule, PricingCalculatorModule, ProposalsModule], // 🔥 ADICIONE AdminModule E CommercialPlansModule AQUI
})
export class AppModule {}