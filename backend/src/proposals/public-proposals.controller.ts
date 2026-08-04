import { Controller, Get, Post, Param } from '@nestjs/common';
import { ProposalsService } from './proposals.service';

/**
 * Controller PÚBLICO para visualização de propostas
 * NÃO requer autenticação JWT
 */
@Controller('proposals/public')
export class PublicProposalsController {
  constructor(private readonly service: ProposalsService) {}

  @Get(':slug')
  async findBySlug(@Param('slug') slug: string) {
    return { success: true, data: await this.service.findBySlug(slug) };
  }

  @Post(':slug/whatsapp-click')
  async trackWhatsAppClick(@Param('slug') slug: string) {
    await this.service.trackWhatsAppClick(slug);
    return { success: true };
  }
}