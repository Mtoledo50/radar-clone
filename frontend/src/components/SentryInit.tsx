/**
 * 🛡️ Inicializa o Sentry no client (Sprint 33 — ADR-088).
 * Renderiza nada; só ativa o monitoramento se houver DSN.
 */
'use client';

import { useEffect } from 'react';
import { initSentryClient } from '@/lib/sentry';

export default function SentryInit() {
  useEffect(() => {
    initSentryClient();
  }, []);
  return null;
}