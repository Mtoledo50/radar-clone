
---

### 📂 `docs/adrs/ADR-090-catalogo-centralizado-ajuda.md`

```markdown
# ADR-090: Catálogo Centralizado de Ajuda em TypeScript

**Data:** 2026-08-27  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Sim

---

## 📋 Contexto

O sistema de ajuda contextual (ADR-089) precisa de um catálogo de páginas com conteúdo rico. Alternativas consideradas:

1. **CMS externo** (Contentful, Strapi): Overkill, dependência externa
2. **Markdown files:** Difícil tipar, sem autocomplete
3. **Banco de dados:** Overkill para conteúdo estático

## 🎯 Decisão

**Catálogo centralizado em TypeScript** (`page-help-catalog.ts`):

- Type-safe (interface `PageHelp`)
- Autocomplete no VS Code
- Zero dependências externas
- Fallback amigável para páginas não mapeadas

## 💡 Implementação

```typescript
// frontend/src/lib/page-help-catalog.ts

export interface PageHelp {
  slug: string;
  title: string;
  description: string;
  steps: string[];
  richContent?: {
    kpis?: { name: string; description: string }[];
    workflow?: string[];
    regrasOuro?: string[];
    exemplos?: string[];
  };
}

export const PAGE_HELP_CATALOG: Record<string, PageHelp> = {
  // Operacional (9 páginas)
  '/dashboard': { slug: 'dashboard', title: 'Dashboard', /* ... */ },
  '/dashboard/clientes': { slug: 'clientes', title: 'Clientes', /* ... */ },
  // ... 7 mais

  // Comercial (3 páginas)
  '/dashboard/precificacao': { slug: 'precificacao', title: 'Precificação', /* ... */ },
  // ... 2 mais

  // Fiscal (7 páginas)
  '/dashboard/fiscal/notas': { slug: 'notas-fiscais', title: 'Notas Fiscais', /* ... */ },
  // ... 6 mais

  // Bancário/Contábil (5 páginas)
  '/dashboard/fechamento': { slug: 'fechamento-mensal', title: 'Fechamento Mensal', /* ... */ },
  // ... 4 mais

  // Inteligência (14 páginas)
  '/dashboard/funcionario-digital': { slug: 'aurora', title: 'Aurora', /* ... */ },
  // ... 13 mais

  // Sistema (2 páginas)
  '/dashboard/admin': { slug: 'admin', title: 'Administração', /* ... */ },
  '/dashboard/minha-empresa': { slug: 'minha-empresa', title: 'Minha Empresa', /* ... */ },
};

// Total: 35 páginas mapeadas

Fallback Amigável


// frontend/src/components/PageHelp.tsx

const help = PAGE_HELP_CATALOG[pathname];

if (!help) {
  // Página não mapeada: mostrar ajuda genérica
  return (
    <button
      onClick={() => window.open('mailto:suporte@contacerta.com.br', '_blank')}
      className="fixed bottom-4 right-4 bg-gray-600 text-white p-3 rounded-full"
      title="Precisa de ajuda? Entre em contato"
    >
      <HelpCircle size={24} />
    </button>
  );
}

✅ Consequências

Positivas

✅ Type-Safe: Interface PageHelp garante estrutura correta
✅ Autocomplete: VS Code sugere campos ao editar
✅ Zero Deps: Não depende de CMS ou banco
✅ Fallback: Páginas não mapeadas mostram ajuda genérica

Negativas

❌ Edição Manual: Alterar conteúdo exige editar TypeScript
❌ Deploy: Mudanças exigem rebuild (não é hot-reload)

📚 Referências

Arquivos que usam esta ADR:

frontend/src/lib/page-help-catalog.ts (35 páginas)
frontend/src/components/PageHelp.tsx (fallback)

ADRs relacionadas:

ADR-089 (Ajuda contextual 2 camadas)

🔄 Histórico de Revisões

Data                    Autor               Mudança
2026-08-27              Marcos Toledo       Criação inicial (Sprint Help System)