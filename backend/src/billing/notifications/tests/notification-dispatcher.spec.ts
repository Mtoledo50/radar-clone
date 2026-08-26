/**
 * =================================================================
 * Testes do NotificationDispatcher (Fase 5 — ADR-086)
 * =================================================================
 * Usa providers FAKE (sem rede): roteamento, fallback log e falha.
 * =================================================================
 */
import { NotificationDispatcherService } from '../notification-dispatcher.service';
import { NotificationChannel, NotificationPayload, NotificationProvider, NotificationResult } from '../notification.types';

class FakeProvider implements NotificationProvider {
  public last?: NotificationPayload;
  constructor(
    public readonly name: 'sendgrid' | 'twilio' | 'log',
    private channels: NotificationChannel[],
    private ok: boolean,
  ) {}
  supports(ch: NotificationChannel) { return this.channels.includes(ch); }
  async send(p: NotificationPayload): Promise<NotificationResult> {
    this.last = p;
    return this.ok
      ? { ok: true, provider: this.name, externalId: 'ext-1' }
      : { ok: false, provider: this.name, error: 'falha simulada' };
  }
}

const ALL: NotificationChannel[] = ['EMAIL', 'WHATSAPP', 'SMS'];

describe('NotificationDispatcher', () => {
  it('roteia EMAIL p/ sendgrid quando configurado', async () => {
    const sg = new FakeProvider('sendgrid', ['EMAIL'], true);
    const d = new NotificationDispatcherService([sg, new FakeProvider('log', ALL, true)]);
    const r = await d.dispatch({ channel: 'EMAIL', to: 'a@b.com', body: 'x' });
    expect(r.provider).toBe('sendgrid');
    expect(sg.last?.to).toBe('a@b.com');
  });

  it('roteia WHATSAPP p/ twilio quando configurado', async () => {
    const tw = new FakeProvider('twilio', ['WHATSAPP', 'SMS'], true);
    const d = new NotificationDispatcherService([tw, new FakeProvider('log', ALL, true)]);
    const r = await d.dispatch({ channel: 'WHATSAPP', to: '51999990000', body: 'x' });
    expect(r.provider).toBe('twilio');
  });

  it('sem provider real → modo log', async () => {
    const d = new NotificationDispatcherService([new FakeProvider('log', ALL, true)]);
    const r = await d.dispatch({ channel: 'EMAIL', to: 'a@b.com', body: 'x' });
    expect(r.provider).toBe('log');
    expect(r.ok).toBe(true);
  });

  it('sem destinatário → preview em log mesmo c/ provider real', async () => {
    const sg = new FakeProvider('sendgrid', ['EMAIL'], true);
    const d = new NotificationDispatcherService([sg, new FakeProvider('log', ALL, true)]);
    const r = await d.dispatch({ channel: 'EMAIL', to: '', body: 'x' });
    expect(r.provider).toBe('log');
    expect(sg.last).toBeUndefined();
  });

  it('falha real → ok:false SEM fallback silencioso', async () => {
    const sg = new FakeProvider('sendgrid', ['EMAIL'], false);
    const d = new NotificationDispatcherService([sg, new FakeProvider('log', ALL, true)]);
    const r = await d.dispatch({ channel: 'EMAIL', to: 'a@b.com', body: 'x' });
    expect(r.ok).toBe(false);
    expect(r.error).toBe('falha simulada');
  });
});