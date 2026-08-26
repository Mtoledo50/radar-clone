/**
 * =================================================================
 * ClientMatcher — vínculo determinístico cobrança→cliente (ADR-087)
 * =================================================================
 * Domínio PURO (sem banco/HTTP): normaliza nomes e casa por
 * igualdade exata normalizada (sem fuzzy — previsível e auditável).
 * =================================================================
 */

/** Remove acentos, uppercase, colapsa não-alfanuméricos em espaço. */
export function normalizeText(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim();
}

export interface ClientCandidate {
  id: string;
  name: string;
}

/** Casa cobrança→cliente por nome normalizado; null se não casar. */
export function matchClientByName(
  clients: ClientCandidate[],
  clientName: string,
): ClientCandidate | null {
  const target = normalizeText(clientName);
  if (!target) return null;
  return clients.find((c) => normalizeText(c.name) === target) ?? null;
}