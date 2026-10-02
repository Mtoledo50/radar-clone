# ADR-025: Ordenação de Planos Comerciais por `order` + `multiplier`

**Data:** 2026-08  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Sim

---

## 📋 Contexto

O sistema possui planos comerciais (START, PRIME, BLACK) que precisam ser exibidos em uma ordem específica na interface (do mais barato ao mais caro). Além disso, o motor de herança de planos (ADR-020) processa os planos em ordem crescente de multiplicador para calcular corretamente os itens herdados.

**Problema:**
- Sem um campo de ordenação explícito, os planos são retornados na ordem de criação (por `id` ou `createdAt`), o que não reflete a ordem comercial desejada.
- Se o administrador reordenar os planos (ex: criar um plano "BASIC" antes do "START"), a ordem no banco não muda automaticamente.
- O motor de herança depende da ordem correta para funcionar (planos com multiplicador menor devem ser processados primeiro).

**Dilema:**
Como garantir que os planos sejam exibidos e processados na ordem correta, independente da ordem de criação?

---

## 🎯 Decisão

Adicionar dois campos ao modelo `CommercialPlan`:

1. **`order: Int`** — Ordem de exibição na interface (1, 2, 3, ...). Quanto menor, mais no início.
2. **`multiplier: Decimal`** — Multiplicador de preço (já existia, mas agora é usado também para ordenação secundária).

### Regras de Ordenação:

1. **Primária:** `order ASC` (ordem de exibição definida pelo admin).
2. **Secundária:** `multiplier ASC` (desempate por multiplicador, caso dois planos tenham o mesmo `order`).
3. **Terciária:** `createdAt ASC` (desempate final por data de criação).

### Endpoint `/resolved` (ADR-026):
O endpoint que retorna planos com herança calculada **DEVE** ordenar por `order ASC, multiplier ASC` antes de processar a herança, garantindo que o motor funcione corretamente.

---

## 💡 Implementação

### Backend: Schema Prisma

```prisma
// backend/prisma/schema.prisma

model CommercialPlan {
  id              String   @id @default(uuid())
  companyId       String
  name            String   // "START", "PRIME", "BLACK"
  description     String?
  
  // 🆕 ADR-025: Ordenação
  order           Int      @default(0) // Ordem de exibição (1, 2, 3...)
  multiplier      Decimal  @default(1.0) @db.Decimal(4, 2) // 1.0, 1.3, 1.6
  isIndependent   Boolean  @default(false) // Não herda e não doa (ADR-020)
  
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  company         Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  items           ServiceItem[]
  
  @@index([companyId, order, multiplier]) // Índice para ordenação rápida
  @@map("commercial_plans")
}

Backend: Serviço de Listagem Ordenada

// backend/src/commercial-plans/commercial-plans.service.ts

@Injectable()
export class CommercialPlansService {
  constructor(private prisma: PrismaService) {}

  /**
   * Lista todos os planos do tenant, ordenados por order ASC, multiplier ASC
   */
  async findAll(companyId: string) {
    return this.prisma.commercialPlan.findMany({
      where: { companyId, isActive: true },
      orderBy: [
        { order: 'asc' },      // Primária: ordem de exibição
        { multiplier: 'asc' }, // Secundária: multiplicador
        { createdAt: 'asc' },  // Terciária: data de criação
      ],
      include: {
        items: true,
      },
    });
  }

  /**
   * Atualiza a ordem de um plano (drag-and-drop no frontend)
   */
  async updateOrder(companyId: string, planId: string, newOrder: number) {
    return this.prisma.commercialPlan.update({
      where: { id: planId, companyId },
      data: { order: newOrder },
    });
  }
}

Frontend: Exibição Ordenada

// frontend/src/app/dashboard/precificacao/page.tsx

export default function PrecificacaoPage() {
  const [plans, setPlans] = useState<CommercialPlan[]>([]);

  useEffect(() => {
    api.get('/commercial-plans').then(res => {
      // Backend já retorna ordenado, mas garantimos no frontend também
      const sorted = res.data.sort((a: any, b: any) => 
        a.order - b.order || a.multiplier - b.multiplier
      );
      setPlans(sorted);
    });
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {plans.map(plan => (
        <div key={plan.id} className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-bold">{plan.name}</h3>
          <p className="text-sm text-gray-600">Multiplicador: {plan.multiplier}x</p>
          <p className="text-xs text-gray-500">Ordem: {plan.order}</p>
          {/* ... resto do card */}
        </div>
      ))}
    </div>
  );
}

Migração Prisma
cd backend
npx prisma migrate dev --name add_order_to_commercial_plans

// Migration SQL gerado
ALTER TABLE "commercial_plans" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX "commercial_plans_companyId_order_multiplier_idx" 
  ON "commercial_plans"("companyId", "order" ASC, "multiplier" ASC);

✅ Consequências

Positivas

✅ Controle Total: Admin define a ordem de exibição dos planos (drag-and-drop).
✅ Motor de Herança Correto: Planos são processados na ordem certa (menor multiplicador primeiro).
✅ Performance: Índice composto acelera a ordenação.

Negativas

❌ Complexidade Adicional: Exige que o admin configure order ao criar planos.
❌ Migração Necessária: Planos existentes recebem order = 0 (precisa reordenar manualmente).

📚 Referências

Arquivos que usam esta ADR:

backend/prisma/schema.prisma (modelo CommercialPlan)
backend/src/commercial-plans/commercial-plans.service.ts (listagem ordenada)
frontend/src/app/dashboard/precificacao/page.tsx (exibição ordenada)

ADRs relacionadas:

ADR-020 (Herança de planos em memória)
ADR-026 (Endpoint /resolved expõe herança)

🔄 Histórico de Revisões

Data                Autor               Mudança
2026-08             Marcos Toledo       Criação inicial