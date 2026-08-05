import { Controller, Get, Post, Param } from '@nestjs/common';
import { ProposalsService } from './proposals.service';

/**
 * =================================================================
 * 🌐 PublicProposalsController — Acesso Público (Sem Autenticação)
 * =================================================================
 * Permite que o CLIENTE DO ESCRITÓRIO (que não tem conta no sistema)
 * visualize a proposta comercial via link compartilhado.
 * 
 * ⚠️ IMPORTANTE: Este controller NÃO usa JwtAuthGuard propositalmente.
 * A segurança vem do slug não-sequencial e do fato de expormos apenas
 * dados da proposta (não dados sensíveis do sistema).
 * 
 * Endpoints:
 * - GET  /public/proposals/:slug              → Busca proposta
 * - POST /public/proposals/:slug/view         → Registra visualização
 * - POST /public/proposals/:slug/whatsapp     → Registra clique WhatsApp
 * =================================================================
 */
@Controller('public/proposals')
export class PublicProposalsController {
  constructor(private readonly service: ProposalsService) {}

  /**
   * 📄 Busca proposta pelo slug (página pública)
   */
  @Get(':slug')
  async findBySlug(@Param('slug') slug: string) {
    return { success: true, data: await this.service.findBySlug(slug) };
  }

  /**
   * 👁️ Registra visualização da proposta (tracking)
   */
  @Post(':slug/view')
  async trackView(@Param('slug') slug: string) {
    await this.service.trackView(slug);
    return { success: true };
  }

  /**
   * 💬 Registra clique no botão WhatsApp (tracking)
   */
  @Post(':slug/whatsapp')
  async trackWhatsAppClick(@Param('slug') slug: string) {
    await this.service.trackWhatsAppClick(slug);
    return { success: true };
  }
}