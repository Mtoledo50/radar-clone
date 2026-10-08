
---

## 📁 `docs/adrs/ADR-122-sincronizacao-bidirecional-obrigacoes.md`

```markdown
# ADR-122: Sincronização Bidirecional Cliente ↔ Obrigações

**Data:** 2026-10-09  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Sim

## 📋 Contexto

Após a unificação do módulo de obrigações (ADR-121), surgiu a necessidade de gerenciar os vínculos **cliente ↔ obrigação** em dois pontos distintos:

1. **Na ficha do cliente** (`ClientProfileModal`): o usuário quer ver quais obrigações estão vinculadas e adicionar/remover rapidamente.
2. **Na lista geral de obrigações** (`/dashboard/admin/obrigacoes`): o usuário quer ver todas as empresas vinculadas a cada obrigação.

O desafio era garantir que uma alteração em um lugar refletisse **automaticamente** no outro, sem duplicar código de sincronização e sem exigir refresh manual da página.

## 🎯 Decisão

1. **Criar endpoints dedicados** para gerenciamento de vínculos:
   - `POST /obligations/schedules/:scheduleId/clients` — vincula clientes a uma obrigação
   - `DELETE /obligations/schedules/:scheduleId/clients/:clientId` — desvincula
   - `GET /obligations/client/:clientId/obligations` — lista obrigações de um cliente

2. **Adicionar aba "Obrigações Vinculadas"** no `ClientProfileModal`, mantendo todas as funcionalidades originais (edição de cadastro, contatos, responsáveis).

3. **Implementar reload automático** após adicionar/remover vínculo, garantindo consistência visual imediata.

4. **Filtrar obrigações já vinculadas** no modal de seleção, evitando duplicidade.

## 💡 Implementação

**Backend:** `backend/src/obligations/obligations.service.ts`

```typescript
async addClientsToObligation(scheduleId: string, clientIds: string[], companyId: string) {
  await this.prisma.obligationDelivery.createMany({
    data: clientIds.map(clientId => ({
      scheduleId, clientId, companyId, status: 'PENDENTE'
    })),
    skipDuplicates: true,  // ✅ idempotente
  });
}

async removeClientFromSchedule(scheduleId: string, clientId: string, companyId: string) {
  await this.prisma.obligationDelivery.deleteMany({
    where: { scheduleId, clientId, schedule: { companyId } }
  });
}

async getClientObligations(clientId: string, companyId: string) {
  return this.prisma.obligationDelivery.findMany({
    where: { clientId, companyId },
    include: { schedule: true },
    orderBy: { schedule: { name: 'asc' } }
  });
},

rontend: frontend/src/components/clients/ClientProfileModal.tsx

// Aba de obrigações com modal de seleção
{activeTab === 'obligations' && (
  <>
    <button onClick={() => setShowAddObligation(true)}>
      <Plus /> Adicionar Obrigação
    </button>
    
    {obligations.map(ob => (
      <div key={ob.id}>
        <h4>{ob.schedule.name}</h4>
        <span>{ob.status}</span>
        <button onClick={() => handleRemoveObligation(ob.schedule.id, ob.schedule.name)}>
          <Trash2 />
        </button>
      </div>
    ))}
  </>
)}

// Modal de seleção (filtra já vinculadas)
<select value={selectedObligationId}>
  {allObligations
    .filter(ob => !obligations.some(clientOb => clientOb.schedule.id === ob.id))
    .map(ob => <option key={ob.id} value={ob.id}>{ob.name}</option>)}
</select>

Integração na página de clientes: frontend/src/app/dashboard/clientes/page.tsx
function openViewModal(client: Client) {
  setSelectedClient(client);
  fetchClientObligations(client.id);  // ✅ Busca obrigações ao abrir modal
  setShowViewModal(true);
}

<ClientProfileModal
  client={selectedClient}
  obligations={clientObligations}
  loadingObligations={loadingObligations}
  onClose={() => setShowViewModal(false)}
  onEditContract={() => openEditModal(selectedClient)}
/>

✅ Consequências
Positivas
✅ Sincronização automática: adicionar/remover em um lugar reflete no outro.
✅ UX fluida: usuário não precisa navegar entre páginas para gerenciar vínculos.
✅ Idempotência: skipDuplicates: true previne erros em cliques duplos.
✅ Preservação do modal original: edição de cadastro, contatos e responsáveis intactos.
✅ Filtro inteligente: modal de seleção não mostra obrigações já vinculadas.
Negativas
⚠️ window.location.reload() após adicionar/remover é brute-force — poderia ser otimizado com invalidação de cache Zustand.
⚠️ Endpoint GET /obligations/client/:id/obligations faz join manual (sem include direto no Prisma) — performance aceitável até ~1000 vínculos.
️ Confirmação via confirm() nativo do browser — poderia ser modal customizado.
📚 Referências
Arquivos: frontend/src/components/clients/ClientProfileModal.tsx, backend/src/obligations/obligations.service.ts
ADRs relacionadas: ADR-121 (Unificação de Obrigações), ADR-004 (Multi-tenant)
Sprint: Sincronização Cliente-Obrigações (Sprint OB-2)
🔄 Histórico de Revisões
Data
Autor
Mudança
2026-10-09
Marcos Toledo
Criação inicial


