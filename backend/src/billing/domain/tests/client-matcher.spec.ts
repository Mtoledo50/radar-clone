/**
 * =================================================================
 * Testes do ClientMatcher (Fase 6 — ADR-087)
 * =================================================================
 * Valida normalização de acentos/case/pontuação + matching exato
 * (sem fuzzy — previsível e auditável).
 * =================================================================
 */
import { matchClientByName, normalizeText } from '../client-matcher';

describe('ClientMatcher (ADR-087)', () => {
  const clients = [
    { id: 'c1', name: 'Academia do Renan LTDA' },
    { id: 'c2', name: 'Padaria Pão Quente' },
  ];

  it('normaliza acentos/case/pontuação', () => {
    expect(normalizeText('  academia DO renan!!! ')).toBe('ACADEMIA DO RENAN');
    expect(normalizeText('Padaria Pão Quente')).toBe('PADARIA PAO QUENTE');
  });

  it('casa por nome normalizado', () => {
    expect(matchClientByName(clients, 'ACADEMIA DO RENAN LTDA')?.id).toBe('c1');
    expect(matchClientByName(clients, 'padaria pao quente')?.id).toBe('c2');
  });

  it('não casa nome diferente (sem fuzzy)', () => {
    expect(matchClientByName(clients, 'Academia do Renan')).toBeNull();
  });

  it('nome vazio → null', () => {
    expect(matchClientByName(clients, '   ')).toBeNull();
  });
});