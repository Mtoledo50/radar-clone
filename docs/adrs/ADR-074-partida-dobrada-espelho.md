
---

### 📂 `docs/adrs/ADR-074-partida-dobrada-espelho.md`

```markdown
# ADR-074: Partida Dobrada com Espelho e Auto-Conciliação

**Data:** 2026-08  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Não (regra contábil fundamental)

---

## 📋 Contexto

O sistema precisa registrar lançamentos contábeis seguindo o princípio da partida dobrada: todo débito tem um crédito de igual valor.

**Problema:**
- Como garantir que D = C em todos os lançamentos?
- Como facilitar a conciliação automática entre lançamentos e extratos bancários?

## 🎯 Decisão

1. **Partida Dobrada Obrigatória:**
   - Todo `AccountingEntry` tem `debitAccountId` + `debitValue` e `creditAccountId` + `creditValue`
   - Validação no backend: `debitValue === creditValue` (tolerância de R$ 0,01 para arredondamento)

2. **Espelhamento Automático:**
   - Ao criar um lançamento, o sistema automaticamente cria o lançamento inverso (espelho)
   - Ex: D Banco / C Receita → automaticamente cria D Receita / C Banco (se necessário)

3. **Auto-Conciliação:**
   - Lançamentos vinculados a transações bancárias (`bankTransactionId`) são automaticamente marcados como `status = 'CONCILIADO'`
   - Botão "✓ Conciliar" para conciliação manual rápida

---

## 💡 Implementação

### Backend: Schema Prisma

```prisma
model AccountingEntry {
  id                  String   @id @default(uuid())
  companyId           String
  clientId            String
  
  entryDate           DateTime
  description         String
  
  // Débito
  debitAccountId      String
  debitAccount        AccountingAccount @relation("DebitEntries", fields: [debitAccountId], references: [id])
  debitValue          Decimal  @default(0) @db.Decimal(12, 2)
  
  // Crédito
  creditAccountId     String
  creditAccount       AccountingAccount @relation("CreditEntries", fields: [creditAccountId], references: [id])
  creditValue         Decimal  @default(0) @db.Decimal(12, 2)
  
  // Vínculo com transação bancária
  bankTransactionId   String?
  
  status              String   @default("PENDENTE") // PENDENTE | CONCILIADO
  
  @@map("accounting_entries")
}

Backend: Validação de Partida Dobrada
// backend/src/accounting/services/accounting-entry.service.ts

async create(companyId: string, data: CreateEntryDto) {
  // Validar partida dobrada
  if (Math.abs(data.debitValue - data.creditValue) > 0.01) {
    throw new BadRequestException('Partida dobrada inválida: Débito ≠ Crédito');
  }

  // Criar lançamento
  const entry = await this.prisma.accountingEntry.create({
    data: {
      companyId,
      ...data,
      status: data.bankTransactionId ? 'CONCILIADO' : 'PENDENTE',
    },
  });

  return entry;
}

✅ Consequências

Positivas

✅ Compliance Contábil: Garante que D = C em todos os lançamentos
✅ Conciliação Rápida: Lançamentos vinculados ao banco são auto-conciliados
✅ Auditoria: Rastreabilidade completa de origem (manual ou bancária)

Negativas

❌ Validação Rigorosa: Lançamentos com D ≠ C são rejeitados (pode frustrar usuários)

📚 Referências

Arquivos que usam esta ADR:

backend/prisma/schema.prisma (model AccountingEntry)
backend/src/accounting/services/accounting-entry.service.ts
frontend/src/app/dashboard/contabil/lancamentos/page.tsx

ADRs relacionadas:

ADR-030 (Human-in-the-Loop)
ADR-066/067 (Reimportação idempotente)

🔄 Histórico de Revisões

Data                Autor               Mudança
2026-08             Marcos Toledo       Criação inicial