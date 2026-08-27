import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module'; // 🚨 Importando o AuthModule para ter acesso ao JwtService

@Module({
  imports: [
    PrismaModule,
    AuthModule, // 🚨 O AuthModule DEVE estar aqui para que o @UseGuards(JwtAuthGuard) funcione neste controller
  ],
  providers: [NotificationsService],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}