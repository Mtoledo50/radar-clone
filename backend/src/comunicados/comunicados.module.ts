import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

// Serviços
import { CnpjParserService } from './cnpj-parser/cnpj-parser.service';
import { MetadadosArquivoService } from './cnpj-parser/metadados-arquivo.service';
import { FileMoverService } from './file-mover/file-mover.service';
import { WatchFolderService } from './watch-folder/watch-folder.service';
import { ArquivoFilaService } from './arquivo-fila/arquivo-fila.service';

// Controllers
import { WatchFolderController } from './watch-folder/watch-folder.controller';
import { ArquivoFilaController } from './arquivo-fila/arquivo-fila.controller';

@Module({
  imports: [ConfigModule],
  controllers: [WatchFolderController, ArquivoFilaController],
  providers: [
    PrismaService,
    CnpjParserService,
    MetadadosArquivoService,
    FileMoverService,
    WatchFolderService,
    ArquivoFilaService,
  ],
  exports: [
    CnpjParserService,
    MetadadosArquivoService,
    FileMoverService,
    ArquivoFilaService,
  ],
})
export class ComunicadosModule {}