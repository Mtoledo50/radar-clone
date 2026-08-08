import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ProductService } from '../services/product.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

/**
 * =================================================================
 * 📦 ProductController — Catálogo de Produtos Fiscais
 * =================================================================
 * CRUD completo de produtos com NCM, custo médio e saldo de estoque.
 * 
 * 🆕 Sprint 8: Todos os endpoints suportam `clientId` para vincular
 * o produto a um cliente específico do escritório. Produtos sem 
 * `clientId` ficam no "catálogo geral" (legado).
 * 
 * 🛡️ Segurança & Multi-tenant:
 *   - Todas as rotas protegidas por JwtAuthGuard
 *   - `companyId` extraído obrigatoriamente do `req.user`
 *   - Validação de NCM (8 dígitos) feita no DTO
 *   - Soft delete com proteção contra exclusão de produtos com movimentações
 * 
 * 📌 Endpoints:
 *   GET    /fiscal/products        → Listagem paginada com busca
 *   GET    /fiscal/products/:id    → Detalhe do produto
 *   POST   /fiscal/products        → Criação
 *   PUT    /fiscal/products/:id    → Atualização parcial
 *   DELETE /fiscal/products/:id    → Soft delete (deletedAt)
 * =================================================================
 */
@Controller('fiscal/products')
@UseGuards(JwtAuthGuard)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  /**
   * GET /fiscal/products
   * 
   * Lista produtos do catálogo com paginação e busca multi-campo.
   * 
   * @param req - Requisição (contém companyId do token JWT)
   * @param search - Termo de busca (descrição, código, NCM ou EAN)
   * @param page - Página atual (padrão: 1)
   * @param limit - Itens por página (padrão: 50, máx: 100)
   * @param clientId - 🆕 Sprint 8: filtra produtos de um cliente específico
   * 
   * @returns { data: Produto[], meta: { total, page, limit, totalPages } }
   * 
   * 💡 A busca por NCM/EAN remove pontuação automaticamente no service,
   * permitindo consultas como "7318.15.00" ou "73181500".
   */
  @Get()
  findAll(
    @Request() req,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('clientId') clientId?: string, // 🆕 Sprint 8
  ) {
    return this.productService.findAll(req.user.companyId, {
      search,
      page: Number(page) || 1,
      limit: Math.min(Number(limit) || 50, 100),
      clientId,
    });
  }
  /**
   * POST /fiscal/products/cleanup-empty
   * 🆕 Sprint 9: remove produtos órfãos (saldo 0, sem kardex, sem notas).
   * Body opcional: { clientId?: string } — limpa apenas aquele cliente.
   */
  @Post('cleanup-empty')
  cleanupEmpty(@Request() req, @Body() body: any) {
    return this.productService.cleanupEmpty(
      req.user.companyId,
      body?.clientId ?? null,
    );
  }
  /**
   * GET /fiscal/products/:id
   * 
   * Retorna o detalhe de um produto específico com contagem de
   * movimentações e itens de nota vinculados (para validação de integridade).
   * 
   * @param id - UUID do produto
   * @throws NotFoundException se o produto não existir ou não pertencer ao companyId
   */
  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.productService.findOne(id, req.user.companyId);
  }

  /**
   * POST /fiscal/products
   * 
   * Cria um novo produto no catálogo fiscal.
   * 
   * @param dto - CreateProductDto (code, description, ncm, unit, clientId?)
   * @throws BadRequestException se NCM não tiver 8 dígitos
   * @throws ConflictException se já existir produto com mesmo código (para o mesmo clientId)
   * 
   * 💡 O NCM é normalizado (remove pontuação) antes da validação.
   * A unit é convertida para UPPERCASE automaticamente.
   */
  @Post()
  create(@Request() req, @Body() dto: CreateProductDto) {
    return this.productService.create(req.user.companyId, dto);
  }

  /**
   * PUT /fiscal/products/:id
   * 
   * Atualiza campos de um produto existente.
   * Permite atualização parcial (somente os campos enviados são alterados).
   * 
   * @param id - UUID do produto
   * @param dto - UpdateProductDto (campos opcionais)
   * @throws NotFoundException se o produto não existir
   * @throws ConflictException se o novo código já existir para outro produto
   * 
   * ⚠️ NCM e EAN são re-validados apenas se forem informados no body.
   */
  @Put(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productService.update(id, req.user.companyId, dto);
  }

  /**
   * DELETE /fiscal/products/:id
   * 
   * Soft delete: marca o produto como excluído (deletedAt) sem removê-lo do banco.
   * 
   * @param id - UUID do produto
   * @throws ConflictException se o produto tiver movimentações ou itens de NF vinculados
   * 
   * 🛡️ Proteção de integridade:
   * Bloqueia exclusão de produtos que já foram movimentados no kardex,
   * preservando o histórico fiscal (exigência legal).
   */
  @Delete(':id')
  delete(@Request() req, @Param('id') id: string) {
    return this.productService.delete(id, req.user.companyId);
  }
}