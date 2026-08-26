/**
 * =================================================================
 * SendgridProvider — EMAIL via REST oficial (SEM SDK)
 * =================================================================
 * POST https://api.sendgrid.com/v3/mail/send (Bearer key).
 * Sucesso = HTTP 202. Zero dependências novas (fetch nativo Node 20).
 * =================================================================
 */
import { NotificationPayload, NotificationProvider, NotificationResult, NotificationChannel } from './notification.types';

export class SendgridProvider implements NotificationProvider {
  readonly name = 'sendgrid' as const;

  constructor(private apiKey: string, private fromEmail: string) {}

  supports(channel: NotificationChannel): boolean {
    return channel === 'EMAIL';
  }

  async send(p: NotificationPayload): Promise<NotificationResult> {
    try {
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: p.to }] }],
          from: { email: this.fromEmail, name: 'Conta Certa' },
          subject: p.subject || 'Conta Certa — Comunicado',
          content: [{ type: 'text/plain', value: p.body }],
        }),
      });
      if (!res.ok) {
        return { ok: false, provider: this.name, error: `SendGrid HTTP ${res.status}` };
      }
      return {
        ok: true,
        provider: this.name,
        externalId: res.headers.get('x-message-id') ?? undefined,
      };
    } catch (e: any) {
      return { ok: false, provider: this.name, error: e.message };
    }
  }
}