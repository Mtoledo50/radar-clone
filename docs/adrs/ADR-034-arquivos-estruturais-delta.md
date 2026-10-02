
---

### 📂 `docs/adrs/ADR-034-arquivos-estruturais-delta.md`

```markdown
# ADR-034: Arquivos Estruturais Sempre Delta (Nunca Substituição Total)

**Data:** 2026-08  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Não (regra de integridade de dados)

---

## 📋 Contexto

O sistema importa arquivos estruturais que definem a base de dados:
- Plano de contas contábeis (CSV/XML)
- Catálogo de produtos fiscais
- Naturezas de lançamento bancário

**Problema:**
- Se o usuário importar um plano de contas 2×, o que acontece?
- Opção A: Substituir tudo (perde lançamentos antigos vinculados às contas)
- Opção B: Duplicar (gera contas repetidas)
- Opção C: Mesclar (complexo, mas preserva histórico)

**Dilema:**
Como permitir atualizações sem quebrar a integridade dos dados históricos?

---

## 🎯 Decisão

**Toda importação de arquivo estrutural DEVE operar em modo DELTA (incremental)**, nunca substituindo registros existentes.

### Regras:

1. **Upsert por Chave Natural:**
   - Plano de contas: upsert por `(companyId, code)`
   - Produtos fiscais: upsert por `(companyId, clientId, code)`
   - Naturezas: upsert por `(companyId, clientId, name)`

2. **Preservação de Vínculos:**
   - Se uma conta já tem lançamentos vinculados, **NÃO** deletar
   - Apenas atualizar campos editáveis (nome, tipo, natureza)
   - Campos imutáveis (código) não podem ser alterados

3. **Desativação em Vez de Exclusão:**
   - Contas/produtos "antigos" são marcados como `isActive = false`
   - Nunca deletar registros que têm histórico (lançamentos, movimentações)

4. **Log de Importação:**
   - Registrar quantos registros foram criados, atualizados e desativados
   - Exibir resumo para o usuário antes de confirmar

---

## 💡 Implementação

### Backend: Serviço de Importação Delta

```typescript
// backend/src/accounting/services/account-import.service.ts

@Injectable()
export class AccountImportService {
  async importPlan(companyId: string, csvPath: string) {
    const accounts = await this.parseCsv(csvPath);
    
    let created = 0;
    let updated = 0;
    let deactivated = 0;

    await this.prisma.$transaction(async (tx) => {
      // 1. Buscar contas existentes
      const existing = await tx.accountingAccount.findMany({
        where: { companyId },
      });
      const existingMap = new Map(existing.map(a => [a.code, a]));

      // 2. Processar cada conta do CSV
      for (const account of accounts) {
        const existingAccount = existingMap.get(account.code);

        if (existingAccount) {
          // Atualizar campos editáveis
          await tx.accountingAccount.update({
            where: { id: existingAccount.id },
            data: {
              name: account.name,
              type: account.type,
              nature: account.nature,
              isActive: true, // Reativar se estava desativada
            },
          });
          updated++;
        } else {
          // Criar nova
          await tx.accountingAccount.create({
            data: {
              companyId,
              code: account.code,
              name: account.name,
              type: account.type,
              nature: account.nature,
              isActive: true,
            },
          });
          created++;
        }
      }

      // 3. Desativar contas que não estão no CSV (mas têm histórico)
      const csvCodes = new Set(accounts.map(a => a.code));
      for (const existingAccount of existing) {
        if (!csvCodes.has(existingAccount.code) && existingAccount.isActive) {
          // Verificar se tem lançamentos vinculados
          const hasEntries = await tx.accountingEntry.count({
            where: {
              OR: [
                { debitAccountId: existingAccount.id },
                { creditAccountId: existingAccount.id },
              ],
            },
          });

          if (hasEntries > 0) {
            // Desativar (não deletar)
            await tx.accountingAccount.update({
              where: { id: existingAccount.id },
              data: { isActive: false },
            });
            deactivated++;
          }
        }
      }
    });

    return { created, updated, deactivated };
  }
}

Frontend: Resumo Antes de Confirmar

// frontend/src/app/dashboard/contabil/plano-contas/page.tsx

<Modal title="Confirmar Importação">
  <div className="space-y-2">
    <p className="text-sm text-gray-600">
      A importação irá:
    </p>
    <ul className="list-disc list-inside text-sm">
      <li><strong>{summary.created}</strong> contas novas serão criadas</li>
      <li><strong>{summary.updated}</strong> contas existentes serão atualizadas</li>
      <li><strong>{summary.deactivated}</strong> contas sem uso serão desativadas</li>
    </ul>
    <p className="text-xs text-gray-500 mt-2">
      Contas com lançamentos históricos nunca serão excluídas.
    </p>
  </div>
  
  <div className="flex gap-2 mt-4">
    <button onClick={handleConfirm} className="bg-teal-600 text-white px-4 py-2 rounded">
      Confirmar
    </button>
    <button onClick={handleCancel} className="bg-gray-300 px-4 py-2 rounded">
      Cancelar
    </button>
  </div>
</Modal>

✅ Consequências

Positivas

✅ Integridade Preservada: Lançamentos antigos não perdem vínculo com contas
✅ Histórico Completo: Contas "antigas" ficam desativadas, mas ainda acessíveis
✅ Transparência: Usuário vê exatamente o que será feito antes de confirmar

Negativas

❌ Complexidade: Lógica de upsert + desativação é mais complexa que "deletar e recriar"
❌ Acúmulo de Dados: Contas desativadas ocupam espaço (mitigado por isActive = false)

📚 Referências

Arquivos que usam esta ADR:

backend/src/accounting/services/account-import.service.ts
backend/src/fiscal/services/product-import.service.ts
frontend/src/app/dashboard/contabil/plano-contas/page.tsx

ADRs relacionadas:

ADR-066/067 (Reimportação idempotente)

🔄 Histórico de Revisões
Data                Autor           Mudança
2026-08             Marcos Toledo   Criação inicial