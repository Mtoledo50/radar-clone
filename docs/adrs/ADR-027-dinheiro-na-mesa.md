
---

### 📂 `docs/adrs/ADR-027-dinheiro-na-mesa.md`

```markdown
# ADR-027: Simulador "Dinheiro na Mesa" com `baseValue × multiplier`

**Data:** 2026-08  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Sim

---

## 📋 Contexto

O escritório contábil precisa saber quanto está "deixando na mesa" (perdendo de receita) ao cobrar menos do que o valor ideal calculado pelo sistema. 

**Problema:**
- O sistema calcula um **valor de referência** para cada plano (soma dos preços dos itens × multiplicador).
- O escritório pode cobrar um valor diferente (ex: desconto comercial, negociação).
- Não há uma forma clara de visualizar quanto o escritório está perdendo ao cobrar menos.

**Dilema:**
Como calcular e exibir de forma transparente o "dinheiro na mesa" (diferença entre valor cobrado e valor ideal)?

---

## 🎯 Decisão

Criar um endpoint `POST /commercial-plans/insights` que recebe o `baseValue` (valor cobrado pelo escritório) e calcula:

1. **Valor de Referência:** Soma dos preços dos itens do plano START × multiplicador.
2. **Diferença:** `baseValue - valorReferencia`.
3. **Dinheiro na Mesa:** Se a diferença for positiva, quanto o escritório está perdendo por mês e por ano.
4. **Percentual vs Base:** `(diferença / baseValue) × 100`.

### Regras:

1. **Plano Base:** O cálculo usa sempre o plano **START** (multiplicador 1.0) como referência.
2. **Arredondamento:** Todos os valores são arredondados para 2 casas decimais (`round2`).
3. **Transparência:** O frontend exibe o passo a passo do cálculo (valor de referência, diferença, %).

---

## 💡 Implementação

### Backend: Domínio Puro

```typescript
// backend/src/commercial-plans/domain/pricing-insights.ts

/**
 * Calcula insights de precificação: valor de referência, dinheiro na mesa, % vs base.
 * 
 * @param resolvedPlans - Planos com herança resolvida (ADR-026)
 * @param baseValue - Valor cobrado pelo escritório (ex: R$ 1.500)
 * @returns Insights de precificação
 */
export function calculatePricingInsights(
  resolvedPlans: ResolvedPlan[],
  baseValue: number
): PricingInsights {
  // 1. Encontrar plano START (multiplicador 1.0)
  const startPlan = resolvedPlans.find(p => p.name === 'START');
  
  if (!startPlan) {
    return {
      referenceValue: 0,
      moneyOnTable: 0,
      percentVsBase: 0,
      message: 'Plano START não encontrado',
    };
  }

  // 2. Calcular valor de referência (soma dos preços dos itens)
  const referenceValue = startPlan.items.reduce((sum, item) => sum + item.price, 0);
  const referenceValueRounded = round2(referenceValue);

  // 3. Calcular diferença
  const difference = baseValue - referenceValueRounded;
  
  // 4. Dinheiro na mesa (se positivo, está perdendo)
  const moneyOnTable = difference > 0 ? round2(difference) : 0;

  // 5. Percentual vs base
  const percentVsBase = baseValue > 0 
    ? round2((difference / baseValue) * 100) 
    : 0;

  return {
    referenceValue: referenceValueRounded,
    moneyOnTable,
    percentVsBase,
    message: moneyOnTable > 0
      ? `Você está deixando R$ ${moneyOnTable.toFixed(2)}/mês na mesa (${percentVsBase}% do valor cobrado)`
      : 'Você está cobrando acima do valor de referência',
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export interface PricingInsights {
  referenceValue: number;
  moneyOnTable: number;
  percentVsBase: number;
  message: string;
}

Backend: Endpoint

// backend/src/commercial-plans/commercial-plans.controller.ts

@Post('insights')
async calculateInsights(
  @Req() req: any,
  @Body() body: { baseValue: number }
) {
  const companyId = req.user.companyId;

  // 1. Buscar planos resolvidos (ADR-026)
  const plans = await this.prisma.commercialPlan.findMany({
    where: { companyId, isActive: true },
    orderBy: [{ order: 'asc' }, { multiplier: 'asc' }],
  });

  const items = await this.prisma.serviceItem.findMany({
    where: { companyId },
  });

  const resolved = resolvePlanInheritance(plans, items);

  // 2. Calcular insights
  const insights = calculatePricingInsights(resolved, body.baseValue);

  return insights;
}

Frontend: Simulador Visual

// frontend/src/app/dashboard/precificacao/insights/page.tsx

export default function InsightsPage() {
  const [baseValue, setBaseValue] = useState(1500);
  const [insights, setInsights] = useState<PricingInsights | null>(null);

  const calculate = async () => {
    const res = await api.post('/commercial-plans/insights', { baseValue });
    setInsights(res.data);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Simulador "Dinheiro na Mesa"</h1>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <label className="block text-sm font-medium mb-2">
          Valor cobrado do cliente (R$)
        </label>
        <input
          type="number"
          value={baseValue}
          onChange={e => setBaseValue(Number(e.target.value))}
          className="w-full px-4 py-2 border rounded"
        />
        <button
          onClick={calculate}
          className="mt-4 bg-teal-600 text-white px-6 py-2 rounded hover:bg-teal-700"
        >
          Calcular
        </button>
      </div>

      {insights && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Resultado</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Valor de Referência:</span>
              <span className="font-semibold">
                R$ {insights.referenceValue.toFixed(2)}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Diferença:</span>
              <span className={`font-semibold ${insights.moneyOnTable > 0 ? 'text-red-600' : 'text-green-600'}`}>
                R$ {(baseValue - insights.referenceValue).toFixed(2)}
              </span>
            </div>

            {insights.moneyOnTable > 0 && (
              <div className="bg-red-50 border border-red-200 p-4 rounded">
                <p className="text-red-800 font-semibold">
                  💸 {insights.message}
                </p>
                <p className="text-sm text-red-600 mt-2">
                  Perda anual: R$ {(insights.moneyOnTable * 12).toFixed(2)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

✅ Consequências

Positivas

✅ Transparência: Escritório vê exatamente quanto está perdendo.
✅ Decisão Informada: Ajuda a decidir se vale a pena dar desconto.
✅ Cálculo Determinístico: Mesmos inputs = mesmos outputs (ADR-031).

Negativas

❌ Dependência do Plano START: Se não houver plano START, o cálculo falha.
❌ Simplificação: Não considera custos operacionais, apenas preço de venda.

📚 Referências

Arquivos que usam esta ADR:

backend/src/commercial-plans/domain/pricing-insights.ts (função calculatePricingInsights)
backend/src/commercial-plans/commercial-plans.controller.ts (endpoint /insights)
frontend/src/app/dashboard/precificacao/insights/page.tsx (simulador visual)

ADRs relacionadas:

ADR-020 (Herança de planos em memória)
ADR-026 (Endpoint /resolved)
ADR-031 (Cálculo determinístico)

🔄 Histórico de Revisões
Data                    Autor                   Mudança
2026-08                 Marcos Toledo           Criação inicial