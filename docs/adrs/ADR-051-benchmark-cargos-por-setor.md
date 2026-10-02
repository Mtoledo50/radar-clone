# ADR-051: Benchmark de Cargos por Setor (Domínio Puro)

**Data:** 2026-08  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Sim

---

## 📋 Contexto
O módulo de Pessoas (Fase B) precisa oferecer um benchmark que mostre ao escritório quais cargos são mais comuns em cada setor (Fiscal, Contábil, DP, Admin), comparando com a média do mercado contábil.

**Problema:** 
Cada escritório tem nomenclaturas diferentes para cargos ("Analista Fiscal", "Auxiliar Fiscal", "Assistente Tributário"), tornando a comparação direta impossível.

## 🎯 Decisão
Criar um **catálogo canônico de cargos por setor** em domínio puro (TypeScript), sem dependência de banco. O frontend exibe barras CSS puro (ADR-001) mostrando a distribuição de cargos do escritório vs benchmark de mercado.

### Catálogo Canônico (exemplo):
- **Fiscal:** Analista Fiscal, Assistente Fiscal, Supervisor Fiscal, Gerente Fiscal
- **Contábil:** Analista Contábil, Auxiliar Contábil, Contador, Supervisor Contábil
- **DP:** Analista de DP, Assistente de DP, Supervisor de DP
- **Admin:** Assistente Administrativo, Analista Financeiro, Gerente Administrativo

## 💡 Implementação
```typescript
// backend/src/employees/domain/position-benchmark.ts
export const POSITION_BENCHMARK = {
  FISCAL: [
    { name: 'Analista Fiscal', percent: 40 },
    { name: 'Assistente Fiscal', percent: 35 },
    { name: 'Supervisor Fiscal', percent: 15 },
    { name: 'Gerente Fiscal', percent: 10 },
  ],
  CONTABIL: [
    { name: 'Analista Contábil', percent: 45 },
    { name: 'Auxiliar Contábil', percent: 30 },
    { name: 'Contador', percent: 15 },
    { name: 'Supervisor Contábil', percent: 10 },
  ],
  // ... outros setores
};

export function normalizePositionName(name: string, sector: string): string {
  const lower = name.toLowerCase();
  const benchmark = POSITION_BENCHMARK[sector] || [];
  
  // Matching fuzzy simples
  for (const pos of benchmark) {
    if (lower.includes(pos.name.toLowerCase().split(' ')[0])) {
      return pos.name;
    }
  }
  return 'OUTRO';
}

✅ Consequências
Positivas: Comparação justa e padronizada, zero dependência de banco, fácil de manter.
Negativas: Cargos muito específicos podem ser classificados como "OUTRO" (aceitável para benchmark).
📚 Referências
backend/src/employees/domain/position-benchmark.ts
frontend/src/app/dashboard/pessoas/benchmark/page.tsx

