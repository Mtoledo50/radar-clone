/**
 * Testes de unidade da Sprint A1.
 * Rodar: npm run test -- --testPathPattern=plan-inheritance
 */
import {
  resolvePlanInheritance,
  PlanInheritanceError,
} from '../plan-inheritance';
import {
  planPriceFromReference,
  relativePercentVsBase,
  calcMoneyOnTable,
} from '../pricing-insights';

describe('Sprint A1 — Motor de Herança', () => {
  it('herda itens do menor para o maior (3 planos)', () => {
    const out = resolvePlanInheritance([
      { id: 'p3', name: 'BLACK', multiplier: 1.45, independent: false, ownItemIds: ['c'] },
      { id: 'p1', name: 'START', multiplier: 0.65, independent: false, ownItemIds: ['a'] },
      { id: 'p2', name: 'PRIME', multiplier: 1, independent: false, ownItemIds: ['b'] },
    ]);
    // Ordem por multiplicador: START(0) → PRIME(1) → BLACK(2)
    expect(out.map((p) => p.name)).toEqual(['START', 'PRIME', 'BLACK']);
    expect(out[0].allItemIds).toEqual(['a']);
    expect(out[1].inheritedItemIds).toEqual(['a']);
    expect(out[2].allItemIds.sort()).toEqual(['a', 'b', 'c']);
  });

  it('plano independente não herda e não doa', () => {
    const out = resolvePlanInheritance([
      { id: 'p1', name: 'START', multiplier: 0.65, independent: false, ownItemIds: ['a'] },
      { id: 'pm', name: 'MEI', multiplier: 0.8, independent: true, ownItemIds: ['m'] },
      { id: 'p2', name: 'PRIME', multiplier: 1, independent: false, ownItemIds: ['b'] },
    ]);
    const mei = out.find((p) => p.name === 'MEI')!;
    const prime = out.find((p) => p.name === 'PRIME')!;
    expect(mei.inheritedItemIds).toEqual([]);       // não herdou do START
    expect(prime.allItemIds).not.toContain('m');    // MEI não contaminou
    expect(prime.allItemIds.sort()).toEqual(['a', 'b']);
  });

  it('rejeita multiplicador <= 0', () => {
    expect(() =>
      resolvePlanInheritance([
        { id: 'x', name: 'X', multiplier: 0, independent: false, ownItemIds: [] },
      ]),
    ).toThrow(PlanInheritanceError);
  });
});

describe('Sprint A1 — Matemática de Preço', () => {
  it('base 2000 × multiplicadores', () => {
    expect(planPriceFromReference(2000, 0.75)).toBe(1500);
    expect(planPriceFromReference(2000, 1.2)).toBe(2400);
  });
  it('percentuais vs base', () => {
    expect(relativePercentVsBase(0.75)).toBe(-25);
    expect(relativePercentVsBase(1.2)).toBe(20);
  });
  it('dinheiro na mesa (500 vs 1000.51)', () => {
    const r = calcMoneyOnTable(500, 1000.51);
    expect(r.hasLoss).toBe(true);
    expect(r.monthlyLoss).toBe(500.51);
    expect(r.annualLoss).toBe(6006.12);
  });
});