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
 * POST /fiscal/invoices/upload  → multipart (campo "files", até 50 XMLs)
 * GET  /fiscal/invoices         → listagem paginada
 * GET  /fiscal/invoices/:id     → detalhe com itens
 * =================================================================
 */
@Controller('fiscal/invoices')
@UseGuards(JwtAuthGuard)
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

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

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.invoiceService.findOne(id, req.user.companyId);
  }
}