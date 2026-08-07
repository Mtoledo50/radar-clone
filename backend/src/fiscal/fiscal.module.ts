import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';

// Controllers
import { SupplierController } from './controllers/supplier.controller';
import { ProductController } from './controllers/product.controller';

// Services
import { SupplierService } from './services/supplier.service';
import { ProductService } from './services/product.service';

/**
 * =================================================================
 * 📦 FiscalModule — Estoque Fiscal e Apuração de ICMS
 * =================================================================
 * Etapa atual: CRUD de Fornecedores e Produtos (catálogo).
 * Próximas etapas: upload de XML, kardex, apuração.
 * =================================================================
 */
@Module({
  imports: [PrismaModule],
  controllers: [SupplierController, ProductController],
  providers: [SupplierService, ProductService],
  exports: [SupplierService, ProductService],
})
export class FiscalModule {}