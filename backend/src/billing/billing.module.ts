/**
 * =================================================================
 * BillingModule — Registro NestJS (FD-5 + Fase 5)
 * =================================================================
 * 🧠 JwtModule registrado aqui pq o JwtAuthGuard injeta JwtService.
 * 🆕 Fase 5: NotificationDispatcherService registrado p/ o
 * BillingService injetar o dispatcher de envios (ADR-086).
 * =================================================================
 */

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationDispatcherService } from './notifications/notification-dispatcher.service';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'radar-clone-super-secret-key-2026-mude-em-producao',
      signOptions: { expiresIn: process.env.JWT_EXPIRATION || '7d' },
    }),
  ],
  controllers: [BillingController],
  providers: [BillingService, NotificationDispatcherService],
  exports: [BillingService],
})
export class BillingModule {}