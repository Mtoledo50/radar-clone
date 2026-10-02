
---

## 📂 `docs/adrs/ADR-020-heranca-planos.md`

```markdown
# ADR-020: Herança de Planos Comerciais em Memória

**Data:** 2026-08  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Sim

---

## 📋 Contexto

O sistema de planos comerciais (START, PRIME, BLACK) precisa suportar herança de itens entre planos, onde planos superiores herdam automaticamente os itens dos planos inferiores, aplicando um multiplicador de preço.

### Problema:
Como calcular a herança de itens sem duplicar dados no banco e mantendo a flexibilidade de personalização?

### Requisitos:
1. Planos superiores herdam itens dos inferiores
2. Cada plano pode ter um multiplicador de preço (ex: START 1.0x, PRIME 1.3x, BLACK 1.6x)
3. Alguns planos podem ser "independentes" (não herdam nem doam itens)
4. A lógica deve ser fácil de manter e testar
5. Performance aceitável para <100 planos e <500 itens

---

## 🎯 Decisão

A herança é **derivada em memória no backend**, não persistida no banco. O banco guarda apenas os itens **próprios** de cada plano. O endpoint `GET /commercial-plans/resolved` retorna os planos com herança já calculada.

### Regras de Negócio:

1. **Multiplicador Crescente:**
   - START: 1.0x (base)
   - PRIME: 1.3x
   - BLACK: 1.6x

2. **Flag `isIndependent`:**
   - Planos marcados como independentes **não herdam E não doam** itens
   - Útil para planos personalizados ou promocionais

3. **Ordem de Processamento:**
   - Sempre ordenar por `multiplier` ascendente antes de processar
   - Isso garante que a herança ocorra na ordem correta

4. **Preços com `round2`:**
   - Usar `Math.round(value * 100) / 100` para evitar erros de ponto flutuante
   - Ex: `19.99 * 1.3 = 25.987` → arredondado para `25.99`

---

## 💡 Implementação

### Backend: Domínio Puro

```typescript
// backend/src/commercial-plans/domain/plan-inheritance.ts

/**
 * Resolve a herança de itens entre planos comerciais.
 * 
 * @param plans - Lista de planos com multiplicadores
 * @param items - Lista de todos os itens de serviço
 * @returns Lista de planos com itens herdados e preços calculados
 */
export function resolvePlanInheritance(
  plans: CommercialPlan[],
  items: ServiceItem[]
): ResolvedPlan[] {
  // 1. Ordenar planos por multiplicador (ascendente)
  const sorted = [...plans].sort((a, b) => a.multiplier - b.multiplier);
  
  // 2. Processar cada plano
  return sorted.map(plan => {
    // Se o plano é independente, não herda nada
    if (plan.isIndependent) {
      const ownItems = items.filter(i => i.planId === plan.id);
      return {
        ...plan,
        items: ownItems.map(item => ({
          ...item,
          price: round2(item.basePrice * plan.multiplier),
        })),
      };
    }
    
    // 3. Coletar itens herdados de planos inferiores
    const inheritedItems = sorted
      .filter(p => p.multiplier < plan.multiplier && !p.isIndependent)
      .flatMap(p => items.filter(i => i.planId === p.id));
    
    // 4. Coletar itens próprios do plano
    const ownItems = items.filter(i => i.planId === plan.id);
    
    // 5. Combinar e calcular preços
    const allItems = [...inheritedItems, ...ownItems];
    
    return {
      ...plan,
      items: allItems.map(item => ({
        ...item,
        price: round2(item.basePrice * plan.multiplier),
      })),
    };
  });
}

/**
 * Arredonda valor para 2 casas decimais (evita erros de ponto flutuante)
 */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Calcula insights de precificação (valor de referência, dinheiro na mesa)
 */
export function calculatePricingInsights(
  resolvedPlans: ResolvedPlan[],
  baseValue: number
): PricingInsights {
  const startPlan = resolvedPlans.find(p => p.name === 'START');
  if (!startPlan) return { referenceValue: 0, moneyOnTable: 0 };
  
  const totalItemsPrice = startPlan.items.reduce((sum, item) => sum + item.price, 0);
  const referenceValue = round2(totalItemsPrice);
  
  const difference = baseValue - referenceValue;
  const moneyOnTable = difference > 0 ? round2(difference) : 0;
  
  return {
    referenceValue,
    moneyOnTable,
    percentVsBase: baseValue > 0 ? round2((difference / baseValue) * 100) : 0,
  };
}

Backend: Endpoint

// backend/src/commercial-plans/commercial-plans.controller.ts

@Get('resolved')
async getResolvedPlans(@Req() req: any) {
  const companyId = req.user.companyId;
  
  // Buscar planos e itens do banco
  const plans = await this.prisma.commercialPlan.findMany({
    where: { companyId },
    orderBy: { multiplier: 'asc' },
  });
  
  const items = await this.prisma.serviceItem.findMany({
    where: { companyId },
  });
  
  // Resolver herança em memória
  const resolved = resolvePlanInheritance(plans, items);
  
  return resolved;
}

Frontend: Consumo


// frontend/src/app/dashboard/precificacao/page.tsx

export default function PrecificacaoPage() {
  const [plans, setPlans] = useState<ResolvedPlan[]>([]);
  
  useEffect(() => {
    api.get('/commercial-plans/resolved').then(res => {
      setPlans(res.data);
    });
  }, []);
  
  return (
    <div>
      {plans.map(plan => (
        <div key={plan.id}>
          <h3>{plan.name} (Multiplicador: {plan.multiplier}x)</h3>
          <ul>
            {plan.items.map(item => (
              <li key={item.id}>
                {item.name}: R$ {item.price.toFixed(2)}
                {item.inherited && <span className="text-xs text-gray-500">(herdado)</span>}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

✅ Consequências

Positivas

✅ Banco simples: Sem duplicação de itens (apenas itens próprios são persistidos)
✅ Lógica centralizada: Fácil de testar e manter (domínio puro, zero deps)
✅ Flexibilidade: Mudar multiplicador não requer migração de dados
✅ Performance: Cálculo em memória é rápido para <100 planos
✅ Testabilidade: 6 testes unitários cobrindo todos os casos edge

Negativas

❌ Cálculo em memória: A cada requisição, o backend recalcula a herança (aceitável para <100 planos)
❌ Frontend dependente: Não pode recalcular sozinho (depende do endpoint /resolved)
❌ Cache necessário: Para planos com muitos itens, considerar cache no frontend


🧪 Testes Unitários

// backend/src/commercial-plans/domain/plan-inheritance.spec.ts

describe('resolvePlanInheritance', () => {
  it('deve herdar itens do plano inferior', () => {
    const plans = [
      { id: '1', name: 'START', multiplier: 1.0, isIndependent: false },
      { id: '2', name: 'PRIME', multiplier: 1.3, isIndependent: false },
    ];
    
    const items = [
      { id: 'i1', planId: '1', name: 'Item A', basePrice: 100 },
      { id: 'i2', planId: '2', name: 'Item B', basePrice: 50 },
    ];
    
    const resolved = resolvePlanInheritance(plans, items);
    
    expect(resolved[0].items).toHaveLength(1); // START tem apenas Item A
    expect(resolved[1].items).toHaveLength(2); // PRIME tem Item A (herdado) + Item B
    expect(resolved[1].items[0].price).toBe(130); // 100 * 1.3
  });
  
  it('deve ignorar planos independentes', () => {
    const plans = [
      { id: '1', name: 'START', multiplier: 1.0, isIndependent: false },
      { id: '2', name: 'CUSTOM', multiplier: 1.5, isIndependent: true },
    ];
    
    const items = [
      { id: 'i1', planId: '1', name: 'Item A', basePrice: 100 },
      { id: 'i2', planId: '2', name: 'Item B', basePrice: 50 },
    ];
    
    const resolved = resolvePlanInheritance(plans, items);
    
    expect(resolved[1].items).toHaveLength(1); // CUSTOM não herda
    expect(resolved[1].items[0].name).toBe('Item B');
  });
  
  it('deve arredondar preços corretamente', () => {
    const plans = [{ id: '1', name: 'START', multiplier: 1.3, isIndependent: false }];
    const items = [{ id: 'i1', planId: '1', name: 'Item', basePrice: 19.99 }];
    
    const resolved = resolvePlanInheritance(plans, items);
    
    expect(resolved[0].items[0].price).toBe(25.99); // 19.99 * 1.3 = 25.987 → 25.99
  });
});

📚 Referências

Arquivos que usam esta ADR:

backend/src/commercial-plans/domain/plan-inheritance.ts
backend/src/commercial-plans/commercial-plans.controller.ts
frontend/src/app/dashboard/precificacao/page.tsx

ADRs relacionadas:

ADR-026 (endpoint /resolved expõe herança em memória)
ADR-027 (simulador "Dinheiro na Mesa" usa baseValue × multiplier)

🔄 Histórico de Revisões

Data        Autor           Mudança
2026-08     Marcos Toledo   Criação inicial
2026-08     Marcos Toledo   Adicionados testes unitários

