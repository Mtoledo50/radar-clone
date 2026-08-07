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
import { ProductService } from '../services/product.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

/**
 * =================================================================
 * 📦 ProductController — Endpoints REST do catálogo de produtos
 * =================================================================
 * Rotas: /fiscal/products
 * Todas protegidas por JWT + isolamento por companyId.
 * =================================================================
 */
@Controller('fiscal/products')
@UseGuards(JwtAuthGuard)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  findAll(
    @Request() req,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.productService.findAll(req.user.companyId, {
      search,
      page: Number(page) || 1,
      limit: Math.min(Number(limit) || 50, 100),
    });
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.productService.findOne(id, req.user.companyId);
  }

  @Post()
  create(@Request() req, @Body() dto: CreateProductDto) {
    return this.productService.create(req.user.companyId, dto);
  }

  @Put(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productService.update(id, req.user.companyId, dto);
  }

  @Delete(':id')
  delete(@Request() req, @Param('id') id: string) {
    return this.productService.delete(id, req.user.companyId);
  }
}