import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  Request,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { InvoiceService } from '../services/invoice.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

/**
 * =================================================================
 * 📄 InvoiceController — Gestão de NF-e de Entrada
 * =================================================================
 * Endpoints:
 *   POST   /fiscal/invoices/upload          → upload em lote (resiliente)
 *   GET    /fiscal/invoices                 → listagem paginada
 *   GET    /fiscal/invoices/metrics         → KPIs do período
 *   GET    /fiscal/invoices/:id             → detalhe da nota
 *   PATCH  /fiscal/invoices/assign-client   → vincular notas a cliente
 *   DELETE /fiscal/invoices/:id             → excluir com estorno
 *
 * ⚠️ Ordem das rotas: rotas literais ('upload', 'metrics',
 *    'assign-client') DEVEM vir ANTES de ':id' para não conflitarem.
 * =================================================================
 */
@Controller('fiscal/invoices')
@UseGuards(JwtAuthGuard)
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  /**
   * POST /fiscal/invoices/upload
   * Upload em lote de XMLs (até 50, 5MB cada).
   */
  @Post('upload')
  @UseInterceptors(
    FilesInterceptor('files', 50, { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  async upload(
    @Request() req,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('clientId') clientId?: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Nenhum arquivo XML enviado.');
    }
    return this.invoiceService.processUpload(
      req.user.companyId,
      req.user.id,
      clientId,
      files,
    );
  }

  /**
   * GET /fiscal/invoices — listagem paginada
   * 🆕 Sprint F5: query param `sortBy` ('emission' padrão | 'product' A–Z).
   * Whitelist segura: qualquer valor inválido vira 'emission'.
   */
  @Get()
  findAll(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('clientId') clientId?: string,
    @Query('sortBy') sortBy?: string,
  ) {
    return this.invoiceService.findAll(req.user.companyId, {
      page: Number(page) || 1,
      limit: Math.min(Number(limit) || 50, 100),
      search,
      clientId,
      sortBy: sortBy === 'product' ? 'product' : 'emission',
    });
  }

  /** GET /fiscal/invoices/metrics — KPIs do período */
  @Get('metrics')
  getMetrics(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.invoiceService.getMetrics(req.user.companyId, {
      startDate,
      endDate,
      clientId,
    });
  }

  /**
   * PATCH /fiscal/invoices/assign-client
   * Vincula (ou desvincula) notas a um cliente, em lote.
   */
  @Patch('assign-client')
  assignClient(@Request() req, @Body() body: any) {
    if (!body.invoiceIds || !Array.isArray(body.invoiceIds)) {
      throw new BadRequestException('invoiceIds deve ser um array.');
    }
    return this.invoiceService.assignClient(req.user.companyId, {
      invoiceIds: body.invoiceIds,
      clientId: body.clientId ?? null,
    });
  }

  /** GET /fiscal/invoices/:id — detalhe da nota */
  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.invoiceService.findOne(id, req.user.companyId);
  }

  /**
   * DELETE /fiscal/invoices/:id
   * Exclui a nota e reverte o estoque (estorno + recálculo).
   */
  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.invoiceService.remove(req.user.companyId, id);
  }
}