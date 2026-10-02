
---

### 📂 `docs/adrs/ADR-053-servicos-extras-preco-medio.md`

```markdown
# ADR-053: Serviços Extras c/ Preço Médio de Mercado

**Data:** 2026-08  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Sim

---

## 📋 Contexto
O módulo de Precificação (Fase C2) precisa mostrar ao escritório quanto ele está cobrando por serviços extras (ex: "Abertura de Empresa", "Alteração Contratual") em comparação com a média de mercado.

**Problema:** 
O escritório não sabe se está cobrando caro ou barato em relação à concorrência, perdendo oportunidades de aumentar a margem.

## 🎯 Decisão
Criar um **catálogo de serviços extras** com preço médio de mercado (baseado em pesquisa de concorrentes) e exibir um indicador visual "💰 Dinheiro na Mesa" quando o escritório cobra abaixo da média.

### Catálogo (exemplo):
| Serviço | Preço Médio Mercado | Faixa Recomendada |
|---------|---------------------|-------------------|
| Abertura de Empresa | R$ 800 | R$ 700 - R$ 1.200 |
| Alteração Contratual | R$ 400 | R$ 350 - R$ 600 |
| Regularização de CPF/CNPJ | R$ 250 | R$ 200 - R$ 400 |

## 💡 Implementação
```typescript
// backend/src/commercial-plans/domain/extra-services-benchmark.ts
export const EXTRA_SERVICES_CATALOG = [
  {
    name: 'Abertura de Empresa',
    marketPrice: 800,
    minRecommended: 700,
    maxRecommended: 1200,
  },
  {
    name: 'Alteração Contratual',
    marketPrice: 400,
    minRecommended: 350,
    maxRecommended: 600,
  },
  // ... outros serviços
];

export function calculateMoneyOnTable(
  service: string,
  chargedPrice: number
): { moneyOnTable: number; percentBelow: number } {
  const catalog = EXTRA_SERVICES_CATALOG.find(s => s.name === service);
  if (!catalog) return { moneyOnTable: 0, percentBelow: 0 };

  const moneyOnTable = Math.max(0, catalog.marketPrice - chargedPrice);
  const percentBelow = catalog.marketPrice > 0
    ? (moneyOnTable / catalog.marketPrice) * 100
    : 0;

  return { moneyOnTable, percentBelow };
}

✅ Consequências
Positivas: Escritório toma decisões de precificação informadas, aumenta margem.
Negativas: Preços de mercado podem desatualizar (requer revisão trimestral).
📚 Referências
backend/src/commercial-plans/domain/extra-services-benchmark.ts
frontend/src/app/dashboard/precificacao/servicos-extras/page.tsx

