// =================================================================
// INÍCIO: backend/src/company/company.service.ts
// =================================================================
/**
 * =================================================================
 * CompanyService — Perfil + Branding + Software Stack + Benchmark
 * =================================================================
 * Sprints: A5 (branding) + C1 (benchmark de softwares).
 *
 * Responsabilidades:
 * 1. PERFIL (CompanyProfile) — onboarding/visão estratégica.
 *    Métodos: getProfile / createProfile / updateProfile.
 * 2. BRANDING (Company) — cores/logo/rodapé das propostas.
 *    Métodos: getBranding / updateBranding.
 * 3. SOFTWARE STACK (Company.softwareStack) — persistência real dos
 *    softwares que o escritório usa. Fonte da verdade do Benchmark.
 *    Métodos: getSoftwareStack / updateSoftwareStack.
 * 4. BENCHMARK (ADR-052) — compara o stack do tenant com a rede
 *    real + catálogo curado v1.
 *    Método: getSoftwareBenchmark.
 *
 * 🧠 ADRs:
 * - ADR-043: branding null = fallback Conta Certa.
 * - ADR-052: benchmark híbrido (rede ≥10 / híbrido 1-9 / catálogo 0).
 * =================================================================
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateBrandingDto } from './dto/update-branding.dto';
import { computeSoftwareBenchmark } from './domain/software-benchmark';
// 🆕 Sprint C2: motor de benchmark de serviços extras
import { computeExtraServicesBenchmark } from './domain/extra-services-benchmark';
@Injectable()
export class CompanyService {
  constructor(private prisma: PrismaService) {}

  // =================================================================
  // 📋 PERFIL DA EMPRESA (CompanyProfile — onboarding/visão)
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
  // 🎨 SPRINT A5 — BRANDING (white-label das propostas públicas)
  // =================================================================

  /**
   * 🎨 Retorna o branding do escritório logado COM FALLBACK.
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

  // =================================================================
  // 🆕 SPRINT C1 — SOFTWARE STACK (Company.softwareStack)
  // =================================================================

  /**
   * 📥 GET /company/software-stack
   * Retorna o array "categoria:valor" salvo na Company do tenant.
   * Fonte da verdade do Benchmark de Mercado (C1) e da memória da UI.
   */
  async getSoftwareStack(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { softwareStack: true },
    });
    return company?.softwareStack ?? [];
  }

  /**
   * 💾 PATCH /company/software-stack
   * Substitui o stack inteiro (sanitiza: só strings não-vazias).
   * É AQUI que a página "Minha Empresa" ganha memória de atualização.
   */
  async updateSoftwareStack(companyId: string, softwareStack: string[]) {
    const clean = Array.isArray(softwareStack)
      ? softwareStack.filter((s) => typeof s === 'string' && s.trim() !== '')
      : [];
    const updated = await this.prisma.company.update({
      where: { id: companyId },
      data: { softwareStack: clean },
      select: { softwareStack: true },
    });
    return updated.softwareStack;
  }

  // =================================================================
  // 🆕 SPRINT C1 — BENCHMARK DE SOFTWARES (ADR-052)
  // =================================================================

  /**
   * 🎯 getSoftwareBenchmark — "o que o mercado usa vs. o que você usa?"
   *
   * 1. Extrai o stack do tenant logado (Company.softwareStack).
   * 2. Coleta os stacks de OUTROS tenants ativos (rede real).
   * 3. Roda o motor `computeSoftwareBenchmark` (domínio puro — ADR-052):
   *    - source 'rede'     → amostra real ≥ 10 escritórios
   *    - source 'hibrido'  → 1–9 escritórios
   *    - source 'catalogo' → 0 (catálogo curado v1, fallback)
   *
   * Zero tabelas novas; 100% derivado em memória dos dados existentes.
   */
  async getSoftwareBenchmark(companyId: string) {
    // 1) Stack do tenant logado (Company.softwareStack)
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { softwareStack: true },
    });
    const youStack = this.parseSoftwareStack(company?.softwareStack || []);

    // 2) Stacks de OUTROS tenants ativos (rede real p/ benchmark híbrido)
    const others = await this.prisma.company.findMany({
      where: {
        id: { not: companyId },
        deletedAt: null,
      },
      select: { softwareStack: true },
    });
    const networkStacks = others
      .map((c) => this.parseSoftwareStack(c.softwareStack || []))
      .filter((stack) => stack.length > 0);

    // 3) Motor de domínio puro (ADR-052)
    return computeSoftwareBenchmark(youStack, networkStacks);
  }

  /**
   * 🔧 Helper privado: parseia o array "categoria:valor" do banco
   * para array plano de nomes de software (ex.: "Domínio").
   * Ignora entradas marcadas como "NÃO_UTILIZADO".
   */
  private parseSoftwareStack(raw: string[]): string[] {
    return raw
      .map((entry) => {
        const parts = entry.split(':');
        const value = parts.slice(1).join(':');
        return value;
      })
      .filter((v) => v && v !== 'NÃO_UTILIZADO' && v.trim() !== '');
  }
  // =================================================================
  // 🆕 SPRINT C2 — BENCHMARK DE SERVIÇOS EXTRAS (ADR-053)
  // =================================================================

  /**
   * 🎯 getExtraServicesBenchmark — "quanto você deixa na mesa?"
   *
   * 1. Lê todos os ServiceItem ATIVOS do tenant (name + basePrice).
   * 2. Cruza com o catálogo curado v1 (keywords normalizadas).
   * 3. Deriva coverage, potencial mensal e insights.
   *
   * Zero tabelas novas; 100% derivado em memória dos ServiceItem.
   */
  async getExtraServicesBenchmark(companyId: string) {
    // 1) Lê ServiceItem ativos do tenant
    const items = await this.prisma.serviceItem.findMany({
      where: { companyId, isActive: true },
      select: { name: true, basePrice: true },
    });

    // 2) Adapta p/ o motor (Decimal → number)
    const ownServices = items.map((item) => ({
      name: item.name,
      price: typeof item.basePrice === 'number'
        ? item.basePrice
        : Number(item.basePrice), // Prisma Decimal → number
    }));

    // 3) Motor de domínio puro (ADR-053)
    return computeExtraServicesBenchmark(ownServices);
  }

}
// =================================================================
// FIM: backend/src/company/company.service.ts
// =================================================================