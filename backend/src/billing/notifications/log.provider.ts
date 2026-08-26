/**
 * =================================================================
 * LogProvider — fallback de dev/preview (ADR-086)
 * =================================================================
 * Não envia nada p/ fora: imprime a mensagem no console do backend.
 * Usado quando não há chaves configuradas ou sem destinatário.
 * =================================================================
 */
import { NotificationPayload, NotificationProvider, NotificationResult, NotificationChannel } from './notification.types';

export class LogProvider implements NotificationProvider {
  readonly name = 'log' as const;

  supports(_channel: NotificationChannel): boolean {
    return true; // aceita tudo (é o último da fila)
  }

  async send(p: NotificationPayload): Promise<NotificationResult> {
    console.log('╔══════════════════════════════════════════════════╗');
    console.log(`║ 📨 [MODO LOG] ${p.channel} → ${p.to || '(sem destinatário)'}`);
    console.log(`║ Assunto: ${p.subject ?? '-'}`);
    console.log(`║ ${p.body}`);
    console.log('╚══════════════════════════════════════════════════╝');
    return { ok: true, provider: 'log' };
  }
}