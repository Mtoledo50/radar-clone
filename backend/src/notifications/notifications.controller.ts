/**
 * =================================================================
 * NotificationsController — Endpoints REST
 * =================================================================
 * GET    /notifications          → lista (não lidas primeiro)
 * GET    /notifications/unread   → conta não lidas
 * PATCH  /notifications/:id/read → marca como lida
 * PATCH  /notifications/read-all → marca todas como lidas
 * POST   /notifications/seed     → gera notificações demo (apenas dev)
 * =================================================================
 */
import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: any) {
    return this.service.list(user.companyId);
  }

  @Get('unread')
  unread(@CurrentUser() user: any) {
    return this.service.countUnread(user.companyId);
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.markAsRead(id, user.companyId);
  }

  @Patch('read-all')
  markAllRead(@CurrentUser() user: any) {
    return this.service.markAllAsRead(user.companyId);
  }

  @Post('seed')
  seed(@CurrentUser() user: any) {
    return this.service.seedDemo(user.companyId);
  }
}