
---

### 📂 `docs/adrs/ADR-056-visao-futuro.md`

```markdown
# ADR-056: Visão de Futuro (Fase D1 — Mentoria)

**Data:** 2026-08  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Sim

---

## 📋 Contexto
O módulo de Mentoria (Fase D) precisa ajudar o escritório a definir metas de longo prazo (1-3 anos) e traduzi-las em ações práticas no dia a dia.

**Problema:** 
Escritórios contábeis geralmente operam no "modo bombeiro" (apagando incêndios), sem visão estratégica de futuro.

## 🎯 Decisão
Criar uma página "Visão de Futuro" onde o usuário define:
1. **Norte Estratégico:** Onde o escritório quer estar em 3 anos (ex: "Ser o maior escritório fiscal da região").
2. **Metas Quantificáveis:** Objetivos mensuráveis (ex: "100 clientes ativos", "R$ 50k de MRR").
3. **Focos de Melhoria:** 3 áreas prioritárias derivadas do Score do Escritório (ADR-055).
4. **Ações Derivadas:** Checklist automático gerado a partir dos focos (ex: foco "Financeiro" → ação "Reduzir inadimplência para <5%").

### Regras:
- Os focos de melhoria são **derivados automaticamente** das 2 dimensões mais fracas do Score (ADR-055).
- As ações são **persistidas** e podem ser marcadas como concluídas (gamificação).

## 💡 Implementação
```prisma
// backend/prisma/schema.prisma
model CompanyVision {
  id              String   @id @default(uuid())
  companyId       String   @unique
  
  northStar       String   // "Ser o maior escritório fiscal da região"
  goalClients     Int?     // Meta de clientes
  goalMRR         Decimal? // Meta de MRR (R$)
  
  focusAreas      String[] // Derivados do Score (ex: ["FINANCEIRO", "OPERACIONAL"])
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  company         Company  @relation(fields: [companyId], references: [id])
  
  @@map("company_visions")
}


// backend/src/mentoria/mentoria.service.ts
async deriveFocusAreas(companyId: string): Promise<string[]> {
  const score = await this.calculateOfficeScore(companyId);
  
  // Pegar as 2 dimensões mais fracas
  const dimensions = [
    { name: 'FINANCEIRO', score: score.financial },
    { name: 'OPERACIONAL', score: score.operational },
    { name: 'PESSOAS', score: score.people },
    { name: 'COMERCIAL', score: score.commercial },
    { name: 'FISCAL', score: score.fiscal },
  ];
  
  return dimensions
    .sort((a, b) => a.score - b.score)
    .slice(0, 2)
    .map(d => d.name);
}

✅ Consequências
Positivas: Escritório sai do modo reativo e planeja estrategicamente, gamificação motiva execução.
Negativas: Requer que o usuário defina metas realistas (orientação via painel "Como funciona").
📚 Referências
backend/prisma/schema.prisma (model CompanyVision)
backend/src/mentoria/mentoria.service.ts
frontend/src/app/dashboard/mentoria/page.tsx

