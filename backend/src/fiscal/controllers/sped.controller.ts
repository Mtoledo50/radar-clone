import {
  Controller,
  Get,
  Query,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { SpedService } from '../services/sped.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

/**
 * =================================================================
 * 📤 SpedController — Exportação de Inventário (Bloco H)
 * =================================================================
 * GET /fiscal/sped/bloco-h?year=&month=            → JSON (preview)
 * GET /fiscal/sped/bloco-h/export?format=sped|csv  → download do arquivo
 * =================================================================
 */
@Controller('fiscal/sped')
@UseGuards(JwtAuthGuard)
export class SpedController {
  constructor(private readonly spedService: SpedService) {}

  @Get('bloco-h')
  blocoH(
    @Request() req,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    return this.spedService.getBlocoH(
      req.user.companyId,
      Number(year) || new Date().getFullYear(),
      Number(month) || new Date().getMonth() + 1,
    );
  }

  @Get('bloco-h/export')
  async export(
    @Request() req,
    @Res() res: Response,
    @Query('year') year?: string,
    @Query('month') month?: string,
    @Query('format') format?: string,
  ) {
    const y = Number(year) || new Date().getFullYear();
    const m = Number(month) || new Date().getMonth() + 1;

    const data = await this.spedService.getBlocoH(req.user.companyId, y, m);

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="inventario_${y}_${String(m).padStart(2, '0')}.csv"`,
      );
      res.send(this.spedService.buildCsv(data));
      return;
    }

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="bloco_h_${y}_${String(m).padStart(2, '0')}.txt"`,
    );
    res.send(this.spedService.buildSpedText(data));
  }
}