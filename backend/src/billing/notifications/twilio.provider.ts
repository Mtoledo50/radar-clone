/**
 * =================================================================
 * TwilioProvider — WHATSAPP/SMS via REST oficial (SEM SDK)
 * =================================================================
 * POST /2010-04-01/Accounts/{SID}/Messages.json (Basic auth).
 * WhatsApp exige prefixo "whatsapp:" no To/From (sandbox de teste).
 * =================================================================
 */
import { NotificationPayload, NotificationProvider, NotificationResult, NotificationChannel } from './notification.types';

export class TwilioProvider implements NotificationProvider {
  readonly name = 'twilio' as const;

  constructor(
    private sid: string,
    private token: string,
    private whatsappFrom: string,
    private smsFrom: string,
  ) {}

  supports(channel: NotificationChannel): boolean {
    return channel === 'WHATSAPP' || channel === 'SMS';
  }

  async send(p: NotificationPayload): Promise<NotificationResult> {
    const isWhats = p.channel === 'WHATSAPP';
    const to = isWhats ? `whatsapp:${p.to}` : p.to;
    const from = isWhats ? this.whatsappFrom : this.smsFrom;

    try {
      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.sid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: 'Basic ' + Buffer.from(`${this.sid}:${this.token}`).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ To: to, From: from, Body: p.body }).toString(),
        },
      );
      const json: any = await res.json();
      if (!res.ok) {
        return { ok: false, provider: this.name, error: json?.message || `Twilio HTTP ${res.status}` };
      }
      return { ok: true, provider: this.name, externalId: json.sid };
    } catch (e: any) {
      return { ok: false, provider: this.name, error: e.message };
    }
  }
}