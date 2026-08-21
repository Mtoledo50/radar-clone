// =================================================================
// INÍCIO: backend/src/dashboard/dashboard.controller.ts
// =================================================================
import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

interface UserPayload {
  id: string;
  companyId: string;
  email: string;
  role: string;
}

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('metrics')
  async getMetrics(@CurrentUser() user: UserPayload) {
    const data = await this.service.getMetrics(user.companyId);
    return { success: true, data };
  }
}
// =================================================================
// FIM: backend/src/dashboard/dashboard.controller.ts
// =================================================================