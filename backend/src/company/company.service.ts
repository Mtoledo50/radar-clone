// =================================================================
// INÍCIO: backend/src/company/company.service.ts
// =================================================================
/**
 * =================================================================
 * CompanyService — Perfil da Empresa + Branding (Sprint A5)
 * =================================================================
 * Duas responsabilidades distintas (atenção aos models Prisma):
 *
 * 1. PERFIL (CompanyProfile) — dados de onboarding/mentoria:
 *    razão social, CNPJ, metas, visão, softwares.
 *    Métodos: getProfile / createProfile / updateProfile.
 *
 * 2. BRANDING (Company) — identidade visual white-label:
 *    primaryColor, secondaryColor, proposalFooterText, logoUrl.
 *    Métodos: getBranding / updateBranding.
 *
 * 🧠 ADR-043: branding null = fallback Conta Certa aplicado no
 *    getBranding (frontend nunca precisa decidir a cor padrão).
 * =================================================================
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateBrandingDto } from './dto/update-branding.dto';

@Injectable()
export class CompanyService {
  constructor(private prisma: PrismaService) {}

  // =================================================================
  // 📋 PERFIL DA EMPRESA (CompanyProfile)
  // =================================================================

  /**
   * Busca o perfil da empresa pelo ID do usuário logado.
   * Retorna { id: null } se não existir (frontend renderiza vazio).
   */
  async getProfile(userId: string) {
    const profile = await this.prisma.companyProfile.findUnique({
      where: { userId },
    });
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
   * Upsert garante funcionamento mesmo se o registro foi removido.
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

  // =================================================================
  // 🎨 SPRINT A5 — BRANDING (white-label)
  // =================================================================

  /**
   * 🎨 Retorna o branding do escritório logado COM FALLBACK.
   *
   * 🧠 ADR-043: se o tenant nunca personalizou, devolvemos as cores
   * padrão Conta Certa — o frontend não precisa tratar o padrão.
   * `isCustomized` permite ao UI mostrar selo "identidade própria".
   */
  async getBranding(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        primaryColor: true,
        secondaryColor: true,
        proposalFooterText: true,
      },
    });

    if (!company) return null;

    return {
      companyName: company.name,
      logoUrl: company.logoUrl,
      primaryColor: company.primaryColor || '#0d9488',     // fallback teal
      secondaryColor: company.secondaryColor || '#f97316', // fallback laranja
      proposalFooterText: company.proposalFooterText,
      isCustomized: Boolean(company.primaryColor || company.logoUrl),
    };
  }

  /**
   * 💾 Atualiza cores/texto do branding (PATCH — só ADMIN no controller).
   *
   * 🧠 Normalização: string vazia vira null → volta ao fallback (ADR-043).
   * Campos não enviados ficam intactos (patch parcial).
   */
  async updateBranding(companyId: string, dto: UpdateBrandingDto) {
    const data: any = {};
    if (dto.primaryColor !== undefined) data.primaryColor = dto.primaryColor || null;
    if (dto.secondaryColor !== undefined) data.secondaryColor = dto.secondaryColor || null;
    if (dto.proposalFooterText !== undefined) {
      data.proposalFooterText = dto.proposalFooterText?.trim() || null;
    }

    return this.prisma.company.update({
      where: { id: companyId },
      data,
      select: {
        id: true,
        primaryColor: true,
        secondaryColor: true,
        proposalFooterText: true,
      },
    });
  }
}
// =================================================================
// FIM: backend/src/company/company.service.ts
// =================================================================