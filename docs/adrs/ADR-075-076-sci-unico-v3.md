
---

### 📂 `docs/adrs/ADR-075-076-sci-unico-v3.md`

```markdown
# ADR-075/076: Layout Oficial SCI-Único v3 + Importação Idempotente

**Data:** 2026-08  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Não (padrão de mercado)

---

## 📋 Contexto

O sistema precisa exportar e importar dados contábeis no formato SCI-Único v3, padrão adotado por sistemas contábeis brasileiros (Domínio, Questor, Sage).

**Problema:**
- O formato SCI-Único tem regras específicas (código reduzido, decimal ponto, delimitador `;`)
- A importação não pode duplicar dados (ADR-066/067)

## 🎯 Decisão

1. **Layout SCI-Único v3 (ADR-075):**
   - Delimitador: `;` (ponto e vírgula)
   - Encoding: UTF-8+BOM (ADR-002)
   - Campos: `codigo_reduzido;nome;debito;credito;saldo`
   - Decimal: ponto (ADR-073)

2. **Importação Idempotente (ADR-076):**
   - Upsert por `(companyId, clientId, competence, code)`
   - Reimportar não duplica, apenas atualiza

---

## 💡 Implementação

### Backend: Exportação

```typescript
// backend/src/accounting/services/sci-export.service.ts

async exportSciUnico(companyId: string, clientId: string, competence: string): Promise<string> {
  const BOM = '\uFEFF';
  const header = 'codigo;nome;debito;credito;saldo\n';
  
  const rows = await this.prisma.trialBalanceRow.findMany({
    where: { trialBalance: { companyId, clientId, competence } },
    orderBy: { code: 'asc' },
  });

  const lines = rows.map(row => {
    const code = row.reducedCode || row.code;
    const debit = row.debit.toFixed(2).replace(',', '.');
    const credit = row.credit.toFixed(2).replace(',', '.');
    const balance = row.currentBalance.toFixed(2).replace(',', '.');
    
    return `${code};${row.name};${debit};${credit};${balance}`;
  });

  return BOM + header + lines.join('\n');
}

Backend: Importação

// backend/src/accounting/services/sci-import.service.ts

async importSciUnico(companyId: string, clientId: string, competence: string, csvContent: string) {
  const rows = this.parseCsv(csvContent, ';');

  await this.prisma.$transaction(async (tx) => {
    // Deletar linhas antigas desta competência
    await tx.trialBalanceRow.deleteMany({
      where: { trialBalance: { companyId, clientId, competence } },
    });

    // Inserir novas linhas
    for (const row of rows) {
      await tx.trialBalanceRow.create({
        data: {
          trialBalanceId: tb.id,
          reducedCode: parseInt(row.codigo),
          name: row.nome,
          debit: parseFloat(row.debito),
          credit: parseFloat(row.credito),
          currentBalance: parseFloat(row.saldo),
        },
      });
    }
  });
}

✅ Consequências

Positivas

✅ Compatibilidade: Arquivos exportados são aceitos por sistemas SCI
✅ Idempotência: Reimportar não duplica dados

Negativas

❌ Complexidade: Exige conversão de formato (decimal, encoding)

📚 Referências

Arquivos que usam esta ADR:

backend/src/accounting/services/sci-export.service.ts
backend/src/accounting/services/sci-import.service.ts

ADRs relacionadas:

ADR-002 (CSV com UTF-8+BOM)
ADR-066/067 (Reimportação idempotente)
ADR-073 (SCI reduzido + decimal ponto)

🔄 Histórico de Revisões

Data                    Autor               Mudança
2026-08                 Marcos Toledo       Criação inicial