import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { BankingService } from './banking.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * =================================================================
 * 🏦 BankingController — Fechamento Mensal (Sprint 21)
 * =================================================================
 * 📌 Endpoints:
 *   POST  /banking/import                 → importa extrato (CSV parseado)
 *   GET   /banking/statement              → transações + resumo DRE
 *   PATCH /banking/transactions/:id       → reclassifica (+ aprendizado)
 * =================================================================
 */
@Controller('banking')
@UseGuards(JwtAuthGuard)
export class BankingController {
  constructor(private readonly bankingService: BankingService) {}

  /**
   * POST /banking/import
   * Body: { clientId?, year, month, fileName?, rows: [{date, description, amount}] }
   */
  @Post('import')
  import(@Request() req, @Body() body: any) {
    return this.bankingService.importStatement(
      req.user.companyId,
      body.clientId ?? null,
      {
        year: Number(body.year),
        month: Number(body.month),
        fileName: body.fileName,
        rows: body.rows || [],
      },
    );
  }

  /**
   * GET /banking/statement?clientId&year&month
   */
  @Get('statement')
  statement(
    @Request() req,
    @Query('clientId') clientId?: string,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    return this.bankingService.getStatement(
      req.user.companyId,
      clientId || null,
      Number(year) || new Date().getFullYear(),
      Number(month) || new Date().getMonth() + 1,
    );
  }

  /**
   * PATCH /banking/transactions/:id
   * Body: { nature, learn? }
   */
  @Patch('transactions/:id')
  reclassify(
    @Request() req,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.bankingService.reclassify(
      req.user.companyId,
      id,
      body.nature,
      body.learn === true,
    );
  }
}