import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('accounting/template')
@UseGuards(JwtAuthGuard)
export class AccountTemplateController {
  constructor(private readonly prisma: PrismaService) {}

  // 📋 Lista o plano (opcional: só analíticas)
  @Get()
  async list(@Query('analytical') analytical?: string) {
    const data = await this.prisma.accountTemplate.findMany({
      where: analytical === 'true' ? { isSynthetic: false } : {},
      orderBy: { code: 'asc' },
    });
    return { success: true, data };
  }

  // 🔎 Resolve códigos reduzidos → contas (para o motor de sugestão)
  @Get('resolve')
  async resolve(@Query('codes') codes?: string) {
    const list = (codes || '')
      .split(',')
      .map((c) => parseInt(c, 10))
      .filter((n) => !isNaN(n));

    const accounts = await this.prisma.accountTemplate.findMany({
      where: { reducedCode: { in: list } },
    });

    const map: Record<number, any> = {};
    accounts.forEach((a) => (map[a.reducedCode] = a));
    return { success: true, data: map };
  }
}