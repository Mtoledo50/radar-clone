
---

### 📂 `docs/adrs/ADR-048-benchmark-contabil.md`

```markdown
# ADR-048: Benchmark Contábil de Distribuição por Setor

**Data:** 2026-08  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Sim

---

## 📋 Contexto
Escritórios contábeis precisam saber se estão com a equipe dimensionada corretamente. O sistema oferece um benchmark comparando a distribuição de funcionários do escritório com a média do mercado contábil.

**Problema:** 
Nomes de setores no cadastro do usuário podem variar ("Fiscal", "Departamento Fiscal", "Tributário"), quebrando a comparação com o benchmark padrão.

## 🎯 Decisão
Definir um **Benchmark Rígido de 5 Categorias** no backend, com normalização de strings (removendo acentos e convertendo para minúsculas) antes da comparação.

### Categorias e Metas de Mercado:
- **Fiscal:** 30% (± 5 p.p.)
- **Contábil:** 25% (± 5 p.p.)
- **Departamento Pessoal (DP):** 20% (± 5 p.p.)
- **Administrativo:** 15% (± 5 p.p.)
- **Outros:** 10% (± 5 p.p.)

## 💡 Implementação
```typescript
// backend/src/employees/domain/sector-benchmark.ts
export const MARKET_BENCHMARK = {
  FISCAL: 0.30,
  CONTABIL: 0.25,
  DP: 0.20,
  ADMIN: 0.15,
  OUTROS: 0.10,
};

export function normalizeSectorName(name: string): string {
  const normalized = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (normalized.includes('fiscal') || normalized.includes('tribut')) return 'FISCAL';
  if (normalized.includes('contabil') || normalized.includes('contab')) return 'CONTABIL';
  if (normalized.includes('pessoal') || normalized.includes('dp') || normalized.includes('rh')) return 'DP';
  if (normalized.includes('admin') || normalized.includes('financeiro')) return 'ADMIN';
  return 'OUTROS';
}

✅ Consequências

Positivas: Comparação justa e padronizada, independente de como o usuário digita o nome do setor.
Negativas: Pode classificar erroneamente setores muito específicos (ex: "TI") como "OUTROS", o que é aceitável para o escopo do benchmark.

📚 Referências

backend/src/employees/domain/sector-benchmark.ts
frontend/src/app/dashboard/pessoas/benchmark/page.tsx