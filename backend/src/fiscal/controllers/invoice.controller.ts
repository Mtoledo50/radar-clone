import {
  Controller,
  Get,
  Post,
  Param,
  Query,
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
 * 📄 InvoiceController — Upload e consulta de NF-e
 * =================================================================
 * Endpoints:
 *   POST /fiscal/invoices/upload   → multipart (campo "files", até 50 XMLs)
 *   GET  /fiscal/invoices          → listagem paginada com busca
 *   GET  /fiscal/invoices/metrics  → KPIs fiscais do período (cards)
 *   GET  /fiscal/invoices/:id      → detalhe com itens e impostos
 *
 * 🛡️ Segurança:
 *   - Todas as rotas protegidas por JwtAuthGuard
 *   - Multi-tenant garantido via req.user.companyId
 *   - Validação de arquivos no interceptor
 *
 * ⚠️ Ordem das rotas:
 *   Rotas literais ('upload', 'metrics') devem ser declaradas ANTES
 *   de rotas parametrizadas (':id'). Caso contrário, o NestJS
 *   interpreta "metrics" como um UUID e retorna 404/500.
 * =================================================================
 */
@Controller('fiscal/invoices')
@UseGuards(JwtAuthGuard)
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  // =================================================================
  // 📤 UPLOAD DE XMLs (multipart)
  // =================================================================

  /**
   * POST /fiscal/invoices/upload
   * Processa lote de arquivos XML de NF-e (até 50 arquivos, 5MB cada).
   *
   * Resposta:
   *   - Processa cada arquivo individualmente (nunca aborta o lote)
   *   - Retorna resumo: total, processed, errors + detalhes por arquivo
   *   - Bloqueia XML duplicado (mesma chave de acesso)
   */
  @Post('upload')
  @UseInterceptors(
    FilesInterceptor('files', 50, {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB por arquivo
    }),
  )
  async upload(
    @Request() req,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Nenhum arquivo XML enviado.');
    }
    return this.invoiceService.processUpload(
      req.user.companyId,
      req.user.id,
      files,
    );
  }

  // =================================================================
  // 📋 LISTAGEM PAGINADA
  // =================================================================

  /**
   * GET /fiscal/invoices?page=&limit=&search=
   * Lista notas da empresa com fornecedor e contagem de itens.
   *
   * Query params:
   *   - page:  página atual (padrão 1)
   *   - limit: itens por página (padrão 50, max 100)
   *   - search: busca por número da NF, chave de acesso ou fornecedor
   */
  @Get()
  findAll(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.invoiceService.findAll(req.user.companyId, {
      page: Number(page) || 1,
      limit: Math.min(Number(limit) || 50, 100),
      search,
    });
  }

  // =================================================================
  // 📊 KPIs FISCAIS DO PERÍODO
  // =================================================================

  /**
   * GET /fiscal/invoices/metrics?startDate=&endDate=
   * Retorna indicadores agregados para os cards da tela de Notas Fiscais.
   *
   * Query params (opcionais — formato YYYY-MM-DD):
   *   - startDate: início do período
   *   - endDate:   fim do período
   *
   * Resposta:
   *   - totalInvoices, totalValue
   *   - totalIcms, totalIcmsSt, totalIpi, totalPis, totalCofins
   *   - distinctSuppliers, totalItemsQuantity, totalItemsCost
   *
   * ⚠️ Declarada ANTES de @Get(':id') para não ser capturada como parâmetro.
   */
  @Get('metrics')
  getMetrics(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.invoiceService.getMetrics(
      req.user.companyId,
      startDate,
      endDate,
    );
  }

  // =================================================================
  // 🔍 DETALHE DA NOTA FISCAL
  // =================================================================

  /**
   * GET /fiscal/invoices/:id
   * Detalhe da nota com itens, produtos e fornecedor completos.
   * Usado pelo modal de visualização no frontend.
   */
  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.invoiceService.findOne(id, req.user.companyId);
  }
}