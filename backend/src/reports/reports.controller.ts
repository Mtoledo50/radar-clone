import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Res,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import * as fs from 'fs';
import * as path from 'path';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /**
   * Gera DRE PDF para um cliente
   */
  @Post('dre')
  async generateDre(
    @Request() req,
    @Body() body: { clientId: string },
  ) {
    return this.reportsService.generateDrePdf(req.user.companyId, body.clientId);
  }
  /**
   * 🆕 Gera Balancete Patrimonial PDF para um cliente
   */
  @Post('balancete')
  async generateBalancete(
    @Request() req,
    @Body() body: { clientId: string },
  ) {
    return this.reportsService.generateBalancetePdf(
      req.user.companyId,
      body.clientId,
    );
  }
  /**
   * Gera Proposta PDF
   */
  @Post('proposal/:proposalId')
  async generateProposal(
    @Request() req,
    @Param('proposalId') proposalId: string,
  ) {
    return this.reportsService.generateProposalPdf(
      req.user.companyId,
      proposalId,
    );
  }

  /**
   * Download de PDF (rota pública para o portal)
   */
  @Get('download/*')
  async downloadPdf(@Param() params: any, @Res() res: Response) {
    const filePath = params[0];
    const fullPath = path.join(process.cwd(), 'uploads', filePath);

    if (!fs.existsSync(fullPath)) {
      throw new NotFoundException('Arquivo não encontrado');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${path.basename(fullPath)}"`,
    );
    fs.createReadStream(fullPath).pipe(res);
  }
}