/**
 * =================================================================
 * Sentry client — opt-in por NEXT_PUBLIC_SENTRY_DSN (ADR-088)
 * =================================================================
 */
import * as Sentry from '@sentry/browser';

let enabled = false;

export function initSentryClient(): boolean {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    enabled = false;
    return false;
  }
  Sentry.init({ dsn, environment: process.env.NODE_ENV || 'development' });
  enabled = true;
  return true;
}

/** Reporta erro de UI/API (no-op se desativado). */
export function reportError(err: unknown): void {
  if (enabled) Sentry.captureException(err);
}