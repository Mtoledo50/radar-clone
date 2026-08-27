/**
 * =================================================================
 * Testes do wrapper Sentry (Sprint 33 — ADR-088)
 * =================================================================
 */
import { initSentry, isSentryEnabled, captureException } from '../sentry';

describe('Sentry wrapper (ADR-088)', () => {
  afterEach(() => {
    delete process.env.SENTRY_DSN;
  });

  it('sem DSN → desativado e capture não lança', () => {
    delete process.env.SENTRY_DSN;
    expect(initSentry()).toBe(false);
    expect(isSentryEnabled()).toBe(false);
    expect(() => captureException(new Error('x'))).not.toThrow();
  });

  it('com DSN válido → ativado', () => {
    process.env.SENTRY_DSN = 'https://abc123@o0.ingest.sentry.io/1';
    expect(initSentry()).toBe(true);
    expect(isSentryEnabled()).toBe(true);
  });
});