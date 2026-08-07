import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { IcmsService } from '../services/icms.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

/**
 * =================================================================
 * 🧮 IcmsController — Apuração de ICMS Mensal
 * =================================================================
 * Gerencia o fechamento mensal do ICMS (créditos das compras × débitos 
 * das vendas) por empresa (tenant) e opcionalmente por cliente.
 * 
 * 🆕 Sprint 8: Todas as operações suportam `clientId` para apurar
 * o ICMS de cada cliente separadamente.
 * 
 * 📌 Endpoints:
 *   GET  /fiscal/icms                  → Resumo anual (12 meses)
 *   GET  /fiscal/icms/detail           → Detalhe de um mês específico
 *   PUT  /fiscal/icms                  → Salvar débitos manuais
 *   POST /fiscal/icms/close            → Fechar o mês (trava edição)
 *   POST /fiscal/icms/reopen           → Reabrir mês para ajustes
 * 
 * 🛡️ Regras fiscais:
 * - Mês FECHADO não pode ser editado (integridade do SPED)
 * - Créditos são recalculados automaticamente das NF-e de entrada
 * - Débitos são informados manualmente (vendas × alíquota)
 * =================================================================
 */
@Controller('fiscal/icms')
@UseGuards(JwtAuthGuard)
export class IcmsController {
  constructor(private readonly icmsService: IcmsService) {}

  /**
   * GET /fiscal/icms?year=
   * 
   * Resumo anual dos 12 meses com totais de créditos, débitos e saldo.
   * Usado pela grade visual da tela de apuração.
   * 
   * @param year - Ano de referência (padrão: ano atual)
   * @param clientId - 🆕 Sprint 8: filtra apuração por cliente
   * 
   * @returns {
   *   year, totalCredits, totalDebits, totalBalance,
   *   months: [ { month, creditsIcms, debitsIcms, balance, status } ]
   * }
   */
  @Get()
  yearSummary(
    @Request() req,
    @Query('year') year?: string,
    @Query('clientId') clientId?: string, // 🆕 Sprint 8
  ) {
    return this.icmsService.getYearSummary(
      req.user.companyId,
      Number(year) || new Date().getFullYear(),
      clientId,
    );
  }

  /**
   * GET /fiscal/icms/detail?year=&month=
   * 
   * Detalhe completo de um mês específico: lista das NF-e que geraram
   * crédito + valores de débito informados manualmente.
   * 
   * @param year - Ano de referência
   * @param month - Mês (1-12)
   * @param clientId - 🆕 Sprint 8: filtra por cliente
   * 
   * @returns {
   *   year, month,
   *   invoices: NF-e[], // que geraram crédito
   *   creditsIcms, salesValue, debitRate, debitsIcms, balance,
   *   status: 'ABERTA' | 'FECHADA'
   * }
   * 
   * ⚠️ Declarada como 'detail' (literal) ANTES de qualquer rota :id.
   */
  @Get('detail')
  detail(
    @Request() req,
    @Query('year') year?: string,
    @Query('month') month?: string,
    @Query('clientId') clientId?: string, // 🆕 Sprint 8
  ) {
    return this.icmsService.getDetail(
      req.user.companyId,
      Number(year) || new Date().getFullYear(),
      Number(month) || new Date().getMonth() + 1,
      clientId,
    );
  }

  /**
   * PUT /fiscal/icms
   * 
   * Salva os débitos manuais do mês (vendas × alíquota).
   * Cria ou atualiza a apuração. Recalcula o saldo automaticamente.
   * 
   * @param body - { year, month, salesValue, debitRate, observations?, clientId? }
   * @throws BadRequestException se o mês estiver FECHADO
   * 
   * 🛡️ Regra fiscal: não permite editar mês já fechado (proteção SPED).
   */
  @Put()
  save(@Request() req, @Body() body: any) {
    return this.icmsService.save(req.user.companyId, {
      year: Number(body.year),
      month: Number(body.month),
      salesValue: Number(body.salesValue ?? 0),
      debitRate: Number(body.debitRate ?? 0),
      observations: body.observations,
      clientId: body.clientId, // 🆕 Sprint 8
    });
  }

  /**
   * POST /fiscal/icms/close
   * 
   * Fecha o mês, travando futuras edições (compliance fiscal).
   * Se a apuração não existir, é criada automaticamente com valores zerados.
   * 
   * @param body - { year, month, clientId? }
   * @returns Apuração atualizada com status = 'FECHADA' e closedAt preenchido
   */
  @Post('close')
  close(@Request() req, @Body() body: any) {
    return this.icmsService.close(
      req.user.companyId,
      Number(body.year),
      Number(body.month),
      body.clientId, // 🆕 Sprint 8
    );
  }

  /**
   * POST /fiscal/icms/reopen
   * 
   * Reabre um mês anteriormente fechado, permitindo ajustes.
   * Use com cautela — ideal apenas para correções antes da transmissão ao SPED.
   * 
   * @param body - { year, month, clientId? }
   * @returns Apuração com status = 'ABERTA' e closedAt = null
   */
  @Post('reopen')
  reopen(@Request() req, @Body() body: any) {
    return this.icmsService.reopen(
      req.user.companyId,
      Number(body.year),
      Number(body.month),
      body.clientId, // 🆕 Sprint 8
    );
  }
}