// ============================================================================
// SPRINT F13 — SmtpEmailProvider (ADR-113)
//
// Provider de produção simples usando nodemailer. Configurado via variáveis
// de ambiente: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE.
// ============================================================================
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import {
  EmailProvider,
  EnviarEmailInput,
  EnviarEmailOutput,
} from './email-provider.interface';

@Injectable()
export class SmtpEmailProvider implements EmailProvider {
  private readonly logger = new Logger(SmtpEmailProvider.name);
  readonly nome = 'SMTP';
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly config: ConfigService) {}

  private async getTransporter(): Promise<nodemailer.Transporter> {
    if (this.transporter) return this.transporter;

    const host = this.config.get<string>('SMTP_HOST');
    const port = parseInt(this.config.get<string>('SMTP_PORT', '587'), 10);
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');
    const secure = this.config.get<string>('SMTP_SECURE', 'false') === 'true';

    if (!host || !user || !pass) {
      throw new Error(
        'SMTP não configurado. Defina SMTP_HOST, SMTP_USER e SMTP_PASS no .env',
      );
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure, // true = porta 465, false = porta 587 com STARTTLS
      auth: { user, pass },
    });

    // Valida conexão (falha rápido se config errada)
    try {
      await this.transporter.verify();
      this.logger.log(`✅ SMTP conectado: ${user}@${host}:${port}`);
    } catch (err: any) {
      this.logger.error(`❌ Falha ao conectar SMTP: ${err.message}`);
      throw err;
    }

    return this.transporter;
  }

  async enviar(input: EnviarEmailInput): Promise<EnviarEmailOutput> {
    try {
      const transporter = await this.getTransporter();
      const from = this.config.get<string>(
        'EMAIL_FROM',
        'nao-responda@contacerta.com.br',
      );

      const info = await transporter.sendMail({
        from,
        to: input.para,
        subject: input.assunto,
        html: input.corpoHtml,
        attachments: input.anexos?.map((a) => ({
          filename: a.nome,
          path: a.caminho,
        })),
        // Headers customizados para tracking futuro
        headers: {
          'X-Radar-EnvioId': input.metadata?.envioId ?? '',
        },
      });

      this.logger.log(`✅ Email enviado via SMTP: ${info.messageId}`);

      return {
        sucesso: true,
        providerMessageId: info.messageId,
      };
    } catch (err: any) {
      this.logger.error(`❌ Falha no envio SMTP: ${err.message}`);
      return {
        sucesso: false,
        erro: err.message,
      };
    }
  }
}