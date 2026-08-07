import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SupplierService } from '../services/supplier.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

/**
 * =================================================================
 * 🏢 SupplierController — Endpoints REST de Fornecedores
 * =================================================================
 * Rotas: /fiscal/suppliers
 * Todas protegidas por JWT e com multi-tenant automático.
 * =================================================================
 */
@Controller('fiscal/suppliers')
@UseGuards(JwtAuthGuard)
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  /**
   * GET /fiscal/suppliers
   * Lista todos os fornecedores com paginação e busca.
   *
   * Query params:
   * - search: busca por nome, CNPJ ou email
   * - page: página atual (padrão 1)
   * - limit: itens por página (padrão 50, max 100)
   */
  @Get()
  findAll(
    @Request() req,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.supplierService.findAll(req.user.companyId, {
      search,
      page: Number(page) || 1,
      limit: Math.min(Number(limit) || 50, 100),
    });
  }

  /**
   * GET /fiscal/suppliers/:id
   * Busca um fornecedor específico com suas últimas notas.
   */
  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.supplierService.findOne(id, req.user.companyId);
  }

  /**
   * POST /fiscal/suppliers
   * Cria um novo fornecedor.
   */
  @Post()
  create(@Request() req, @Body() data: any) {
    return this.supplierService.create(req.user.companyId, data);
  }

  /**
   * PUT /fiscal/suppliers/:id
   * Atualiza um fornecedor existente.
   */
  @Put(':id')
  update(@Request() req, @Param('id') id: string, @Body() data: any) {
    return this.supplierService.update(id, req.user.companyId, data);
  }

  /**
   * DELETE /fiscal/suppliers/:id
   * Soft delete do fornecedor (não remove histórico).
   */
  @Delete(':id')
  delete(@Request() req, @Param('id') id: string) {
    return this.supplierService.delete(id, req.user.companyId);
  }
}