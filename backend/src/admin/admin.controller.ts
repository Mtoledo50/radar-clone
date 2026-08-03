import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Request, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import * as bcrypt from 'bcryptjs';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private prisma: PrismaService) {}

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
        allowedModules: body.allowedModules,
      },
    });
  }

  // 🔥 NOVO: Deletar Empresa (com proteção e limpeza de usuários)
  @Delete('companies/:id')
  async deleteCompany(@Param('id') id: string, @Request() req) {
    this.checkAdmin(req);

    // 🛡️ Proteção 1: Impedir deleção da empresa padrão (sua própria empresa)
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) {
      throw new BadRequestException('Empresa não encontrada.');
    }

    if (company.name.includes('Escritório Padrão') || company.id === '00000000-0000-0000-0000-000000000001') {
      throw new BadRequestException('Não é possível deletar a empresa padrão do sistema.');
    }

    // 🛡️ Proteção 2: Impedir que o admin delete a empresa onde ele mesmo está
    if (req.user.companyId === id) {
      throw new BadRequestException('Você não pode deletar a empresa da qual faz parte.');
    }

    // 🧹 Limpeza: Deletar todos os usuários vinculados à empresa primeiro
    await this.prisma.user.deleteMany({ where: { companyId: id } });

    // Deletar a empresa
    await this.prisma.company.delete({ where: { id } });

    return { success: true, message: 'Empresa e usuários associados removidos com sucesso.' };
  }

  @Post('onboard')
  async onboardClient(@Body() body: any, @Request() req) {
    this.checkAdmin(req);

    // Verificar se o e-mail já existe
    const existingUser = await this.prisma.user.findUnique({ where: { email: body.email } });
    if (existingUser) {
      throw new BadRequestException('Já existe um usuário com este e-mail.');
    }

    const company = await this.prisma.company.create({
      data: {
        name: body.companyName,
        cnpj: body.cnpj || null,
        plan: body.plan || 'BASIC',
        allowedModules: body.allowedModules || ['dashboard', 'pessoas', 'clientes'],
      },
    });

    const hashedPassword = await bcrypt.hash(body.password, 10);
    const user = await this.prisma.user.create({
      data: {
        name: body.userName,
        email: body.email,
        password: hashedPassword,
        role: 'CLIENTE',
        companyId: company.id,
      },
    });

    return { success: true, company, user };
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
      data: { role: body.role },
    });
  }

  // 🔥 NOVO: Deletar Usuário
  @Delete('users/:id')
  async deleteUser(@Param('id') id: string, @Request() req) {
    this.checkAdmin(req);

    // 🛡️ Proteção: Não permitir que o admin delete a si mesmo
    if (req.user.id === id) {
      throw new BadRequestException('Você não pode deletar o seu próprio usuário.');
    }

    await this.prisma.user.delete({ where: { id } });
    return { success: true, message: 'Usuário removido com sucesso.' };
  }
}