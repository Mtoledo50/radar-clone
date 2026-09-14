import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

// ── Services ──
import { CnpjParserService } from './cnpj-parser/cnpj-parser.service';
import { MetadadosArquivoService } from './cnpj-parser/metadados-arquivo.service';
import { FileMoverService } from './file-mover/file-mover.service';
import { WatchFolderService } from './watch-folder/watch-folder.service';
import { ArquivoFilaService } from './arquivo-fila/arquivo-fila.service';
import { EmailProviderFactory } from './email-provider/email-provider.factory';
import { LogEmailProvider } from './email-provider/log-email.provider';
import { SmtpEmailProvider } from './email-provider/smtp-email.provider';
import { EmailTemplateService } from './email-template/email-template.service';
import { EmailEnvioService } from './email-envio/email-envio.service';

// ── Controllers ──
import { WatchFolderController } from './watch-folder/watch-folder.controller';
import { ArquivoFilaController } from './arquivo-fila/arquivo-fila.controller';
import { EmailEnvioController } from './email-envio/email-envio.controller';
import { EmailTemplateController } from './email-template/email-template.controller';

@Module({
  imports: [ConfigModule],
  controllers: [
    WatchFolderController,
    ArquivoFilaController,
    EmailEnvioController,
    EmailTemplateController, // 🆕 F16-A

  ],
  providers: [
    PrismaService,
    CnpjParserService,
    MetadadosArquivoService,
    FileMoverService,
    WatchFolderService,
    ArquivoFilaService,
    EmailProviderFactory,
    LogEmailProvider,
    SmtpEmailProvider,
    EmailTemplateService,
    EmailEnvioService,
  ],
  exports: [
    CnpjParserService,
    MetadadosArquivoService,
    FileMoverService,
    ArquivoFilaService,
    EmailEnvioService,
  ],
})
export class ComunicadosModule {}