import { Controller, Get, Put, Param, Body, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private prisma: PrismaService) {}

  // 🔒 Middleware manual para garantir que só ADMIN acessa
  private checkAdmin(req: any) {
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Acesso restrito ao Administrador do Sistema.');
    }
  }

  @Get('companies')
  async getCompanies(@Request() req) {
    this.checkAdmin(req);
    return this.prisma.company.findMany({
      include: { users: { select: { id: true, name: true, email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Put('companies/:id')
  async updateCompany(@Param('id') id: string, @Body() body: any, @Request() req) {
    this.checkAdmin(req);
    return this.prisma.company.update({
      where: { id },
      data: {
        plan: body.plan,
        allowedModules: body.allowedModules, // Array de strings
      },
    });
  }

  @Get('users')
  async getUsers(@Request() req) {
    this.checkAdmin(req);
    return this.prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, companyId: true, company: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Put('users/:id/role')
  async updateUserRole(@Param('id') id: string, @Body() body: any, @Request() req) {
    this.checkAdmin(req);
    return this.prisma.user.update({
      where: { id },
      data: { role: body.role }, // 'ADMIN' ou 'CLIENTE'
    });
  }
}