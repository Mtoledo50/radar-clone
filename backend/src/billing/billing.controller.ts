// =================================================================
// INÍCIO: backend/src/billing/billing.controller.ts
// =================================================================
/**
 * 🎛️ BillingController — FD-5 + Fase 4b + Fase 6
 *
 * Rotas:
 *  - BillingInstruction: CRUD + status + 🆕 vínculo client
 *  - CNAB: remessa, upload retorno, arquivos, movimentos, process
 *  - Régua: regras (CRUD/toggle), executar, eventos (pendentes,
 *    todos, aprovar, enviar, 🆕 override destinatário)
 *
 * 🧠 ADR-084: tudo protegido por JwtAuthGuard + multi-tenant
 *    via @CurrentUser (companyId vem do token, nunca do body).
 */
import {
  Body, Controller, Delete, Get, Param, Patch, Post,
  UploadedFile, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { CnabFormato } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { BillingService } from './billing.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  // ═══════════════ BILLING INSTRUCTION ═══════════════

  @Get()
  list(@CurrentUser() user: { companyId: string }) {
    return this.billingService.list(user.companyId);
  }

  @Post()
  create(
    @CurrentUser() user: { companyId: string },
    @Body()
    dto: {
      clientName: string;
      document?: string;
      amount: number;
      dueDate: string;
      clientId?: string | null; // 🆕 Fase 6: vínculo explícito opcional
    },
  ) {
    return this.billingService.create(user.companyId, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: { companyId: string }, @Param('id') id: string) {
    return this.billingService.remove(user.companyId, id);
  }

  @Patch(':id/status')
  setStatus(
    @CurrentUser() user: { companyId: string },
    @Param('id') id: string,
    @Body('status') status: 'ENVIADA' | 'PAGA',
  ) {
    return this.billingService.setStatus(user.companyId, id, status);
  }

  /** 🆕 Fase 6: vincula/desvincula client na cobrança (ADR-087). */
  @Patch(':id/client')
  linkClient(
    @CurrentUser() user: { companyId: string },
    @Param('id') id: string,
    @Body('clientId') clientId: string | null,
  ) {
    return this.billingService.linkClient(user.companyId, id, clientId);
  }

  // ═══════════════ CNAB ═══════════════

  @Post('generate-cnab')
  generateCnab(@CurrentUser() user: { companyId: string }) {
    return this.billingService.generateCnab(user.companyId);
  }

  @Post('retorno/upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadRetorno(
    @CurrentUser() user: { companyId: string },
    @UploadedFile() file: Express.Multer.File,
    @Body('formato') formato: CnabFormato,
    @Body('banco') banco: string,
  ) {
    // latin1 preserva bytes crus do CNAB (arquivos bancários não são UTF-8)
    return this.billingService.uploadRetorno(
      user.companyId,
      file.buffer.toString('latin1'),
      formato,
      banco || 'bb',
    );
  }

  @Get('arquivos')
  listArquivos(@CurrentUser() user: { companyId: string }) {
    return this.billingService.listArquivos(user.companyId);
  }

  @Get('arquivos/:arquivoId/movimentos')
  listMovimentos(
    @CurrentUser() user: { companyId: string },
    @Param('arquivoId') arquivoId: string,
  ) {
    return this.billingService.listMovimentos(user.companyId, arquivoId);
  }

  @Post('movimento/process')
  processMovimento(
    @CurrentUser() user: { companyId: string },
    @Body()
    dto: {
      movimentoId: string;
      observacao?: string;
      bankTransactionId?: string;
      clientId?: string;
    },
  ) {
    return this.billingService.processMovimento(
      user.companyId,
      dto.movimentoId,
      dto.observacao,
      dto.bankTransactionId,
      dto.clientId,
    );
  }

  // ═══════════════ RÉGUA DE COBRANÇA ═══════════════

  @Get('regras')
  listRegras(@CurrentUser() user: { companyId: string }) {
    return this.billingService.listCobrancaRegras(user.companyId);
  }

  @Post('regras')
  createRegra(
    @CurrentUser() user: { companyId: string },
    @Body()
    dto: {
      nome: string;
      diasAposVencimento: number;
      canal: 'EMAIL' | 'WHATSAPP' | 'SMS';
      templateMensagem: string;
      requerAprovacao?: boolean;
      ordem?: number;
    },
  ) {
    return this.billingService.createCobrancaRegra(user.companyId, dto);
  }

  @Patch('regras/:id')
  updateRegra(
    @CurrentUser() user: { companyId: string },
    @Param('id') id: string,
    @Body()
    dto: {
      nome?: string;
      diasAposVencimento?: number;
      canal?: 'EMAIL' | 'WHATSAPP' | 'SMS';
      templateMensagem?: string;
      requerAprovacao?: boolean;
      ordem?: number;
    },
  ) {
    return this.billingService.updateCobrancaRegra(user.companyId, id, dto);
  }

  @Patch('regras/:id/toggle')
  toggleRegra(@CurrentUser() user: { companyId: string }, @Param('id') id: string) {
    return this.billingService.toggleCobrancaRegra(user.companyId, id);
  }

  @Post('executar-regua')
  executarRegua(@CurrentUser() user: { companyId: string }) {
    return this.billingService.executarRegua(user.companyId);
  }

  @Get('eventos/pendentes')
  eventosPendentes(@CurrentUser() user: { companyId: string }) {
    return this.billingService.listCobrancaEventosPendentes(user.companyId);
  }

  @Get('eventos')
  listEventos(@CurrentUser() user: { companyId: string }) {
    return this.billingService.listCobrancaEventos(user.companyId);
  }

  /** 🆕 Fase 6: override humano do destinatário (ADR-087). */
  @Patch('eventos/:id/destinatario')
  setDestinatario(
    @CurrentUser() user: { companyId: string },
    @Param('id') id: string,
    @Body('destinatario') destinatario: string,
  ) {
    return this.billingService.setEventoDestinatario(user.companyId, id, destinatario);
  }

  @Post('eventos/:id/aprovar')
  aprovarEvento(
    @CurrentUser() user: { companyId: string; id: string },
    @Param('id') id: string,
    @Body() dto: { aprovado: boolean; motivoRejeicao?: string },
  ) {
    return this.billingService.aprovarEvento(
      user.companyId,
      id,
      dto.aprovado,
      user.id,
      dto.motivoRejeicao,
    );
  }

  @Post('eventos/:id/enviar')
  enviarEvento(@CurrentUser() user: { companyId: string }, @Param('id') id: string) {
    return this.billingService.enviarEvento(user.companyId, id);
  }
}
// =================================================================
// FIM: backend/src/billing/billing.controller.ts
// =================================================================