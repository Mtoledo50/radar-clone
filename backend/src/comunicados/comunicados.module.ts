// backend/src/comunicados/comunicados.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CnpjParserService } from './cnpj-parser/cnpj-parser.service';
import { MetadadosArquivoService } from './cnpj-parser/metadados-arquivo.service';
import { FileMoverService } from './file-mover/file-mover.service';

@Module({
  imports: [ConfigModule],
  providers: [CnpjParserService, MetadadosArquivoService, FileMoverService],
  exports: [CnpjParserService, MetadadosArquivoService, FileMoverService],
})
export class ComunicadosModule {}