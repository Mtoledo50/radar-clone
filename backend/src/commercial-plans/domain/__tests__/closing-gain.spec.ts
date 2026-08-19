// =================================================================
// Sprint A4 — testes do domínio de Fechamento com Ganho
// =================================================================
import { calcClosingGain } from '../closing-gain';

describe('calcClosingGain (ADR-020)', () => {
  it('sem desconto e sem cobrança atual → preço cheio, ganho null', () => {
    const r = calcClosingGain({ idealPrice: 2800, discountPercent: 0 });
    expect(r.finalPrice).toBe(2800);
    expect(r.concessionMonthly).toBe(0);
    expect(r.gainMonthly).toBeNull();
    expect(r.belowCurrent).toBe(false);
  });

  it('10% de desconto em 2800 → 2520 e concessão 280/mês (3360/ano)', () => {
    const r = calcClosingGain({ idealPrice: 2800, discountPercent: 10 });
    expect(r.finalPrice).toBe(2520);
    expect(r.concessionMonthly).toBe(280);
    expect(r.concessionYearly).toBe(3360);
  });

  it('ganho vs hoje: 2520 fechado vs 1200 atual → +1320/mês (+15840/ano)', () => {
    const r = calcClosingGain({
      idealPrice: 2800,
      currentCharge: 1200,
      discountPercent: 10,
    });
    expect(r.gainMonthly).toBe(1320);
    expect(r.gainYearly).toBe(15840);
    expect(r.belowCurrent).toBe(false);
  });

  it('🟡 fechou abaixo do atual → belowCurrent true', () => {
    const r = calcClosingGain({
      idealPrice: 1000,
      currentCharge: 1200,
      discountPercent: 30,
    });
    expect(r.finalPrice).toBe(700);
    expect(r.belowCurrent).toBe(true);
    expect(r.gainMonthly).toBe(-500);
  });

  it('desconto fora de 0–50 → throw', () => {
    expect(() =>
      calcClosingGain({ idealPrice: 1000, discountPercent: 60 }),
    ).toThrow();
  });
});