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
 * 📤 SpedController — Exportação de Inventário (Bloco H do SPED)
 * =================================================================
 * Gera o inventário físico de mercadorias na data-base (fim do mês)
 * por replay das movimentações do Kardex, nos formatos exigidos pelo
 * PVA da Receita Federal e para conferência interna.
 * 
 * 🆕 Sprint 8: Suporte a `clientId` para exportar inventário 
 * segregado por cliente.
 * 
 * 📌 Endpoints:
 *   GET /fiscal/sped/bloco-h            → Preview JSON do inventário
 *   GET /fiscal/sped/bloco-h/export     → Download do arquivo (sped|csv)
 * 
 * 📐 Formatos suportados:
 *   - sped: pipe-delimited (H001|H005|H010|H990) — layout oficial
 *   - csv:  separador ; com BOM UTF-8 (abre direto no Excel BR)
 * 
 * ⚠️ O formato SPED tem layout fixo por lei — não é customizável.
 * A customização de campos está disponível apenas no CSV.
 * =================================================================
 */
@Controller('fiscal/sped')
@UseGuards(JwtAuthGuard)
export class SpedController {
  constructor(private readonly spedService: SpedService) {}

  /**
   * GET /fiscal/sped/bloco-h?year=&month=
   * 
   * Preview JSON do inventário na data-base selecionada.
   * Usado pela tela para exibir a tabela antes do download.
   * 
   * @param year - Ano de referência (padrão: ano atual)
   * @param month - Mês (1-12, padrão: mês atual)
   * @param clientId - 🆕 Sprint 8: filtra inventário por cliente
   * 
   * @returns {
   *   year, month, refDate (ISO),
   *   itemsCount, totalValue,
   *   items: [ { code, description, ncm, unit, quantity, unitValue, totalValue } ]
   * }
   * 
   * 💡 O saldo é reconstruído replayando todas as movimentações até a data-base,
   * permitindo consultar inventários históricos (ex: dezembro/2022).
   */
  @Get('bloco-h')
  blocoH(
    @Request() req,
    @Query('year') year?: string,
    @Query('month') month?: string,
    @Query('clientId') clientId?: string, // 🆕 Sprint 8
  ) {
    return this.spedService.getBlocoH(
      req.user.companyId,
      Number(year) || new Date().getFullYear(),
      Number(month) || new Date().getMonth() + 1,
      clientId,
    );
  }

  /**
   * GET /fiscal/sped/bloco-h/export?format=sped|csv&year=&month=
   * 
   * Download do arquivo de inventário.
   * 
   * @param format - 'sped' (layout oficial) ou 'csv' (Excel)
   * @param year - Ano de referência
   * @param month - Mês (1-12)
   * @param clientId - 🆕 Sprint 8: filtra inventário por cliente
   * 
   * @returns Stream de arquivo (attachment)
   * 
   * 🛡️ Headers configurados:
   * - Content-Type: text/plain ou text/csv (charset=utf-8)
   * - Content-Disposition: attachment com nome padronizado
   *   Ex: bloco_h_2026_08.txt ou inventario_2026_08.csv
   * 
   * 💡 O CSV inclui BOM UTF-8 (\uFEFF) para que o Excel BR
   * reconheça acentos corretamente ao abrir com duplo-clique.
   */
  @Get('bloco-h/export')
  async export(
    @Request() req,
    @Res() res: Response,
    @Query('year') year?: string,
    @Query('month') month?: string,
    @Query('format') format?: string,
    @Query('clientId') clientId?: string, // 🆕 Sprint 8
  ) {
    const y = Number(year) || new Date().getFullYear();
    const m = Number(month) || new Date().getMonth() + 1;
    
    // Gera o inventário na data-base (pode ser histórico)
    const data = await this.spedService.getBlocoH(req.user.companyId, y, m, clientId);

    const monthStr = String(m).padStart(2, '0');

    // CSV: formato para Excel BR (separador ; e BOM UTF-8)
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="inventario_${y}_${monthStr}.csv"`,
      );
      res.send(this.spedService.buildCsv(data));
      return;
    }

    // SPED: formato oficial pipe-delimited (padrão Receita Federal)
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="bloco_h_${y}_${monthStr}.txt"`,
    );
    res.send(this.spedService.buildSpedText(data));
  }
}