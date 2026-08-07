import { Module } from '@nestjs/common';
import { SupplierController } from './controllers/supplier.controller';
import { SupplierService } from './services/supplier.service';

/**
 * =================================================================
 * 📦 FiscalModule — Módulo de Estoque Fiscal
 * =================================================================
 * Responsável pela gestão fiscal: fornecedores, produtos, notas
 * fiscais, kardex e apuração de ICMS.
 *
 * 🎯 Princípios:
 * - Multi-tenant (companyId em todas as queries)
 * - Modular (cada domínio com seu controller/service)
 * - Testável (cada service pode ser testado isoladamente)
 * =================================================================
 */
@Module({
  controllers: [
    SupplierController,
    // ProductController,   // Será adicionado na Etapa 2B
    // InvoiceController,   // Será adicionado na Etapa 2C
    // InventoryController, // Será adicionado na Etapa 2C
  ],
  providers: [
    SupplierService,
    // ProductService,
    // XmlParserService,
    // InvoiceService,
    // InventoryService,
  ],
  exports: [
    SupplierService,
  ],
})
export class FiscalModule {}