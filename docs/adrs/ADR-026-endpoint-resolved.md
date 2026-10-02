
---

### 📂 `docs/adrs/ADR-026-endpoint-resolved.md`

```markdown
# ADR-026: Endpoint `/resolved` Expõe Herança de Planos em Memória

**Data:** 2026-08  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Sim

---

## 📋 Contexto

O motor de herança de planos (ADR-020) calcula em memória quais itens cada plano herda dos planos inferiores e aplica o multiplicador de preço. O frontend precisa exibir essa informação completa (itens próprios + herdados + preços calculados).

**Problema:**
- O banco armazena apenas os itens **próprios** de cada plano (não persiste a herança).
- O frontend não pode calcular a herança sozinho (não tem acesso à lógica de negócio).
- Expor os planos "crus" (sem herança resolvida) obrigaria o frontend a fazer múltiplas requisições e recalcular a herança.

**Dilema:**
Como expor os planos com herança já calculada, sem duplicar lógica no frontend?

---

## 🎯 Decisão

Criar um endpoint específico `GET /commercial-plans/resolved` que:

1. Busca todos os planos e itens do banco.
2. Aplica a lógica de herança em memória (função `resolvePlanInheritance` do domínio puro).
3. Retorna os planos com a estrutura `ResolvedPlan`:
   - `items`: Lista completa (próprios + herdados).
   - Cada item tem o campo `inherited: boolean` indicando se foi herdado.
   - Preços já calculados com o multiplicador do plano.

### Regras:

1. **Ordenação Obrigatória:** O endpoint **DEVE** ordenar os planos por `order ASC, multiplier ASC` antes de processar a herança (ADR-025).
2. **Zero Cálculo no Frontend:** O frontend apenas exibe o que o backend retorna. Não recalcula nada.
3. **Cache Opcional:** Para performance, o endpoint pode usar cache (Redis) com TTL de 5 minutos, invalidado ao criar/editar planos.

---

## 💡 Implementação

### Backend: Endpoint

```typescript
// backend/src/commercial-plans/commercial-plans.controller.ts

@Controller('commercial-plans')
export class CommercialPlansController {
  constructor(private service: CommercialPlansService) {}

  /**
   * GET /commercial-plans/resolved
   * 
   * Retorna planos com herança já calculada em memória.
   * Usado pelo frontend para exibir itens próprios + herdados.
   */
  @Get('resolved')
  async getResolvedPlans(@Req() req: any) {
    const companyId = req.user.companyId;
    
    // 1. Buscar planos ordenados (ADR-025)
    const plans = await this.prisma.commercialPlan.findMany({
      where: { companyId, isActive: true },
      orderBy: [
        { order: 'asc' },
        { multiplier: 'asc' },
      ],
    });

    // 2. Buscar todos os itens
    const items = await this.prisma.serviceItem.findMany({
      where: { companyId },
    });

    // 3. Resolver herança em memória (domínio puro)
    const resolved = resolvePlanInheritance(plans, items);

    // 4. Marcar itens herdados
    const resolvedWithFlag = resolved.map(plan => {
      const ownItemIds = new Set(
        items.filter(i => i.planId === plan.id).map(i => i.id)
      );

      return {
        ...plan,
        items: plan.items.map(item => ({
          ...item,
          inherited: !ownItemIds.has(item.id),
        })),
      };
    });

    return resolvedWithFlag;
  }
}

Backend: Tipo Retornado

// backend/src/commercial-plans/types/resolved-plan.type.ts

export interface ResolvedPlan {
  id: string;
  name: string;
  multiplier: number;
  isIndependent: boolean;
  items: ResolvedItem[];
}

export interface ResolvedItem {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  price: number; // Preço calculado (basePrice × multiplier)
  inherited: boolean; // true se foi herdado de plano inferior
}

Frontend: Consumo

// frontend/src/app/dashboard/precificacao/page.tsx

export default function PrecificacaoPage() {
  const [resolvedPlans, setResolvedPlans] = useState<ResolvedPlan[]>([]);

  useEffect(() => {
    api.get('/commercial-plans/resolved').then(res => {
      setResolvedPlans(res.data);
    });
  }, []);

  return (
    <div className="space-y-8">
      {resolvedPlans.map(plan => (
        <div key={plan.id} className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-bold mb-4">
            {plan.name} ({plan.multiplier}x)
          </h3>
          
          <ul className="space-y-2">
            {plan.items.map(item => (
              <li key={item.id} className="flex justify-between items-center">
                <div>
                  <span className="font-medium">{item.name}</span>
                  {item.inherited && (
                    <span className="ml-2 text-xs text-gray-500 italic">
                      (herdado)
                    </span>
                  )}
                </div>
                <span className="text-teal-600 font-semibold">
                  R$ {item.price.toFixed(2)}
                </span>
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

✅ Frontend Simples: Apenas exibe dados, não calcula nada.
✅ Lógica Centralizada: Motor de herança vive no backend (fácil de testar).
✅ Performance: Uma única requisição traz tudo (planos + itens + preços).

Negativas

❌ Cálculo em Memória: A cada requisição, o backend recalcula a herança (aceitável para <100 planos).
❌ Cache Necessário: Para planos com muitos itens, considerar cache Redis.

📚 Referências

Arquivos que usam esta ADR:

backend/src/commercial-plans/commercial-plans.controller.ts (endpoint /resolved)
backend/src/commercial-plans/domain/plan-inheritance.ts (função resolvePlanInheritance)
frontend/src/app/dashboard/precificacao/page.tsx (consumo do endpoint)

ADRs relacionadas:

ADR-020 (Herança de planos em memória)
ADR-025 (Ordenação por order + multiplier)
ADR-027 (Simulador "Dinheiro na Mesa")

🔄 Histórico de Revisões

Data    '           Autor               Mudança
2026-08             Marcos Toledo       Criação inicial
