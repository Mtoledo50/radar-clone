import { Controller, Get, Param, Post } from '@nestjs/common';
import { ProposalsService } from './proposals.service';

/**
 * 🌐 Controller PÚBLICO (sem autenticação)
 * Permite que clientes visualizem propostas via link compartilhado
 */
@Controller('public/proposals')
export class PublicProposalsController {
  constructor(private readonly service: ProposalsService) {}

  @Get(':slug')
  async findBySlug(@Param('slug') slug: string) {
    return { success: true, data: await this.service.findBySlug(slug) };
  }

  @Post(':slug/whatsapp-click')
  async trackWhatsAppClick(@Param('slug') slug: string) {
    await this.service.trackWhatsAppClick(slug);
    return { success: true, message: 'Clique registrado' };
  }
}