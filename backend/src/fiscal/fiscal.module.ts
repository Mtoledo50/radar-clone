import { Module } from '@nestjs/common';

// Controllers
import { SupplierController } from './controllers/supplier.controller';
import { ProductController } from './controllers/product.controller';

// Services
import { SupplierService } from './services/supplier.service';
import { ProductService } from './services/product.service';

/**
 * =================================================================
 * 📦 FiscalModule — Módulo de Estoque Fiscal
 * =================================================================
 * Etapa 2A: Fornecedores ✅
 * Etapa 2B: Produtos ✅ (esta entrega)
 * Etapa 2C: Parser XML (próxima)
 * =================================================================
 */
@Module({
  controllers: [SupplierController, ProductController],
  providers: [SupplierService, ProductService],
  exports: [SupplierService, ProductService],
})
export class FiscalModule {}