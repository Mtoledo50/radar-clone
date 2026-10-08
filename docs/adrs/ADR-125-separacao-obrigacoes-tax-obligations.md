
---

## 📁 `docs/adrs/ADR-125-separacao-obrigacoes-tax-obligations.md`

```markdown
# ADR-125: Separação Arquitetural: obligations vs tax-obligations

**Data:** 2026-10-09  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Sim (refatoração de imports)

##  Contexto

O módulo original `obligations/` estava crescendo e misturando duas responsabilidades distintas:

1. **Obrigações gerais:** Catálogo de obrigações, lotes, vínculos cliente↔obrigação, watch folder.
2. **Obrigações fiscais específicas:** DAS, DARF, GPS, FGTS — com cálculos, alíquotas, competências fiscais.

Manter tudo em um único módulo violava o **Single Responsibility Principle** e dificultava a manutenção.

## 🎯 Decisão

Separar em **dois módulos distintos**:

1. **`backend/src/obligations/`** — Gestão geral de obrigações (catálogo, lotes, watch folder, vínculos).
2. **`backend/src/tax-obligations/`** — Obrigações fiscais específicas com lógica tributária (cálculos, alíquotas, competências).

O módulo `app.module.ts` registra ambos separadamente.

## 💡 Implementação

**Estrutura de diretórios:**

backend/src/
├── obligations/ # Gestão geral
│ ├── obligations.module.ts
│ ├── obligations.controller.ts
│ ├── obligations.service.ts
│ ── dto/
└── tax-obligations/ # Obrigações fiscais específicas
├── tax-obligations.module.ts
├── tax-obligations.controller.ts
├── tax-obligations.service.ts
└── dto/

**Registro no AppModule:**

```typescript
@Module({
  imports: [
    ObligationsModule,
    TaxObligationsModule,
    // ... outros módulos
  ],
})
export class AppModule {}


✅ Consequências
Positivas
✅ Separação clara de responsabilidades.
✅ Módulos independentes podem evoluir separadamente.
✅ Facilita testes unitários (cada módulo tem seu escopo).
✅ Código mais legível e manutenível.
Negativas
⚠️ Duplicação de alguns DTOs comuns (mitigável com módulo compartilhado).
⚠️ Imports cruzados entre módulos exigem cuidado (usar interfaces compartilhadas).
📚 Referências
Arquivos: backend/src/obligations/, backend/src/tax-obligations/, backend/src/app.module.ts
ADRs relacionadas: ADR-121 (Unificação de Obrigações), ADR-123 (Watch Folder)
🔄 Histórico de Revisões
Data
Autor
Mudança
2026-10-09
Marcos Toledo
Criação inicial
