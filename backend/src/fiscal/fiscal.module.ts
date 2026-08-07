import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';

// Controllers
import { SupplierController } from './controllers/supplier.controller';
import { ProductController } from './controllers/product.controller';
import { InvoiceController } from './controllers/invoice.controller';

// Services
import { SupplierService } from './services/supplier.service';
import { ProductService } from './services/product.service';
import { InvoiceService } from './services/invoice.service';
import { XmlParserService } from './services/xml-parser.service';

@Module({
  imports: [PrismaModule],
  controllers: [SupplierController, ProductController, InvoiceController],
  providers: [SupplierService, ProductService, InvoiceService, XmlParserService],
  exports: [SupplierService, ProductService, InvoiceService, XmlParserService],
})
export class FiscalModule {}