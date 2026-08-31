import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string) {
    return this.prisma.user.findMany({
      where: { companyId, deletedAt: null }, // ✅ Só usuários ativos
      select: { id: true, name: true, email: true, role: true, mustChangePassword: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true, companyId: true, mustChangePassword: true },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado.');
    return user;
  }

  async create(createUserDto: CreateUserDto, companyId: string, requesterRole: string) {
    if (requesterRole !== 'SUPER_ADMIN' && requesterRole !== 'ADMIN') {
      throw new BadRequestException('Permissão negada para criar usuários.');
    }

    const existingUser = await prismaCheckActiveEmail(this.prisma, createUserDto.email);
    if (existingUser) throw new ConflictException('E-mail já está em uso.');

    const plainPassword = createUserDto.password || 'Mudar@123456';
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    return this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
        companyId,
        mustChangePassword: !createUserDto.password,
      },
      select: { id: true, name: true, email: true, role: true },
    });
  }

  async update(id: string, companyId: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.findFirst({ where: { id, companyId, deletedAt: null } });
    if (!user) throw new NotFoundException('Usuário não encontrado.');

    if (updateUserDto.role && updateUserDto.role !== 'ADMIN' && user.role === 'ADMIN') {
      const adminCount = await this.prisma.user.count({ where: { companyId, role: 'ADMIN', deletedAt: null } });
      if (adminCount <= 1) {
        throw new BadRequestException('A empresa deve ter pelo menos um administrador.');
      }
    }

    return this.prisma.user.update({ where: { id }, data: updateUserDto });
  }

  async resetPassword(id: string, companyId: string) {
    const user = await this.prisma.user.findFirst({ where: { id, companyId, deletedAt: null } });
    if (!user) throw new NotFoundException('Usuário não encontrado.');

    const tempPassword = 'Mudar@' + Math.random().toString(36).slice(-6).toUpperCase();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword, mustChangePassword: true },
    });

    return { tempPassword };
  }

  // 🆕 NOVO: Exclusão lógica (Soft Delete) com travas de segurança
  async remove(id: string, companyId: string, requesterId: string) {
    // Trava 1: Ninguém pode excluir a si mesmo (evita auto-lockout)
    if (id === requesterId) {
      throw new BadRequestException('Você não pode excluir o próprio usuário.');
    }

    // Trava 2: Isolamento multi-tenant + usuário ativo
    const user = await this.prisma.user.findFirst({ where: { id, companyId, deletedAt: null } });
    if (!user) throw new NotFoundException('Usuário não encontrado.');

    // Trava 3: Protege o último ADMIN da empresa
    if (user.role === 'ADMIN') {
      const adminCount = await this.prisma.user.count({
        where: { companyId, role: 'ADMIN', deletedAt: null },
      });
      if (adminCount <= 1) {
        throw new BadRequestException('A empresa deve ter pelo menos um administrador ativo.');
      }
    }

    // Soft Delete: marca como excluído e libera o e-mail para reuso futuro
    await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        email: `${user.email}__deletado_${Date.now()}`, // Libera a constraint @unique do e-mail
      },
    });

    return { message: `Usuário ${user.name} removido com sucesso.` };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado.');

    if (!user.mustChangePassword) {
      if (!dto.currentPassword) throw new BadRequestException('Informe a senha atual.');
      const valid = await bcrypt.compare(dto.currentPassword, user.password);
      if (!valid) throw new UnauthorizedException('Senha atual incorreta.');
    }

    this.validatePasswordStrength(dto.newPassword);

    const hashed = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashed, mustChangePassword: false },
    });

    return { message: 'Senha alterada com sucesso.' };
  }

  private validatePasswordStrength(password: string) {
    const rules = [
      { ok: password.length >= 8, msg: 'A senha deve ter no mínimo 8 caracteres.' },
      { ok: /[A-Z]/.test(password), msg: 'A senha deve conter ao menos uma letra maiúscula.' },
      { ok: /[a-z]/.test(password), msg: 'A senha deve conter ao menos uma letra minúscula.' },
      { ok: /[0-9]/.test(password), msg: 'A senha deve conter ao menos um número.' },
    ];
    for (const rule of rules) {
      if (!rule.ok) throw new BadRequestException(rule.msg);
    }
  }
}

// Helper: verifica e-mail apenas entre usuários ATIVOS
function prismaCheckActiveEmail(prisma: any, email: string) {
  return prisma.user.findFirst({ where: { email, deletedAt: null } });
}