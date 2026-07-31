import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CompanyModule } from './company/company.module'; // <-- Adicione esta linha

@Module({
  imports: [PrismaModule, AuthModule],
  imports: [PrismaModule, AuthModule, CompanyModule], // <-- Adicione CompanyModule aqui
})
export class AppModule {}