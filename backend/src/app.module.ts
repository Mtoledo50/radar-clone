import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CompanyModule } from './company/company.module';
import { EmployeeModule } from './employee/employee.module';
import { ClientModule } from './client/client.module'; // <-- ADICIONE
import { PricingModule } from './pricing/pricing.module'; // <-- ADICIONE
import { PlanningModule } from './planning/planning.module'; // <-- NOVO


@Module({
  imports: [PrismaModule, AuthModule, CompanyModule, EmployeeModule, ClientModule, PricingModule, PlanningModule],
})
export class AppModule {}