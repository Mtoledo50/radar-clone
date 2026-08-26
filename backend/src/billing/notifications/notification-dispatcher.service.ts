/**
 * =================================================================
 * NotificationDispatcherService — roteamento por canal (ADR-086)
 * =================================================================
 * Regras:
 * 1) Sem destinatário → MODO LOG (preview), mesmo com chaves.
 * 2) Canal c/ provider real configurado → provider real.
 * 3) Sem provider real p/ o canal → MODO LOG.
 * 4) Falha do provider real → retorna ok:false (NADA de fallback
 *    silencioso; o evento vira FALHOU p/ auditoria).
 * =================================================================
 */
import { Injectable, Optional } from '@nestjs/common';
import { NotificationPayload, NotificationProvider, NotificationResult } from './notification.types';
import { LogProvider } from './log.provider';
import { SendgridProvider } from './sendgrid.provider';
import { TwilioProvider } from './twilio.provider';

@Injectable()
export class NotificationDispatcherService {
  private readonly providers: NotificationProvider[];

  /** Providers injetáveis (testes); padrão = monta do process.env. */
  /** Providers injetáveis (testes); padrão = monta do process.env. */
  constructor(@Optional() providers?: NotificationProvider[]) {
        if (providers) {
      this.providers = providers;
      return;
    }

    const env = process.env;
    const list: NotificationProvider[] = [];

    // EMAIL real só com chave SendGrid
    if (env.SENDGRID_API_KEY) {
      list.push(new SendgridProvider(env.SENDGRID_API_KEY, env.NOTIFICATION_FROM_EMAIL || 'nao-responder@contacerta.com.br'));
    }

    // WHATSAPP/SMS real só com credenciais Twilio
    if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN) {
      list.push(
        new TwilioProvider(
          env.TWILIO_ACCOUNT_SID,
          env.TWILIO_AUTH_TOKEN,
          env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886',
          env.TWILIO_SMS_FROM || '+14155238886',
        ),
      );
    }

    // Log SEMPRE por último (fallback dev/preview)
    list.push(new LogProvider());
    this.providers = list;

    const reais = list.filter((p) => p.name !== 'log').map((p) => p.name);
    console.log(`📡 Dispatcher de notificações: ${reais.length ? reais.join(', ') : 'MODO LOG (sem chaves)'}`);
  }

  /** Escolhe o provider e envia. Nunca lança exceção — retorna resultado. */
  async dispatch(payload: NotificationPayload): Promise<NotificationResult> {
    const log = this.providers.find((p) => p.name === 'log') as NotificationProvider;

    // Sem destinatário → preview em log (não desperdiça crédito)
    if (!payload.to) return log.send(payload);

    const real = this.providers.find((p) => p.name !== 'log' && p.supports(payload.channel));
    return (real ?? log).send(payload);
  }
}