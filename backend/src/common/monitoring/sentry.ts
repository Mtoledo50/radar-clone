/**
 * =================================================================
 * Sentry wrapper — opt-in por env (Sprint 33 — ADR-088)
 * =================================================================
 * Sem SENTRY_DSN → desativado e silencioso (zero custo em dev).
 * Com DSN → init + captura automática de erros não tratados do
 * Express/Nest (setupExpressErrorHandler no SDK v9/v10) sem alterar
 * o formato das respostas HTTP.
 *
 * 🧠 Chamada defensiva `(Sentry as any).setupXxx`: o helper de
 * integração mudou de lugar entre versões do SDK (v8 = Nest,
 * v9/v10 = Express/@sentry/nestjs). Assim o wrapper compila e
 * degrada graciosamente em qualquer versão.
 * =================================================================
 */
import { INestApplication } from '@nestjs/common';
import * as Sentry from '@sentry/node';

let enabled = false;

/** Inicia o Sentry se houver DSN. Retorna true se ativou. */
export function initSentry(app?: INestApplication): boolean {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    enabled = false;
    return false;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0.1),
  });

  // Captura automática de erros não tratados (Nest roda sobre Express)
  if (app) {
    try {
      const expressApp = app.getHttpAdapter().getInstance();
      const setup =
        (Sentry as any).setupExpressErrorHandler ??  // SDK v9/v10
        (Sentry as any).setupNestErrorHandler;      // SDK v8 (fallback)
      if (typeof setup === 'function') {
        setup(expressApp);
      }
    } catch {
      // nunca quebra o boot (ADR-088: monitoramento é opt-in e seguro)
    }
  }

  enabled = true;
  return true;
}

/** Reporta exceção manualmente (no-op se desativado). */
export function captureException(err: unknown): void {
  if (enabled) Sentry.captureException(err);
}

export function isSentryEnabled(): boolean {
  return enabled;
}