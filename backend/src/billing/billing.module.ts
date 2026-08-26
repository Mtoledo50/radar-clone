/**
 * =================================================================
 * BillingModule — Registro NestJS (FD-5)
 * =================================================================
 * 🧠 Fix DI: o JwtAuthGuard injeta JwtService, então o JwtModule
 * precisa estar disponível no contexto deste módulo. Usamos
 * JwtModule.register com o MESMO secret do .env (idêntico ao
 * AuthModule) — sem alterar o AuthModule (zero risco).
 * =================================================================
 */

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    // 🆕 Disponibiliza JwtService p/ o JwtAuthGuard neste contexto
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'radar-clone-super-secret-key-2026-mude-em-producao',
      signOptions: { expiresIn: process.env.JWT_EXPIRATION || '7d' },
    }),
  ],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}