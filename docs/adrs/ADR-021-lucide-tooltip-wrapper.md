
---

### 📂 `docs/adrs/ADR-021-lucide-tooltip-wrapper.md`

```markdown
# ADR-021: Lucide Tooltip via `<span title>` Wrapper

**Data:** 2026-09  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Sim

---

## 📋 Contexto

Utilizamos a biblioteca `lucide-react` para ícones. Muitos ícones (ex: lixeira, edição, informações) precisam de um tooltip (dica de ferramenta) para acessibilidade (a11y) e clareza de UX.

**Problema:** A biblioteca `lucide-react` não possui uma propriedade `title` ou `tooltip` nativa que funcione de forma consistente em todos os ambientes de renderização (especialmente no build de produção do Next.js com certas otimizações de SVG). Passar `title` diretamente para o componente `<Icon />` às vezes é removido ou não renderizado corretamente pelo React.

---

## 🎯 Decisão

Sempre envolver ícones que necessitam de tooltip em um elemento HTML nativo `<span>` (ou `<div>`) com o atributo `title`. Isso garante acessibilidade nativa do navegador, zero dependência de bibliotecas de tooltip pesadas (como `radix-ui` ou `tippy.js` para casos simples) e funcionamento garantido no build de produção.

---

## 💡 Implementação

### ❌ Errado (Pode falhar no build de produção)
```tsx
import { Trash2 } from 'lucide-react';

// O atributo title pode ser perdido na minificação/otimização do SVG
<Trash2 size={16} title="Excluir registro" className="text-red-500" />

✅ Correto (Padrão do Projeto)

import { Trash2 } from 'lucide-react';

<span title="Excluir registro" className="inline-flex items-center justify-center cursor-pointer">
  <Trash2 size={16} className="text-red-500 hover:text-red-700 transition-colors" />
</span>

Componente Reutilizável (Opcional, mas recomendado)

// frontend/src/components/ui/IconWithTooltip.tsx
import { LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  tooltip: string;
  size?: number;
  className?: string;
}

export function IconWithTooltip({ icon: Icon, tooltip, size = 16, className }: Props) {
  return (
    <span title={tooltip} className="inline-flex items-center justify-center">
      <Icon size={size} className={className} aria-label={tooltip} />
    </span>
  );
}

✅ Consequências

Positivas

✅ Acessibilidade (a11y): Leitores de tela e navegadores nativos entendem o atributo title.
✅ Zero Dependências: Não requer bibliotecas de tooltip adicionais.
✅ Estabilidade: Funciona 100% das vezes no build de produção (npm run build).

Negativas

❌ Estilização limitada: O tooltip nativo do navegador (title) não pode ser estilizado com CSS (cor, fonte, atraso). Para tooltips complexos e estilizados, usar radix-ui (exceção à regra).

📚 Referências

frontend/src/app/dashboard/**/page.tsx (botões de ação em tabelas)
Correção aplicada na Sprint 31 (Docker/Build) para resolver erros de produção.

🔄 Histórico de Revisões

Data                Autor                       Mudança
2026-09             Marcos Toledo               Criação inicial após falha no build de produção
