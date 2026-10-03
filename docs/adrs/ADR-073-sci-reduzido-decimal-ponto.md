
---

### 📂 `docs/adrs/ADR-073-sci-reduzido-decimal-ponto.md`

```markdown
# ADR-073: Exportação SCI com Código Reduzido e Decimal Ponto

**Data:** 2026-08  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Não (requisito de integração)

---

## 📋 Contexto

O sistema exporta lançamentos contábeis no formato SCI-Único v3 para integração com sistemas externos (Domínio, Questor, Sage).

**Problema:**
- O formato SCI exige código reduzido (ex: "819" em vez de "01.1.1.02.026")
- O formato SCI exige decimal com ponto (ex: "1500.00" em vez de "1.500,00")
- O sistema interno usa código completo e decimal com vírgula (padrão BR)

## 🎯 Decisão

Na exportação SCI:
1. Usar `reducedCode` em vez de `code` completo
2. Formatar decimais com ponto (padrão US) em vez de vírgula (padrão BR)
3. Não alterar o formato interno (manter padrão BR para exibição no frontend)

---

## 💡 Implementação

### Backend: Serviço de Exportação

```typescript
// backend/src/accounting/services/sci-export.service.ts

export function formatSciDecimal(value: number): string {
  // Converter de BR (1.500,00) para US (1500.00)
  return value.toFixed(2).replace(',', '.');
}

export function formatSciCode(account: AccountingAccount): string {
  // Usar reducedCode se disponível, senão extrair do code completo
  if (account.reducedCode) {
    return account.reducedCode.toString();
  }
  
  // Fallback: extrair último segmento do código completo
  const parts = account.code.split('.');
  return parts[parts.length - 1];
}

async exportToSci(companyId: string, clientId: string, competence: string) {
  const entries = await this.prisma.accountingEntry.findMany({
    where: { companyId, clientId, competence },
    include: { debitAccount: true, creditAccount: true },
  });

  const lines = entries.map(entry => {
    const debitCode = formatSciCode(entry.debitAccount);
    const creditCode = formatSciCode(entry.creditAccount);
    const value = formatSciDecimal(entry.value);

    return `${debitCode};${creditCode};${value}`;
  });

  return lines.join('\n');
}

✅ Consequências

Positivas

✅ Compatibilidade: Arquivo exportado é aceito por sistemas SCI
✅ Transparência: Frontend continua exibindo no padrão BR

Negativas

❌ Conversão: Exige formatação na exportação (overhead mínimo)

📚 Referências

Arquivos que usam esta ADR:

backend/src/accounting/services/sci-export.service.ts
frontend/src/app/dashboard/contabil/export-sci/page.tsx

ADRs relacionadas:

ADR-070/072 (Plano de contas SCI)
ADR-075 (Layout oficial SCI-Único v3)

🔄 Histórico de Revisões

Data                Autor               Mudança
2026-08             Marcos Toledo       Criação inicial