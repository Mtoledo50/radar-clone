
---

## 📁 `docs/adrs/ADR-126-padrao-importacao-duas-fases.md`

```markdown
# ADR-126: Padrão de Importação em Duas Fases (Preview + Confirm)

**Data:** 2026-10-09  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Sim

## 📋 Contexto

A importação em massa de obrigações (via Excel/CSV) é uma operação **destrutiva** se executada incorretamente. Erros comuns:

1. Importar arquivo errado (ex: mês anterior).
2. Duplicar registros por clique duplo.
3. Vincular clientes errados por CNPJ similar.

Uma vez executada, a importação não pode ser desfeita facilmente (exige rollback manual no banco).

## 🎯 Decisão

Implementar **padrão de importação em duas fases**:

1. **Fase 1 — Preview:** Analisa o arquivo, mostra estatísticas (quantos registros, quantos clientes vinculados, quantos erros) **sem salvar no banco**.
2. **Fase 2 — Confirm:** Usuário confirma explicitamente, e só então os dados são persistidos.

Scripts CLI separados:
- `import-obligations-preview.ts` — simula importação e mostra relatório.
- `import-obligations-confirm.ts` — executa importação real.

## 💡 Implementação

**Script Preview:** `backend/scripts/import-obligations-preview.ts`

```typescript
// Lê arquivo, valida, mostra estatísticas SEM salvar
const stats = await service.previewImport(filePath, obligationName);
console.log(`Total de registros: ${stats.total}`);
console.log(`Clientes vinculados: ${stats.linked}`);
console.log(`Erros: ${stats.errors}`);
console.log(`\nPara confirmar, execute: import-obligations-confirm.ts`);

Script Confirm: backend/scripts/import-obligations-confirm.ts

// Executa importação real após confirmação explícita
const confirmed = await confirm('Deseja prosseguir? (s/n)');
if (confirmed) {
  await service.processExcelImport(filePath, obligationName, companyId);
  console.log('✅ Importação concluída!');
}

✅ Consequências
Positivas
✅ Segurança: usuário vê o que será importado antes de confirmar.
✅ Prevenção de erros: detecta problemas (CNPJs inválidos, clientes não encontrados) antes de persistir.
✅ Idempotência: preview pode ser rodado N vezes sem efeito colateral.
✅ Auditoria: logs claros de preview vs confirm.
Negativas
⚠️ Dois passos em vez de um (pode ser visto como fricção).
⚠️ Scripts CLI exigem acesso ao terminal (não disponível para usuários não-técnicos).
📚 Referências
Arquivos: backend/scripts/import-obligations-preview.ts, backend/scripts/import-obligations-confirm.ts
ADRs relacionadas: ADR-066 (Reimportação idempotente), ADR-120 (Importação CSV de clientes)
🔄 Histórico de Revisões
Data
Autor
Mudança
2026-10-09
Marcos Toledo
Criação inicial

