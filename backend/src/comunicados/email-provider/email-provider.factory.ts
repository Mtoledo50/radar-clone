// ============================================================================
// SPRINT F13 — Factory de EmailProvider (ADR-113)
//
// Escolhe o provider correto baseado na variável EMAIL_PROVIDER:
//   - 'log'      → LogEmailProvider (default em dev)
//   - 'smtp'     → SmtpEmailProvider (produção simples)
//   - 'sendgrid' → SendGridEmailProvider (futuro — Bloco 4+)
// ============================================================================
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailProvider } from './email-provider.interface';
import { LogEmailProvider } from './log-email.provider';
import { SmtpEmailProvider } from './smtp-email.provider';

@Injectable()
export class EmailProviderFactory {
  private readonly logger = new Logger(EmailProviderFactory.name);

  constructor(
    private readonly config: ConfigService,
    private readonly logProvider: LogEmailProvider,
    private readonly smtpProvider: SmtpEmailProvider,
  ) {}

  /**
   * Retorna o provider configurado para o ambiente atual.
   */
  getProvider(): EmailProvider {
    const tipo = this.config.get<string>('EMAIL_PROVIDER', 'log').toLowerCase();

    switch (tipo) {
      case 'smtp':
        this.logger.debug('Usando provider: SMTP');
        return this.smtpProvider;

      case 'sendgrid':
        // TODO(Bloco 4+): implementar SendGridEmailProvider
        this.logger.warn(
          'SendGrid não implementado ainda — usando LOG como fallback',
        );
        return this.logProvider;

      case 'log':
      default:
        this.logger.debug('Usando provider: LOG (desenvolvimento)');
        return this.logProvider;
    }
  }
}