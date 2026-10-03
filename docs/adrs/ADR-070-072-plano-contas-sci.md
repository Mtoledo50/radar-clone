
---

### 📂 `docs/adrs/ADR-070-072-plano-contas-sci.md`

```markdown
# ADR-070/072: Plano de Contas SCI por Cliente com Código Unificado

**Data:** 2026-08  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Não

---

## 📋 Contexto

O sistema precisa suportar múltiplos planos de contas contábeis, pois cada cliente do escritório pode ter seu próprio plano (ex: um cliente usa SCI 90113, outro usa um plano customizado).

**Problema:**
- Como vincular lançamentos contábeis a contas de planos diferentes?
- Como garantir que cada cliente use apenas seu plano ativo?
- Como exportar dados no formato SCI-Único (que exige código unificado)?

## 🎯 Decisão

1. **Multi-Planos por Cliente (ADR-072):**
   - Cada cliente pode ter múltiplos planos de contas vinculados
   - Apenas um plano é marcado como `ativo` por vez
   - Lançamentos contábeis sempre usam o plano ativo do cliente

2. **Código Unificado (ADR-070):**
   - Cada conta tem um `reducedCode` (número sequencial, ex: "819")
   - O código completo é `code` (ex: "01.1.1.02.026")
   - Exportação SCI usa `reducedCode` (formato exigido pelo sistema SCI-Único)

3. **Seed Idempotente (ADR-062):**
   - Plano SCI 90113 (1.207 contas) importado via seed
   - Upsert por `(companyId, code)` para não duplicar

---

## 💡 Implementação

### Backend: Schema Prisma

```prisma
model AccountingAccount {
  id            String   @id @default(uuid())
  companyId     String?  // NULL = conta global (template)
  
  // Identificação
  code          String   // "01.1.1.02.026" (classificação contábil)
  name          String   // "Sicredi 07417-6"
  reducedCode   Int?     // 819 (código unificado SCI)
  
  // Hierarquia
  level         Int      @default(1)
  parentId      String?
  parent        AccountingAccount? @relation("AccountHierarchy", fields: [parentId], references: [id])
  children      AccountingAccount[] @relation("AccountHierarchy")
  
  // Classificação
  type          AccountType   // ATIVO | PASSIVO | RECEITA | DESPESA
  nature        AccountNature // DEVEDORA | CREDORA
  
  isActive      Boolean  @default(true)
  
  @@unique([companyId, code])
  @@index([companyId, reducedCode])
  @@map("accounting_accounts")
}

model Client {
  id              String   @id @default(uuid())
  companyId       String
  name            String
  
  // Plano de contas ativo
  accountingPlanId String?
  accountingPlan   AccountingPlan? @relation(fields: [accountingPlanId], references: [id])
  
  @@map("clients")
}

model AccountingPlan {
  id          String   @id @default(uuid())
  companyId   String
  name        String   // "SCI 90113", "Plano Customizado"
  isActive    Boolean  @default(false)
  
  accounts    AccountingAccount[]
  
  @@map("accounting_plans")
}

Backend: Serviço de Vinculação

// backend/src/accounting/services/account-plan.service.ts

@Injectable()
export class AccountPlanService {
  async getActivePlan(companyId: string, clientId: string) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId, companyId },
      include: { accountingPlan: true },
    });

    if (!client?.accountingPlan) {
      throw new NotFoundException('Cliente sem plano de contas ativo');
    }

    return client.accountingPlan;
  }

  async setActivePlan(companyId: string, clientId: string, planId: string) {
    // Desativar plano anterior
    await this.prisma.client.update({
      where: { id: clientId, companyId },
      data: { accountingPlanId: planId },
    });
  }
}

✅ Consequências

Positivas

✅ Flexibilidade: Cada cliente usa seu próprio plano
✅ Exportação SCI: Código unificado facilita integração com sistemas externos
✅ Hierarquia: Suporte a contas sintéticas e analíticas

Negativas

❌ Complexidade: Exige gerenciamento de qual plano está ativo por cliente
❌ Migração: Clientes existentes precisam ser vinculados a um plano

📚 Referências

Arquivos que usam esta ADR:

backend/prisma/schema.prisma (models AccountingAccount, AccountingPlan, Client)
backend/src/accounting/services/account-plan.service.ts
frontend/src/app/dashboard/contabil/plano-contas/page.tsx

ADRs relacionadas:

ADR-062 (Seed idempotente de plano de contas)
ADR-073 (SCI reduzido + decimal ponto)
ADR-075 (Layout oficial SCI-Único v3)

🔄 Histórico de Revisões

Data                Autor                   Mudança
2026-08             Marcos Toledo           Criação inicial