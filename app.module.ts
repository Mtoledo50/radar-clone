import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CompanyModule } from './company/company.module'; // <-- Adicione esta linha
import { CommercialPlansModule } from './commercial-plans/commercial-plans.module';

@Module({
  imports: [PrismaModule, AuthModule],
  imports: [PrismaModule, AuthModule, CompanyModule, CommercialPlansModule], // <-- Adicione CompanyModule e CommercialPlansModule aqui
})
export class AppModule {}