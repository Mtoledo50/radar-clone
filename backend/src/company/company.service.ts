import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyProfileDto } from './dto/create-company-profile.dto';

@Injectable()
export class CompanyService {
  constructor(private prisma: PrismaService) {}

  /**
   * Cria ou atualiza o perfil da empresa para um usuário
   */
  async createOrUpdate(userId: string, dto: CreateCompanyProfileDto) {
    // Verifica se já existe um perfil para este usuário
    const existing = await this.prisma.companyProfile.findUnique({
      where: { userId },
    });

    if (existing) {
      // Se existe, atualiza
      return this.prisma.companyProfile.update({
        where: { userId },
        data: dto,
      });
    }

    // Se não existe, cria
    return this.prisma.companyProfile.create({
      data: {
        userId,
        ...dto,
      },
    });
  }

  /**
   * Busca o perfil da empresa de um usuário
   */
  async findByUserId(userId: string) {
    return this.prisma.companyProfile.findUnique({
      where: { userId },
    });
  }
}