import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';

// =================================================================
// Controllers
// =================================================================
import { SupplierController } from './controllers/supplier.controller';
import { ProductController } from './controllers/product.controller';
import { InvoiceController } from './controllers/invoice.controller';
import { InventoryController } from './controllers/inventory.controller';
import { IcmsController } from './controllers/icms.controller';
import { SpedController } from './controllers/sped.controller';

// =================================================================
// Services
// =================================================================
import { SupplierService } from './services/supplier.service';
import { ProductService } from './services/product.service';
import { InvoiceService } from './services/invoice.service';
import { XmlParserService } from './services/xml-parser.service';
import { InventoryService } from './services/inventory.service';
import { IcmsService } from './services/icms.service';
import { SpedService } from './services/sped.service';

/**
 * =================================================================
 * 📦 FiscalModule — Estoque Fiscal e Apuração de ICMS
 * =================================================================
 * Etapa 2A: Fornecedores ✅
 * Etapa 2B: Produtos ✅
 * Etapa 2C: Parser XML + Upload ✅
 * Etapa 2D: Notas Fiscais (consulta) ✅
 * Etapa 2E: Estoque/Kardex ✅
 * Etapa 2F: Apuração de ICMS Mensal ✅
 * Etapa 2G: Exportação SPED (Bloco H) 🔄 (esta entrega)
 *
 * 🛡️ Regra de ouro NestJS:
 *   - controllers → classes com @Controller()
 *   - providers   → classes com @Injectable()
 * =================================================================
 */
@Module({
  imports: [PrismaModule],
  controllers: [
    SupplierController,
    ProductController,
    InvoiceController,
    InventoryController,
    IcmsController,
    SpedController, // ✅ Controller no array de controllers
  ],
  providers: [
    SupplierService,
    ProductService,
    InvoiceService,
    XmlParserService,
    InventoryService,
    IcmsService,
    SpedService, // ✅ Service no array de providers
  ],
  exports: [
    SupplierService,
    ProductService,
    InvoiceService,
    XmlParserService,
    InventoryService,
    IcmsService,
    SpedService,
  ],
})
export class FiscalModule {}