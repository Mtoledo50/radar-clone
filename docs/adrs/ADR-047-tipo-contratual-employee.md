
---

### 📂 `docs/adrs/ADR-047-tipo-contratual-employee.md`

```markdown
# ADR-047: Tipo Contratual Vive no Model `Employee`

**Data:** 2026-08  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Não

---

## 📋 Contexto
O módulo de Pessoas precisa diferenciar colaboradores por tipo de vínculo (CLT, Estagiário, Terceirizado, Sócio) para cálculos de turnover, distribuição por setor e benchmarking.

**Problema:** 
Criar uma tabela separada `EmploymentType` ou `Contract` para isso é superengenharia para um SaaS que precisa de agilidade.

## 🎯 Decisão
Adicionar um **Enum `ContractType`** diretamente no model `Employee` do Prisma.

### Regras:
1. O campo é obrigatório com um valor padrão (`CLT`).
2. O frontend exibe badges coloridos distintos para cada tipo.
3. Filtros de turnover e distribuição por setor usam esse campo como agrupador primário.

## 💡 Implementação
```prisma
// backend/prisma/schema.prisma
enum ContractType {
  CLT
  ESTAGIARIO
  TERCEIRIZADO
  SOCIO
}

model Employee {
  id            String        @id @default(uuid())
  companyId     String
  name          String
  contractType  ContractType  @default(CLT)
  // ...
}

✅ Consequências

Positivas: Schema simples, queries de agrupamento (groupBy) extremamente rápidas, sem joins desnecessários.
Negativas: Se no futuro houver necessidade de detalhes contratuais complexos (ex: múltiplos contratos por pessoa), será necessária uma refatoração para uma tabela 1:N.

📚 Referências

backend/prisma/schema.prisma
frontend/src/app/dashboard/pessoas/page.tsx