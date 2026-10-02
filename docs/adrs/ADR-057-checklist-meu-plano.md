
---

### 📂 `docs/adrs/ADR-057-checklist-meu-plano.md`

```markdown
# ADR-057: Checklist "Meu Plano" Persistido (Fase D2)

**Data:** 2026-08  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Sim

---

## 📋 Contexto
O módulo de Mentoria (Fase D2) precisa transformar os focos de melhoria (ADR-056) em ações concretas e rastreáveis, com progresso visual.

**Problema:** 
Metas sem ações derivadas e acompanhamento viram "letras mortas" no painel.

## 🎯 Decisão
Criar um **checklist persistido** onde cada foco de melhoria gera automaticamente 3-5 ações sugeridas (ex: foco "FINANCEIRO" → "Reduzir inadimplência", "Aumentar ticket médio"). O usuário pode:
- Marcar ações como concluídas (checkbox).
- Adicionar ações customizadas.
- Ver progresso em % (ex: "3/5 ações concluídas = 60%").

### Regras:
- Ações sugeridas são **importadas idempotentemente** (não duplicam ao recarregar a página).
- Ações customizadas podem ser editadas/deletadas pelo usuário.
- Progresso é calculado em tempo real e exibido no Dashboard.

## 💡 Implementação
```prisma
// backend/prisma/schema.prisma
model ActionPlan {
  id              String   @id @default(uuid())
  companyId       String
  
  focusArea       String   // "FINANCEIRO", "OPERACIONAL", etc.
  description     String   // "Reduzir inadimplência para <5%"
  isCompleted     Boolean  @default(false)
  isSuggested     Boolean  @default(true) // true = importada do catálogo, false = custom
  
  createdAt       DateTime @default(now())
  completedAt     DateTime?
  
  company         Company  @relation(fields: [companyId], references: [id])
  
  @@unique([companyId, focusArea, description]) // Idempotência
  @@map("action_plans")
}

// backend/src/mentoria/action-plan.service.ts
async importSuggestedActions(companyId: string, focusAreas: string[]) {
  const catalog = {
    FINANCEIRO: [
      'Reduzir inadimplência para <5%',
      'Aumentar ticket médio em 15%',
      'Implementar cobrança automática',
    ],
    OPERACIONAL: [
      'Fechar 100% dos meses no prazo',
      'Reduzir retrabalho em 20%',
      'Implementar checklist de fechamento',
    ],
    // ... outros focos
  };

  for (const focus of focusAreas) {
    const actions = catalog[focus] || [];
    for (const action of actions) {
      await this.prisma.actionPlan.upsert({
        where: {
          companyId_focusArea_description: {
            companyId,
            focusArea: focus,
            description: action,
          },
        },
        update: {},
        create: {
          companyId,
          focusArea: focus,
          description: action,
          isSuggested: true,
        },
      });
    }
  }
}
✅ Consequências
Positivas: Ações tangíveis e rastreáveis, progresso visual motiva execução, idempotência evita duplicação.
Negativas: Catálogo de ações sugeridas pode ficar desatualizado (requer revisão semestral).
📚 Referências
backend/prisma/schema.prisma (model ActionPlan)
backend/src/mentoria/action-plan.service.ts
frontend/src/app/dashboard/mentoria/meu-plano/page.tsx

