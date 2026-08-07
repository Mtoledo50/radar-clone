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
 * Endpoints:
 *   GET  /fiscal/icms?year=            → resumo dos 12 meses
 *   GET  /fiscal/icms/detail?year=&month= → detalhe com notas de crédito
 *   PUT  /fiscal/icms                  → salvar débitos manuais
 *   POST /fiscal/icms/close            → fechar o mês
 *   POST /fiscal/icms/reopen           → reabrir o mês
 * =================================================================
 */
@Controller('fiscal/icms')
@UseGuards(JwtAuthGuard)
export class IcmsController {
  constructor(private readonly icmsService: IcmsService) {}

  @Get()
  yearSummary(@Request() req, @Query('year') year?: string) {
    return this.icmsService.getYearSummary(
      req.user.companyId,
      Number(year) || new Date().getFullYear(),
    );
  }

  @Get('detail')
  detail(
    @Request() req,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    return this.icmsService.getDetail(
      req.user.companyId,
      Number(year) || new Date().getFullYear(),
      Number(month) || new Date().getMonth() + 1,
    );
  }

  @Put()
  save(@Request() req, @Body() body: any) {
    return this.icmsService.save(req.user.companyId, {
      year: Number(body.year),
      month: Number(body.month),
      salesValue: Number(body.salesValue ?? 0),
      debitRate: Number(body.debitRate ?? 0),
      observations: body.observations,
    });
  }

  @Post('close')
  close(@Request() req, @Body() body: any) {
    return this.icmsService.close(
      req.user.companyId,
      Number(body.year),
      Number(body.month),
    );
  }

  @Post('reopen')
  reopen(@Request() req, @Body() body: any) {
    return this.icmsService.reopen(
      req.user.companyId,
      Number(body.year),
      Number(body.month),
    );
  }
}