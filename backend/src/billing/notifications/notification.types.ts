/**
 * =================================================================
 * Tipos do subsistema de notificações (Fase 5 — ADR-086)
 * =================================================================
 */

/** Canais suportados pela régua de cobrança. */
export type NotificationChannel = 'EMAIL' | 'WHATSAPP' | 'SMS';

/** Payload único que todo provider entende. */
export interface NotificationPayload {
  channel: NotificationChannel;
  to: string;              // email ou telefone (sem prefixo; o provider trata)
  subject?: string;        // apenas EMAIL
  body: string;            // mensagem final (placeholders já substituídos)
  meta?: Record<string, unknown>; // rastreabilidade (eventoId, companyId)
}

/** Resultado padronizado de qualquer provider. */
export interface NotificationResult {
  ok: boolean;
  provider: 'sendgrid' | 'twilio' | 'log';
  externalId?: string;     // id p/ auditoria (Twilio sid / SendGrid msg id)
  error?: string;          // motivo da falha (quando ok = false)
}

/** Contrato que todo provider implementa (Strategy). */
export interface NotificationProvider {
  readonly name: 'sendgrid' | 'twilio' | 'log';
  supports(channel: NotificationChannel): boolean;
  send(payload: NotificationPayload): Promise<NotificationResult>;
}