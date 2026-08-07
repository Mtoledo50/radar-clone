import {
  Controller,
  Get,
  Post,
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
 * 📄 InvoiceController — Upload e consulta de NF-e de Entrada
 * =================================================================
 * Responsável por gerenciar o ciclo de vida das Notas Fiscais de entrada
 * no módulo fiscal, desde o upload em lote até a consulta detalhada.
 * 
 * 🆕 Sprint 8: Todos os endpoints agora suportam o parâmetro `clientId`
 * para vincular a nota e seus derivados (itens, movimentos) a um 
 * cliente específico do escritório, mantendo a compatibilidade com 
 * dados legados (clientId = null).
 *
 * 🛡️ Segurança & Multi-tenant:
 *   - Todas as rotas protegidas por JwtAuthGuard.
 *   - O `companyId` é extraído obrigatoriamente do `req.user`.
 *   - Validação de tamanho e tipo de arquivo no interceptor.
 *
 * ⚠️ Ordem das rotas (Regra do NestJS):
 *   Rotas literais ('upload', 'metrics') DEVEM ser declaradas ANTES
 *   de rotas parametrizadas (':id'). Caso contrário, o NestJS
 *   interpreta "metrics" como um UUID e retorna Error 404/500.
 * =================================================================
 */
@Controller('fiscal/invoices')
@UseGuards(JwtAuthGuard)
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  // =================================================================
  // 📤 UPLOAD DE XMLs (Processamento em Lote)
  // =================================================================

  /**
   * POST /fiscal/invoices/upload
   * 
   * Processa um lote de arquivos XML de NF-e (layout 4.0).
   * 
   * @param req - Objeto da requisição (contém companyId e userId do token JWT)
   * @param files - Array de arquivos multipart (máx. 50 arquivos, 5MB cada)
   * @param clientId - 🆕 Sprint 8: ID opcional do cliente dono do estoque. Se omitido, fica null.
   * 
   * @returns Resumo do processamento:
   *   - total: quantidade total de arquivos recebidos
   *   - processed: quantidade de arquivos processados com sucesso
   *   - errors: quantidade de arquivos que falharam
   *   - results: array detalhado com fileName, status, accessKey e mensagem de erro (se houver)
   * 
   * 🛡️ Regras de Negócio:
   *   - Nunca aborta o lote inteiro se um arquivo falhar (resiliência).
   *   - Bloqueia NF-e duplicada verificando a `accessKey` (chave de 44 dígitos).
   *   - Cria ou vincula fornecedor automaticamente via CNPJ.
   */
  @Post('upload')
  @UseInterceptors(
    FilesInterceptor('files', 50, {
      limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5MB por arquivo
    }),
  )
  async upload(
    @Request() req,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('clientId') clientId?: string, // 🆕 Sprint 8: Recebe o clientId via FormData
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Nenhum arquivo XML foi enviado.');
    }
    
    return this.invoiceService.processUpload(
      req.user.companyId,
      req.user.id,
      clientId, // 🆕 Sprint 8: Propaga o clientId para o service
      files,
    );
  }

  // =================================================================
  // 📋 LISTAGEM PAGINADA DE NOTAS
  // =================================================================

  /**
   * GET /fiscal/invoices
   * 
   * Lista as notas fiscais da empresa com paginação, busca textual e filtros.
   * 
   * @param req - Objeto da requisição (companyId)
   * @param page - Página atual (padrão: 1)
   * @param limit - Itens por página (padrão: 50, máximo: 100)
   * @param search - Termo de busca (número da NF, chave de acesso ou nome do fornecedor)
   * @param clientId - 🆕 Sprint 8: Filtra notas apenas de um cliente específico (opcional)
   * 
   * @returns Objeto contendo:
   *   - data: Array de notas com dados do fornecedor e contagem de itens
   *   - meta: Informações de paginação (total, page, limit, totalPages)
   */
  @Get()
  findAll(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('clientId') clientId?: string, // 🆕 Sprint 8
  ) {
    return this.invoiceService.findAll(req.user.companyId, {
      page: Number(page) || 1,
      limit: Math.min(Number(limit) || 50, 100), // Garante que o limit não sobrecarregue a DB
      search,
      clientId, // 🆕 Sprint 8
    });
  }

  // =================================================================
  // 📊 KPIs FISCAIS DO PERÍODO (Dashboard)
  // =================================================================

  /**
   * GET /fiscal/invoices/metrics
   * 
   * Retorna indicadores agregados para os cards da tela de Notas Fiscais / Apuração.
   * Essencial para performance: utiliza agregações do Prisma em vez de buscar todos os registros.
   * 
   * @param req - Objeto da requisição (companyId)
   * @param startDate - Início do período (formato YYYY-MM-DD, opcional)
   * @param endDate - Fim do período (formato YYYY-MM-DD, opcional)
   * @param clientId - 🆕 Sprint 8: Calcula métricas apenas para um cliente específico (opcional)
   * 
   * @returns Objeto com:
   *   - totalInvoices, totalValue
   *   - totalIcms, totalIcmsSt, totalIpi, totalPis, totalCofins
   *   - distinctSuppliers, totalItemsQuantity, totalItemsCost
   * 
   * ⚠️ Declarada ANTES de @Get(':id') para evitar conflito de rotas no NestJS.
   */
  @Get('metrics')
  getMetrics(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('clientId') clientId?: string, // 🆕 Sprint 8
  ) {
    return this.invoiceService.getMetrics(req.user.companyId, {
      startDate,
      endDate,
      clientId, // 🆕 Sprint 8
    });
  }

  // =================================================================
  // 🔍 DETALHE DA NOTA FISCAL
  // =================================================================

  /**
   * GET /fiscal/invoices/:id
   * 
   * Retorna o detalhe completo de uma nota fiscal específica.
   * Usado principalmente pelo modal de visualização no frontend.
   * 
   * @param req - Objeto da requisição (companyId para validação multi-tenant)
   * @param id - UUID da nota fiscal
   * 
   * @returns Objeto da nota contendo:
   *   - Dados do cabeçalho (totais, datas, status)
   *   - Dados completos do fornecedor
   *   - Array de itens com dados do produto vinculado (se houver match) e impostos
   * 
   * @throws NotFoundException se a nota não existir ou não pertencer ao companyId.
   */
  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    // O service já valida internamente se o id pertence ao req.user.companyId
    return this.invoiceService.findOne(id, req.user.companyId);
  }
}