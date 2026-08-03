// =================================================================
// INÍCIO: company.service.ts
// =================================================================
/**
 * CompanyService
 * Gerencia o perfil da empresa (CompanyProfile) vinculado ao usuário.
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CompanyService {
  constructor(private prisma: PrismaService) {}

  /**
   * Busca o perfil da empresa pelo ID do usuário logado.
   */
  async getProfile(userId: string) {
    const profile = await this.prisma.companyProfile.findUnique({
      where: { userId },
    });
    
    // Retorna o perfil ou um objeto vazio com id null para o frontend lidar
    return profile || { id: null };
  }

  /**
   * Cria um novo perfil de empresa para o usuário.
   */
  async createProfile(userId: string, data: any) {
    return this.prisma.companyProfile.create({
      data: {
        userId,
        razaoSocial: data.razaoSocial,
        cnpj: data.cnpj,
        estado: data.estado,
        softwareConsultoria: data.softwareConsultoria,
        softwareContabil: data.softwareContabil,
        softwareFiscal: data.softwareFiscal,
        clientesHoje: data.clientesHoje,
        clientesAno: data.clientesAno,
        funcionariosHoje: data.funcionariosHoje,
        funcionariosAno: data.funcionariosAno,
        visaoEmpresa: data.visaoEmpresa,
        maiorDesafio: data.maiorDesafio,
        compromisso: data.compromisso,
      },
    });
  }

  /**
   * Atualiza (ou cria, se não existir) o perfil da empresa.
   * Usamos upsert para garantir que funcione mesmo se o registro for deletado.
   */
  async updateProfile(userId: string, data: any) {
    return this.prisma.companyProfile.upsert({
      where: { userId },
      update: {
        razaoSocial: data.razaoSocial,
        cnpj: data.cnpj,
        estado: data.estado,
        softwareConsultoria: data.softwareConsultoria,
        softwareContabil: data.softwareContabil,
        softwareFiscal: data.softwareFiscal,
        clientesHoje: data.clientesHoje,
        clientesAno: data.clientesAno,
        funcionariosHoje: data.funcionariosHoje,
        funcionariosAno: data.funcionariosAno,
        visaoEmpresa: data.visaoEmpresa,
        maiorDesafio: data.maiorDesafio,
        compromisso: data.compromisso,
      },
      create: {
        userId,
        razaoSocial: data.razaoSocial,
        cnpj: data.cnpj,
        estado: data.estado,
        softwareConsultoria: data.softwareConsultoria,
        softwareContabil: data.softwareContabil,
        softwareFiscal: data.softwareFiscal,
        clientesHoje: data.clientesHoje,
        clientesAno: data.clientesAno,
        funcionariosHoje: data.funcionariosHoje,
        funcionariosAno: data.funcionariosAno,
        visaoEmpresa: data.visaoEmpresa,
        maiorDesafio: data.maiorDesafio,
        compromisso: data.compromisso,
      },
    });
  }
}
// =================================================================
// FIM: company.service.ts
// =================================================================