
---

### 📂 `docs/adrs/ADR-049-flag-critico-historico.md`

```markdown
# ADR-049: Flag de Colaborador Crítico com Cópia Histórica

**Data:** 2026-08  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Sim

---

## 📋 Contexto
O turnover de "colaboradores críticos" (aqueles cujo conhecimento é difícil de substituir) tem um impacto financeiro e operacional muito maior do que o turnover geral. O sistema precisa rastrear e alertar sobre isso.

**Problema:** 
Se um colaborador crítico for demitido e seu registro for apenas "desativado" ou alterado, perdemos a capacidade de auditar *quem* era crítico no passado ao gerar relatórios históricos de turnover.

## 🎯 Decisão
Adicionar um flag `isCritical: Boolean` no model `Employee`. Quando um registro de desligamento (`Resignation`) for criado, o valor de `isCritical` no momento do desligamento deve ser **copiado** para o modelo `Resignation`, criando um snapshot histórico imutável.

## 💡 Implementação
```prisma
model Employee {
  id          String   @id @default(uuid())
  companyId   String
  name        String
  isCritical  Boolean  @default(false)
  resignations Resignation[]
}

model Resignation {
  id              String   @id @default(uuid())
  employeeId      String
  wasCritical     Boolean  // Snapshot do isCritical no momento do desligamento
  resignationDate DateTime
  // ...
}

✅ Consequências

Positivas: Relatórios de turnover de críticos são 100% precisos historicamente, sem depender do estado atual do cadastro do funcionário.
Negativas: Redundância de dados controlada (necessária para auditoria).

📚 Referências

backend/prisma/schema.prisma
backend/src/employees/services/resignation.service.ts