# ADR-120: Importação em Massa de Clientes com Agrupamento por CNPJ

**Data:** 2026-10-09  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Sim (com migração de rollback)

## 📋 Contexto

O sistema precisava importar a base legada de clientes do S3D (aprox. 94 empresas) via CSV. O arquivo apresentava três desafios arquiteturais:

1. **Duplicidade de contatos:** A mesma empresa aparece N vezes no CSV, uma linha para cada contato (ex: "BOLSA DE ARTE" aparece 3x com contatos diferentes).
2. **Matriz e filial:** Empresas com o **mesmo nome** mas **CNPJs diferentes** (ex: matriz `90.882.713/0001-19` e filial `90.882.713/0002-08`).
3. **Schema restritivo:** A constraint `@@unique([companyId, companyName])` impedia o cadastro de filiais com o mesmo nome.

Além disso, rodar a importação múltiplas vezes não poderia duplicar registros nem sobrescrever dados já preenchidos manualmente.

##  Decisão

1. **Alterar a unique constraint** no schema Prisma de `@@unique([companyId, companyName])` para `@@unique([companyId, cnpj])`, permitindo filiais com mesmo nome.
2. **Agrupar linhas do CSV por CNPJ** antes do processamento, usando `Map<string, row[]>`.
3. **Implementar upsert em cascata:** buscar por `s3dId` → `cnpj` → `companyName`, e:
   - Se existir: **atualizar apenas campos preenchidos** (filtro de segurança que descarta `null`/`""`).
   - Se não existir: **criar novo registro**.
4. **Ordenar alfabeticamente** (`localeCompare pt-BR`) antes do agrupamento, garantindo ordem A-Z no banco.
5. **Criar contatos em loop** dentro de cada grupo CNPJ, com verificação de duplicidade por `email`/`name`.

## 💡 Implementação

**Arquivo:** `backend/src/client/client.service.ts` — método `importFromCSV`

```typescript
// 1. Filtra linhas válidas (CNPJ 14 dígitos, ignora rodapés)
const validRecords = records.filter(row => {
  const cleanCnpj = row[2]?.toString().trim().replace(/\D/g, '');
  return cleanCnpj.length === 14;
});

// 2. Ordenação alfabética por Razão Social (coluna 0)
validRecords.sort((a, b) =>
  a[0].toString().toUpperCase().localeCompare(b[0].toString().toUpperCase(), 'pt-BR')
);

// 3. Agrupamento por CNPJ (Map preserva ordem de inserção)
const groupedByCnpj = new Map<string, any[]>();
for (const row of validRecords) {
  const cnpj = row[2].toString().trim().replace(/\D/g, '');
  if (!groupedByCnpj.has(cnpj)) groupedByCnpj.set(cnpj, []);
  groupedByCnpj.get(cnpj)!.push(row);
}

// 4. Upsert com filtro de segurança
for (const [cnpj, rows] of groupedByCnpj.entries()) {
  const client = await this.prisma.client.findFirst({
    where: { OR: [{ s3dId }, { cnpj }] }
  });
  
  if (client) {
    const cleanUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, v]) => v !== "" && v !== null && v !== undefined)
    );
    await this.prisma.client.update({ where: { id: client.id }, data: cleanUpdateData });
  } else {
    await this.prisma.client.create({ data: createData });
  }
}

Schema alterado: backend/prisma/schema.prisma

model Client {
  // ...
  @@unique([companyId, cnpj])  // ✅ substitui @@unique([companyId, companyName])
}

✅ Consequências
Positivas
✅ Importação idempotente: pode ser rodada N vezes sem duplicar dados.
✅ Matriz e filial coexistem no sistema com nomes iguais e CNPJs diferentes.
✅ Preservação de dados: campos preenchidos manualmente não são sobrescritos por CSV vazio.
✅ Contatos múltiplos vinculados corretamente à mesma empresa.
✅ Lista de clientes sempre ordenada A-Z após importação.
Negativas
⚠️ Quebra de compatibilidade: sistemas que buscavam por companyName único precisam ajustar queries.
⚠️ Necessidade de migrate reset em ambiente local para reaplicar a unique constraint.
⚠️ Performance: ordenação + agrupamento em memória pode ficar lenta para CSVs com >10k linhas (mitigável com streaming).
📚 Referências
Arquivos: backend/src/client/client.service.ts, backend/prisma/schema.prisma
ADRs relacionadas: ADR-066 (Reimportação idempotente), ADR-004 (Multi-tenant)
Sprint: Importação CSV S3D (Sprint F12)
🔄 Histórico de Revisões
Data
Autor
Mudança
2026-10-09
Marcos Toledo
Criação inicial