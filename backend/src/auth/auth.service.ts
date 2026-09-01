import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto & { companyId?: string }) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('E-mail já cadastrado');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // 🔥 DEFAULT: Se não passar companyId, usa a empresa Admin padrão (para não quebrar o registro)
    const defaultCompanyId = '00000000-0000-0000-0000-000000000001';

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        companyId: dto.companyId || defaultCompanyId,
        role: 'CLIENTE',
      },
      include: {
        company: true, // 🔥 Busca os dados da empresa para incluir no token
      },
    });

    const token = this.generateToken(user);

    return {
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        allowedModules: user.company?.allowedModules || []
      },
      token,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        company: true, // 🔥 ESSENCIAL: Busca o plano e módulos permitidos
      },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const token = this.generateToken(user);

    return {
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        allowedModules: user.company?.allowedModules || []
      },
      token,
    };
  }

  private generateToken(user: any) {
    // 🔥 PAYLOAD COMPLETO PARA O JwtStrategy e Guards funcionarem
    const payload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role,
      companyId: user.companyId,
      allowedModules: user.company?.allowedModules || [],
    };
    
    return this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_EXPIRATION || '7d',
    });
  }
}