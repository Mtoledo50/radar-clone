
---

## 📁 `docs/adrs/ADR-121-unificacao-gestao-obrigacoes.md`

```markdown
# ADR-121: Unificação do Módulo de Gestão de Obrigações

**Data:** 2026-10-09  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Sim

## 📋 Contexto

O módulo de obrigações estava fragmentado em **5 páginas separadas**:
- `/dashboard/fiscal/obrigacoes` (gestão geral)
- `/dashboard/fiscal/obrigacoes/importar` (importação Excel)
- `/dashboard/fiscal/obrigacoes/lotes` (obrigações em lote)
- `/dashboard/fiscal/obrigacoes/clientes` (por cliente)
- `/dashboard/fiscal/obrigacoes/tipo` (por tipo)

Essa fragmentação causava:
- **Navegação confusa:** usuário precisava clicar em 5 menu items para tarefas correlatas.
- **Duplicação de código:** cada página tinha sua própria tabela, filtros e modais.
- **Manutenção cara:** mudanças de UX exigiam edição em 5 arquivos.
- **Falta de visão holística:** impossível ver obrigações, lotes e clientes em uma única tela.

## 🎯 Decisão

Criar **uma única página unificada** em `/dashboard/admin/obrigacoes` com **5 abas internas**:

1. **Visão Geral** — KPIs e últimas obrigações importadas.
2. **Catálogo de Obrigações** — CRUD completo com busca, filtros e ordenação A-Z/Z-A.
3. **Obrigações em Lote** — Lista expansível com empresas vinculadas e status.
4. **Por Cliente** — Cards agrupando obrigações por empresa.
5. **Por Responsável** — Cards agrupando obrigações por colaborador.

O **modal de edição** foi expandido para incluir **todas** as configurações:
- Dados básicos (nome, mininome, departamento, responsável)
- Dias de entrega por mês (com toggle dia fixo vs dia útil)
- Configurações de prazo (lembrete, tipo de dia, ação em não-úteis)
- **📁 Watch Folder** (caminho, padrão de arquivo, ação pós-processamento)
- Flags e alertas (robô, multa, guia, ativa)
- Comentário padrão

## 💡 Implementação

**Arquivo principal:** `frontend/src/app/dashboard/admin/obrigacoes/page.tsx`

```tsx
// Estrutura de abas com estado compartilhado
const [activeTab, setActiveTab] = useState<TabKey>('catalogo');
const [schedules, setSchedules] = useState<ObligationSchedule[]>([]);

// Modal único reutilizado para criar E editar
<EditObligationModal
  schedule={editingSchedule}  // null = criar, objeto = editar
  onSave={editingSchedule ? handleSaveEdit : handleCreateSchedule}
  onClose={() => setShowEditModal(false)}
/>

Endpoints backend:
GET /obligations/schedules — lista todas
POST /obligations/schedules — cria nova
PATCH /obligations/schedules/:id — atualiza
DELETE /obligations/schedules/:id — remove com cascade
Menu lateral: frontend/src/app/dashboard/layout.tsx

{
  id: 'gestao-obrigacoes',
  title: 'Gestão de Obrigações',
  href: '/dashboard/admin/obrigacoes',
  children: [
    { id: 'obrigacoes-painel', title: 'Painel Unificado', href: '/dashboard/admin/obrigacoes' },
    { id: 'obrigacoes-importar', title: 'Importar em Lote', href: '/dashboard/fiscal/obrigacoes/importar' },
    { id: 'obrigacoes-lotes', title: 'Obrigações em Lote', href: '/dashboard/fiscal/obrigacoes/lotes' },
    { id: 'obrigacoes-clientes', title: 'Por Cliente', href: '/dashboard/fiscal/obrigacoes/clientes' },
    { id: 'obrigacoes-tipo', title: 'Por Tipo de Obrigação', href: '/dashboard/fiscal/obrigacoes/tipo' },
  ]
}

✅ Consequências
Positivas
✅ UX unificada: 5 funcionalidades em 1 página, menos cliques.
✅ DRY: um único modal, uma única tabela, um único conjunto de filtros.
✅ Manutenção simplificada: mudanças de estilo/layout aplicadas uma vez.
✅ Visão 360°: usuário alterna entre abas sem perder contexto.
✅ Ordenação A-Z/Z-A implementada com useMemo performático.
Negativas
⚠️ Página única ficou grande (~1500 linhas) — mitigado com sub-componentes (TabCatalogo, TabLotes, etc.).
️ URLs antigas (/dashboard/fiscal/obrigacoes/*) precisam de redirect ou coexistência temporária.
⚠️ Estado compartilhado entre abas exige cuidado com re-renders (solucionado com useMemo).
📚 Referências
Arquivos: frontend/src/app/dashboard/admin/obrigacoes/page.tsx, backend/src/obligations/obligations.controller.ts
ADRs relacionadas: ADR-113 (Watch Folder), ADR-117 (Aprovação obrigatória)
Sprint: Unificação de Obrigações (Sprint OB-1)
🔄 Histórico de Revisões
Data
Autor
Mudança
2026-10-09
Marcos Toledo
Criação inicial

