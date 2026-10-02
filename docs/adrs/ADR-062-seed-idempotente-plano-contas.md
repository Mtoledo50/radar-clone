
---

### 📂 `docs/adrs/ADR-062-seed-idempotente-plano-contas.md`

```markdown
# ADR-062: Seed Idempotente de Plano de Contas

**Data:** 2026-08  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Não (regra de integridade de dados)

---

## 📋 Contexto
O módulo Contábil (Sprint Contábil+) precisa importar o plano de contas padrão SCI 90113 (1.207 contas) no banco de dados, mas a importação não pode duplicar contas se executada múltiplas vezes.

**Problema:** 
Executar o seed 2× criaria 2.414 contas duplicadas, quebrando a integridade do plano de contas.

## 🎯 Decisão
Implementar um **seed idempotente** que usa `upsert` por chave natural `(companyId, code)` para criar contas apenas se não existirem. Contas já existentes não são alteradas (preserva customizações do usuário).

### Regras:
1. **Upsert por `(companyId, code)`:** Se a conta já existe, não faz nada. Se não existe, cria.
2. **Encoding Windows-1252:** O CSV do plano de contas SCI usa encoding Windows-1252 (não UTF-8), exigindo autodetecção no parser.
3. **Hierarquia Pai→Filho:** Contas sintéticas (ex: "1.1.01") são criadas antes das analíticas (ex: "1.1.01.001"), garantindo que `parentId` seja resolvido corretamente.
4. **Reimportação Desativa Contas Antigas:** Se o usuário importar um novo plano, contas que não estão no novo CSV são marcadas como `isActive = false` (ADR-034).

## 💡 Implementação
```typescript
// backend/prisma/seed-chart-of-accounts.ts
import * as fs from 'fs';
import * as iconv from 'iconv-lite'; // Para ler Windows-1252

export async function seedChartOfAccounts() {
  // 1. Ler CSV com encoding Windows-1252
  const buffer = fs.readFileSync('./data/plano-contas-sci-90113.csv');
  const csvContent = iconv.decode(buffer, 'win1252');

  // 2. Parse do CSV (delimitador ;, encoding Windows-1252)
  const rows = parseCsv(csvContent, ';');

  // 3. Criar contas sintéticas primeiro (hierarquia)
  const syntheticAccounts = rows.filter(r => r.tipo === 'S');
  for (const row of syntheticAccounts) {
    await prisma.accountingAccount.upsert({
      where: {
        companyId_code: {
          companyId: 'company-demo-id',
          code: row.codigo,
        },
      },
      update: {}, // Não alterar se já existe
      create: {
        companyId: 'company-demo-id',
        code: row.codigo,
        name: row.nome,
        type: mapType(row.tipo),
        nature: mapNature(row.natureza),
        level: row.nivel,
        isActive: true,
      },
    });
  }

  // 4. Criar contas analíticas (com parentId)
  const analyticAccounts = rows.filter(r => r.tipo === 'A');
  for (const row of analyticAccounts) {
    const parentCode = row.codigo.split('.').slice(0, -1).join('.');
    const parent = await prisma.accountingAccount.findUnique({
      where: {
        companyId_code: {
          companyId: 'company-demo-id',
          code: parentCode,
        },
      },
    });

    await prisma.accountingAccount.upsert({
      where: {
        companyId_code: {
          companyId: 'company-demo-id',
          code: row.codigo,
        },
      },
      update: {},
      create: {
        companyId: 'company-demo-id',
        code: row.codigo,
        name: row.nome,
        type: mapType(row.tipo),
        nature: mapNature(row.natureza),
        level: row.nivel,
        parentId: parent?.id,
        isActive: true,
      },
    });
  }
}

✅ Consequências
Positivas: Seed pode ser executado N vezes sem duplicar, hierarquia preservada, encoding correto.
Negativas: Requer biblioteca iconv-lite para ler Windows-1252, seed é mais lento (1.207 upserts).
📚 Referências
backend/prisma/seed-chart-of-accounts.ts
backend/prisma/schema.prisma (model AccountingAccount)
ADR-034 (Arquivos estruturais sempre delta)
