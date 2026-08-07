import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';

// Controllers
import { SupplierController } from './controllers/supplier.controller';
import { ProductController } from './controllers/product.controller';
import { InvoiceController } from './controllers/invoice.controller';
import { InventoryController } from './controllers/inventory.controller';

// Services
import { SupplierService } from './services/supplier.service';
import { ProductService } from './services/product.service';
import { InvoiceService } from './services/invoice.service';
import { XmlParserService } from './services/xml-parser.service';
import { InventoryService } from './services/inventory.service';

/**
 * =================================================================
 * 📦 FiscalModule — Estoque Fiscal e Apuração de ICMS
 * =================================================================
 * Etapa 2A: Fornecedores ✅
 * Etapa 2B: Produtos ✅
 * Etapa 2C: Parser XML + Upload ✅
 * Etapa 2D: Notas Fiscais (consulta) ✅
 * Etapa 2E: Estoque/Kardex 🔄 (esta entrega)
 * =================================================================
 */
@Module({
  imports: [PrismaModule],
  controllers: [
    SupplierController,
    ProductController,
    InvoiceController,
    InventoryController,
  ],
  providers: [
    SupplierService,
    ProductService,
    InvoiceService,
    XmlParserService,
    InventoryService,
  ],
  exports: [
    SupplierService,
    ProductService,
    InvoiceService,
    XmlParserService,
    InventoryService,
  ],
})
export class FiscalModule {}