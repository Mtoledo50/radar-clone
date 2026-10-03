
---

### 📂 `docs/adrs/ADR-089-ajuda-contextual-2-camadas.md`

```markdown
# ADR-089: Ajuda Contextual em 2 Camadas (Progressive Disclosure)

**Data:** 2026-08-27  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Sim

---

## 📋 Contexto

O sistema tem muitas funcionalidades complexas (conciliação, classificação, emissão de guias). Usuários precisam de ajuda contextual, mas não querem poluição visual.

**Problema:**
- Tooltips simples não explicam fluxos complexos
- Páginas de documentação separadas quebram o fluxo de trabalho
- Como fornecer ajuda rica sem sobrecarregar a UI?

## 🎯 Decisão

**Progressive Disclosure em 2 Camadas:**

1. **Camada 1 — Modal Rápido:**
   - Botão "O que é isso?" em cada página
   - Modal com descrição curta + passos numerados
   - Fecha com ESC ou clique fora

2. **Camada 2 — Página Detalhada:**
   - Link "Saiba mais" no modal
   - Página `/ajuda/[slug]` com conteúdo rico:
     - KPIs explicados
     - Workflow passo a passo
     - Regras de ouro
     - Exemplos práticos

## 💡 Implementação

### Catálogo Centralizado

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
  '/dashboard/fechamento': {
    slug: 'fechamento-mensal',
    title: 'Fechamento Mensal',
    description: 'Concilie extratos bancários com notas fiscais e feche o mês.',
    steps: [
      'Importe o extrato bancário (CSV)',
      'Revise as sugestões de conciliação',
      'Aprove as conciliações automáticas (score ≥ 80%)',
      'Revise manualmente as pendências (score 50-79%)',
      'Clique em "Fechar Mês" quando tudo estiver conciliado',
    ],
    richContent: {
      kpis: [
        { name: 'Score de Conciliação', description: 'Nota de 0-100% baseada em valor (60%), nome (30%) e data (10%)' },
        { name: 'Pendências', description: 'Itens com score 50-79% que exigem revisão humana' },
      ],
      workflow: [
        'Importar extrato → Conciliação automática → Revisão humana → Fechamento',
      ],
      regrasOuro: [
        'Nunca feche o mês sem revisar todas as pendências',
        'Score < 50% é ignorado (deixe para o humano)',
      ],
    },
  },
  // ... 35 páginas mapeadas
};

Componente Modal (Camada 1)

// frontend/src/components/PageHelp.tsx

'use client';

import { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { PAGE_HELP_CATALOG } from '@/lib/page-help-catalog';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export function PageHelp() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  
  const help = PAGE_HELP_CATALOG[pathname];
  if (!help) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-teal-600 text-white p-3 rounded-full shadow-lg hover:bg-teal-700"
        title="O que é isso?"
      >
        <HelpCircle size={24} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold">{help.title}</h2>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <p className="text-gray-600 mb-4">{help.description}</p>

            <h3 className="font-semibold mb-2">Passos:</h3>
            <ol className="list-decimal list-inside space-y-1 mb-4">
              {help.steps.map((step, i) => (
                <li key={i} className="text-gray-700">{step}</li>
              ))}
            </ol>

            <Link
              href={`/ajuda/${help.slug}`}
              className="text-teal-600 hover:text-teal-700 font-medium"
            >
              Saiba mais →
            </Link>
          </div>
        </div>
      )}
    </>
  );
}

Página Detalhada (Camada 2)

// frontend/src/app/ajuda/[slug]/page.tsx

import { PAGE_HELP_CATALOG } from '@/lib/page-help-catalog';
import { notFound } from 'next/navigation';

export default function AjudaDetalhadaPage({ params }: { params: { slug: string } }) {
  const help = Object.values(PAGE_HELP_CATALOG).find(h => h.slug === params.slug);
  
  if (!help) notFound();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">{help.title}</h1>
      <p className="text-gray-600 mb-8">{help.description}</p>

      {help.richContent?.kpis && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">KPIs Explicados</h2>
          <div className="grid gap-4">
            {help.richContent.kpis.map((kpi, i) => (
              <div key={i} className="bg-gray-50 p-4 rounded">
                <h3 className="font-semibold">{kpi.name}</h3>
                <p className="text-gray-600">{kpi.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {help.richContent?.regrasOuro && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Regras de Ouro</h2>
          <ul className="list-disc list-inside space-y-2">
            {help.richContent.regrasOuro.map((regra, i) => (
              <li key={i} className="text-gray-700">{regra}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

✅ Consequências

Positivas

✅ Zero Poluição Visual: Ajuda só aparece quando solicitada
✅ Conteúdo Rico: KPIs, workflows, regras de ouro
✅ Manutenível: Catálogo centralizado em TypeScript

Negativas

❌ Esforço Inicial: 35 páginas mapeadas manualmente
❌ Atualização: Novas páginas exigem atualização do catálogo

📚 Referências

Arquivos que usam esta ADR:

frontend/src/lib/page-help-catalog.ts (35 páginas mapeadas)
frontend/src/components/PageHelp.tsx (modal camada 1)
frontend/src/app/ajuda/[slug]/page.tsx (página camada 2)

ADRs relacionadas:

ADR-088 (Monitoramento opt-in)
ADR-090 (Catálogo centralizado)

🔄 Histórico de Revisões

Data                Autor               Mudança
2026-08-27          Marcos Toledo       Criação inicial (Sprint Help System)