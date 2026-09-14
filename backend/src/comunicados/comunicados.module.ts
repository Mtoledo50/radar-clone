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
import { EmailRetryService } from './email-envio/email-retry.service';

// ── Controllers ──
import { WatchFolderController } from './watch-folder/watch-folder.controller';
import { ArquivoFilaController } from './arquivo-fila/arquivo-fila.controller';
import { EmailEnvioController } from './email-envio/email-envio.controller';
import { EmailTemplateController } from './email-template/email-template.controller';

// 🆕 F18-B — imports no topo
import { PortalClienteService } from './portal-cliente/portal-cliente.service';
import { PortalClienteController } from './portal-cliente/portal-cliente.controller';
@Module({
  imports: [ConfigModule],
  controllers: [
    WatchFolderController,
    ArquivoFilaController,
    EmailEnvioController,
    EmailTemplateController, // 🆕 F16-A
    PortalClienteController, // 🆕 F18-B

  ],
  providers: [
    PortalClienteService, // 🆕 F18-B
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
    EmailRetryService, // 🆕 F17-A

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