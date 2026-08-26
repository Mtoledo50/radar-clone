/**
 * =================================================================
 * BillingController — Endpoints REST de Cobrança e CNAB
 * =================================================================
 * Exposição dos métodos do BillingService via HTTP.
 * Todos endpoints exigem JWT (multi-tenant via companyId).
 *
 * Rotas:
 * - CRUD de BillingInstruction (compatibilidade frontend atual)
 * - Upload e processamento de retorno CNAB
 * - Régua de cobrança (CRUD de regras + eventos)
 * - Execução da régua (scheduler)
 *
 * ADR-084: Domínio puro + validação rigorosa + aprovação humana.
 * =================================================================
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CnabFormato } from '@prisma/client';
import {
  UploadRetornoDto,
  ProcessMovimentoDto,
  CreateCobrancaRegraDto,
  AprovarEventoDto,
  validarAprovacao,
} from './dto';

@Controller('billing')
@UseGuards(JwtAuthGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  // ═══════════════════════════════════════════════════════════════
  // BILLING INSTRUCTION (compatibilidade frontend atual)
  // ═══════════════════════════════════════════════════════════════

  /** Lista cobranças com status efetivo (deriva VENCIDA). */
  @Get()
  async list(@CurrentUser() user: { companyId: string }) {
    return this.billingService.list(user.companyId);
  }

  /** Cria cobrança manual (entrada explícita). */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: { companyId: string },
    @Body()
    dto: {
      clientName: string;
      document?: string;
      amount: number;
      dueDate: string;
    },
  ) {
    return this.billingService.create(user.companyId, dto);
  }

  /** Remove cobrança PENDENTE. */
  @Delete(':id')
  async remove(
    @CurrentUser() user: { companyId: string },
    @Param('id') id: string,
  ) {
    return this.billingService.remove(user.companyId, id);
  }

  /** Transição de status (ENVIADA/PAGA). */
  @Patch(':id/status')
  async setStatus(
    @CurrentUser() user: { companyId: string },
    @Param('id') id: string,
    @Body('status') status: 'ENVIADA' | 'PAGA',
  ) {
    if (!['ENVIADA', 'PAGA'].includes(status)) {
      throw new BadRequestException(`Status inválido: ${status}`);
    }
    return this.billingService.setStatus(user.companyId, id, status);
  }

  /** Gera remessa CNAB das cobranças PENDENTES. */
  @Post('generate-cnab')
  @HttpCode(HttpStatus.CREATED)
  async generateCnab(@CurrentUser() user: { companyId: string }) {
    return this.billingService.generateCnab(user.companyId);
  }

  // ═══════════════════════════════════════════════════════════════
  // 🆕 RETORNO CNAB (upload + parse + processamento)
  // ═══════════════════════════════════════════════════════════════

  /**
   * Upload de arquivo CNAB de retorno.
   *
   * Usa multipart/form-data:
   * - file: arquivo .txt/.ret (campo "file")
   * - formato: "CNAB_240" ou "CNAB_400"
   * - banco: "bb", "itau", "bradesco", "santander", "caixa"
   */
  @Post('retorno/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB máximo
      fileFilter: (_req, file, cb) => {
        // aceita .txt, .ret, .cnv
        const ext = file.originalname.toLowerCase();
        if (ext.endsWith('.txt') || ext.endsWith('.ret') || ext.endsWith('.cnv')) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Apenas arquivos .txt, .ret ou .cnv'), false);
        }
      },
    }),
  )
  @HttpCode(HttpStatus.CREATED)
  async uploadRetorno(
    @CurrentUser() user: { companyId: string },
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadRetornoDto,
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo CNAB é obrigatório');
    }

    // Converte encoding do arquivo (banco usa ISO-8859-1 ou Windows-1252)
    let conteudo: string;
    try {
      conteudo = file.buffer.toString('latin1');
    } catch {
      conteudo = file.buffer.toString('utf-8');
    }

    return this.billingService.uploadRetorno(
      user.companyId,
      conteudo,
      dto.formato as CnabFormato,
      dto.banco,
    );
  }

  /** Lista arquivos CNAB (remessas e retornos) da empresa. */
  @Get('arquivos')
  async listArquivos(@CurrentUser() user: { companyId: string }) {
    return this.billingService.listArquivos(user.companyId);
  }

  /** Lista movimentos de um arquivo específico. */
  @Get('arquivos/:arquivoId/movimentos')
  async listMovimentos(
    @CurrentUser() user: { companyId: string },
    @Param('arquivoId') arquivoId: string,
  ) {
    return this.billingService.listMovimentos(user.companyId, arquivoId);
  }

  /** Processa um movimento CNAB (aplica baixa). */
  @Post('movimento/process')
  async processMovimento(
    @CurrentUser() user: { companyId: string },
    @Body() dto: ProcessMovimentoDto,
  ) {
    return this.billingService.processMovimento(
      user.companyId,
      dto.movimentoId,
      dto.observacao,
      dto.bankTransactionId,
      dto.clientId,
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // 🆕 RÉGUA DE COBRANÇA (regras + eventos)
  // ═══════════════════════════════════════════════════════════════

  /** Lista regras de cobrança da empresa. */
  @Get('regras')
  async listRegras(@CurrentUser() user: { companyId: string }) {
    return this.billingService.listCobrancaRegras(user.companyId);
  }

  /** Cria uma regra de cobrança. */
  @Post('regras')
  @HttpCode(HttpStatus.CREATED)
  async createRegra(
    @CurrentUser() user: { companyId: string },
    @Body() dto: CreateCobrancaRegraDto,
  ) {
    return this.billingService.createCobrancaRegra(user.companyId, dto);
  }

  /** Atualiza uma regra existente. */
  @Patch('regras/:id')
  async updateRegra(
    @CurrentUser() user: { companyId: string },
    @Param('id') id: string,
    @Body() dto: Partial<CreateCobrancaRegraDto>,
  ) {
    return this.billingService.updateCobrancaRegra(user.companyId, id, dto);
  }

  /** Ativa/desativa uma regra. */
  @Patch('regras/:id/toggle')
  async toggleRegra(
    @CurrentUser() user: { companyId: string },
    @Param('id') id: string,
  ) {
    return this.billingService.toggleCobrancaRegra(user.companyId, id);
  }

  /** Lista eventos de cobrança pendentes de aprovação. */
  @Get('eventos/pendentes')
  async listEventosPendentes(@CurrentUser() user: { companyId: string }) {
    return this.billingService.listCobrancaEventosPendentes(user.companyId);
  }
  /** Histórico de eventos de cobrança (todos os status). */
  @Get('eventos')
  async listEventos(@CurrentUser() user: { companyId: string }) {
    return this.billingService.listCobrancaEventos(user.companyId);
  }
  /** Aprova ou rejeita um evento de cobrança. */
  @Post('eventos/:id/aprovar')
  async aprovarEvento(
    @CurrentUser() user: { id: string; companyId: string },
    @Param('id') id: string,
    @Body() dto: AprovarEventoDto,
  ) {
    try {
      validarAprovacao(dto);
    } catch (e) {
      throw new BadRequestException(e.message);
    }
    return this.billingService.aprovarEvento(
      user.companyId,
      id,
      dto.aprovado,
      user.id,
      dto.motivoRejeicao,
    );
  }

  /** Dispara um evento aprovado (envia email/WhatsApp). */
  @Post('eventos/:id/enviar')
  async enviarEvento(
    @CurrentUser() user: { companyId: string },
    @Param('id') id: string,
  ) {
    return this.billingService.enviarEvento(user.companyId, id);
  }

  /**
   * Executa a régua de cobrança.
   *
   * Este endpoint pode ser chamado manualmente ou por um cron job.
   * Verifica cobranças vencidas e cria eventos conforme as regras.
   */
  @Post('executar-regua')
  @HttpCode(HttpStatus.ACCEPTED)
  async executarRegua(@CurrentUser() user: { companyId: string }) {
    return this.billingService.executarRegua(user.companyId);
  }
}