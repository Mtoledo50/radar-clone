# ADR-066/067: Reimportação Idempotente (Overlap + Anti-Duplicidade)

**Data:** 2026-08  
**Status:** ✅ Aceita (Regra Crítica de Integridade)  
**Decisor:** Marcos Toledo  
**Reversível:** Não

---

## 📋 Contexto

O sistema importa dados de fontes externas repetidamente:
- Extratos bancários (CSV)
- Planos de contas (CSV/XML)
- NF-e (XML)
- NFS-e (XML)
- Balancetes (CSV)

**Problema:**
- Se o usuário importar o mesmo extrato 2×, o que acontece?
- Opção A: Duplicar (gera lançamentos duplicados, conciliação quebrada)
- Opção B: Substituir tudo (perde histórico de conciliação manual)
- Opção C: Mesclar (complexo, mas preserva dados)

**Dilema:**
Como permitir reimportação sem duplicar dados e sem perder histórico?

---

## 🎯 Decisão

**Toda importação DEVE ser idempotente**, usando estratégia de **overlap com anti-duplicidade**:

1. **Identificação por Chave Natural:**
   - Extrato bancário: `(companyId, clientId, date, value, description)`
   - NF-e: `accessKey` (44 caracteres)
   - Plano de contas: `(companyId, code)`
   - Balancete: `(companyId, clientId, competence)`

2. **Upsert em Vez de Insert:**
   - Se o registro já existe (mesma chave natural), atualiza campos editáveis
   - Se não existe, cria novo
   - Nunca duplica

3. **Preservação de Vínculos:**
   - Se um registro já tem vínculos (ex: transação conciliada), não deletar
   - Apenas atualizar campos que não quebram integridade

4. **Log de Importação:**
   - Registrar quantos registros foram criados, atualizados e ignorados
   - Exibir resumo para o usuário

---

## 💡 Implementação

### Backend: Exemplo de Importação Idempotente de Extrato

```typescript
// backend/src/banking/services/bank-import.service.ts

@Injectable()
export class BankImportService {
  async importCsv(companyId: string, clientId: string, csvPath: string) {
    const transactions = await this.parseCsv(csvPath);
    
    let created = 0;
    let updated = 0;
    let ignored = 0;

    await this.prisma.$transaction(async (tx) => {
      for (const tx_data of transactions) {
        // Chave natural: (companyId, clientId, date, value, description)
        const existing = await tx.bankTransaction.findFirst({
          where: {
            companyId,
            clientId,
            date: tx_data.date,
            value: tx_data.value,
            description: tx_data.description,
          },
        });

        if (existing) {
          // Se já existe e está conciliada, não alterar
          if (existing.status === 'CONCILIADA') {
            ignored++;
            continue;
          }

          // Atualizar campos editáveis
          await tx.bankTransaction.update({
            where: { id: existing.id },
            data: {
              category: tx_data.category,
              counterparty: tx_data.counterparty,
              // ... outros campos
            },
          });
          updated++;
        } else {
          // Criar novo
          await tx.bankTransaction.create({
            data: {
              companyId,
              clientId,
              ...tx_data,
              status: 'PENDENTE',
            },
          });
          created++;
        }
      }
    });

    return { created, updated, ignored };
  }
}

Backend: Exemplo de Importação de Balancete

// backend/src/accounting/services/trial-balance-import.service.ts

async importCsv(companyId: string, clientId: string, competence: string, csvPath: string) {
  const rows = await this.parseCsv(csvPath);

  await this.prisma.$transaction(async (tx) => {
    // 1. Deletar linhas antigas desta competência (substituição limpa)
    await tx.trialBalanceRow.deleteMany({
      where: { trialBalance: { companyId, clientId, competence } },
    });

    // 2. Upsert do cabeçalho
    const tb = await tx.trialBalance.upsert({
      where: { companyId_clientId_competence: { companyId, clientId, competence } },
      update: { rowCount: rows.length, totalDebit, totalCredit },
      create: { companyId, clientId, competence, rowCount: rows.length, totalDebit, totalCredit },
    });

    // 3. Inserir novas linhas
    await tx.trialBalanceRow.createMany({
      data: rows.map(r => ({
        trialBalanceId: tb.id,
        code: r.code,
        name: r.name,
        debit: r.debit,
        credit: r.credit,
        balance: r.balance,
      })),
    });
  });
}

✅ Consequências

Positivas

✅ Zero Duplicação: Reimportar não gera dados duplicados
✅ Histórico Preservado: Conciliações manuais não são perdidas
✅ Transparência: Usuário vê quantos registros foram criados/atualizados/ignorados

Negativas

❌ Complexidade: Lógica de upsert é mais complexa que insert simples
❌ Performance: Verificar existência antes de inserir adiciona overhead (mitigado por índices)

📚 Referências

Arquivos que usam esta ADR:

backend/src/banking/services/bank-import.service.ts
backend/src/accounting/services/trial-balance-import.service.ts
backend/src/fiscal/services/nfse-import.service.ts

ADRs relacionadas:

ADR-034 (Arquivos estruturais sempre delta)
ADR-036 (Parser NFS-e ABRASF)

🔄 Histórico de Revisões

Data                Autor               Mudança
2026-08             Marcos Toledo       Criação inicial